const redisClient = require('../config/redis');

class MatchingService {
    constructor() {
        this.QUEUE_KEY = 'matching_queue';
        this.USER_PREFIX = 'user:';
        this.MATCH_THRESHOLD = 50;
        this.MAX_WAIT_TIME = 10000; // 10 seconds before relaxing rules

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

        if (redisClient.isReady) {
            try {
                await redisClient.hSet(`${this.USER_PREFIX}${socketId}`, user);
                await redisClient.rPush(this.QUEUE_KEY, socketId);
            } catch (e) {
                console.error("Redis error, falling back to memory:", e);
                this.localUsers.set(socketId, user);
                this.localQueue.push(socketId);
            }
        } else {
            this.localUsers.set(socketId, user);
            this.localQueue.push(socketId);
        }

        return this.findMatch(socketId);
    }

    async removeUserFromQueue(socketId) {
        if (redisClient.isReady) {
            try {
                await redisClient.lRem(this.QUEUE_KEY, 0, socketId);
                await redisClient.del(`${this.USER_PREFIX}${socketId}`);
            } catch (e) {
                this.removeFromLocal(socketId);
            }
        } else {
            this.removeFromLocal(socketId);
        }
    }

    removeFromLocal(socketId) {
        this.localQueue = this.localQueue.filter(id => id !== socketId);
        this.localUsers.delete(socketId);
    }

    async findMatch(currentSocketId) {
        if (redisClient.isReady) {
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

    calculateScore(userA, userB) {
        const prefA = typeof userA.preferences === 'string' ? JSON.parse(userA.preferences) : userA.preferences;
        const prefB = typeof userB.preferences === 'string' ? JSON.parse(userB.preferences) : userB.preferences;

        // 1. Hard Filter: Group Mode (Must match)
        if (prefA.groupMode !== prefB.groupMode) return -1;

        let score = 0;

        // 2. Mode Match (Video vs Text) - High Priority
        if (prefA.mode === prefB.mode) {
            score += 50;
        }

        // 3. Gender Match
        // Does B match A's preference?
        const aSatisfied = prefA.partnerGender === 'any' || prefA.partnerGender === prefB.gender;
        // Does A match B's preference?
        const bSatisfied = prefB.partnerGender === 'any' || prefB.partnerGender === prefA.gender;

        if (aSatisfied && bSatisfied) {
            score += 60; // Mutual satisfaction
        } else if (aSatisfied || bSatisfied) {
            score += 10; // Partial (should be rare/impossible if strict, but good for fallback)
        } else {
            // Mismatch
            score -= 50;
        }

        // 4. Interest Match
        const commonInterests = prefA.interests.filter(i => prefB.interests.includes(i));
        score += commonInterests.length * 10;

        return score;
    }

    async findMatchRedis(currentSocketId) {
        // Get current user details
        const currentUserData = await redisClient.hGetAll(`${this.USER_PREFIX}${currentSocketId}`);
        if (!currentUserData || !currentUserData.socketId) return null;

        const joinedAt = parseInt(currentUserData.joinedAt);
        const waitTime = Date.now() - joinedAt;
        const isDesperate = waitTime > this.MAX_WAIT_TIME;

        // Get candidate pool (first 50 users)
        const candidateIds = await redisClient.lRange(this.QUEUE_KEY, 0, 49);

        let bestMatch = null;
        let bestScore = -100;

        for (const id of candidateIds) {
            if (id === currentSocketId) continue;

            const candidateData = await redisClient.hGetAll(`${this.USER_PREFIX}${id}`);
            if (!candidateData || !candidateData.socketId) continue;

            const score = this.calculateScore(currentUserData, candidateData);

            if (score === -1) continue; // Hard filter mismatch

            // Logic:
            // 1. If score > Threshold, it's a good match.
            // 2. If we are desperate, take any positive score.
            // 3. Pick the HIGHEST score found.

            if (score > bestScore) {
                bestScore = score;
                bestMatch = candidateData;
            }
        }

        // Decision
        if (bestMatch) {
            if (bestScore >= this.MATCH_THRESHOLD || (isDesperate && bestScore > 0)) {
                // Execute Match
                await this.removeUserFromQueue(currentSocketId);
                await this.removeUserFromQueue(bestMatch.socketId);

                return {
                    socketId: bestMatch.socketId,
                    preferences: JSON.parse(bestMatch.preferences || '{}')
                };
            }
        }

        return null; // Keep waiting
    }

    findMatchLocal(currentSocketId) {
        const currentUser = this.localUsers.get(currentSocketId);
        if (!currentUser) return null;

        const joinedAt = parseInt(currentUser.joinedAt);
        const waitTime = Date.now() - joinedAt;
        const isDesperate = waitTime > this.MAX_WAIT_TIME;

        let bestMatch = null;
        let bestScore = -100;

        for (const id of this.localQueue) {
            if (id === currentSocketId) continue;

            const candidate = this.localUsers.get(id);
            if (!candidate) continue;

            const score = this.calculateScore(currentUser, candidate);

            if (score === -1) continue;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = candidate;
            }
        }

        if (bestMatch) {
            if (bestScore >= this.MATCH_THRESHOLD || (isDesperate && bestScore > 0)) {
                this.removeFromLocal(currentSocketId);
                this.removeFromLocal(bestMatch.socketId);

                return {
                    socketId: bestMatch.socketId,
                    preferences: JSON.parse(bestMatch.preferences || '{}')
                };
            }
        }

        return null;
    }
}

module.exports = new MatchingService();
