import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Flag, MessageSquare, Monitor, MonitorOff, SkipForward, Loader2, RefreshCcw, Maximize2, Minimize2, Heart, ThumbsUp, Laugh, Sparkles, Share2, Copy, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import PanicButton from './safety/PanicButton';
import ReportModal from './safety/ReportModal';
import Chat from './Chat';
import ConnectionIndicator from './ConnectionIndicator';
import { playJoinSound, playLeaveSound } from '../utils/soundEffects';
import PermissionError from './PermissionError';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocket();
    const {
        localStream,
        remoteStream,
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
        closeConnection,
        resetPeerConnection,
        cleanup,
        peerConnection,
        peerConnections,
        startScreenShare,
        stopScreenShare,
        toggleScreenShare,
        toggleVideo,
        toggleAudio,
        switchCamera,
        isScreenSharing
    } = useWebRTC();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteVideoRefs = useRef(new Map()); // For group calls
    const initiatorHandledRef = useRef(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [remoteVideoOff, setRemoteVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showNextConfirm, setShowNextConfirm] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const [isNextDisabled, setIsNextDisabled] = useState(false);
    
    // Group call state
    const [isGroupCall, setIsGroupCall] = useState(false);
    const [groupPeers, setGroupPeers] = useState([]); // Array of { peerId, stream }
    const [fullscreenPeer, setFullscreenPeer] = useState(null); // peerId for fullscreen view
    
    // Video aspect ratio control
    const [videoFit, setVideoFit] = useState('cover'); // 'cover' | 'contain'
    
    // Social features state
    const [showReactions, setShowReactions] = useState(false);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [remoteReaction, setRemoteReaction] = useState(null);
    
    // User name state
    const [userName, setUserName] = useState(() => {
        return localStorage.getItem('echoroom_username') || '';
    });
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempName, setTempName] = useState('');
    
    // Reconnection state
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeoutRef = useRef(null);

    const preferences = location.state || {};

    // Check if this is a group room
    useEffect(() => {
        if (roomId && roomId.startsWith('group-')) {
            setIsGroupCall(true);
        }
    }, [roomId]);

    // Initialize local media stream
    useEffect(() => {
        const initMedia = async () => {
            try {
                await startLocalStream();
                setPermissionError(null);
            } catch (err) {
                console.error("Failed to start local stream:", err);

                if (err.type === 'permission') {
                    setPermissionError(err);
                } else {
                    toast.error(err.message || "Failed to access camera/microphone");
                }
            }
        };
        initMedia();

        return () => {
             // Ensure tracks are stopped when leaving the room page
             console.log("Room unmounting, cleaning up...");
             cleanup(); 
        };
    }, []); // Empty dependency array: run once on mount, cleanup on unmount

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            console.log("Attaching remote stream to video element:", remoteStream.getTracks().map(t => t.kind));
            remoteVideoRef.current.srcObject = remoteStream;

            // Programmatically play the video to bypass autoplay restrictions
            remoteVideoRef.current.play().catch(err => {
                console.error("Error playing remote video:", err);
                // If autoplay fails, user interaction is required
                toast.error("Click anywhere to enable video/audio");
            });
        }
    }, [remoteStream]);

    // Save username to localStorage
    const saveUserName = (name) => {
        const trimmedName = name.trim();
        if (trimmedName) {
            setUserName(trimmedName);
            localStorage.setItem('echoroom_username', trimmedName);
            setShowNameModal(false);
            toast.success(`Name set to "${trimmedName}"`);
            
            // Broadcast name to peers
            if (socket && roomId) {
                socket.emit('user-name-update', { roomId, userName: trimmedName });
            }
        }
    };

    // Reconnection logic
    const attemptReconnect = async () => {
        if (reconnectAttempts >= maxReconnectAttempts) {
            toast.error("Failed to reconnect after multiple attempts");
            setIsReconnecting(false);
            return;
        }

        setIsReconnecting(true);
        setReconnectAttempts(prev => prev + 1);
        
        try {
            console.log(`Reconnect attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
            
            // Clean up existing connections
            cleanup();
            
            // Reinitialize media stream
            await startLocalStream();
            
            // Rejoin the room
            if (socket && roomId) {
                socket.emit('join-room', { roomId, userName });
                toast.success("Reconnected successfully!");
                setIsReconnecting(false);
                setReconnectAttempts(0);
            }
        } catch (err) {
            console.error("Reconnect failed:", err);
            toast.error(`Reconnect attempt ${reconnectAttempts + 1} failed`);
            
            // Schedule next attempt with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            reconnectTimeoutRef.current = setTimeout(attemptReconnect, delay);
        }
    };

    // Cleanup reconnect timeout on unmount
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    // Socket event listeners for WebRTC signaling and room management
    useEffect(() => {
        if (!socket || !roomId) return;

        // Handle match found (from queue)
        const handleMatchFound = ({ roomId: newRoomId, isGroup }) => {
            console.log("Match found! Room:", newRoomId, "isGroup:", isGroup);
            if (isGroup) {
                setIsGroupCall(true);
            }
            navigate(`/room/${newRoomId}`, { state: preferences, replace: true });
        };

        // Join room and signal readiness
        socket.emit('join-room', { roomId });

        // ==================== GROUP CALL HANDLERS ====================
        
        // Handle list of existing peers when joining a group room
        const handleExistingPeers = async ({ peers }) => {
            console.log("Existing peers in room:", peers);
            if (!localStream) {
                setTimeout(() => handleExistingPeers({ peers }), 100);
                return;
            }
            
            for (const peerId of peers) {
                // Create a connection for each existing peer and send offer
                const onIceCandidate = (candidate, targetPeerId) => {
                    socket.emit('ice-candidate', { roomId, candidate, targetPeerId });
                };
                const onRemoteStream = (stream, peerId) => {
                    setGroupPeers(prev => {
                        console.log("Updating groupPeers state. Current peers:", prev);
                        const existing = prev.find(p => p.peerId === peerId);
                        if (existing) {
                            console.log("Updating stream for peer:", peerId);
                            return prev.map(p => p.peerId === peerId ? { ...p, stream } : p);
                        }
                        console.log("Adding new peer to groupPeers:", peerId);
                        return [...prev, { peerId, stream }];
                    });
                };
                
                createPeerConnectionForPeer(peerId, onIceCandidate, onRemoteStream);
                
                try {
                    const offer = await createOfferForPeer(peerId);
                    socket.emit('offer', { roomId, offer, targetPeerId: peerId });
                } catch (err) {
                    console.error("Error creating offer for peer:", peerId, err);
                }
            }
        };
        
        // Handle new peer joining the group
        const handlePeerJoined = async ({ peerId }) => {
            console.log("New peer joined:", peerId);
            toast.success("A new person joined!");
            playJoinSound();

            // Create a connection for the new peer
            const onIceCandidate = (candidate, targetPeerId) => {
                socket.emit('ice-candidate', { roomId, candidate, targetPeerId });
            };
            const onRemoteStream = (stream, peerId) => {
                setGroupPeers(prev => {
                    const existing = prev.find(p => p.peerId === peerId);
                    if (existing) {
                        return prev.map(p => p.peerId === peerId ? { ...p, stream } : p);
                    }
                    return [...prev, { peerId, stream }];
                });
            };

            createPeerConnectionForPeer(peerId, onIceCandidate, onRemoteStream);
        };

        socket.on('peer-joined', handlePeerJoined);
        
        // Handle peer leaving the group
        const handlePeerLeft = ({ peerId }) => {
            console.log("Peer left:", peerId);
            toast("Someone left the room", { icon: '👋' });
            playLeaveSound();
            
            removePeerConnection(peerId);
            setGroupPeers(prev => prev.filter(p => p.peerId !== peerId));
        };

        // ==================== 1-ON-1 CALL HANDLERS ====================

        // Handle WebRTC initiator role (1-on-1 only)
        const handleIsInitiator = async (isInitiator) => {
            if (isGroupCall) return; // Skip for group calls
            
            console.log("Is initiator:", isInitiator);

            if (initiatorHandledRef.current) {
                console.log("Initiator already handled, skipping");
                return;
            }

            setIsSearching(false);

            if (peerConnection.current) {
                const state = peerConnection.current.connectionState;
                if (state === 'connected' || state === 'connecting') {
                    console.log("Peer connection already active, skipping creation");
                    return;
                }
            }

            if (!localStream) {
                console.log("Waiting for local stream before creating peer connection...");
                setTimeout(() => handleIsInitiator(isInitiator), 100);
                return;
            }

            initiatorHandledRef.current = true;
            console.log("Local stream ready, proceeding with peer connection");

            const handleIceCandidate = (candidate) => {
                socket.emit('ice-candidate', { roomId, candidate });
            };

            createPeerConnection(handleIceCandidate);

            if (isInitiator) {
                try {
                    const offer = await createOffer();
                    socket.emit('offer', { roomId, offer });
                } catch (err) {
                    console.error("Error creating offer:", err);
                }
            }
        };

        // ==================== SHARED SIGNALING HANDLERS ====================

        // Handle receiving WebRTC offer
        const handleOfferReceived = async ({ offer, sender }) => {
            console.log("Received offer from:", sender);

            if (isGroupCall) {
                // Group call - create peer connection for this specific peer
                if (!localStream) {
                    setTimeout(() => handleOfferReceived({ offer, sender }), 100);
                    return;
                }
                
                const onIceCandidate = (candidate, targetPeerId) => {
                    socket.emit('ice-candidate', { roomId, candidate, targetPeerId });
                };
                const onRemoteStream = (stream, peerId) => {
                    setGroupPeers(prev => {
                        const existing = prev.find(p => p.peerId === peerId);
                        if (existing) {
                            return prev.map(p => p.peerId === peerId ? { ...p, stream } : p);
                        }
                        return [...prev, { peerId, stream }];
                    });
                };
                
                createPeerConnectionForPeer(sender, onIceCandidate, onRemoteStream);
                
                try {
                    const answer = await handleOfferFromPeer(offer, sender);
                    socket.emit('answer', { roomId, answer, targetPeerId: sender });
                } catch (err) {
                    console.error("Error handling offer from peer:", sender, err);
                }
            } else {
                // 1-on-1 call
                if (!peerConnection.current) {
                    const handleIceCandidate = (candidate) => {
                        socket.emit('ice-candidate', { roomId, candidate });
                    };
                    createPeerConnection(handleIceCandidate);
                }

            try {
                const answer = await handleOffer(offer);
                socket.emit('answer', { roomId, answer });
            } catch (err) {
                console.error("Error handling offer:", err);
            }
            }
        };

        // Handle receiving WebRTC answer
        const handleAnswerReceived = async ({ answer, sender }) => {
            console.log("Received answer from:", sender);

            if (isGroupCall) {
                // Group call - handle answer for specific peer
                try {
                    await handleAnswerFromPeer(answer, sender);
                    console.log("Answer handled for peer:", sender);
                } catch (err) {
                    console.error("Error handling answer from peer:", sender, err);
                }
            } else {
                // 1-on-1 call
                if (!peerConnection.current) {
                    console.warn("No peer connection for answer");
                    return;
                }

                try {
                    await handleAnswer(answer);
                    console.log("Answer handled successfully");
                } catch (err) {
                    console.error("Error handling answer:", err);
                }
            }
        };

        // Handle receiving ICE candidates
        const handleIceCandidateReceived = async ({ candidate, sender }) => {
            if (isGroupCall) {
                // Group call - add ICE candidate for specific peer
                try {
                    await addIceCandidateForPeer(candidate, sender);
                } catch (err) {
                    console.error("Error adding ICE candidate for peer:", sender, err);
                }
            } else {
                // 1-on-1 call
                if (!peerConnection.current) {
                    console.warn("No peer connection for ICE candidate");
                    return;
                }

            // DO NOT filter by remoteDescription here. 
            // The WebRTCManager handles queuing if remoteDescription is missing.
            try {
                await addIceCandidate(candidate);
            } catch (err) {
                console.error("Error adding ICE candidate:", err);
            }
            }
        };

        // Handle peer disconnection
        const handlePeerDisconnected = () => {
            console.log("Peer disconnected");
            playLeaveSound();
            toast("Partner disconnected. Click Next to find a new match.", {
                icon: '👋',
                duration: 5000
            });
            // Don't auto-navigate - let user decide
        };

        // Handle connection events
        const handleConnect = () => {
            console.log("Socket reconnected");
            socket.emit('join-room', { roomId });
        };

        const handleConnectError = (err) => {
            console.error("Socket connection error:", err);
            toast.error("Connection error. Retrying...");
        };

        // Register all socket listeners
        socket.on('match-found', handleMatchFound);
        socket.on('existing-peers', handleExistingPeers);
        socket.on('peer-joined', handlePeerJoined);
        socket.on('peer-left', handlePeerLeft);
        socket.on('is-initiator', handleIsInitiator);
        socket.on('offer', handleOfferReceived);
        socket.on('answer', handleAnswerReceived);
        socket.on('ice-candidate', handleIceCandidateReceived);
        socket.on('peer-disconnected', handlePeerDisconnected);
        socket.on('connect', handleConnect);
        socket.on('connect_error', handleConnectError);

        // Play join sound when connected
        playJoinSound();

        return () => {
            socket.off('match-found', handleMatchFound);
            socket.off('existing-peers', handleExistingPeers);
            socket.off('peer-joined', handlePeerJoined);
            socket.off('peer-left', handlePeerLeft);
            socket.off('is-initiator', handleIsInitiator);
            socket.off('offer', handleOfferReceived);
            socket.off('answer', handleAnswerReceived);
            socket.off('ice-candidate', handleIceCandidateReceived);
            socket.off('peer-disconnected', handlePeerDisconnected);
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleConnectError);
        };
    }, [socket, roomId, createPeerConnection, navigate, preferences, peerConnection, closeConnection, isGroupCall, localStream]);

    // Handle video toggle from peer
    useEffect(() => {
        if (!socket) return;

        const handleRemoteVideoToggle = ({ isVideoOff }) => {
            setRemoteVideoOff(isVideoOff);
        };

        socket.on('toggle-video', handleRemoteVideoToggle);

        return () => {
            socket.off('toggle-video', handleRemoteVideoToggle);
        };
    }, [socket]);

    const handleToggleMute = () => {
        // Toggle audio - returns new enabled state (true = unmuted, false = muted)
        const isEnabled = toggleAudio();
        setIsMuted(!isEnabled);
        toast.success(isEnabled ? 'Microphone On' : 'Microphone Off');
    };

    const handleToggleVideo = () => {
        // Toggle video - returns new enabled state (true = on, false = off)
        const isEnabled = toggleVideo();
        setIsVideoOff(!isEnabled);
        socket.emit('toggle-video', { roomId, isVideoOff: !isEnabled });
        toast.success(isEnabled ? 'Camera On' : 'Camera Off');
    };

    const [mode, setMode] = useState('video'); // 'video' | 'text'

    const handleModeSwitch = () => {
        if (mode === 'video') {
            // Switch to Text
            setMode('text');
            toggleVideo(false); // Turn off camera
            toggleAudio(false); // Turn off mic
            setIsVideoOff(true);
            setIsMuted(true);
            setIsChatOpen(true);
            toast('Switched to Text Mode', { icon: '💬' });
        } else {
            // Switch to Video
            setMode('video');
            toggleVideo(true); // Turn on camera
            toggleAudio(true); // Turn on mic
            setIsVideoOff(false);
            setIsMuted(false);
            toast('Switched to Video Mode', { icon: '📹' });
        }
    };

    const handleNextMatchRequest = () => {
        setShowNextConfirm(true);
    };

    const confirmNextMatch = () => {
        closeConnection();
        socket.emit('leave-room', roomId);
        navigate('/room/matching', { state: preferences });
    };

    const handleLeaveRoomRequest = () => {
        setShowExitConfirm(true);
    };

    const confirmLeaveRoom = () => {
        closeConnection();
        socket.emit('leave-room', roomId);
        navigate('/post-chat');
    };

    const handleReportSubmit = async (data) => {
        socket.emit('report', {
            roomId,
            reason: data.reason,
            details: data.details || ''
        });
        setIsReportOpen(false);
        toast.success("Report submitted. Thank you for keeping EchoRoom safe.");
    };

    // Reaction emojis
    const reactions = [
        { emoji: '❤️', name: 'heart' },
        { emoji: '👍', name: 'thumbsup' },
        { emoji: '😂', name: 'laugh' },
        { emoji: '👏', name: 'clap' },
        { emoji: '🔥', name: 'fire' },
        { emoji: '✨', name: 'sparkle' },
    ];

    const sendReaction = (reaction) => {
        // Add floating reaction locally
        const id = Date.now();
        setFloatingReactions(prev => [...prev, { id, emoji: reaction.emoji }]);
        setTimeout(() => {
            setFloatingReactions(prev => prev.filter(r => r.id !== id));
        }, 2000);

        // Send to peer
        socket.emit('send-reaction', { roomId, reaction: reaction.emoji });
        setShowReactions(false);
    };

    // Handle share room
    const handleShareRoom = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast.success('Room link copied to clipboard!');
        setShowShareModal(false);
    };

    // Listen for reactions from peer
    useEffect(() => {
        if (!socket) return;

        const handleReaction = ({ reaction }) => {
            setRemoteReaction(reaction);
            setTimeout(() => setRemoteReaction(null), 2000);
        };

        socket.on('receive-reaction', handleReaction);
        return () => socket.off('receive-reaction', handleReaction);
    }, [socket]);

    return (
        <div className="room-container relative flex flex-col h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/30 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        EchoRoom
                    </h1>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Reconnect Button */}
                    {isReconnecting ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="p-2"
                        >
                            <Loader2 className="w-5 h-5 text-cyan-400" />
                        </motion.div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={attemptReconnect}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            title="Reconnect"
                        >
                            <RefreshCcw className="w-5 h-5 text-cyan-400" />
                        </motion.button>
                    )}
                    
                    {/* Share Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShareRoom}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        title="Share Room"
                    >
                        <Share2 className="w-5 h-5 text-purple-400" />
                    </motion.button>

                    {/* Leave Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowExitConfirm(true)}
                        className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-colors"
                    >
                        <PhoneOff className="w-5 h-5" />
                    </motion.button>
                </div>
            </header>

            {/* Main Video Section */}
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">
                {/* Self Preview - Floating on mobile, sidebar on desktop */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`
                        ${isGroupCall 
                            ? 'absolute bottom-24 right-4 w-32 h-44 md:w-48 md:h-64 z-20' 
                            : 'lg:w-1/4 lg:min-w-[280px] w-full h-48 lg:h-auto'
                        }
                        bg-black/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10
                        shadow-2xl transition-all duration-300 hover:border-cyan-500/50
                    `}
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Name Badge */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm font-medium text-white truncate">
                                {userName || 'You'}
                            </span>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setTempName(userName);
                                    setShowNameModal(true);
                                }}
                                className="p-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                                title="Edit name"
                            >
                                <UserPlus className="w-3 h-3 md:w-4 md:h-4" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Video/Audio Status Indicators */}
                    <div className="absolute top-2 left-2 flex gap-1">
                        {isMuted && (
                            <div className="p-1 rounded bg-red-500/80">
                                <MicOff className="w-3 h-3" />
                            </div>
                        )}
                        {isVideoOff && (
                            <div className="p-1 rounded bg-red-500/80">
                                <VideoOff className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Remote Videos Grid */}
                <div className={`
                    flex-1 grid gap-3 
                    ${isGroupCall 
                        ? groupPeers.length <= 1 
                            ? 'grid-cols-1' 
                            : groupPeers.length <= 4 
                                ? 'grid-cols-1 md:grid-cols-2' 
                                : 'grid-cols-2 md:grid-cols-3'
                        : 'grid-cols-1'
                    }
                `}>
                    {isGroupCall ? (
                        groupPeers.length > 0 ? (
                            groupPeers.map(({ peerId, stream, peerName }) => (
                                <motion.div 
                                    key={peerId}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-sm border border-white/10 cursor-pointer hover:border-cyan-500/50 transition-all"
                                    onClick={() => setFullscreenPeer(peerId)}
                                >
                                    <video
                                        ref={el => {
                                            if (el && stream) {
                                                el.srcObject = stream;
                                                el.play().catch(() => {});
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover min-h-[200px]"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                        <span className="text-xs md:text-sm font-medium text-white">
                                            {peerName || `User ${peerId.slice(0, 6)}`}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                <p className="text-lg font-medium">Waiting for others to join...</p>
                                <p className="text-sm mt-2">Share the room link to invite friends</p>
                            </div>
                        )
                    ) : (
                        /* 1-on-1 Remote Video */
                        <div className="relative rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-sm border border-white/10 h-full">
                            {remoteStream ? (
                                <>
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    {remoteReaction && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1.5, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl"
                                        >
                                            {remoteReaction}
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-neutral-400 min-h-[300px]">
                                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                    <p className="text-lg font-medium">Connecting...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Controls */}
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-20 flex items-center justify-center gap-2 md:gap-4 p-3 md:p-4 bg-black/40 backdrop-blur-md border-t border-white/10"
            >
                {/* Mic Toggle */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        toggleAudio();
                        setIsMuted(!isMuted);
                    }}
                    className={`p-3 md:p-4 rounded-2xl transition-all ${
                        isMuted 
                            ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
                </motion.button>

                {/* Video Toggle */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        toggleVideo();
                        setIsVideoOff(!isVideoOff);
                    }}
                    className={`p-3 md:p-4 rounded-2xl transition-all ${
                        isVideoOff 
                            ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    {isVideoOff ? <VideoOff className="w-5 h-5 md:w-6 md:h-6" /> : <Video className="w-5 h-5 md:w-6 md:h-6" />}
                </motion.button>

                {/* Screen Share */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleScreenShare}
                    className={`p-3 md:p-4 rounded-2xl transition-all hidden md:flex ${
                        isScreenSharing 
                            ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/50' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    {isScreenSharing ? <MonitorOff className="w-5 h-5 md:w-6 md:h-6" /> : <Monitor className="w-5 h-5 md:w-6 md:h-6" />}
                </motion.button>

                {/* Chat Toggle */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`p-3 md:p-4 rounded-2xl transition-all ${
                        isChatOpen 
                            ? 'bg-purple-500/20 text-purple-400 ring-2 ring-purple-500/50' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                </motion.button>

                {/* Reactions */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowReactions(!showReactions)}
                        className="p-3 md:p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        <Heart className="w-5 h-5 md:w-6 md:h-6" />
                    </motion.button>
                    
                    <AnimatePresence>
                        {showReactions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 flex gap-2 p-2 bg-black/80 backdrop-blur-md rounded-xl"
                            >
                                {[
                                    { emoji: '❤️', name: 'heart' },
                                    { emoji: '👍', name: 'thumbsup' },
                                    { emoji: '😂', name: 'laugh' },
                                    { emoji: '🔥', name: 'fire' },
                                    { emoji: '👏', name: 'clap' }
                                ].map(reaction => (
                                    <motion.button
                                        key={reaction.name}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => sendReaction(reaction)}
                                        className="text-2xl hover:bg-white/10 p-2 rounded-lg transition-colors"
                                    >
                                        {reaction.emoji}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* End Call */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowExitConfirm(true)}
                    className="p-3 md:p-4 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
                >
                    <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
                </motion.button>
            </motion.div>

            {/* Name Edit Modal */}
            <AnimatePresence>
                {showNameModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-white/10"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Set Your Display Name</h3>
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                placeholder="Enter your name..."
                                maxLength={20}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        saveUserName(tempName);
                                    }
                                }}
                            />
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowNameModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors font-medium border border-white/10"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => saveUserName(tempName)}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold transition-all shadow-lg shadow-cyan-500/30"
                                >
                                    Save
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Exit Confirmation Modal */}
            <ConfirmationModal
                isOpen={showExitConfirm}
                title="Leave Room?"
                message="Are you sure you want to leave this room? You'll be disconnected from the call."
                confirmText="Leave"
                cancelText="Stay"
                onConfirm={() => {
                    cleanup();
                    navigate('/');
                }}
                onCancel={() => setShowExitConfirm(false)}
                isDanger={true}
            />

            {/* Chat Panel */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute right-0 top-0 bottom-0 w-full md:w-96 z-30 bg-gray-900/95 backdrop-blur-md border-l border-white/10"
                    >
                        <Chat 
                            socket={socket} 
                            roomId={roomId} 
                            userName={userName}
                            onClose={() => setIsChatOpen(false)} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Reactions */}
            <AnimatePresence>
                {floatingReactions.map(reaction => (
                    <motion.div
                        key={reaction.id}
                        initial={{ opacity: 1, y: 0, x: '-50%' }}
                        animate={{ opacity: 0, y: -200 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2 }}
                        className="absolute bottom-32 left-1/2 text-4xl pointer-events-none z-40"
                    >
                        {reaction.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Toast Notifications */}
            <Toaster 
                position="top-center" 
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: '#1f2937',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                    },
                }}
            />
        </div>
    );
};

const ControlButton = ({ onClick, isActive, activeIcon, inactiveIcon }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
            isActive 
                ? 'text-white hover:bg-white/10' 
                : 'text-red-400 bg-red-500/20 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
        }`}
    >
        {!isActive && (
            <motion.div
                className="absolute inset-0 bg-red-500/10"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
        )}
        {React.cloneElement(isActive ? activeIcon : inactiveIcon, { className: "w-5 h-5 relative z-10" })}
    </motion.button>
);

const ConfirmationModal = ({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, isDanger }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="glass-panel rounded-2xl p-6 max-w-sm w-full"
                    style={{ 
                        boxShadow: isDanger 
                            ? '0 0 60px rgba(239, 68, 68, 0.2)' 
                            : '0 0 60px rgba(6, 182, 212, 0.2)' 
                    }}
                >
                    <motion.h3 
                        className="text-xl font-bold text-white mb-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {title}
                    </motion.h3>
                    <motion.p 
                        className="text-neutral-400 mb-6"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        {message}
                    </motion.p>
                    <div className="flex gap-3">
                        <motion.button
                            onClick={onCancel}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors font-medium border border-white/10"
                        >
                            {cancelText}
                        </motion.button>
                        <motion.button
                            onClick={onConfirm}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                                isDanger 
                                    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/30' 
                                    : 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black shadow-lg shadow-cyan-500/30'
                            }`}
                        >
                            {confirmText}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default Room;
