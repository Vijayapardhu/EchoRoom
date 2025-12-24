import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import WebRTCManager, { ConnectionState } from '../services/WebRTCManager';

const WebRTCContext = createContext();

export const useWebRTC = () => {
    const context = useContext(WebRTCContext);
    if (!context) {
        throw new Error('useWebRTC must be used within WebRTCProvider');
    }
    return context;
};

export const WebRTCProvider = ({ children }) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState(ConnectionState.IDLE);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const webrtcManagerRef = useRef(null);
    const peerConnection = useRef(null);

    // Initialize WebRTC Manager
    useEffect(() => {
        if (!webrtcManagerRef.current) {
            webrtcManagerRef.current = new WebRTCManager();
            console.log('[WebRTCContext] WebRTCManager initialized');

            // Set up event listeners
            webrtcManagerRef.current.on('stateChange', ({ newState }) => {
                console.log('[WebRTCContext] State changed to:', newState);
                setConnectionState(newState);
            });

            webrtcManagerRef.current.on('remoteStream', (stream) => {
                console.log('[WebRTCContext] Remote stream received');
                setRemoteStream(stream);
            });

            webrtcManagerRef.current.on('error', (error) => {
                console.error('[WebRTCContext] Error:', error);
            });
        }

        return () => {
            if (webrtcManagerRef.current) {
                webrtcManagerRef.current.cleanup();
                webrtcManagerRef.current = null;
            }
        };
    }, []);

    /**
     * Start local media stream
     */
    const startLocalStream = useCallback(async (constraints = null) => {
        try {
            console.log('[WebRTCContext] Starting local stream...');
            const stream = await webrtcManagerRef.current.initializeMedia(constraints);
            setLocalStream(stream);
            console.log('[WebRTCContext] Local stream started');
            return stream;
        } catch (error) {
            console.error('[WebRTCContext] Failed to start local stream:', error);
            throw error;
        }
    }, []);

    /**
     * Create peer connection
     */
    const createPeerConnection = useCallback((onIceCandidate) => {
        console.log('[WebRTCContext] Creating peer connection...');

        const pc = webrtcManagerRef.current.createPeerConnection();
        peerConnection.current = pc;

        // Set up ICE candidate handler
        if (onIceCandidate) {
            webrtcManagerRef.current.on('iceCandidate', onIceCandidate);
        }

        console.log('[WebRTCContext] Peer connection created');
        return pc;
    }, []);

    /**
     * Create offer
     */
    const createOffer = useCallback(async () => {
        console.log('[WebRTCContext] Creating offer...');
        return await webrtcManagerRef.current.createOffer();
    }, []);

    /**
     * Handle offer
     */
    const handleOffer = useCallback(async (offer) => {
        console.log('[WebRTCContext] Handling offer...');
        return await webrtcManagerRef.current.handleOffer(offer);
    }, []);

    /**
     * Handle answer
     */
    const handleAnswer = useCallback(async (answer) => {
        console.log('[WebRTCContext] Handling answer...');
        await webrtcManagerRef.current.handleAnswer(answer);
    }, []);

    /**
     * Add ICE candidate
     */
    const addIceCandidate = useCallback(async (candidate) => {
        await webrtcManagerRef.current.addIceCandidate(candidate);
    }, []);

    /**
     * Toggle video
     */
    const toggleVideo = useCallback((enabled) => {
        if (!webrtcManagerRef.current) return false;
        const result = webrtcManagerRef.current.getMediaManager().toggleVideo(enabled);

        // Update peer connection if exists
        if (peerConnection.current && localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                const sender = peerConnection.current.getSenders().find(s => s.track === videoTrack);
                if (sender) {
                    sender.track.enabled = enabled;
                }
            }
        }

        return result;
    }, [localStream]);

    /**
     * Toggle audio
     */
    const toggleAudio = useCallback((enabled) => {
        if (!webrtcManagerRef.current) return false;
        const result = webrtcManagerRef.current.getMediaManager().toggleAudio(enabled);

        // Update peer connection if exists
        if (peerConnection.current && localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                const sender = peerConnection.current.getSenders().find(s => s.track === audioTrack);
                if (sender) {
                    sender.track.enabled = enabled;
                }
            }
        }

        return result;
    }, [localStream]);

    /**
     * Switch camera
     */
    const switchCamera = useCallback(async () => {
        if (!webrtcManagerRef.current) return null;

        try {
            const newTrack = await webrtcManagerRef.current.getMediaManager().switchCamera();

            // Update peer connection with new track
            if (peerConnection.current && localStream) {
                const oldTrack = localStream.getVideoTracks()[0];
                const sender = peerConnection.current.getSenders().find(s => s.track === oldTrack);

                if (sender) {
                    await sender.replaceTrack(newTrack);
                    console.log('[WebRTCContext] Camera switched and track replaced');
                }
            }

            return newTrack;
        } catch (error) {
            console.error('[WebRTCContext] Failed to switch camera:', error);
            throw error;
        }
    }, [localStream]);

    /**
     * Start screen share
     */
    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            if (peerConnection.current && localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                const sender = peerConnection.current.getSenders().find(s => s.track === videoTrack);

                if (sender) {
                    await sender.replaceTrack(screenTrack);
                    setIsScreenSharing(true);
                    console.log('[WebRTCContext] Screen sharing started');

                    // Handle screen share stop
                    screenTrack.onended = async () => {
                        await stopScreenShare();
                    };
                }
            }

            return screenStream;
        } catch (error) {
            console.error('[WebRTCContext] Failed to start screen share:', error);
            throw error;
        }
    }, [localStream]);

    /**
     * Stop screen share
     */
    const stopScreenShare = useCallback(async () => {
        if (peerConnection.current && localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            const sender = peerConnection.current.getSenders().find(s => s.track && s.track.kind === 'video');

            if (sender && videoTrack) {
                await sender.replaceTrack(videoTrack);
                setIsScreenSharing(false);
                console.log('[WebRTCContext] Screen sharing stopped');
            }
        }
    }, [localStream]);

    /**
     * Toggle screen share
     */
    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            await stopScreenShare();
        } else {
            await startScreenShare();
        }
    }, [isScreenSharing, startScreenShare, stopScreenShare]);

    /**
     * Close connection
     */
    const closeConnection = useCallback(() => {
        console.log('[WebRTCContext] Closing connection...');
        if (webrtcManagerRef.current) {
            webrtcManagerRef.current.closePeerConnection();
        }
        peerConnection.current = null;
        setRemoteStream(null);
    }, []);

    /**
     * Reset peer connection
     */
    const resetPeerConnection = useCallback(() => {
        console.log('[WebRTCContext] Resetting peer connection...');
        closeConnection();
        setConnectionState(ConnectionState.IDLE);
    }, [closeConnection]);

    /**
     * Cleanup
     */
    const cleanup = useCallback(() => {
        console.log('[WebRTCContext] Cleaning up...');
        if (webrtcManagerRef.current) {
            webrtcManagerRef.current.cleanup();
        }
        setLocalStream(null);
        setRemoteStream(null);
        setConnectionState(ConnectionState.IDLE);
        setIsScreenSharing(false);
        peerConnection.current = null;
    }, []);

    const value = {
        // State
        localStream,
        remoteStream,
        connectionState,
        isScreenSharing,
        peerConnection,

        // Methods
        startLocalStream,
        createPeerConnection,
        createOffer,
        handleOffer,
        handleAnswer,
        addIceCandidate,
        toggleVideo,
        toggleAudio,
        switchCamera,
        startScreenShare,
        stopScreenShare,
        toggleScreenShare,
        closeConnection,
        resetPeerConnection,
        cleanup,

        // Manager access
        webrtcManager: webrtcManagerRef.current
    };

    return (
        <WebRTCContext.Provider value={value}>
            {children}
        </WebRTCContext.Provider>
    );
};
