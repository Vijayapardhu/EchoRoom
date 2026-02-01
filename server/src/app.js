const express = require('express');
const cors = require('cors');

const app = express();

// List of allowed origins for CORS
const allowedOrigins = [
    'https://echoroom.online',
    'https://www.echoroom.online',
    'https://echoroom-git-main-vijayapardhus-projects.vercel.app',
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

// CORS configuration optimized for WebRTC signaling
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace('www.', '')) || origin.includes('vercel.app') || origin.includes('echoroom'))) {
            callback(null, true);
        } else {
            // Blocked origin
            callback(new Error('Not allowed by CORS'));
        }
    },
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
// Credentials should be set via environment variables
app.get('/api/turn-credentials', (req, res) => {
    const iceServers = [
        // STUN servers (free, unlimited)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun.stunprotocol.org:3478' }
    ];

    // Add TURN servers from environment variables if available
    if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
        iceServers.push({
            urls: process.env.TURN_SERVER_URL,
            username: process.env.TURN_USERNAME,
            credential: process.env.TURN_CREDENTIAL
        });
    }

    res.json({
        iceServers,
        ttl: 86400 // 24 hour TTL
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
