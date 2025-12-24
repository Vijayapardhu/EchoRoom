const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const app = require('./src/app');
const socketService = require('./src/services/socketService');

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

// Initialize Socket Service
socketService(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
