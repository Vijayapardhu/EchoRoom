/**
 * useWebRTC Hook - React integration for WebRTC services
 * Provides a clean interface for components to use WebRTC functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import WebRTCManager, { ConnectionState } from '../services/WebRTCManager';
import SignalingService from '../services/SignalingService';

export const useWebRTCConnection = (socket, roomId) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState(ConnectionState.IDLE);
    const [error, setError] = useState(null);

    const webrtcManagerRef = useRef(null);
    const signalingServiceRef = useRef(null);

    // Initialize WebRTC Manager
    useEffect(() => {
        if (!webrtcManagerRef.current) {
            webrtcManagerRef.current = new WebRTCManager();

            // Set up event listeners
            webrtcManagerRef.current.on('stateChange', ({ newState }) => {
                setConnectionState(newState);
            });

            webrtcManagerRef.current.on('remoteStream', (stream) => {
                setRemoteStream(stream);
            });

            webrtcManagerRef.current.on('error', (err) => {
                setError(err);
            });
        }

        return () => {
            if (webrtcManagerRef.current) {
                webrtcManagerRef.current.cleanup();
                webrtcManagerRef.current = null;
            }
        };
    }, []);

    // Initialize Signaling Service
    useEffect(() => {
        if (socket && !signalingServiceRef.current) {
            signalingServiceRef.current = new SignalingService(socket);
        }

        return () => {
            if (signalingServiceRef.current) {
                signalingServiceRef.current.cleanup();
                signalingServiceRef.current = null;
            }
        };
    }, [socket]);

    // Initialize media stream
    const initializeMedia = useCallback(async (constraints = null) => {
        try {
            const stream = await webrtcManagerRef.current.initializeMedia(constraints);
            setLocalStream(stream);
            setError(null);
            return stream;
        } catch (err) {
            setError(err);
            throw err;
        }
    }, []);

    // Create peer connection
    const createConnection = useCallback(() => {
        if (!webrtcManagerRef.current) return null;

        const pc = webrtcManagerRef.current.createPeerConnection();

        // Set up ICE candidate handler
        webrtcManagerRef.current.on('iceCandidate', (candidate) => {
            if (signalingServiceRef.current && roomId) {
                signalingServiceRef.current.sendIceCandidate(roomId, candidate);
            }
        });

        return pc;
    }, [roomId]);

    // Create and send offer
    const createOffer = useCallback(async () => {
        if (!webrtcManagerRef.current || !signalingServiceRef.current || !roomId) {
            throw new Error('Missing required dependencies for creating offer');
        }

        const offer = await webrtcManagerRef.current.createOffer();
        signalingServiceRef.current.sendOffer(roomId, offer);
        return offer;
    }, [roomId]);

    // Handle received offer
    const handleOffer = useCallback(async (offer) => {
        if (!webrtcManagerRef.current || !signalingServiceRef.current || !roomId) {
            throw new Error('Missing required dependencies for handling offer');
        }

        const answer = await webrtcManagerRef.current.handleOffer(offer);
        signalingServiceRef.current.sendAnswer(roomId, answer);
        return answer;
    }, [roomId]);

    // Handle received answer
    const handleAnswer = useCallback(async (answer) => {
        if (!webrtcManagerRef.current) {
            throw new Error('WebRTCManager not initialized');
        }

        await webrtcManagerRef.current.handleAnswer(answer);
    }, []);

    // Handle received ICE candidate
    const handleIceCandidate = useCallback(async (candidate) => {
        if (!webrtcManagerRef.current) {
            throw new Error('WebRTCManager not initialized');
        }

        await webrtcManagerRef.current.addIceCandidate(candidate);
    }, []);

    // Toggle video
    const toggleVideo = useCallback((enabled) => {
        if (!webrtcManagerRef.current) return false;
        return webrtcManagerRef.current.getMediaManager().toggleVideo(enabled);
    }, []);

    // Toggle audio
    const toggleAudio = useCallback((enabled) => {
        if (!webrtcManagerRef.current) return false;
        return webrtcManagerRef.current.getMediaManager().toggleAudio(enabled);
    }, []);

    // Switch camera
    const switchCamera = useCallback(async () => {
        if (!webrtcManagerRef.current) return null;
        return await webrtcManagerRef.current.getMediaManager().switchCamera();
    }, []);

    // Close connection
    const closeConnection = useCallback(() => {
        if (webrtcManagerRef.current) {
            webrtcManagerRef.current.closePeerConnection();
        }
    }, []);

    // Cleanup
    const cleanup = useCallback(() => {
        if (webrtcManagerRef.current) {
            webrtcManagerRef.current.cleanup();
        }
        if (signalingServiceRef.current) {
            signalingServiceRef.current.cleanup();
        }
        setLocalStream(null);
        setRemoteStream(null);
        setConnectionState(ConnectionState.IDLE);
        setError(null);
    }, []);

    return {
        // State
        localStream,
        remoteStream,
        connectionState,
        error,

        // Methods
        initializeMedia,
        createConnection,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        toggleVideo,
        toggleAudio,
        switchCamera,
        closeConnection,
        cleanup,

        // Managers (for advanced usage)
        webrtcManager: webrtcManagerRef.current,
        signalingService: signalingServiceRef.current
    };
};

export default useWebRTCConnection;
