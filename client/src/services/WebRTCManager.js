/**
 * WebRTCManager - Enhanced WebRTC connection manager
 * - Optimized for video/audio streaming
 * - Adaptive bitrate control
 * - Improved connection reliability
 * - Better NAT traversal with multiple TURN servers
 * - Optimized for high-load scenarios
 */

import MediaManager from './MediaManager';
import { ICE_SERVERS, PEER_CONFIG, MEDIA_CONSTRAINTS, CONNECTION_SETTINGS } from '../config/webrtc.config';

// Connection states
export const ConnectionState = {
    IDLE: 'idle',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    FAILED: 'failed'
};

// Fetch TURN credentials from server (with fallback)
const fetchTurnCredentials = async (serverUrl) => {
    try {
        const response = await fetch(`${serverUrl}/api/turn-credentials`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        if (response.ok) {
            const data = await response.json();
            return data.iceServers;
        }
    } catch (error) {
        // Failed to fetch TURN credentials, using defaults
    }
    return null;
};

class WebRTCManager {
    constructor(iceServers = null) {
        this.peerConnection = null;
        this.mediaManager = new MediaManager();
        this.state = ConnectionState.IDLE;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 300;
        this.reconnectTimer = null;
        this.iceConnectionCheckTimer = null;
        this.candidateQueue = [];
        this.statsInterval = null;
        this.iceGatheringTimeout = null;
        this.connectionStartTime = null;
        this.hasReceivedStream = false;
        this.connectionStateCallback = null; // For reporting state to server

        // Event listeners
        this.listeners = {
            stateChange: [],
            remoteStream: [],
            iceCandidate: [],
            error: [],
            stats: [],
            connectionQuality: [],
            iceRestart: []
        };

        // Use centralized ICE servers configuration
        this.iceServers = iceServers || ICE_SERVERS;
    }
    
    /**
     * Set connection state callback for reporting to signaling server
     */
    setConnectionStateCallback(callback) {
        this.connectionStateCallback = callback;
    }
    
    /**
     * Update ICE servers from server
     */
    async updateIceServers(serverUrl) {
        const servers = await fetchTurnCredentials(serverUrl);
        if (servers) {
            this.iceServers = servers;
        }
    }
    
    /**
     * Get MediaManager instance
     */
    getMediaManager() {
        return this.mediaManager;
    }

    /**
     * Get optimal RTCPeerConnection configuration
     */
    getPeerConnectionConfig() {
        return {
            ...PEER_CONFIG,
            iceServers: this.iceServers // Allow override with custom servers
        };
    }

    /**
     * Initialize local media stream with optimized constraints
     */
    async initializeMedia(constraints = null) {
        try {
            // Use centralized media constraints
            const defaultConstraints = MEDIA_CONSTRAINTS;

            const stream = await this.mediaManager.initializeStream(constraints || defaultConstraints);
            return stream;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Create peer connection with optimized settings
     */
    createPeerConnection() {
        if (this.peerConnection) {
            this.closePeerConnection();
        }

        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }

        this.peerConnection = new RTCPeerConnection(this.getPeerConnectionConfig());

        // Add local tracks with proper transceiver configuration
        const localStream = this.mediaManager.getStream();
        if (localStream) {
            localStream.getTracks().forEach(track => {
                const sender = this.peerConnection.addTrack(track, localStream);
                
                // Configure encoding parameters for video
                if (track.kind === 'video') {
                    this.configureVideoEncoding(sender);
                }
            });
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
        } catch (error) {
            // Could not configure video encoding
        }
    }

    /**
     * Setup peer connection event handlers
     */
    setupPeerConnectionHandlers() {
        // ICE candidate handler
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.emit('iceCandidate', event.candidate);
            }
        };

        // Track handler with stream validation
        this.peerConnection.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                const stream = event.streams[0];
                
                // Validate stream has tracks
                if (stream.getTracks().length === 0) {
                    return;
                }
                
                this.hasReceivedStream = true;
                
                // Ensure tracks are enabled
                stream.getTracks().forEach(track => {
                    if (!track.enabled) {
                        track.enabled = true;
                    }
                });
                
                this.emit('remoteStream', stream);
            }
        };

        // ICE connection state handler with faster detection
        this.peerConnection.oniceconnectionstatechange = () => {
            const iceState = this.peerConnection.iceConnectionState;

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
            
            // Report state to server
            if (this.connectionStateCallback) {
                this.connectionStateCallback(iceState);
            }
        };

        // Connection state handler
        this.peerConnection.onconnectionstatechange = () => {
            const connState = this.peerConnection.connectionState;
            
            if (connState === 'connected') {
                this.handleConnectionSuccess();
            } else if (connState === 'failed') {
                this.handleConnectionFailure();
            }
            
            // Report state to server
            if (this.connectionStateCallback) {
                this.connectionStateCallback(connState);
            }
        };

        // Signaling state handler
        this.peerConnection.onsignalingstatechange = () => {};

        // Negotiation needed handler
        this.peerConnection.onnegotiationneeded = async () => {
            this.emit('negotiationNeeded', {});
        };

        // ICE gathering state handler
        this.peerConnection.onicegatheringstatechange = () => {};
    }

    /**
     * Handle successful connection
     */
    handleConnectionSuccess() {
        if (this.state === ConnectionState.CONNECTED) return;
        
        const connectionTime = Date.now() - this.connectionStartTime;
        
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
        this.setState(ConnectionState.FAILED);
        this.attemptReconnection();
    }

    /**
     * Attempt reconnection with exponential backoff
     */
    attemptReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.setState(ConnectionState.FAILED);
            this.emit('error', {
                type: 'reconnection_failed',
                message: 'Failed to reconnect after multiple attempts'
            });
            return;
        }

        this.reconnectAttempts++;
        this.setState(ConnectionState.RECONNECTING);

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
            if (this.peerConnection) {
                const offer = await this.peerConnection.createOffer({ 
                    iceRestart: true,
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                await this.peerConnection.setLocalDescription(offer);
                
                this.emit('iceRestart', { offer });
                return offer;
            }
        } catch (error) {
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

            return offer;
        } catch (error) {
            this.setState(ConnectionState.FAILED);
            throw error;
        }
    }

    /**
     * Process queued ICE candidates
     */
    async processCandidateQueue() {
        if (!this.peerConnection || !this.candidateQueue.length) return;

        while (this.candidateQueue.length > 0) {
            const candidate = this.candidateQueue.shift();
            try {
                if (!this.peerConnection || this.peerConnection.signalingState === 'closed') {
                    break;
                }
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                // Failed to add ICE candidate
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

            return answer;
        } catch (error) {
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
        } catch (error) {
            throw error;
        }
    }

    /**
     * Add ICE candidate
     */
    async addIceCandidate(candidate) {
        if (!this.peerConnection) {
            return;
        }

        if (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
            this.candidateQueue.push(candidate);
            return;
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            // Failed to add ICE candidate
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
        }
        this.clearReconnectTimer();
        this.candidateQueue = [];
        this.setState(ConnectionState.DISCONNECTED);
    }

    /**
     * Clean up all resources
     */
    cleanup() {
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
