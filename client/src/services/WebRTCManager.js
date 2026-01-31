/**
 * WebRTCManager - Core WebRTC connection manager
 * - State machine for connection lifecycle
 * - Automatic reconnection with exponential backoff
 * - ICE connection monitoring
 * - Event emission for UI updates
 */

import MediaManager from './MediaManager';

// Connection states
export const ConnectionState = {
    IDLE: 'idle',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    FAILED: 'failed'
};

class WebRTCManager {
    constructor(iceServers = null) {
        this.peerConnection = null;
        this.mediaManager = new MediaManager();
        this.state = ConnectionState.IDLE;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3; // Reduced for faster failover
        this.reconnectDelay = 500; // Start with 500ms for faster retry
        this.reconnectTimer = null;
        this.iceConnectionCheckTimer = null;
        this.candidateQueue = []; // Queue for early ICE candidates
        this.statsInterval = null;
        this.iceGatheringTimeout = null;

        // Event listeners
        this.listeners = {
            stateChange: [],
            remoteStream: [],
            iceCandidate: [],
            error: [],
            stats: []
        };

        // ICE servers configuration - optimized for speed with TURN fallback
        this.iceServers = iceServers || [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            // Free TURN servers for NAT traversal
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ];

        console.log('[WebRTCManager] Initialized with optimized ICE config');
    }

    /**
     * Get optimal RTCPeerConnection configuration
     */
    getPeerConnectionConfig() {
        return {
            iceServers: this.iceServers,
            iceCandidatePoolSize: 5, // Pre-gather candidates
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            iceTransportPolicy: 'all'
        };
    }

    /**
     * Initialize local media stream
     */
    async initializeMedia(constraints = null) {
        try {
            console.log('[WebRTCManager] Initializing media...');
            const stream = await this.mediaManager.initializeStream(constraints);
            console.log('[WebRTCManager] Media initialized successfully');
            return stream;
        } catch (error) {
            console.error('[WebRTCManager] Media initialization failed:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Create peer connection
     */
    createPeerConnection() {
        if (this.peerConnection) {
            console.warn('[WebRTCManager] Closing existing peer connection');
            this.closePeerConnection();
        }

        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }

        console.log('[WebRTCManager] Creating new peer connection');
        this.peerConnection = new RTCPeerConnection(this.getPeerConnectionConfig());

        // Add local tracks
        const localStream = this.mediaManager.getStream();
        if (localStream) {
            localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, localStream);
                console.log('[WebRTCManager] Added track:', track.kind);
            });
        } else {
            console.warn('[WebRTCManager] No local stream available when creating peer connection');
        }

