const matchingService = require('./matchingService');
const safetyService = require('./safetyService');

const roomsWithInitiator = new Set();
const groupRooms = new Map(); // Track group rooms: roomId -> { participants: Set, maxSize: 6, topic: string }
const pendingMatches = new Map(); // Track users waiting for matches

const socketService = (io) => {
    // Periodic matching check for waiting users
    setInterval(async () => {
        for (const [socketId, prefs] of pendingMatches.entries()) {
            const socket = io.sockets.sockets.get(socketId);
            if (!socket) {
                pendingMatches.delete(socketId);
                continue;
            }
            
            try {
                const match = await matchingService.findMatch(socketId);
                if (match) {
                    pendingMatches.delete(socketId);
                    pendingMatches.delete(match.socketId);
                    
                    const roomId = `${socketId}-${match.socketId}`;
                    socket.join(roomId);
                    io.sockets.sockets.get(match.socketId)?.join(roomId);
                    io.to(roomId).emit('match-found', { roomId, isGroup: false });
                    console.log(`[Periodic] Match found: ${socketId} <-> ${match.socketId}`);
                }
            } catch (err) {
                console.error('[Periodic] Match check error:', err);
            }
        }
    }, 2000); // Check every 2 seconds

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
                // Check if group mode
                if (preferences.groupMode === 'group') {
                    // Find or create a group room
                    let matchedRoom = null;
                    
                    for (const [roomId, roomData] of groupRooms.entries()) {
                        if (roomData.participants.size < roomData.maxSize && 
                            roomData.mode === preferences.mode) {
                            matchedRoom = roomId;
                            break;
                        }
                    }
                    
                    if (matchedRoom) {
                        // Join existing group
                        groupRooms.get(matchedRoom).participants.add(socket.id);
                        socket.join(matchedRoom);
                        socket.emit('match-found', { roomId: matchedRoom, isGroup: true });
                        
                        // Notify existing participants about new member
                        socket.to(matchedRoom).emit('peer-joined', { peerId: socket.id });
                    } else {
                        // Create new group room
                        const newRoomId = `group-${socket.id}-${Date.now()}`;
                        groupRooms.set(newRoomId, {
                            participants: new Set([socket.id]),
                            maxSize: 6,
                            mode: preferences.mode,
                            createdAt: Date.now()
                        });
                        socket.join(newRoomId);
                        socket.emit('match-found', { roomId: newRoomId, isGroup: true, waiting: true });
                    }
                } else {
                    // Standard 1-on-1 matching
                    const match = await matchingService.addUserToQueue(socket.id, preferences);

                    if (match) {
                        console.log(`Match found: ${socket.id} <-> ${match.socketId}`);
                        const roomId = `${socket.id}-${match.socketId}`;

                        // Remove from pending matches
                        pendingMatches.delete(socket.id);
                        pendingMatches.delete(match.socketId);

                        // Join both users to the room
                        socket.join(roomId);
                        io.sockets.sockets.get(match.socketId)?.join(roomId);

                        // Notify both users
                        io.to(roomId).emit('match-found', { roomId, isGroup: false });
                    } else {
                        // Add to pending matches for periodic check
                        pendingMatches.set(socket.id, preferences);
                    }
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
            
            // Check if this is a group room
            if (roomId.startsWith('group-')) {
                // Group room logic - mesh network
                if (room) {
                    const existingPeers = Array.from(room).filter(id => id !== socket.id);
                    
                    // Send list of existing peers to the new joiner
                    socket.emit('existing-peers', { peers: existingPeers });
                    
                    // Notify existing peers about the new joiner
                    for (const peerId of existingPeers) {
                        io.to(peerId).emit('peer-joined', { peerId: socket.id });
                    }
                }
            } else {
                // 1-on-1 room logic
                if (room && room.size === 2) {
                    // Only emit is-initiator if not already done for this room
                    if (!roomsWithInitiator.has(roomId)) {
                        const clients = Array.from(room);
                        console.log(`Room ${roomId} full. Starting WebRTC handshake.`);

                        // Deterministically pick initiator
                        const initiator = clients[0];
                        const receiver = clients[1];

                        io.to(initiator).emit('is-initiator', true);
                        io.to(receiver).emit('is-initiator', false);

                        // Mark this room as having assigned initiators
                        roomsWithInitiator.add(roomId);
                    } else {
                        console.log(`Room ${roomId} already has initiators, skipping`);
                    }
                }
            }
        });

        // Handle leaving a room
        socket.on('leave-room', (roomId) => {
            console.log(`User ${socket.id} leaving room ${roomId}`);
            socket.leave(roomId);
            socket.to(roomId).emit('peer-disconnected');
        });

        // Handle WebRTC Signaling (supports both 1-on-1 and group)
        socket.on('offer', (data) => {
            const { roomId, offer, targetPeerId } = data;
            if (targetPeerId) {
                // Group call - send to specific peer
                io.to(targetPeerId).emit('offer', { offer, sender: socket.id });
            } else {
                // 1-on-1 - broadcast to room
                socket.to(roomId).emit('offer', { offer, sender: socket.id });
            }
        });

        socket.on('answer', (data) => {
            const { roomId, answer, targetPeerId } = data;
            if (targetPeerId) {
                io.to(targetPeerId).emit('answer', { answer, sender: socket.id });
            } else {
                socket.to(roomId).emit('answer', { answer, sender: socket.id });
            }
        });

        socket.on('ice-candidate', (data) => {
            const { roomId, candidate, targetPeerId } = data;
            if (targetPeerId) {
                io.to(targetPeerId).emit('ice-candidate', { candidate, sender: socket.id });
            } else {
                socket.to(roomId).emit('ice-candidate', { candidate, sender: socket.id });
            }
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

        // Reaction Events
        socket.on('send-reaction', ({ roomId, reaction }) => {
            socket.to(roomId).emit('receive-reaction', { reaction, sender: socket.id });
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
            
            // Remove from pending matches
            pendingMatches.delete(socket.id);
            
            // Cleanup group rooms
            for (const [roomId, roomData] of groupRooms.entries()) {
                if (roomData.participants.has(socket.id)) {
                    roomData.participants.delete(socket.id);
                    // Notify others in the group
                    io.to(roomId).emit('peer-left', { peerId: socket.id });
                    
                    // Delete room if empty
                    if (roomData.participants.size === 0) {
                        groupRooms.delete(roomId);
                    }
                }
            }
            
            // Cleanup initiator tracking for rooms that are now empty
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    const roomObj = io.sockets.adapter.rooms.get(room);
                    if (!roomObj || roomObj.size === 0) {
                        roomsWithInitiator.delete(room);
                    }
                }
            }
            updateActiveUsers();
        });
    });
};


module.exports = socketService;
