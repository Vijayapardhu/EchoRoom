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
                        const existing = prev.find(p => p.peerId === peerId);
                        if (existing) {
                            return prev.map(p => p.peerId === peerId ? { ...p, stream } : p);
                        }
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
            
            // Don't create connection here - wait for their offer
        };
        
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
        <div className="h-[100dvh] bg-black relative overflow-hidden flex flex-col">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: 'rgba(20, 20, 20, 0.9)',
                    color: '#fff',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                },
            }} />

            {/* Floating Reactions */}
            <AnimatePresence>
                {floatingReactions.map(({ id, emoji }) => (
                    <motion.div
                        key={id}
                        initial={{ opacity: 1, y: 0, x: Math.random() * 100 - 50, scale: 0 }}
                        animate={{ opacity: 0, y: -200, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute bottom-32 right-8 text-4xl z-50 pointer-events-none"
                    >
                        {emoji}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Remote Peer Reaction */}
            <AnimatePresence>
                {remoteReaction && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl z-40 pointer-events-none"
                    >
                        {remoteReaction}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Searching Overlay */}
            <AnimatePresence>
                {isSearching && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center"
                    >
                        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                        <h3 className="text-xl font-medium text-white tracking-wide">Scanning Frequencies...</h3>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-0 left-0 right-0 p-4 md:p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent pointer-events-none"
                    >
                        <div className="flex items-center gap-3 pointer-events-auto">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md">
                                <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)] ${mode === 'video' ? 'bg-cyan-500' : 'bg-purple-500'}`} />
                                <span className={`text-xs font-bold tracking-wider uppercase ${mode === 'video' ? 'text-cyan-400' : 'text-purple-400'}`}>
                                    {mode === 'video' ? 'Live Video' : 'Text Mode'}
                                </span>
                            </div>
                            <ConnectionIndicator />
                        </div>

                        <div className="flex gap-2 pointer-events-auto">
                            {/* Share Room Button (Group calls) */}
                            {isGroupCall && (
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="p-3 rounded-full text-neutral-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-300"
                                    title="Share Room"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className={`p-3 rounded-full transition-all duration-300 ${isChatOpen ? 'text-cyan-400 bg-cyan-500/10' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <MessageSquare className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsReportOpen(true)}
                                className="p-3 rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                            >
                                <Flag className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Share Room Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        onClick={() => setShowShareModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white">Share Room</h3>
                                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-neutral-400" />
                                </button>
                            </div>
                            <p className="text-neutral-400 text-sm mb-4">Invite friends to join this group call!</p>
                            <div className="flex items-center gap-2 p-3 bg-black/50 rounded-xl border border-white/10 mb-4">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={window.location.href}
                                    className="flex-1 bg-transparent text-white text-sm truncate outline-none"
                                />
                                <button
                                    onClick={handleShareRoom}
                                    className="p-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-colors"
                                >
                                    <Copy className="w-4 h-4 text-black" />
                                </button>
                            </div>
                            <button
                                onClick={handleShareRoom}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Copy Link
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Video Area */}
            <div className="flex-1 relative w-full h-full bg-black">
                {/* Group Call Grid Layout */}
                {isGroupCall && groupPeers.length > 0 ? (
                    <>
                        {/* Fullscreen Peer View */}
                        {fullscreenPeer && (
                            <div 
                                className="absolute inset-0 z-40 bg-black cursor-pointer"
                                onClick={() => setFullscreenPeer(null)}
                            >
                                {groupPeers.filter(p => p.peerId === fullscreenPeer).map(({ peerId, stream }) => (
                                    <div key={peerId} className="w-full h-full relative">
                                        <video
                                            ref={el => {
                                                if (el && stream) {
                                                    el.srcObject = stream;
                                                    el.play().catch(() => {});
                                                }
                                            }}
                                            autoPlay
                                            playsInline
                                            muted={false}
                                            className="w-full h-full object-contain"
                                        />
                                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 rounded-lg text-sm text-white flex items-center gap-2">
                                            <span>Peer {peerId.slice(0, 6)}</span>
                                            <span className="text-xs text-white/60">• Tap to exit fullscreen</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Grid Layout - Responsive */}
                        <div className={`w-full h-full p-2 ${
                            fullscreenPeer ? 'hidden' : ''
                        } ${
                            /* Mobile: Stack vertically, Desktop: Use grid */
                            groupPeers.length === 1 
                                ? 'flex items-center justify-center' 
                                : groupPeers.length === 2 
                                    ? 'flex flex-col md:flex-row gap-2' 
                                    : groupPeers.length === 3 
                                        ? 'flex flex-col gap-2'
                                        : 'grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2 gap-2'
                        }`}>
                            {groupPeers.length === 3 ? (
                                /* 3 users: 1 on top, 2 on bottom */
                                <>
                                    <div 
                                        className="flex-1 md:flex-[2] relative rounded-xl overflow-hidden bg-neutral-900 cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all"
                                        onClick={() => setFullscreenPeer(groupPeers[0].peerId)}
                                    >
                                        <video
                                            ref={el => {
                                                if (el && groupPeers[0].stream) {
                                                    el.srcObject = groupPeers[0].stream;
                                                    el.play().catch(() => {});
                                                }
                                            }}
                                            autoPlay
                                            playsInline
                                            muted={false}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                                            Peer {groupPeers[0].peerId.slice(0, 6)}
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col md:flex-row gap-2">
                                        {groupPeers.slice(1).map(({ peerId, stream }) => (
                                            <div 
                                                key={peerId} 
                                                className="flex-1 relative rounded-xl overflow-hidden bg-neutral-900 cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all"
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
                                                    muted={false}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                                                    Peer {peerId.slice(0, 6)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                /* 1, 2, 4+ users: Regular grid */
                                groupPeers.map(({ peerId, stream }) => (
                                    <div 
                                        key={peerId} 
                                        className={`relative rounded-xl overflow-hidden bg-neutral-900 cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all ${
                                            groupPeers.length === 1 ? 'w-full h-full max-w-4xl max-h-[80vh]' : 
                                            groupPeers.length === 2 ? 'flex-1 min-h-0' : ''
                                        }`}
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
                                            muted={false}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                                            Peer {peerId.slice(0, 6)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* 1-on-1 Remote Video */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            muted={false}
                            className={`w-full h-full ${videoFit === 'cover' ? 'object-cover' : 'object-contain'} transition-all duration-300 ${remoteVideoOff || mode === 'text' ? 'hidden' : ''}`}
                        />
                    </>
                )}

                {/* Video Fit Toggle (Overlay on Remote Video) */}
                {!isGroupCall && !remoteVideoOff && mode === 'video' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setVideoFit(prev => prev === 'cover' ? 'contain' : 'cover');
                        }}
                        className="absolute bottom-6 left-6 p-2 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white hover:bg-black/60 transition-all z-20"
                        title={videoFit === 'cover' ? "Show Full Video" : "Fill Screen"}
                    >
                        {videoFit === 'cover' ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                )}

                {/* Remote Video Placeholder (1-on-1 only) */}
                {!isGroupCall && (remoteVideoOff || mode === 'text') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-6 rounded-full bg-neutral-800">
                                {mode === 'text' ? <MessageSquare className="w-12 h-12 text-purple-500" /> : <VideoOff className="w-12 h-12 text-neutral-500" />}
                            </div>
                            <p className="text-neutral-400 font-medium">{mode === 'text' ? 'Text Mode Active' : 'Camera Paused'}</p>
                        </div>
                    </div>
                )}
                
                {/* Waiting for peers in group call */}
                {isGroupCall && groupPeers.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                            <p className="text-neutral-400 font-medium">Waiting for others to join...</p>
                            <p className="text-neutral-500 text-sm">Share the room to invite friends!</p>
                        </div>
                    </div>
                )}

                {/* Cinematic Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

                {/* Local Video - Mobile Optimized Position */}
                <motion.div
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    className={`absolute top-20 right-4 w-28 md:w-56 aspect-[3/4] md:aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 cursor-grab active:cursor-grabbing z-30 group ${mode === 'text' ? 'hidden' : ''}`}
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`}
                    />
                    {/* Local Video Placeholder */}
                    {isVideoOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                            <VideoOff className="w-6 h-6 text-neutral-500" />
                        </div>
                    )}
                    {/* Local Status Icons */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        {isMuted && <div className="p-1 bg-red-500/80 rounded-full"><MicOff className="w-3 h-3 text-white" /></div>}
                        {isVideoOff && <div className="p-1 bg-red-500/80 rounded-full"><VideoOff className="w-3 h-3 text-white" /></div>}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Controls - Mobile Optimized */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-6 left-0 right-0 z-30 px-4 flex justify-center"
                    >
                        <div className="w-full max-w-md bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center justify-between shadow-2xl gap-2">

                            <div className="flex gap-1">
                                <ControlButton onClick={handleToggleMute} isActive={!isMuted} activeIcon={<Mic />} inactiveIcon={<MicOff />} />
                                <ControlButton onClick={handleToggleVideo} isActive={!isVideoOff} activeIcon={<Video />} inactiveIcon={<VideoOff />} />
                                <button
                                    onClick={switchCamera}
                                    className="p-3 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                                    title="Switch Camera"
                                >
                                    <RefreshCcw className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Reactions Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowReactions(!showReactions)}
                                    className={`p-3 rounded-xl transition-all duration-300 ${showReactions ? 'text-pink-400 bg-pink-500/10' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                                    title="Send Reaction"
                                >
                                    <Heart className="w-5 h-5" />
                                </button>
                                
                                {/* Reaction Picker */}
                                <AnimatePresence>
                                    {showReactions && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                            className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex gap-1 shadow-2xl"
                                        >
                                            {reactions.map((reaction) => (
                                                <button
                                                    key={reaction.name}
                                                    onClick={() => sendReaction(reaction)}
                                                    className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-125 text-2xl"
                                                >
                                                    {reaction.emoji}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Prominent Next Button */}
                            <button
                                onClick={handleNextMatchRequest}
                                className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-cyan-300 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                            >
                                <SkipForward className="w-5 h-5" />
                                <span>Next</span>
                            </button>

                            <div className="flex gap-1">
                                <button
                                    onClick={handleModeSwitch}
                                    className={`p-3 rounded-xl transition-all duration-300 ${mode === 'text' ? 'text-purple-400 bg-purple-500/10' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    {mode === 'text' ? <MessageSquare className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={handleLeaveRoomRequest}
                                    className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <PhoneOff className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={showNextConfirm}
                title="Skip to Next?"
                message="Are you sure you want to leave this conversation and find a new match?"
                confirmText="Yes, Skip"
                cancelText="Cancel"
                onConfirm={confirmNextMatch}
                onCancel={() => setShowNextConfirm(false)}
            />

            <ConfirmationModal
                isOpen={showExitConfirm}
                title="Leave Room?"
                message="Are you sure you want to exit the room and return to home?"
                confirmText="Yes, Leave"
                cancelText="Stay"
                onConfirm={confirmLeaveRoom}
                onCancel={() => setShowExitConfirm(false)}
                isDanger
            />

            <PanicButton roomId={roomId} />

            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                onSubmit={handleReportSubmit}
            />

            <Chat
                roomId={roomId}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </div>
    );
};

const ControlButton = ({ onClick, isActive, activeIcon, inactiveIcon }) => (
    <button
        onClick={onClick}
        className={`p-3 rounded-xl transition-all duration-300 ${isActive ? 'text-white hover:bg-white/10' : 'text-red-400 bg-red-500/10 hover:bg-red-500/20'}`}
    >
        {React.cloneElement(isActive ? activeIcon : inactiveIcon, { className: "w-5 h-5" })}
    </button>
);

const ConfirmationModal = ({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, isDanger }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                >
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-neutral-400 mb-6">{message}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDanger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-black'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default Room;
