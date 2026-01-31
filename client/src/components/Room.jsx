import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { 
    Microphone, 
    MicrophoneSlash, 
    VideoCamera, 
    VideoCameraSlash, 
    PhoneDisconnect, 
    ChatCircle,
    Monitor,
    ArrowClockwise,
    Spinner,
    ShareNetwork,
    Copy,
    UserPlus,
    X,
    WifiHigh,
    WifiMedium,
    WifiLow,
    WifiSlash,
    CheckCircle,
    Info,
    Smiley,
    Heart,
    Fire,
    Lightning,
    HandsClapping,
    Star,
    Crosshair,
    Users,
    Scan,
    CornersOut,
    CornersIn,
    ArrowsOutSimple,
    ArrowsInSimple
} from '@phosphor-icons/react';
import Chat from './Chat';
import { playJoinSound, playLeaveSound } from '../utils/soundEffects';

// Connection quality indicator
const ConnectionQuality = ({ stats }) => {
    const getQuality = () => {
        if (!stats || stats.rtt === 0) return { icon: WifiSlash, color: 'text-red-400', label: 'Disconnected' };
        if (stats.rtt < 50) return { icon: WifiHigh, color: 'text-cyan-400', label: 'Excellent' };
        if (stats.rtt < 100) return { icon: WifiHigh, color: 'text-green-400', label: 'Good' };
        if (stats.rtt < 200) return { icon: WifiMedium, color: 'text-yellow-400', label: 'Fair' };
        return { icon: WifiLow, color: 'text-orange-400', label: 'Poor' };
    };

    const quality = getQuality();
    const Icon = quality.icon;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-white/10">
            <Icon weight="fill" className={`w-4 h-4 ${quality.color}`} />
            <span className="text-xs text-white/60 uppercase tracking-wider">{quality.label}</span>
            {stats?.rtt > 0 && (
                <span className="text-xs text-white/30 font-mono">{stats.rtt}ms</span>
            )}
        </div>
    );
};

