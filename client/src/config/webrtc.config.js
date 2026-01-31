/**
 * WebRTC Configuration
 * Centralized ICE servers, peer connection config, and media constraints
 * 
 * IMPORTANT: Replace TURN credentials with your own from https://www.metered.ca/tools/openrelay/
 */

// ICE Servers Configuration
export const ICE_SERVERS = [
    // Google STUN (Free, reliable)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Twilio's STUN server
    { urls: 'stun:global.stun.twilio.com:3478' },
    
    // Metered.ca TURN servers (Free tier - Your credentials)
    // Sign up at: https://www.metered.ca/tools/openrelay/
    {
        urls: 'turn:a.relay.metered.ca:80',
        username: 'c34da8d58759d2073a974734',
        credential: '0r6th55vCqs8FMNI'
    },
    {
        urls: 'turn:a.relay.metered.ca:80?transport=tcp',
        username: 'c34da8d58759d2073a974734',
        credential: '0r6th55vCqs8FMNI'
    },
    {
        urls: 'turn:a.relay.metered.ca:443',
        username: 'c34da8d58759d2073a974734',
        credential: '0r6th55vCqs8FMNI'
    },
    {
        urls: 'turn:a.relay.metered.ca:443?transport=tcp',
        username: 'c34da8d58759d2073a974734',
        credential: '0r6th55vCqs8FMNI'
    },
    {
        urls: 'turns:a.relay.metered.ca:443',
        username: 'c34da8d58759d2073a974734',
        credential: '0r6th55vCqs8FMNI'
    }
];

// Peer Connection Configuration
export const PEER_CONFIG = {
    iceServers: ICE_SERVERS,
    iceTransportPolicy: 'all', // 'all' tries all connection types, 'relay' forces TURN
    iceCandidatePoolSize: 10,  // Pre-gather candidates for faster connection
    bundlePolicy: 'max-bundle', // Bundle all media on single connection
    rtcpMuxPolicy: 'require'    // Multiplex RTCP with RTP
};

// Media Constraints - Optimized for video chat
export const MEDIA_CONSTRAINTS = {
    video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 30 },
        facingMode: 'user'
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
    }
};

// Low bandwidth constraints (for slow connections)
export const LOW_BANDWIDTH_CONSTRAINTS = {
    video: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 24, max: 30 }
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
};

// Audio only constraints
export const AUDIO_ONLY_CONSTRAINTS = {
    video: false,
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
};

// Connection quality thresholds
export const QUALITY_THRESHOLDS = {
    excellent: { rtt: 50, packetsLost: 0 },
    good: { rtt: 100, packetsLost: 5 },
    fair: { rtt: 200, packetsLost: 15 },
    poor: { rtt: 500, packetsLost: 30 }
};

// Timeouts and retry settings
export const CONNECTION_SETTINGS = {
    iceGatheringTimeout: 5000,    // Time to gather ICE candidates
    connectionTimeout: 30000,      // Overall connection timeout
    reconnectAttempts: 3,          // Number of reconnection attempts
    reconnectBaseDelay: 300,       // Base delay between reconnects (ms)
    statsInterval: 2000            // Interval for stats collection
};

export default {
    ICE_SERVERS,
    PEER_CONFIG,
    MEDIA_CONSTRAINTS,
    LOW_BANDWIDTH_CONSTRAINTS,
    AUDIO_ONLY_CONSTRAINTS,
    QUALITY_THRESHOLDS,
    CONNECTION_SETTINGS
};
