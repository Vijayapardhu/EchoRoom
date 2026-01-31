/**
 * WebRTCManager - Enhanced WebRTC connection manager
 * - Optimized for video/audio streaming
 * - Adaptive bitrate control
 * - Improved connection reliability
 * - Better NAT traversal with multiple TURN servers
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
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 500;
        this.reconnectTimer = null;
        this.iceConnectionCheckTimer = null;
        this.candidateQueue = [];
        this.statsInterval = null;
        this.iceGatheringTimeout = null;
        this.connectionStartTime = null;
        this.hasReceivedStream = false;

        // Event listeners
        this.listeners = {
            stateChange: [],
            remoteStream: [],
            iceCandidate: [],
            error: [],
            stats: [],
            connectionQuality: []
        };

        // Optimized ICE servers configuration
        this.iceServers = iceServers || [
            // Google's public STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            // Twilio's STUN servers
            { urls: 'stun:global.stun.twilio.com:3478' },
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
            },
            {
                urls: 'turn:openrelay.metered.ca:80?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ];

        console.log('[WebRTCManager] Initialized with enhanced ICE config');
    }

    /**
     * Get optimal RTCPeerConnection configuration
     */
    getPeerConnectionConfig() {
        return {
            iceServers: this.iceServers,
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            iceTransportPolicy: 'all'
        };
    }

    /**
     * Initialize local media stream with optimized constraints
     */
    async initializeMedia(constraints = null) {
        try {
            console.log('[WebRTCManager] Initializing media with optimized constraints...');
            
            // Default optimized constraints for video calls
            const defaultConstraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 2
                },
                video: {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 },
                    facingMode: 'user'
                }
            };

            const stream = await this.mediaManager.initializeStream(constraints || defaultConstraints);
            console.log('[WebRTCManager] Media initialized successfully with tracks:', 
                stream.getTracks().map(t => `${t.kind}:${t.label}`));
            return stream;
        } catch (error) {
            console.error('[WebRTCManager] Media initialization failed:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Create peer connection with optimized settings
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

        console.log('[WebRTCManager] Creating new peer connection with optimized config');
        this.peerConnection = new RTCPeerConnection(this.getPeerConnectionConfig());

        // Add local tracks with proper transceiver configuration
        const localStream = this.mediaManager.getStream();
        if (localStream) {
            localStream.getTracks().forEach(track => {
                const sender = this.peerConnection.addTrack(track, localStream);
                console.log('[WebRTCManager] Added track:', track.kind, 'enabled:', track.enabled);
                
                // Configure encoding parameters for video
                if (track.kind === 'video') {
                    this.configureVideoEncoding(sender);
                }
            });
        } else {
            console.warn('[WebRTCManager] No local stream available');
        }

        this.setupPeerConnectionHandlers();
        this.startStatsMonitoring();
        this.connectionStartTime = Date.now();
        this.hasReceivedStream = false;
        
        return this.peerConnection;
    }

    /**
     * Configure video encoding for adaptive bitrate
     */
    async configureVideoEncoding(sender) {
        try {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
                params.encodings = [{}];
            }
            
            // Enable adaptive bitrate
            params.encodings[0].active = true;
            params.encodings[0].adaptivePtime = true;
            
            // Set bitrate constraints (will adapt based on network)
            params.encodings[0].maxBitrate = 2500000; // 2.5 Mbps max
            params.encodings[0].minBitrate = 150000;  // 150 kbps min
            
            await sender.setParameters(params);
            console.log('[WebRTCManager] Video encoding configured for adaptive bitrate');
        } catch (error) {
            console.warn('[WebRTCManager] Could not configure video encoding:', error);
        }
    }

    /**
     * Setup peer connection event handlers
     */
    setupPeerConnectionHandlers() {
        // ICE candidate handler
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTCManager] New ICE candidate:', event.candidate.type, event.candidate.protocol);
                this.emit('iceCandidate', event.candidate);
            }
        };

        // Track handler with stream validation
        this.peerConnection.ontrack = (event) => {
            console.log('[WebRTCManager] Received remote track:', event.track.kind, 'enabled:', event.track.enabled);
            
            if (event.streams && event.streams[0]) {
                const stream = event.streams[0];
                
                // Validate stream has tracks
                if (stream.getTracks().length === 0) {
                    console.warn('[WebRTCManager] Received stream with no tracks');
                    return;
                }
                
                this.hasReceivedStream = true;
                console.log('[WebRTCManager] Remote stream received with tracks:', 
                    stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
                
                // Ensure tracks are enabled
                stream.getTracks().forEach(track => {
                    if (!track.enabled) {
                        console.log('[WebRTCManager] Enabling disabled track:', track.kind);
                        track.enabled = true;
                    }
                });
                
                this.emit('remoteStream', stream);
            }
        };

        // ICE connection state handler with faster detection
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
            
            if (connState === 'connected') {
                this.handleConnectionSuccess();
            } else if (connState === 'failed') {
                this.handleConnectionFailure();
            }
        };

        // Signaling state handler
        this.peerConnection.onsignalingstatechange = () => {
            console.log('[WebRTCManager] Signaling state:', this.peerConnection.signalingState);
        };

        // Negotiation needed handler
        this.peerConnection.onnegotiationneeded = async () => {
            console.log('[WebRTCManager] Negotiation needed');
            // This is handled by the application layer
        };

        // ICE gathering state handler
        this.peerConnection.onicegatheringstatechange = () => {
            const gatheringState = this.peerConnection.iceGatheringState;
            console.log('[WebRTCManager] ICE gathering state:', gatheringState);
        };
    }

    /**
     * Handle successful connection
     */
    handleConnectionSuccess() {
        if (this.state === ConnectionState.CONNECTED) return;
        
        const connectionTime = Date.now() - this.connectionStartTime;
        console.log(`[WebRTCManager] Connection established in ${connectionTime}ms`);
        
        this.reconnectAttempts = 0;
        this.reconnectDelay = 500;
        this.setState(ConnectionState.CONNECTED);
        this.clearReconnectTimer();
        
        // Emit connection quality
        this.emit('connectionQuality', { 
            quality: 'good', 
            connectionTime,
            hasStream: this.hasReceivedStream 
        });
    }

    /**
     * Handle disconnection with faster recovery
     */
    handleDisconnection() {
        console.warn('[WebRTCManager] Connection disconnected');

        if (this.state === ConnectionState.CONNECTED) {
            setTimeout(() => {
                if (this.peerConnection && 
                    (this.peerConnection.iceConnectionState === 'disconnected' || 
                     this.peerConnection.iceConnectionState === 'failed')) {
                    this.attemptReconnection();
                }
            }, 500);
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

        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
    }

    /**
     * Restart ICE with new offer
     */
    async restartIce() {
        try {
            console.log('[WebRTCManager] Restarting ICE...');

            if (this.peerConnection) {
                const offer = await this.peerConnection.createOffer({ 
                    iceRestart: true,
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                await this.peerConnection.setLocalDescription(offer);
                
                console.log('[WebRTCManager] ICE restart offer created');
                this.emit('iceRestart', { offer });
                return offer;
            }
        } catch (error) {
            console.error('[WebRTCManager] ICE restart failed:', error);
            this.emit('error', { type: 'ice_restart_failed', error });
        }
    }

    /**
     * Create optimized offer
     */
    async createOffer() {
        if (!this.peerConnection) {
            throw new Error('No peer connection available');
        }

        try {
            this.setState(ConnectionState.CONNECTING);

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

        while (this.candidateQueue.length > 0) {
            const candidate = this.candidateQueue.shift();
            try {
                if (!this.peerConnection || this.peerConnection.signalingState === 'closed') {
                    break;
                }
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
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
            await this.processCandidateQueue();

            const answer = await this.peerConnection.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
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
            this.candidateQueue.push(candidate);
            return;
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
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
                let bytesSent = 0;
                let bitrate = 0;

                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime) {
                        rtt = Math.round(report.currentRoundTripTime * 1000);
                    }
                    if (report.type === 'inbound-rtp') {
                        if (report.kind === 'video') {
                            packetsLost = report.packetsLost || 0;
                            jitter = report.jitter || 0;
                            bytesReceived = report.bytesReceived || 0;
                        }
                    }
                    if (report.type === 'outbound-rtp' && report.kind === 'video') {
                        bytesSent = report.bytesSent || 0;
                    }
                });

                // Calculate approximate bitrate
                if (this.lastBytesReceived) {
                    bitrate = Math.round((bytesReceived - this.lastBytesReceived) * 8 / 1000); // kbps
                }
                this.lastBytesReceived = bytesReceived;

                const statsData = { rtt, packetsLost, jitter, bytesReceived, bytesSent, bitrate };
                this.emit('stats', statsData);

                // Emit quality assessment
                let quality = 'good';
                if (rtt > 300 || packetsLost > 50) quality = 'poor';
                else if (rtt > 150 || packetsLost > 10) quality = 'fair';
                
                this.emit('connectionQuality', { quality, ...statsData });

            } catch (err) {
                // Silently fail for stats
            }
        }, 2000);
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
        this.candidateQueue = [];
        this.setState(ConnectionState.DISCONNECTED);
    }

    /**
     * Clean up all resources
     */
    cleanup() {
        console.log('[WebRTCManager] Cleaning up...');
        this.closePeerConnection();
        this.mediaManager.cleanup();
        this.listeners = { 
            stateChange: [], 
            remoteStream: [], 
            iceCandidate: [], 
            error: [], 
            stats: [],
            connectionQuality: [],
            iceRestart: []
        };
    }

    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    setState(newState) {
        if (this.state !== newState) {
            const oldState = this.state;
            this.state = newState;
            console.log(`[WebRTCManager] State: ${oldState} -> ${newState}`);
            this.emit('stateChange', { oldState, newState });
        }
    }

    getState() {
        return this.state;
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    getMediaManager() {
        return this.mediaManager;
    }

    getPeerConnection() {
        return this.peerConnection;
    }
}

export default WebRTCManager;
