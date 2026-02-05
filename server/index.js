const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const app = require('./src/app');
const socketService = require('./src/services/socketService');

dotenv.config();

const server = http.createServer(app);

// Allowed origins for Socket.IO
const allowedOrigins = [
    'https://echoroom.online',
    'https://www.echoroom.online',
    'https://echoroom-git-main-vijayapardhus-projects.vercel.app',
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

// Optimized Socket.IO configuration for WebRTC signaling
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, etc.)
            if (!origin) return callback(null, true);
            // Allow all vercel.app and echoroom domains
            if (origin.includes('vercel.app') || origin.includes('echoroom') || origin.includes('localhost')) {
                callback(null, true);
            } else {
                console.log('[CORS] Blocking origin:', origin);
                callback(null, true); // Allow anyway for debugging
            }
        },
        methods: ["GET", "POST"],
        credentials: false  // Disabled to avoid CORS issues
    },
    // Optimized settings for real-time WebRTC signaling
    pingTimeout: 60000,           // Increased for mobile networks
    pingInterval: 25000,          // Keep-alive interval
    transports: ['polling', 'websocket'],  // Polling first for reliability
    allowUpgrades: true,
    upgradeTimeout: 10000,        // Time to upgrade from polling to websocket
    perMessageDeflate: false,     // Disable compression for lower latency
    httpCompression: false,       // Disable HTTP compression for speed
    maxHttpBufferSize: 1e6,       // 1MB max buffer for signaling messages
    connectTimeout: 45000,        // Connection timeout
    // WebSocket-specific options for better performance
    allowEIO3: true,              // Allow Engine.IO v3 clients
    cookie: false                 // Disable cookies for faster handshake
});

// Connection event logging
io.engine.on('connection_error', (err) => {
    console.error('[Socket.IO] Connection error:', err.message);
});

io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id, 'from', socket.handshake.headers.origin || 'unknown');
    
    socket.on('disconnect', (reason) => {
        console.log('[Socket.IO] Client disconnected:', socket.id, 'Reason:', reason);
    });
    
    socket.on('error', (error) => {
        console.error('[Socket.IO] Socket error:', socket.id, error.message);
    });
});

// Initialize Socket Service
socketService(io);

const PORT = process.env.PORT || 5000;

// Graceful shutdown handler
const gracefulShutdown = () => {
    io.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

server.listen(PORT, () => {
    // Server started
});
