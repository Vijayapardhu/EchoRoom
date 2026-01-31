const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration optimized for WebRTC signaling
const corsOptions = {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Trust proxy for proper IP detection on Render/Vercel
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'echoroom-signaling',
        uptime: process.uptime()
    });
});

// WebRTC TURN server credentials endpoint
// Using multiple free TURN providers for reliability
app.get('/api/turn-credentials', (req, res) => {
    // Multiple TURN server options for maximum reliability
    // These are free tier servers - for production, consider paid TURN services
    res.json({
        iceServers: [
            // STUN servers (free, unlimited)
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            { urls: 'stun:stun.stunprotocol.org:3478' },
            // Metered.ca free TURN servers (more reliable)
            {
                urls: 'turn:a.relay.metered.ca:80',
                username: 'e8dd65c92eb0fb1e27f3b6c4',
                credential: 'u/LHJ+nC+RxSWmup'
            },
            {
                urls: 'turn:a.relay.metered.ca:80?transport=tcp',
                username: 'e8dd65c92eb0fb1e27f3b6c4',
                credential: 'u/LHJ+nC+RxSWmup'
            },
            {
                urls: 'turn:a.relay.metered.ca:443',
                username: 'e8dd65c92eb0fb1e27f3b6c4',
                credential: 'u/LHJ+nC+RxSWmup'
            },
            {
                urls: 'turn:a.relay.metered.ca:443?transport=tcp',
                username: 'e8dd65c92eb0fb1e27f3b6c4',
                credential: 'u/LHJ+nC+RxSWmup'
            },
            {
                urls: 'turns:a.relay.metered.ca:443',
                username: 'e8dd65c92eb0fb1e27f3b6c4',
                credential: 'u/LHJ+nC+RxSWmup'
            },
            // OpenRelay backup (less reliable but free)
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ],
        ttl: 86400 // 24 hour TTL
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
