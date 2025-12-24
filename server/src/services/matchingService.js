const redisClient = require('../config/redis');

class MatchingService {
    constructor() {
        this.QUEUE_KEY = 'matching_queue';
        this.USER_PREFIX = 'user:';
    }

    async addUserToQueue(socketId, preferences) {
        const user = {
            socketId,
            preferences: JSON.stringify(preferences),
            joinedAt: Date.now().toString(),
        };

        // Store user details in Hash
        await redisClient.hSet(`${this.USER_PREFIX}${socketId}`, user);

        // Add to Queue
        await redisClient.rPush(this.QUEUE_KEY, socketId);

        console.log(`User ${socketId} added to Redis queue.`);
        return this.findMatch(socketId);
    }

    async removeUserFromQueue(socketId) {
        await redisClient.lRem(this.QUEUE_KEY, 0, socketId);
        await redisClient.del(`${this.USER_PREFIX}${socketId}`);
        console.log(`User ${socketId} removed from Redis queue.`);
    }

    async findMatch(currentSocketId) {
        // Pop the first user from the queue
        const potentialMatchId = await redisClient.lPop(this.QUEUE_KEY);

        if (!potentialMatchId) {
            return null;
        }

        // If we popped ourselves, put back and wait
        if (potentialMatchId === currentSocketId) {
            await redisClient.rPush(this.QUEUE_KEY, currentSocketId);
            return null;
        }

        // Found a match!
        const matchData = await redisClient.hGetAll(`${this.USER_PREFIX}${potentialMatchId}`);

        // If match data is missing (expired/deleted), try again
        if (!matchData || !matchData.socketId) {
            return this.findMatch(currentSocketId);
        }

        // Remove ourselves from queue since we found a match
        await this.removeUserFromQueue(currentSocketId);

        // Clean up the matched user
        await this.removeUserFromQueue(potentialMatchId);

        return {
            socketId: matchData.socketId,
            preferences: JSON.parse(matchData.preferences || '{}')
        };
    }
}

module.exports = new MatchingService();
