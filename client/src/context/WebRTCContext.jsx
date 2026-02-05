import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import WebRTCManager, { ConnectionState } from '../services/WebRTCManager';
import { PEER_CONFIG } from '../config/webrtc.config';

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
    const [connectionStats, setConnectionStats] = useState({ rtt: 0, packetsLost: 0, bitrate: 0 });
    const [connectionQuality, setConnectionQuality] = useState('unknown');

    const webrtcManagerRef = useRef(null);
    const peerConnection = useRef(null);
    const peerConnections = useRef(new Map()); // For group calls: peerId -> RTCPeerConnection
    const candidateQueues = useRef(new Map());
    const remoteStreams = useRef(new Map()); // peerId -> MediaStream
    const managerInitialized = useRef(false);

    // Initialize WebRTC Manager - only once
    useEffect(() => {
        if (managerInitialized.current) return;
        
        webrtcManagerRef.current = new WebRTCManager();
        managerInitialized.current = true;

        // Set up event listeners
        webrtcManagerRef.current.on('stateChange', ({ newState }) => {
            setConnectionState(newState);
        });

        webrtcManagerRef.current.on('remoteStream', (stream) => {
            setRemoteStream(stream);
        });

        webrtcManagerRef.current.on('error', (error) => {
            // Error handled silently in production
        });

        webrtcManagerRef.current.on('stats', (stats) => {
            setConnectionStats(stats);
        });

        webrtcManagerRef.current.on('connectionQuality', ({ quality }) => {
            setConnectionQuality(quality);
        });

        return () => {
            if (webrtcManagerRef.current) {
                webrtcManagerRef.current.cleanup();
                webrtcManagerRef.current = null;
                managerInitialized.current = false;
            }
        };
    }, []);

    /**
     * Start local media stream with timeout and retry logic
     */
    const startLocalStream = useCallback(async (constraints = null, retryCount = 0) => {
        const maxRetries = 3;
        const timeout = 10000; // 10 second timeout
        
        try {
            // Check if we already have an active stream
            if (localStream) {
                const tracks = localStream.getTracks();
                const allActive = tracks.every(track => track.readyState === 'live');
                if (allActive && tracks.length > 0) {
                    return localStream;
                }
                // Clean up dead stream
                tracks.forEach(track => track.stop());
                setLocalStream(null);
            }
            
            if (!webrtcManagerRef.current) {
                throw new Error('WebRTC manager not initialized');
            }
            
            // Create a promise with timeout
            const streamPromise = webrtcManagerRef.current.initializeMedia(constraints);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Media initialization timeout')), timeout);
            });
            
            const stream = await Promise.race([streamPromise, timeoutPromise]);
            setLocalStream(stream);
            return stream;
        } catch (error) {
            // Retry logic for transient errors
            if (retryCount < maxRetries && 
                error.message === 'Media initialization timeout' || 
                error.type === 'inuse') {
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return startLocalStream(constraints, retryCount + 1);
            }
            
            throw error;
        }
    }, [localStream]);

    /**
     * Create peer connection for 1-on-1 call
     */
    const createPeerConnection = useCallback((onIceCandidate) => {
        const pc = webrtcManagerRef.current.createPeerConnection();
        peerConnection.current = pc;

        // Set up ICE candidate handler
        if (onIceCandidate) {
            webrtcManagerRef.current.on('iceCandidate', onIceCandidate);
        }

        return pc;
    }, []);

    /**
     * Create peer connection for a specific peer (group calls)
     */
    const createPeerConnectionForPeer = useCallback((peerId, onIceCandidate, onRemoteStream) => {

        // Close existing connection if any
        if (peerConnections.current.has(peerId)) {
            const existingPc = peerConnections.current.get(peerId);
            existingPc.close();
            peerConnections.current.delete(peerId);
        }

        // Use centralized config for consistency
        const pc = new RTCPeerConnection(PEER_CONFIG);

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && onIceCandidate) {
                onIceCandidate(event.candidate, peerId);
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {};

        pc.oniceconnectionstatechange = () => {};

        // Handle remote stream with proper track management
        pc.ontrack = (event) => {
            
            if (event.streams && event.streams[0]) {
                const stream = event.streams[0];
                
                // Ensure all tracks are enabled
                stream.getTracks().forEach(track => {
                    track.enabled = true;
                });
                
                remoteStreams.current.set(peerId, stream);
                
                if (onRemoteStream) {
                    onRemoteStream(stream, peerId);
                }
            }
        };

        peerConnections.current.set(peerId, pc);
        return pc;
    }, [localStream]);

    /**
     * Create offer for a specific peer (group calls)
     */
    const createOfferForPeer = useCallback(async (peerId) => {
        const pc = peerConnections.current.get(peerId);
        if (!pc) throw new Error('No peer connection for ' + peerId);

        const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        return offer;
    }, []);

    /**
     * Handle offer from a specific peer (group calls)
     */
    const handleOfferFromPeer = useCallback(async (offer, peerId) => {
        const pc = peerConnections.current.get(peerId);
        if (!pc) throw new Error('No peer connection for ' + peerId);

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processQueuedCandidatesForPeer(peerId);

        const answer = await pc.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        await pc.setLocalDescription(answer);
        return answer;
    }, []);

    /**
     * Handle answer from a specific peer (group calls)
     */
    const handleAnswerFromPeer = useCallback(async (answer, peerId) => {
        const pc = peerConnections.current.get(peerId);
        if (!pc) throw new Error('No peer connection for ' + peerId);

        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await processQueuedCandidatesForPeer(peerId);
    }, []);

    /**
     * Process queued ICE candidates for a peer
     */
    const processQueuedCandidatesForPeer = async (peerId) => {
        const queue = candidateQueues.current.get(peerId);
        const pc = peerConnections.current.get(peerId);
        
        if (!queue || !pc) return;
        
        for (const candidate of queue) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                // Failed to add candidate, continue
            }
        }
        
        candidateQueues.current.delete(peerId);
    };

    /**
     * Add ICE candidate for a specific peer (group calls)
     */
    const addIceCandidateForPeer = useCallback(async (candidate, peerId) => {
        const pc = peerConnections.current.get(peerId);
        if (!pc) return;

        try {
            // Queue candidates if remote description isn't set yet
            if (!pc.remoteDescription || !pc.remoteDescription.type) {
                if (!candidateQueues.current.has(peerId)) {
                    candidateQueues.current.set(peerId, []);
                }
                candidateQueues.current.get(peerId).push(candidate);
                console.log('[WebRTCContext] Queued ICE candidate for peer:', peerId);
                return;
            }
            
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('[WebRTCContext] Error adding ICE candidate for peer:', peerId, e);
        }
    }, []);

    /**
     * Remove peer connection (when peer leaves group)
     */
    const removePeerConnection = useCallback((peerId) => {
        const pc = peerConnections.current.get(peerId);
        if (pc) {
            pc.close();
            peerConnections.current.delete(peerId);
            candidateQueues.current.delete(peerId);
            remoteStreams.current.delete(peerId);
        }
    }, []);

    /**
     * Create offer
     */
    const createOffer = useCallback(async () => {
        return await webrtcManagerRef.current.createOffer();
    }, []);

    /**
     * Handle offer
     */
    const handleOffer = useCallback(async (offer) => {
        return await webrtcManagerRef.current.handleOffer(offer);
    }, []);

    /**
     * Handle answer
     */
    const handleAnswer = useCallback(async (answer) => {
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
        
        let newEnabled = enabled;
        if (enabled === undefined && localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                newEnabled = !videoTrack.enabled;
            }
        }
        
        const result = webrtcManagerRef.current.getMediaManager().toggleVideo(newEnabled);

        // Update peer connection
        if (peerConnection.current && localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
                if (sender && sender.track) {
                    sender.track.enabled = result;
                }
            }
        }

        // Update all group peer connections
        peerConnections.current.forEach((pc) => {
            const videoTrack = localStream?.getVideoTracks()[0];
            if (videoTrack) {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender && sender.track) {
                    sender.track.enabled = result;
                }
            }
        });

        return result;
    }, [localStream]);

    /**
     * Toggle audio
     */
    const toggleAudio = useCallback((enabled) => {
        if (!webrtcManagerRef.current) return false;
        
        let newEnabled = enabled;
        if (enabled === undefined && localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                newEnabled = !audioTrack.enabled;
            }
        }
        
        const result = webrtcManagerRef.current.getMediaManager().toggleAudio(newEnabled);

        // Update peer connection
        if (peerConnection.current && localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'audio');
                if (sender && sender.track) {
                    sender.track.enabled = result;
                }
            }
        }

        // Update all group peer connections
        peerConnections.current.forEach((pc) => {
            const audioTrack = localStream?.getAudioTracks()[0];
            if (audioTrack) {
                const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
                if (sender && sender.track) {
                    sender.track.enabled = result;
                }
            }
        });

        return result;
    }, [localStream]);

    /**
     * Switch camera
     */
    const switchCamera = useCallback(async () => {
        if (!webrtcManagerRef.current) return null;

        try {
            const newTrack = await webrtcManagerRef.current.getMediaManager().switchCamera();

            // Update all connections with new track
            const replaceTrackInConnection = async (pc) => {
                if (!pc) return;
                const oldTrack = localStream?.getVideoTracks()[0];
                const sender = pc.getSenders().find(s => s.track === oldTrack || s.track?.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(newTrack);
                }
            };

            await replaceTrackInConnection(peerConnection.current);
            
            for (const [peerId, pc] of peerConnections.current) {
                await replaceTrackInConnection(pc);
            }

            return newTrack;
        } catch (error) {
            throw error;
        }
    }, [localStream]);

    /**
     * Start screen share
     */
    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                video: { 
                    cursor: 'always',
                    displaySurface: 'monitor'
                },
                audio: false
            });
            const screenTrack = screenStream.getVideoTracks()[0];

            const replaceTrack = async (pc) => {
                if (!pc) return;
                const videoTrack = localStream?.getVideoTracks()[0];
                const sender = pc.getSenders().find(s => s.track === videoTrack || s.track?.kind === 'video');

                if (sender) {
                    await sender.replaceTrack(screenTrack);
                }
            };

            await replaceTrack(peerConnection.current);
            
            for (const [peerId, pc] of peerConnections.current) {
                await replaceTrack(pc);
            }

            setIsScreenSharing(true);

            screenTrack.onended = async () => {
                await stopScreenShare();
            };

            return screenStream;
        } catch (error) {
            throw error;
        }
    }, [localStream]);

    /**
     * Stop screen share
     */
    const stopScreenShare = useCallback(async () => {
        const videoTrack = localStream?.getVideoTracks()[0];
        if (!videoTrack) return;

        const replaceTrack = async (pc) => {
            if (!pc) return;
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
                await sender.replaceTrack(videoTrack);
            }
        };

        await replaceTrack(peerConnection.current);
        
        for (const [peerId, pc] of peerConnections.current) {
            await replaceTrack(pc);
        }

        setIsScreenSharing(false);
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
    }, [isScreenSharing]);

    /**
     * Close connection
     */
    const closeConnection = useCallback(() => {
        if (webrtcManagerRef.current) {
            webrtcManagerRef.current.closePeerConnection();
        }
        peerConnection.current = null;
        setRemoteStream(null);
        setConnectionState(ConnectionState.IDLE);
    }, []);

    /**
     * Reset peer connection
     */
    const resetPeerConnection = useCallback(() => {
        closeConnection();
        candidateQueues.current.clear();
        remoteStreams.current.clear();
    }, [closeConnection]);

    /**
     * Cleanup
     */
    const cleanup = useCallback(() => {
        if (webrtcManagerRef.current) {
            webrtcManagerRef.current.cleanup();
        }
        
        peerConnections.current.forEach((pc) => pc.close());
        peerConnections.current.clear();
        candidateQueues.current.clear();
        remoteStreams.current.clear();
        
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
        setRemoteStream,
        connectionState,
        isScreenSharing,
        connectionStats,
        connectionQuality,
        peerConnection,
        peerConnections,

        // Methods
        startLocalStream,
        createPeerConnection,
        createPeerConnectionForPeer,
        createOffer,
        createOfferForPeer,
        handleOffer,
        handleOfferFromPeer,
        handleAnswer,
        handleAnswerFromPeer,
        addIceCandidate,
        addIceCandidateForPeer,
        removePeerConnection,
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
