const matchingService = require('./matchingService');
const safetyService = require('./safetyService');

const socketService = (io) => {
    io.on('connection', async (socket) => {
        const clientIp = socket.handshake.address;
        console.log('User connected:', socket.id, 'IP:', clientIp);

        // Active Users Tracking
        const updateActiveUsers = () => {
            const count = io.engine.clientsCount;
            io.emit('active-users', { count });
        };
        updateActiveUsers();

        // Check for IP ban
        const isBanned = await safetyService.checkBanStatus(clientIp);
        if (isBanned) {
            console.log(`Blocked banned IP: ${clientIp}`);
            socket.emit('banned', { reason: 'Your IP has been banned due to safety violations.' });
            socket.disconnect(true);
            return;
        }

        // Handle joining the matching queue
        socket.on('join-queue', async (preferences) => {
            console.log(`User ${socket.id} joining queue with prefs:`, preferences);
            try {
                const match = await matchingService.addUserToQueue(socket.id, preferences);

                if (match) {
                    console.log(`Match found: ${socket.id} <-> ${match.socketId}`);
                    const roomId = `${socket.id}-${match.socketId}`;

                    // Join both users to the room
                    socket.join(roomId);
                    io.sockets.sockets.get(match.socketId)?.join(roomId);

                    // Notify both users
                    io.to(roomId).emit('match-found', { roomId });
                }
            } catch (err) {
                console.error('Error in join-queue:', err);
            }
        });

        // Handle joining a specific room (Handshake trigger)
        socket.on('join-room', ({ roomId }) => {
            console.log(`User ${socket.id} joining room ${roomId}`);
            socket.join(roomId);

            const room = io.sockets.adapter.rooms.get(roomId);
            if (room && room.size === 2) {
                const clients = Array.from(room);
                console.log(`Room ${roomId} full. Starting WebRTC handshake.`);

                // Deterministically pick initiator
                const initiator = clients[0];
                const receiver = clients[1];

                io.to(initiator).emit('is-initiator', true);
                io.to(receiver).emit('is-initiator', false);
            }
        });

        // Handle leaving a room
        socket.on('leave-room', (roomId) => {
            console.log(`User ${socket.id} leaving room ${roomId}`);
            socket.leave(roomId);
            socket.to(roomId).emit('peer-disconnected');
        });

        // Handle WebRTC Signaling
        socket.on('offer', (data) => {
            const { roomId, offer } = data;
            socket.to(roomId).emit('offer', { offer, sender: socket.id });
        });

        socket.on('answer', (data) => {
            const { roomId, answer } = data;
            socket.to(roomId).emit('answer', { answer, sender: socket.id });
        });

        socket.on('ice-candidate', (data) => {
            const { roomId, candidate } = data;
            socket.to(roomId).emit('ice-candidate', { candidate, sender: socket.id });
        });

        // Safety Events
        socket.on('panic', ({ roomId }) => {
            console.log(`Panic triggered in room ${roomId} by ${socket.id}`);
            socket.to(roomId).emit('partner-panic');
            socket.leave(roomId);
            const clientIp = socket.handshake.address;
            safetyService.handleReport(socket.id, 'unknown-target', 'PANIC_BUTTON', 'User triggered panic button', clientIp, null);
        });

        socket.on('report', ({ roomId, reason, details }) => {
            console.log(`Report received from ${socket.id} in room ${roomId}: ${reason}`);
            const room = io.sockets.adapter.rooms.get(roomId);
            let reportedIp = null;
            let reportedId = 'unknown-target';

            if (room) {
                for (const id of room) {
                    if (id !== socket.id) {
                        reportedId = id;
                        const targetSocket = io.sockets.sockets.get(id);
                        if (targetSocket) {
                            reportedIp = targetSocket.handshake.address;
                        }
                        break;
                    }
                }
            }

            safetyService.handleReport(socket.id, reportedId, reason, details, socket.handshake.address, reportedIp);
        });

        // Chat Events
        socket.on('send-message', ({ roomId, message }) => {
            socket.to(roomId).emit('receive-message', message);
        });

        // Media State Events
        socket.on('toggle-video', ({ roomId, isVideoOff }) => {
            socket.to(roomId).emit('toggle-video', { isVideoOff });
        });

        // Handle Disconnect
        socket.on('disconnecting', () => {
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    socket.to(room).emit('peer-disconnected');
                }
            }
        });

        socket.on('disconnect', async () => {
            console.log('User disconnected:', socket.id);
            await matchingService.removeUserFromQueue(socket.id);
            updateActiveUsers();
        });
    });
};


module.exports = socketService;
