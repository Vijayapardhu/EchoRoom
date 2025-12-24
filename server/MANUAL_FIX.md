# Manual Fix for Black Screen Issue

## Quick Fix Instructions

### File to Edit: `server/src/services/socketService.js`

### Step 1: Add tracking variable
At the **very top** of the file (after the requires, around line 3), add:
```javascript
const matchingService = require('./matchingService');
const safetyService = require('./safetyService');

// ADD THIS LINE:
const roomsWithInitiator = new Set();

const socketService = (io) => {
```

### Step 2: Modify the join-room handler
Find this code (around line 48-64):
```javascript
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
```

**Replace with:**
```javascript
socket.on('join-room', ({ roomId }) => {
    console.log(`User ${socket.id} joining room ${roomId}`);
    socket.join(roomId);

    const room = io.sockets.adapter.rooms.get(roomId);
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
});
```

### Step 3: Clean up when users disconnect
Find the disconnect handler (around line 140) and add cleanup:
```javascript
socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    await matchingService.removeUserFromQueue(socket.id);
    
    // ADD THESE LINES:
    // Clean up room initiator tracking
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
```

### Step 4: Restart the server
After making these changes, restart your server:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## That's it!
The black screen should now be fixed. The server will only send `is-initiator` once per room.
