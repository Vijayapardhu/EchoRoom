const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

(async () => {
    try {
        if (!client.isOpen) {
            await client.connect();
        }
    } catch (err) {
        console.warn('Redis Connection Failed (Is Redis running?):', err.message);
        // We don't exit process here, allowing server to start without Redis (features will fail)
    }
})();

module.exports = client;