        // Set up event handlers
        this.setupPeerConnectionHandlers();        
        // Start stats monitoring
        this.startStatsMonitoring();
        return this.peerConnection;
    }

    /**
     * Setup peer connection event handlers
     */
    setupPeerConnectionHandlers() {
        // ICE candidate handler
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTCManager] New ICE candidate:', event.candidate.type);
                this.emit('iceCandidate', event.candidate);
            }
        };

        // Track handler (remote stream)
        this.peerConnection.ontrack = (event) => {
            console.log('[WebRTCManager] Received remote track:', event.track.kind);
            this.emit('remoteStream', event.streams[0]);
        };

        // ICE connection state handler
        this.peerConnection.oniceconnectionstatechange = () => {
            const iceState = this.peerConnection.iceConnectionState;
            console.log('[WebRTCManager] ICE connection state:', iceState);

            switch (iceState) {
                case 'connected':
                case 'completed':
                    this.handleConnectionSuccess();
                    break;
                case 'disconnected':
                    this.handleDisconnection();
                    break;
                case 'failed':
                    this.handleConnectionFailure();
                    break;
                case 'closed':
                    this.setState(ConnectionState.DISCONNECTED);
                    break;
            }
        };

        // Connection state handler
        this.peerConnection.onconnectionstatechange = () => {
            const connState = this.peerConnection.connectionState;
            console.log('[WebRTCManager] Connection state:', connState);
        };

        // Signaling state handler
        this.peerConnection.onsignalingstatechange = () => {
            console.log('[WebRTCManager] Signaling state:', this.peerConnection.signalingState);
        };

        // ICE gathering state handler for connection monitoring
        this.peerConnection.onicegatheringstatechange = () => {
            const gatheringState = this.peerConnection.iceGatheringState;
            console.log('[WebRTCManager] ICE gathering state:', gatheringState);
            
            if (gatheringState === 'complete') {
                console.log('[WebRTCManager] ICE gathering complete');
            }
        };
    }

    /**
     * Handle successful connection
     */
    handleConnectionSuccess() {
        console.log('[WebRTCManager] Connection established successfully');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.setState(ConnectionState.CONNECTED);
        this.clearReconnectTimer();
    }

    /**
     * Handle disconnection
     */
    handleDisconnection() {
        console.warn('[WebRTCManager] Connection disconnected');

        if (this.state === ConnectionState.CONNECTED) {
            // Wait briefly for transient issues (reduced from 1000ms)
            setTimeout(() => {
                if (this.peerConnection && this.peerConnection.iceConnectionState === 'disconnected') {
                    this.attemptReconnection();
                }
            }, 300);
        }
    }

    /**
     * Handle connection failure
     */
    handleConnectionFailure() {
        console.error('[WebRTCManager] Connection failed');
        this.setState(ConnectionState.FAILED);
        this.attemptReconnection();
    }

    /**
     * Attempt reconnection with exponential backoff
     */
    attemptReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WebRTCManager] Max reconnection attempts reached');
            this.setState(ConnectionState.FAILED);
            this.emit('error', {
                type: 'reconnection_failed',
                message: 'Failed to reconnect after multiple attempts'
            });
            return;
        }

        this.reconnectAttempts++;
        this.setState(ConnectionState.RECONNECTING);

        console.log(`[WebRTCManager] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

        this.reconnectTimer = setTimeout(() => {
            this.restartIce();
        }, this.reconnectDelay);

        // Exponential backoff: 500ms, 1s, 2s, 4s, 8s
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 8000);
    }

    /**
     * Restart ICE
     */
    async restartIce() {
        try {
            console.log('[WebRTCManager] Restarting ICE...');

            if (this.peerConnection) {
                // Create new offer with iceRestart
                const offer = await this.peerConnection.createOffer({ iceRestart: true });
                await this.peerConnection.setLocalDescription(offer);

                console.log('[WebRTCManager] ICE restart offer created');
                return offer;
            }
        } catch (error) {
            console.error('[WebRTCManager] ICE restart failed:', error);
            this.emit('error', { type: 'ice_restart_failed', originalError: error });
        }
    }

    /**
     * Create offer with optimized settings
     */
    async createOffer() {
        if (!this.peerConnection) {
            throw new Error('No peer connection available');
        }

        try {
            this.setState(ConnectionState.CONNECTING);
            
            // Optimized offer options for faster connection
            const offerOptions = {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                iceRestart: false
            };
            
            const offer = await this.peerConnection.createOffer(offerOptions);
            await this.peerConnection.setLocalDescription(offer);
            
            console.log('[WebRTCManager] Offer created');
            return offer;
        } catch (error) {
            console.error('[WebRTCManager] Failed to create offer:', error);
            this.setState(ConnectionState.FAILED);
            throw error;
        }
    }

    /**
     * Process queued ICE candidates
     */
    async processCandidateQueue() {
        if (!this.peerConnection || !this.candidateQueue.length) return;

        console.log(`[WebRTCManager] Processing ${this.candidateQueue.length} queued candidates`);
        
        // Use a copy to iterate, but we shift one by one in case of errors
        // Wait for connection to be stable enough?
        // Candidates can be added when remote description is set.
        
        while (this.candidateQueue.length > 0) {
            const candidate = this.candidateQueue.shift();
            try {
                // Check if connection is still valid
                if (!this.peerConnection || this.peerConnection.signalingState === 'closed') {
                    console.warn('[WebRTCManager] Peer connection closed while processing queue');
                    break;
                }
                
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('[WebRTCManager] Queued ICE candidate added');
            } catch (error) {
                console.error('[WebRTCManager] Failed to add queued ICE candidate:', error);
            }
        }
    }

    /**
     * Handle received offer
     */
    async handleOffer(offer) {
        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        try {
            this.setState(ConnectionState.CONNECTING);
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Process any queued candidates immediately
            await this.processCandidateQueue();
            
            // Create answer with optimized options
            const answerOptions = {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            };
            
            const answer = await this.peerConnection.createAnswer(answerOptions);
            await this.peerConnection.setLocalDescription(answer);
            console.log('[WebRTCManager] Answer created');
            return answer;
        } catch (error) {
            console.error('[WebRTCManager] Failed to handle offer:', error);
            this.setState(ConnectionState.FAILED);
            throw error;
        }
    }

    /**
     * Handle received answer
     */
    async handleAnswer(answer) {
        if (!this.peerConnection) {
            throw new Error('No peer connection available');
        }

        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            
            // Process any queued candidates immediately
            await this.processCandidateQueue();
            
            console.log('[WebRTCManager] Answer set successfully');
        } catch (error) {
            console.error('[WebRTCManager] Failed to handle answer:', error);
            throw error;
        }
    }

    /**
     * Add ICE candidate
     */
    async addIceCandidate(candidate) {
        if (!this.peerConnection) {
            console.warn('[WebRTCManager] No peer connection for ICE candidate');
            return;
        }

        if (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
            console.warn('[WebRTCManager] No remote description set, queuing ICE candidate');
            this.candidateQueue.push(candidate);
            return;
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('[WebRTCManager] ICE candidate added');
        } catch (error) {
            console.error('[WebRTCManager] Failed to add ICE candidate:', error);
        }
    }

    /**
     * Start monitoring connection stats
     */
    startStatsMonitoring() {
        if (this.statsInterval) clearInterval(this.statsInterval);

        this.statsInterval = setInterval(async () => {
            if (!this.peerConnection || this.peerConnection.connectionState !== 'connected') return;

            try {
                const stats = await this.peerConnection.getStats();
                let rtt = 0;
                let packetsLost = 0;
                let jitter = 0;
                let bytesReceived = 0;

                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime) {
                        rtt = Math.round(report.currentRoundTripTime * 1000); // Convert to ms
                    }
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        packetsLost = report.packetsLost || 0;
                        jitter = report.jitter || 0;
                        bytesReceived = report.bytesReceived || 0;
                    }
                });

                this.emit('stats', { rtt, packetsLost, jitter, bytesReceived });
            } catch (err) {
                // silently fail for stats
            }
        }, 1000);
    }

    /**
     * Close peer connection
     */
    closePeerConnection() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
            console.log('[WebRTCManager] Peer connection closed');
        }
        this.clearReconnectTimer();
        this.setState(ConnectionState.DISCONNECTED);
    }

    /**
     * Clean up all resources
     */
    cleanup() {
        console.log('[WebRTCManager] Cleaning up...');
        this.closePeerConnection();
        this.mediaManager.cleanup();
        this.clearReconnectTimer();
        this.listeners = { stateChange: [], remoteStream: [], iceCandidate: [], error: [], stats: [] };
    }

    /**
     * Clear reconnect timer
     */
    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Set connection state
     */
    setState(newState) {
        if (this.state !== newState) {
            const oldState = this.state;
            this.state = newState;
            console.log(`[WebRTCManager] State changed: ${oldState} → ${newState}`);
            this.emit('stateChange', { oldState, newState });
        }
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }

    /**
     * Event emitter - on
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Event emitter - off
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Event emitter - emit
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Get media manager
     */
    getMediaManager() {
        return this.mediaManager;
    }

    /**
     * Get peer connection
     */
    getPeerConnection() {
        return this.peerConnection;
    }
}

export default WebRTCManager;
