const { db } = require('../config/firebase');

class SafetyService {
    constructor() {
        if (db) {
            this.reportsCollection = db.collection('reports');
            this.usersCollection = db.collection('users');
            this.bannedIpsCollection = db.collection('banned_ips');
        } else {
            // Running in memory-only mode
        }
    }

    async checkBanStatus(ip) {
        if (!db) return false;
        try {
            const doc = await this.bannedIpsCollection.doc(ip).get();
            return doc.exists;
        } catch (error) {
            return false;
        }
    }

    async banIp(ip, reason) {
        if (!db) return;
        try {
            await this.bannedIpsCollection.doc(ip).set({
                reason,
                timestamp: new Date(),
            });
        } catch (error) {
            // Error banning IP
        }
    }

    async handleReport(reporterId, reportedId, reason, details, reporterIp, reportedIp) {
        const report = {
            reporterId,
            reportedId,
            reason,
            details,
            reporterIp: reporterIp || null,
            reportedIp: reportedIp || null,
            timestamp: new Date(),
        };

        try {
            if (db) {
                await this.reportsCollection.add(report);
            }

            // Decrement trust score
            await this.decrementTrustScore(reportedId, 10);

            // Auto-ban logic (simplified for MVP)
            // If trust score drops below threshold, ban IP
            const score = await this.getTrustScore(reportedId);
            if (score <= 50 && reportedIp) {
                await this.banIp(reportedIp, 'Trust score too low');
            }
        } catch (error) {
            // Error saving report
        }

        return report;
    }

    async handleBlock(blockerId, blockedId) {
        // In a real app, store this in a 'blocks' subcollection or similar
    }

    async getTrustScore(userId) {
        if (!db) return 100;
        try {
            const doc = await this.usersCollection.doc(userId).get();
            if (doc.exists) {
                return doc.data().trustScore || 100;
            }
        } catch (error) {
            // Error fetching trust score
        }
        return 100; // Default
    }

    async decrementTrustScore(userId, amount) {
        if (!db) return 100;
        try {
            const userRef = this.usersCollection.doc(userId);
            let newScore = 100;
            await db.runTransaction(async (t) => {
                const doc = await t.get(userRef);
                const currentScore = doc.exists ? (doc.data().trustScore || 100) : 100;
                newScore = Math.max(0, currentScore - amount);
                t.set(userRef, { trustScore: newScore }, { merge: true });
            });
            return newScore;
        } catch (error) {
            return 100;
        }
    }
}

module.exports = new SafetyService();