// Neon button component
const ControlButton = ({ onClick, active, activeIcon, inactiveIcon, color = 'cyan', label }) => {
    const colors = {
        cyan: 'border-cyan-400 text-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(0,243,255,0.3)]',
        red: 'border-red-400 text-red-400 bg-red-400/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        purple: 'border-purple-400 text-purple-400 bg-purple-400/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
        white: 'border-white/30 text-white hover:border-white/60'
    };

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
                p-4 border transition-all duration-300 relative overflow-hidden group
                ${active ? colors[color] : colors.white}
            `}
            style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
        >
            {active && color !== 'white' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            )}
            {React.cloneElement(active ? activeIcon : inactiveIcon, { 
                weight: 'fill',
                className: 'w-6 h-6 relative z-10' 
            })}
        </motion.button>
    );
};

// Floating reaction
const FloatingReaction = ({ icon: Icon, color, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const colorClasses = {
        red: 'text-red-400',
        cyan: 'text-cyan-400',
        yellow: 'text-yellow-400',
        orange: 'text-orange-400',
        purple: 'text-purple-400'
    };

    return (
        <motion.div
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -200, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute bottom-32 left-1/2 pointer-events-none z-40"
        >
            <Icon weight="fill" className={`w-16 h-16 ${colorClasses[color]}`} />
        </motion.div>
    );
};

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
        cleanup,
        peerConnection,
        peerConnections,
        toggleScreenShare,
        toggleVideo,
        toggleAudio,
        isScreenSharing,
        connectionStats,
    } = useWebRTC();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const initiatorHandledRef = useRef(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [userName, setUserName] = useState(() => localStorage.getItem('echoroom_username') || '');
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempName, setTempName] = useState('');
    const [isGroupCall, setIsGroupCall] = useState(false);
    const [groupPeers, setGroupPeers] = useState([]);
    
    // Reactions
    const [showReactions, setShowReactions] = useState(false);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [remoteReaction, setRemoteReaction] = useState(null);
    
    // Video display modes for cross-device compatibility (mobile/desktop)
    const [videoFitMode, setVideoFitMode] = useState('contain'); // 'contain' = fit center, 'cover' = fill
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [remoteAspectRatio, setRemoteAspectRatio] = useState(null); // 'portrait', 'landscape', or null
    const remoteVideoContainerRef = useRef(null);

    const preferences = location.state || {};

    const reactions = [
        { icon: Heart, color: 'red', name: 'heart' },
        { icon: Lightning, color: 'cyan', name: 'lightning' },
        { icon: Star, color: 'yellow', name: 'star' },
        { icon: Fire, color: 'orange', name: 'fire' },
        { icon: HandsClapping, color: 'purple', name: 'clap' },
    ];

    useEffect(() => {
        if (roomId && roomId.startsWith('group-')) {
            setIsGroupCall(true);
        }
        initiatorHandledRef.current = false;
    }, [roomId]);

    useEffect(() => {
        const initMedia = async () => {
            try {
                await startLocalStream();
            } catch (err) {
                console.error('Failed to start local stream:', err);
                toast.error('Camera access required');
            }
        };
        initMedia();
        return () => cleanup();
    }, []);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            
            // Detect aspect ratio when video metadata loads
            const handleLoadedMetadata = () => {
                const video = remoteVideoRef.current;
                if (video) {
                    const aspectRatio = video.videoWidth / video.videoHeight;
                    // Portrait (mobile) is typically < 1, Landscape (desktop) is > 1
                    if (aspectRatio < 1) {
                        setRemoteAspectRatio('portrait');
                        setVideoFitMode('contain'); // Default to fit-center for portrait videos
                    } else {
                        setRemoteAspectRatio('landscape');
                        setVideoFitMode('cover'); // Default to fill for landscape videos
                    }
                    console.log('[Room] Remote video aspect ratio:', aspectRatio.toFixed(2), aspectRatio < 1 ? 'portrait' : 'landscape');
                }
            };
            
            remoteVideoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
            
            return () => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
                }
            };
        }
    }, [remoteStream]);
    
    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);
    
    // Toggle fullscreen mode
    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                const element = remoteVideoContainerRef.current;
                if (element) {
                    if (element.requestFullscreen) {
                        await element.requestFullscreen();
                    } else if (element.webkitRequestFullscreen) {
                        await element.webkitRequestFullscreen();
                    }
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                }
            }
        } catch (err) {
            console.error('[Room] Fullscreen error:', err);
        }
    }, []);
    
    // Toggle video fit mode (contain/cover)
    const toggleVideoFitMode = useCallback(() => {
        setVideoFitMode(prev => prev === 'contain' ? 'cover' : 'contain');
    }, []);

    useEffect(() => {
        if (!socket || !roomId) return;

        socket.emit('join-room', { roomId, userName });

        const handleExistingPeers = async ({ peers }) => {
            if (!localStream) {
                setTimeout(() => handleExistingPeers({ peers }), 100);
                return;
            }
            for (const peerId of peers) {
                const onIceCandidate = (candidate, targetPeerId) => {
                    socket.emit('ice-candidate', { roomId, candidate, targetPeerId });
                };
                const onRemoteStream = (stream, pid) => {
                    setGroupPeers(prev => {
                        const existing = prev.find(p => p.peerId === pid);
                        if (existing) {
                            return prev.map(p => p.peerId === pid ? { ...p, stream } : p);
                        }
                        return [...prev, { peerId: pid, stream }];
                    });
                };
                createPeerConnectionForPeer(peerId, onIceCandidate, onRemoteStream);
                try {
                    const offer = await createOfferForPeer(peerId);
                    socket.emit('offer', { roomId, offer, targetPeerId: peerId });
                } catch (err) {
                    console.error('Error creating offer:', err);
                }
            }
        };

        const handlePeerJoined = async ({ peerId }) => {
            toast.success('New node connected');
            playJoinSound();
            const onIceCandidate = (candidate, targetPeerId) => {
                socket.emit('ice-candidate', { roomId, candidate, targetPeerId });
            };
            const onRemoteStream = (stream, pid) => {
                setGroupPeers(prev => {
                    const existing = prev.find(p => p.peerId === pid);
                    if (existing) return prev.map(p => p.peerId === pid ? { ...p, stream } : p);
                    return [...prev, { peerId: pid, stream }];
                });
            };
            createPeerConnectionForPeer(peerId, onIceCandidate, onRemoteStream);
        };

        const handlePeerLeft = ({ peerId }) => {
            toast('Node disconnected', { icon: <Info weight="fill" className="w-5 h-5" /> });
            playLeaveSound();
            removePeerConnection(peerId);
            setGroupPeers(prev => prev.filter(p => p.peerId !== peerId));
        };

        const handleIsInitiator = async (isInitiator) => {
            if (isGroupCall) return;
            if (initiatorHandledRef.current) return;
            
            if (!localStream) {
                setTimeout(() => handleIsInitiator(isInitiator), 200);
                return;
            }

            initiatorHandledRef.current = true;
            const handleIceCandidate = (candidate) => {
                socket.emit('ice-candidate', { roomId, candidate });
            };
            createPeerConnection(handleIceCandidate);

            if (isInitiator) {
                try {
                    const offer = await createOffer();
                    socket.emit('offer', { roomId, offer });
                } catch (err) {
                    console.error('Error creating offer:', err);
                }
            }
        };

        const handleOfferReceived = async ({ offer, sender }) => {
            if (isGroupCall) {
                if (!localStream) {
                    setTimeout(() => handleOfferReceived({ offer, sender }), 100);
                    return;
                }
                const onIceCandidate = (candidate, targetPeerId) => {
                    socket.emit('ice-candidate', { roomId, candidate, targetPeerId });
                };
                const onRemoteStream = (stream, pid) => {
                    setGroupPeers(prev => {
                        const existing = prev.find(p => p.peerId === pid);
                        if (existing) return prev.map(p => p.peerId === pid ? { ...p, stream } : p);
                        return [...prev, { peerId: pid, stream }];
                    });
                };
                createPeerConnectionForPeer(sender, onIceCandidate, onRemoteStream);
                try {
                    const answer = await handleOfferFromPeer(offer, sender);
                    socket.emit('answer', { roomId, answer, targetPeerId: sender });
                } catch (err) {
                    console.error('Error handling offer:', err);
                }
            } else {
                if (!peerConnection.current) {
                    const handleIceCandidate = (candidate) => {
                        socket.emit('ice-candidate', { roomId, candidate });
                    };
                    createPeerConnection(handleIceCandidate);
                }
                try {
                    const answer = await handleOffer(offer);
                    socket.emit('answer', { roomId, answer });
                    initiatorHandledRef.current = true;
                } catch (err) {
                    console.error('Error handling offer:', err);
                }
            }
        };

        const handleAnswerReceived = async ({ answer, sender }) => {
            if (isGroupCall) {
                try { await handleAnswerFromPeer(answer, sender); } catch (err) {}
            } else {
                if (!peerConnection.current) return;
                try { await handleAnswer(answer); } catch (err) {}
            }
        };

        const handleIceCandidateReceived = async ({ candidate, sender }) => {
            if (isGroupCall) {
                try { await addIceCandidateForPeer(candidate, sender); } catch (err) {}
            } else {
                if (!peerConnection.current) return;
                try { await addIceCandidate(candidate); } catch (err) {}
            }
        };

        const handleReaction = ({ reaction }) => {
            setRemoteReaction(reaction);
            setTimeout(() => setRemoteReaction(null), 2000);
        };

        socket.on('existing-peers', handleExistingPeers);
        socket.on('peer-joined', handlePeerJoined);
        socket.on('peer-left', handlePeerLeft);
        socket.on('is-initiator', handleIsInitiator);
        socket.on('offer', handleOfferReceived);
        socket.on('answer', handleAnswerReceived);
        socket.on('ice-candidate', handleIceCandidateReceived);
        socket.on('receive-reaction', handleReaction);

        playJoinSound();

        return () => {
            socket.off('existing-peers', handleExistingPeers);
            socket.off('peer-joined', handlePeerJoined);
            socket.off('peer-left', handlePeerLeft);
            socket.off('is-initiator', handleIsInitiator);
            socket.off('offer', handleOfferReceived);
            socket.off('answer', handleAnswerReceived);
            socket.off('ice-candidate', handleIceCandidateReceived);
            socket.off('receive-reaction', handleReaction);
        };
    }, [socket, roomId, createPeerConnection, isGroupCall, localStream, userName, createOffer, handleOffer, handleAnswer, addIceCandidate, createPeerConnectionForPeer, createOfferForPeer, handleOfferFromPeer, handleAnswerFromPeer, addIceCandidateForPeer, removePeerConnection]);

    const handleToggleMute = useCallback(() => {
        const isEnabled = toggleAudio();
        setIsMuted(!isEnabled);
    }, [toggleAudio]);

    const handleToggleVideo = useCallback(() => {
        const isEnabled = toggleVideo();
        setIsVideoOff(!isEnabled);
        socket.emit('toggle-video', { roomId, isVideoOff: !isEnabled });
    }, [toggleVideo, socket, roomId]);

    const handleLeaveRoom = useCallback(() => {
        cleanup();
        socket.emit('leave-room', roomId);
        navigate('/post-chat');
    }, [cleanup, socket, roomId, navigate]);

    const sendReaction = useCallback((reaction) => {
        const id = Date.now();
        setFloatingReactions(prev => [...prev, { id, ...reaction }]);
        socket.emit('send-reaction', { roomId, reaction: reaction.name });
        setShowReactions(false);
    }, [socket, roomId]);

    const handleShareRoom = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied', { icon: <CheckCircle weight="fill" className="w-5 h-5 text-cyan-400" /> });
    }, []);

    return (
        <div className="relative flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
            {/* Background Grid */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center border border-cyan-400/50 bg-cyan-400/10">
                        <Crosshair weight="fill" className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-widest uppercase text-white">
                            Echo<span className="text-cyan-400">Room</span>
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-wider">
                            {isGroupCall ? <><Users weight="fill" className="w-3 h-3" /> Multi-Node</> : <><Scan weight="fill" className="w-3 h-3" /> Direct Link</>}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <ConnectionQuality stats={connectionStats} />
                    
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShareRoom}
                        className="p-2 border border-white/10 hover:border-purple-400/50 hover:bg-purple-400/10 transition-all"
                        style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                    >
                        <ShareNetwork weight="fill" className="w-5 h-5 text-purple-400" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowExitConfirm(true)}
                        className="px-4 py-2 border border-red-400/50 bg-red-400/10 text-red-400 font-bold text-xs uppercase tracking-wider hover:bg-red-400/20 transition-all"
                        style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                    >
                        Terminate
                    </motion.button>
                </div>
            </header>

            {/* Main Video Area */}
            <div className="relative z-10 flex-1 flex flex-col gap-3 p-3 overflow-hidden">
                {/* Local Video */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.1}
                    className="absolute bottom-24 right-4 z-30 w-32 h-40 md:w-40 md:h-52 bg-black border border-white/20 overflow-hidden"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-white/80 uppercase">
                                {userName || 'You'}
                            </span>
                            <button 
                                onClick={() => { setTempName(userName); setShowNameModal(true); }}
                                className="p-1 hover:bg-white/20 transition-colors"
                            >
                                <UserPlus weight="fill" className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div className="absolute top-2 left-2 flex gap-1">
                        {isMuted && (
                            <div className="p-1 bg-red-400/80">
                                <MicrophoneSlash weight="fill" className="w-3 h-3 text-black" />
                            </div>
                        )}
                        {isVideoOff && (
                            <div className="p-1 bg-red-400/80">
                                <VideoCameraSlash weight="fill" className="w-3 h-3 text-black" />
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Remote Videos */}
                <div className="flex-1 h-full">
                    {isGroupCall ? (
                        <div className={`h-full grid gap-3 ${groupPeers.length <= 1 ? 'grid-cols-1' : groupPeers.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            {groupPeers.length > 0 ? (
                                groupPeers.map(({ peerId, stream }) => (
                                    <motion.div 
                                        key={peerId}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="relative bg-neutral-900/50 border border-white/10 overflow-hidden"
                                        style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
                                    >
                                        <video
                                            ref={el => { if (el && stream) { el.srcObject = stream; el.play().catch(() => {}); }}}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                            <span className="text-xs font-mono text-white/80">Node {peerId.slice(0, 6)}</span>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/30">
                                    <Spinner weight="bold" className="w-12 h-12 animate-spin mb-4 text-cyan-400" />
                                    <p className="text-lg font-mono uppercase tracking-widest">Awaiting nodes...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div 
                            className="relative h-full bg-neutral-900/50 border border-white/10 overflow-hidden"
                            style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))' }}
                        >
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
                                            animate={{ scale: 2, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                        >
                                            {reactions.find(r => r.name === remoteReaction)?.icon && 
                                                React.createElement(reactions.find(r => r.name === remoteReaction).icon, {
                                                    weight: 'fill',
                                                    className: `w-20 h-20 text-${reactions.find(r => r.name === remoteReaction).color}-400`
                                                })
                                            }
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/30">
                                    <Spinner weight="bold" className="w-12 h-12 animate-spin mb-4 text-cyan-400" />
                                    <p className="text-lg font-mono uppercase tracking-widest">Establishing link...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-20 flex items-center justify-center gap-4 p-4 bg-black/80 backdrop-blur-md border-t border-white/10"
            >
                <ControlButton
                    onClick={handleToggleMute}
                    active={isMuted}
                    activeIcon={<MicrophoneSlash />}
                    inactiveIcon={<Microphone />}
                    color={isMuted ? 'red' : 'white'}
                />

                <ControlButton
                    onClick={handleToggleVideo}
                    active={isVideoOff}
                    activeIcon={<VideoCameraSlash />}
                    inactiveIcon={<VideoCamera />}
                    color={isVideoOff ? 'red' : 'white'}
                />

                <ControlButton
                    onClick={toggleScreenShare}
                    active={isScreenSharing}
                    activeIcon={<Monitor />}
                    inactiveIcon={<Monitor />}
                    color={isScreenSharing ? 'cyan' : 'white'}
                />

                <ControlButton
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    active={isChatOpen}
                    activeIcon={<ChatCircle />}
                    inactiveIcon={<ChatCircle />}
                    color={isChatOpen ? 'purple' : 'white'}
                />

                {/* Reactions */}
                <div className="relative">
                    <ControlButton
                        onClick={() => setShowReactions(!showReactions)}
                        active={showReactions}
                        activeIcon={<Smiley />}
                        inactiveIcon={<Smiley />}
                        color="white"
                    />
                    
                    <AnimatePresence>
                        {showReactions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex gap-2 p-3 bg-black/90 border border-white/20"
                            >
                                {reactions.map(reaction => (
                                    <motion.button
                                        key={reaction.name}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => sendReaction(reaction)}
                                        className="p-2 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all"
                                        style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                                    >
                                        <reaction.icon weight="fill" className={`w-6 h-6 text-${reaction.color}-400`} />
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
                    className="p-4 border-2 border-red-400 bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-black transition-all"
                    style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                >
                    <PhoneDisconnect weight="fill" className="w-6 h-6" />
                </motion.button>
            </motion.div>

            {/* Name Modal */}
            <AnimatePresence>
                {showNameModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-black border border-white/20 p-6 max-w-sm w-full"
                            style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
                        >
                            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-widest">Set Identifier</h3>
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                placeholder="Enter callsign..."
                                maxLength={20}
                                className="w-full bg-white/5 border border-white/20 px-4 py-3 text-white uppercase tracking-wider text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 mb-4"
                                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { setUserName(tempName); localStorage.setItem('echoroom_username', tempName); setShowNameModal(false); }}}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowNameModal(false)}
                                    className="flex-1 py-3 border border-white/20 text-white hover:bg-white/5 transition-all uppercase text-xs font-bold tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => { setUserName(tempName); localStorage.setItem('echoroom_username', tempName); setShowNameModal(false); }}
                                    className="flex-1 py-3 border-2 border-cyan-400 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all uppercase text-xs font-bold tracking-widest"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Exit Confirmation */}
            <AnimatePresence>
                {showExitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-black border border-white/20 p-6 max-w-sm w-full"
                            style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
                        >
                            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Terminate Connection?</h3>
                            <p className="text-white/40 text-sm mb-6 uppercase tracking-wider">This will end the current session</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="flex-1 py-3 border border-white/20 text-white hover:bg-white/5 transition-all uppercase text-xs font-bold tracking-widest"
                                >
                                    Stay
                                </button>
                                <button
                                    onClick={handleLeaveRoom}
                                    className="flex-1 py-3 border-2 border-red-400 bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-black transition-all uppercase text-xs font-bold tracking-widest"
                                >
                                    Terminate
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <Chat roomId={roomId} isOpen={isChatOpen} userName={userName} onClose={() => setIsChatOpen(false)} />

            {/* Floating Reactions */}
            <AnimatePresence>
                {floatingReactions.map(reaction => (
                    <FloatingReaction
                        key={reaction.id}
                        icon={reaction.icon}
                        color={reaction.color}
                        onComplete={() => setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id))}
                    />
                ))}
            </AnimatePresence>

            {/* Toast */}
            <Toaster 
                position="top-center"
                toastOptions={{
                    style: {
                        background: 'rgba(0, 0, 0, 0.9)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        border: '1px solid rgba(0, 243, 255, 0.3)',
                        borderRadius: '0',
                    },
                }}
            />
        </div>
    );
};

export default Room;
