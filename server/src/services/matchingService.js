const redisClient = require('../config/redis');

class MatchingService {
    constructor() {
        this.QUEUE_KEY = 'matching_queue';
        this.USER_PREFIX = 'user:';

        // In-memory fallback
        this.localQueue = [];
        this.localUsers = new Map();
    }

    async addUserToQueue(socketId, preferences) {
        const user = {
            socketId,
            preferences: JSON.stringify(preferences),
            joinedAt: Date.now().toString(),
        };

        if (redisClient.isOpen) {
            try {
                // Store user details in Hash
                await redisClient.hSet(`${this.USER_PREFIX}${socketId}`, user);
                // Add to Queue
                await redisClient.rPush(this.QUEUE_KEY, socketId);
                console.log(`User ${socketId} added to Redis queue.`);
            } catch (e) {
                console.error("Redis error, falling back to memory:", e);
                this.localUsers.set(socketId, user);
                this.localQueue.push(socketId);
            }
        } else {
            console.log(`User ${socketId} added to Local Memory queue.`);
            this.localUsers.set(socketId, user);
            this.localQueue.push(socketId);
        }

        return this.findMatch(socketId);
    }

    async removeUserFromQueue(socketId) {
        if (redisClient.isOpen) {
            try {
                await redisClient.lRem(this.QUEUE_KEY, 0, socketId);
                await redisClient.del(`${this.USER_PREFIX}${socketId}`);
                console.log(`User ${socketId} removed from Redis queue.`);
            } catch (e) {
                // Fallback cleanup
                this.removeFromLocal(socketId);
            }
        } else {
            this.removeFromLocal(socketId);
        }
    }

    removeFromLocal(socketId) {
        this.localQueue = this.localQueue.filter(id => id !== socketId);
        this.localUsers.delete(socketId);
        console.log(`User ${socketId} removed from Local Memory queue.`);
    }

    async findMatch(currentSocketId) {
        if (redisClient.isOpen) {
            try {
                return await this.findMatchRedis(currentSocketId);
            } catch (e) {
                console.error("Redis match error, using memory:", e);
                return this.findMatchLocal(currentSocketId);
            }
        } else {
            return this.findMatchLocal(currentSocketId);
        }
    }

    async findMatchRedis(currentSocketId) {
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

    findMatchLocal(currentSocketId) {
        if (this.localQueue.length === 0) return null;

        // Simple FIFO match
        // Find someone who isn't us
        const matchIndex = this.localQueue.findIndex(id => id !== currentSocketId);

        if (matchIndex === -1) return null; // Only us in queue

        const potentialMatchId = this.localQueue[matchIndex];
        const matchData = this.localUsers.get(potentialMatchId);

        if (!matchData) {
            // Stale ID, remove and retry
            this.localQueue.splice(matchIndex, 1);
            return this.findMatchLocal(currentSocketId);
        }

        // Remove both from queue
        this.removeFromLocal(currentSocketId);
        this.removeFromLocal(potentialMatchId);

        return {
            socketId: matchData.socketId,
            preferences: JSON.parse(matchData.preferences || '{}')
        };
    }
}

module.exports = new MatchingService();
