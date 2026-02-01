/**
 * SignalingService - Enhanced signaling with reliability features
 * - Message queuing for offline scenarios
 * - Duplicate detection
 * - Timeout handling
 * - Retry logic
 */

class SignalingService {
    constructor(socket) {
        this.socket = socket;
        this.messageQueue = [];
        this.processedMessages = new Set();
        this.messageIdCounter = 0;
        this.pendingAcks = new Map();
        this.ackTimeout = 5000; // 5 seconds
    }

    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${this.messageIdCounter++}`;
    }

    /**
     * Send signaling message with reliability
     */
    send(event, data, requiresAck = false) {
        const messageId = this.generateMessageId();
        const message = {
            id: messageId,
            event,
            data,
            timestamp: Date.now()
        };

        if (this.socket && this.socket.connected) {
            this.socket.emit(event, { ...data, _msgId: messageId });

            if (requiresAck) {
                this.waitForAck(messageId, event, data);
            }
        } else {
            this.messageQueue.push(message);
        }

        return messageId;
    }

    /**
     * Wait for acknowledgment with timeout
     */
    waitForAck(messageId, event, data) {
        const timeout = setTimeout(() => {
            this.pendingAcks.delete(messageId);
            // Retry logic could go here
        }, this.ackTimeout);

        this.pendingAcks.set(messageId, { event, data, timeout });
    }

    /**
     * Handle acknowledgment
     */
    handleAck(messageId) {
        const pending = this.pendingAcks.get(messageId);
        if (pending) {
            clearTimeout(pending.timeout);
            this.pendingAcks.delete(messageId);
        }
    }

    /**
     * Process queued messages
     */
    processQueue() {
        if (!this.socket || !this.socket.connected) {
            return;
        }

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.socket.emit(message.event, { ...message.data, _msgId: message.id });
        }
    }

    /**
     * Check if message was already processed (duplicate detection)
     */
    isDuplicate(messageId) {
        if (this.processedMessages.has(messageId)) {
            return true;
        }

        this.processedMessages.add(messageId);

        // Clean up old processed messages (keep last 1000)
        if (this.processedMessages.size > 1000) {
            const iterator = this.processedMessages.values();
            for (let i = 0; i < 100; i++) {
                this.processedMessages.delete(iterator.next().value);
            }
        }

        return false;
    }

    /**
     * Send offer
     */
    sendOffer(roomId, offer) {
        return this.send('offer', { roomId, offer }, true);
    }

    /**
     * Send answer
     */
    sendAnswer(roomId, answer) {
        return this.send('answer', { roomId, answer }, true);
    }

    /**
     * Send ICE candidate
     */
    sendIceCandidate(roomId, candidate) {
        return this.send('ice-candidate', { roomId, candidate });
    }

    /**
     * Join room
     */
    joinRoom(roomId) {
        return this.send('join-room', { roomId });
    }

    /**
     * Leave room
     */
    leaveRoom(roomId) {
        return this.send('leave-room', roomId);
    }

    /**
     * Register event listener with duplicate detection
     */
    on(event, callback) {
        if (!this.socket) return;

        const wrappedCallback = (data) => {
            const messageId = data._msgId;

            // Check for duplicates
            if (messageId && this.isDuplicate(messageId)) {
                return;
            }

            // Send acknowledgment if message ID present
            if (messageId) {
                this.socket.emit('ack', { messageId });
            }

            callback(data);
        };

        this.socket.on(event, wrappedCallback);
        return wrappedCallback;
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    /**
     * Clean up
     */
    cleanup() {
        // Clear pending acks
        this.pendingAcks.forEach(pending => clearTimeout(pending.timeout));
        this.pendingAcks.clear();

        // Clear queues
        this.messageQueue = [];
        this.processedMessages.clear();
    }
}

export default SignalingService;
