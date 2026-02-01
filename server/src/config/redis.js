const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => {
    // Suppress ECONNREFUSED logs to avoid console spam when Redis is missing
    if (err.code === 'ECONNREFUSED') {
        return;
    }
    // Redis client error
});
client.on('connect', () => {});

(async () => {
    try {
        if (!client.isOpen) {
            await client.connect();
        }
    } catch (err) {
        // Redis connection failed, allowing server to start without Redis
    }
})();

module.exports = client;
