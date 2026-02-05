const matchingService = require('./matchingService');
const safetyService = require('./safetyService');

const roomsWithInitiator = new Set();
const groupRooms = new Map(); // Track group rooms: roomId -> { participants: Set, maxSize: 6, topic: string }
const pendingMatches = new Map(); // Track users waiting for matches

// Rate limiting and connection tracking for scalability
const connectionRateLimit = new Map(); // IP -> { count, lastReset }
const activeConnections = new Map(); // socketId -> { ip, connectedAt, roomId }
const roomConnectionStates = new Map(); // roomId -> { socketId -> connectionState }
const iceCandidateBuffer = new Map(); // roomId-peerId -> [candidates] for buffering before offer/answer

const MAX_CONNECTIONS_PER_IP = 5;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_PENDING_MATCHES = 10000;
const ICE_BUFFER_TIMEOUT = 30000; // 30 seconds to buffer ICE candidates

// Cleanup stale data periodically
const cleanupInterval = 60000; // 1 minute

const socketService = (io) => {
    // Periodic cleanup of stale connections and data
    setInterval(() => {
        const now = Date.now();
        
        // Clean up old rate limit entries
        for (const [ip, data] of connectionRateLimit.entries()) {
            if (now - data.lastReset > RATE_LIMIT_WINDOW * 2) {
                connectionRateLimit.delete(ip);
            }
        }
        
        // Clean up stale group rooms (older than 1 hour with no activity)
        for (const [roomId, roomData] of groupRooms.entries()) {
            if (roomData.participants.size === 0 || 
                (now - roomData.createdAt > 3600000 && roomData.participants.size < 2)) {
                groupRooms.delete(roomId);
                roomsWithInitiator.delete(roomId);
            }
        }
        
        // Limit pending matches queue size
        if (pendingMatches.size > MAX_PENDING_MATCHES) {
            const entriesToRemove = pendingMatches.size - MAX_PENDING_MATCHES;
            const iterator = pendingMatches.keys();
            for (let i = 0; i < entriesToRemove; i++) {
                const key = iterator.next().value;
                pendingMatches.delete(key);
            }
            console.log(`[Cleanup] Trimmed pending matches queue by ${entriesToRemove}`);
        }
        
        console.log(`[Stats] Active: ${activeConnections.size}, Pending: ${pendingMatches.size}, Groups: ${groupRooms.size}`);
    }, cleanupInterval);

    // Periodic matching check for waiting users (optimized for high load)
    setInterval(async () => {
        // Process in batches to prevent blocking
        const batchSize = 100;
        const entries = Array.from(pendingMatches.entries()).slice(0, batchSize);
        
        for (const [socketId, prefs] of entries) {
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
        const clientIp = socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                         socket.handshake.address;
        console.log('User connected:', socket.id, 'IP:', clientIp);

        // Rate limiting check
        const now = Date.now();
        let rateData = connectionRateLimit.get(clientIp);
        
        if (!rateData || now - rateData.lastReset > RATE_LIMIT_WINDOW) {
            rateData = { count: 0, lastReset: now };
        }
        
        rateData.count++;
        connectionRateLimit.set(clientIp, rateData);
        
        // Check for too many connections from same IP
        const connectionsFromIp = Array.from(activeConnections.values())
            .filter(conn => conn.ip === clientIp).length;
        
        if (connectionsFromIp >= MAX_CONNECTIONS_PER_IP) {
            console.log(`Rate limit exceeded for IP: ${clientIp} (${connectionsFromIp} connections)`);
            socket.emit('error', { message: 'Too many connections from your IP. Please try again later.' });
            socket.disconnect(true);
            return;
        }
        
        // Track this connection
        activeConnections.set(socket.id, { ip: clientIp, connectedAt: now, roomId: null });

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

        // Store peer info
        const peerInfoMap = new Map(); // socketId -> { gender, interests, name }

        // Handle joining a specific room (Handshake trigger)
        socket.on('join-room', ({ roomId, userName, peerInfo }) => {
            console.log(`User ${socket.id} joining room ${roomId}`, peerInfo);
            socket.join(roomId);
            
            // Store peer info
            peerInfoMap.set(socket.id, { ...peerInfo, name: userName, socketId: socket.id });

            const room = io.sockets.adapter.rooms.get(roomId);
            console.log(`[Room ${roomId}] Current size: ${room?.size || 0}`);
            
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
                        // Send peer info to new joiner
                        if (peerInfoMap.has(peerId)) {
                            socket.emit('peer-info', { peerId, info: peerInfoMap.get(peerId) });
                        }
                    }
                }
            } else {
                // 1-on-1 room logic
                if (room && room.size === 2) {
                    const clients = Array.from(room);
                    const otherPeerId = clients.find(id => id !== socket.id);
                    
                    // If there's already an existing peer, notify them about the new/reconnected peer
                    // This handles the reconnection case where User A refreshes but User B stays
                    if (otherPeerId) {
                        // Notify existing peer to reset their connection
                        io.to(otherPeerId).emit('peer-reconnected', { peerId: socket.id });
                    }
                    
                    // Exchange peer info between the two peers
                    if (otherPeerId && peerInfoMap.has(otherPeerId)) {
                        socket.emit('peer-info', { peerId: otherPeerId, info: peerInfoMap.get(otherPeerId) });
                        io.to(otherPeerId).emit('peer-info', { peerId: socket.id, info: peerInfoMap.get(socket.id) });
                    }
                    
                    // Reset initiator flag for reconnection scenarios
                    // Remove old initiator assignment so new one can be made
                    roomsWithInitiator.delete(roomId);
                    
                    // Always reassign roles when someone joins (handles reconnection)
                    if (!roomsWithInitiator.has(roomId)) {
                        console.log(`[WebRTC] Room ${roomId} ready with 2 peers. Assigning roles...`);

                        // Sort to deterministically pick initiator (alphabetically)
                        clients.sort();
                        const initiator = clients[0];
                        const receiver = clients[1];

                        console.log(`[WebRTC] Initiator: ${initiator}, Receiver: ${receiver}`);

                        // Emit to both peers immediately for faster connection
                        io.to(initiator).emit('is-initiator', true);
                        io.to(receiver).emit('is-initiator', false);
                        console.log(`[WebRTC] Roles assigned for room ${roomId}`);

                        // Mark this room as having assigned initiators
                        roomsWithInitiator.add(roomId);
                    } else {
                        console.log(`[WebRTC] Room ${roomId} already has initiators, skipping`);
                    }
                } else if (room && room.size > 2) {
                    // Room is full, notify the new joiner
                    console.log(`[Room ${roomId}] Room is full (${room.size} users)`);
                    socket.emit('room-full', { message: 'Room is already full' });
                } else {
                    console.log(`[Room ${roomId}] Waiting for peer... (${room?.size || 0}/2)`);
                }
            }
        });

        // Handle request for initiator status (in case client missed it)
        socket.on('request-initiator-status', ({ roomId }) => {
            console.log(`[WebRTC] User ${socket.id} requesting initiator status for room ${roomId}`);
            
            const room = io.sockets.adapter.rooms.get(roomId);
            if (room && room.size === 2) {
                const clients = Array.from(room);
                clients.sort();
                const initiator = clients[0];
                const receiver = clients[1];
                
                // Re-send initiator status to the requesting client
                if (socket.id === initiator) {
                    console.log(`[WebRTC] Re-sending is-initiator: true to ${socket.id}`);
                    socket.emit('is-initiator', true);
                } else if (socket.id === receiver) {
                    console.log(`[WebRTC] Re-sending is-initiator: false to ${socket.id}`);
                    socket.emit('is-initiator', false);
                }
            } else {
                console.log(`[WebRTC] Room ${roomId} not ready (${room?.size || 0}/2), cannot send initiator status`);
            }
        });

        // Handle "Next" button - skip to next match
        socket.on('next', ({ roomId }) => {
            console.log(`User ${socket.id} clicked Next in room ${roomId}`);
            
            // Notify partner that user left
            socket.to(roomId).emit('partner-left', { reason: 'next' });
            
            // Leave the current room
            socket.leave(roomId);
            
            // Clean up room state
            roomsWithInitiator.delete(roomId);
            if (roomConnectionStates.has(roomId)) {
                roomConnectionStates.delete(roomId);
            }
            
            // Clean up ICE candidate buffer
            for (const [key] of iceCandidateBuffer.entries()) {
                if (key.includes(roomId)) {
                    iceCandidateBuffer.delete(key);
                }
            }
            
            // Remove from matching queue if was waiting
            matchingService.removeUserFromQueue(socket.id);
            pendingMatches.delete(socket.id);
        });

        // Handle leaving a room
        socket.on('leave-room', (roomId) => {
            console.log(`User ${socket.id} leaving room ${roomId}`);
            socket.leave(roomId);
            socket.to(roomId).emit('peer-disconnected');
            socket.to(roomId).emit('partner-left', { reason: 'leave' });
            
            // Clean up room state
            roomsWithInitiator.delete(roomId);
            if (roomConnectionStates.has(roomId)) {
                roomConnectionStates.get(roomId).delete(socket.id);
                if (roomConnectionStates.get(roomId).size === 0) {
                    roomConnectionStates.delete(roomId);
                }
            }
            
            // Clean up ICE candidate buffer
            const bufferKey = `${roomId}-${socket.id}`;
            iceCandidateBuffer.delete(bufferKey);
        });

        // Handle WebRTC Signaling with enhanced reliability
        socket.on('offer', (data) => {
            const { roomId, offer, targetPeerId } = data;
            console.log(`[WebRTC] Offer from ${socket.id} to ${targetPeerId || 'room'}`);
            
            if (targetPeerId) {
                // Group call - send to specific peer
                io.to(targetPeerId).emit('offer', { offer, sender: socket.id });
                
                // Send any buffered ICE candidates
                const bufferKey = `${roomId}-${socket.id}-${targetPeerId}`;
                if (iceCandidateBuffer.has(bufferKey)) {
                    const candidates = iceCandidateBuffer.get(bufferKey);
                    candidates.forEach(candidate => {
                        io.to(targetPeerId).emit('ice-candidate', { candidate, sender: socket.id });
                    });
                    iceCandidateBuffer.delete(bufferKey);
                }
            } else {
                // 1-on-1 - broadcast to room
                socket.to(roomId).emit('offer', { offer, sender: socket.id });
            }
        });

        socket.on('answer', (data) => {
            const { roomId, answer, targetPeerId } = data;
            console.log(`[WebRTC] Answer from ${socket.id} to ${targetPeerId || 'room'}`);
            
            if (targetPeerId) {
                io.to(targetPeerId).emit('answer', { answer, sender: socket.id });
            } else {
                socket.to(roomId).emit('answer', { answer, sender: socket.id });
            }
        });

        socket.on('ice-candidate', (data) => {
            const { roomId, candidate, targetPeerId } = data;
            
            if (!candidate) return; // Ignore null candidates
            
            // Log ICE candidate transmission
            console.log(`[WebRTC] ICE candidate from ${socket.id} to ${targetPeerId || 'room:' + roomId}`);
            
            if (targetPeerId) {
                io.to(targetPeerId).emit('ice-candidate', { candidate, sender: socket.id });
            } else {
                socket.to(roomId).emit('ice-candidate', { candidate, sender: socket.id });
            }
        });
        
        // Handle connection state updates for monitoring
        socket.on('connection-state', (data) => {
            const { roomId, state } = data;
            if (!roomConnectionStates.has(roomId)) {
                roomConnectionStates.set(roomId, new Map());
            }
            roomConnectionStates.get(roomId).set(socket.id, { state, timestamp: Date.now() });
            
            // Notify peer about connection state
            socket.to(roomId).emit('peer-connection-state', { peerId: socket.id, state });
            
            if (state === 'connected') {
                console.log(`[WebRTC] Connection established in room ${roomId}`);
            } else if (state === 'failed') {
                console.log(`[WebRTC] Connection failed in room ${roomId} for ${socket.id}`);
            }
        });
        
        // Handle ICE restart requests
        socket.on('ice-restart', (data) => {
            const { roomId, offer, targetPeerId } = data;
            console.log(`[WebRTC] ICE restart requested by ${socket.id}`);
            
            if (targetPeerId) {
                io.to(targetPeerId).emit('ice-restart', { offer, sender: socket.id });
            } else {
                socket.to(roomId).emit('ice-restart', { offer, sender: socket.id });
            }
        });
        
        // Handle renegotiation needed (for adding/removing tracks)
        socket.on('renegotiate', (data) => {
            const { roomId, targetPeerId } = data;
            console.log(`[WebRTC] Renegotiation requested by ${socket.id}`);
            
            if (targetPeerId) {
                io.to(targetPeerId).emit('renegotiate', { sender: socket.id });
            } else {
                socket.to(roomId).emit('renegotiate', { sender: socket.id });
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

        // Peer Info Update
        socket.on('update-peer-info', ({ roomId, info }) => {
            peerInfoMap.set(socket.id, { ...info, socketId: socket.id });
            socket.to(roomId).emit('peer-info', { peerId: socket.id, info });
        });

        // Media State Events
        socket.on('toggle-video', ({ roomId, isVideoOff }) => {
            socket.to(roomId).emit('toggle-video', { isVideoOff, peerId: socket.id });
        });
        
        socket.on('toggle-audio', ({ roomId, isMuted }) => {
            socket.to(roomId).emit('toggle-audio', { isMuted, peerId: socket.id });
        });
        
        // Ping/Pong for connection health monitoring
        socket.on('ping-server', (callback) => {
            if (typeof callback === 'function') {
                callback({ timestamp: Date.now() });
            }
        });

        // Handle Disconnect
        socket.on('disconnecting', () => {
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    socket.to(room).emit('peer-disconnected', { peerId: socket.id });
                }
            }
        });

        socket.on('disconnect', async () => {
            console.log('User disconnected:', socket.id);
            await matchingService.removeUserFromQueue(socket.id);
            
            // Remove from pending matches
            pendingMatches.delete(socket.id);
            
            // Remove from active connections
            activeConnections.delete(socket.id);
            
            // Cleanup group rooms
            for (const [roomId, roomData] of groupRooms.entries()) {
                if (roomData.participants.has(socket.id)) {
                    roomData.participants.delete(socket.id);
                    // Notify others in the group
                    io.to(roomId).emit('peer-left', { peerId: socket.id });
                    
                    // Delete room if empty
                    if (roomData.participants.size === 0) {
                        groupRooms.delete(roomId);
                        roomsWithInitiator.delete(roomId);
                        roomConnectionStates.delete(roomId);
                    }
                }
            }
            
            // Cleanup initiator tracking and connection states for rooms that are now empty
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    const roomObj = io.sockets.adapter.rooms.get(room);
                    if (!roomObj || roomObj.size === 0) {
                        roomsWithInitiator.delete(room);
                        roomConnectionStates.delete(room);
                    } else {
                        // Remove this socket from room connection states
                        if (roomConnectionStates.has(room)) {
                            roomConnectionStates.get(room).delete(socket.id);
                        }
                    }
                    
                    // Clean up ICE candidate buffers for this socket
                    for (const [key] of iceCandidateBuffer.entries()) {
                        if (key.includes(socket.id)) {
                            iceCandidateBuffer.delete(key);
                        }
                    }
                }
            }
            
            // Clean up peer info
            peerInfoMap.delete(socket.id);
            
            updateActiveUsers();
        });
    });
};


module.exports = socketService;
