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
    X,
    WifiHigh,
    WifiMedium,
    WifiLow,
    WifiSlash,
    CheckCircle,
    Info,
    Smiley,
    Heart,
    Lightning,
    Star,
    Fire,
    HandsClapping,
    Users,
    ArrowLeft,
    GridFour,
    UserSquare,
    GenderMale,
    GenderFemale,
    Tag
} from '@phosphor-icons/react';
import Chat from './Chat';
import { playJoinSound, playLeaveSound } from '../utils/soundEffects';

// Connection quality indicator
const ConnectionQuality = ({ stats }) => {
    const getQuality = () => {
        if (!stats || stats.rtt === 0) return { icon: WifiSlash, color: 'text-red-400', label: 'Disconnected' };
        if (stats.rtt < 50) return { icon: WifiHigh, color: 'text-emerald-400', label: 'Excellent' };
        if (stats.rtt < 100) return { icon: WifiHigh, color: 'text-blue-400', label: 'Good' };
        if (stats.rtt < 200) return { icon: WifiMedium, color: 'text-yellow-400', label: 'Fair' };
        return { icon: WifiLow, color: 'text-orange-400', label: 'Poor' };
    };

    const quality = getQuality();
    const Icon = quality.icon;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
            <Icon weight="fill" className={`w-4 h-4 ${quality.color}`} />
            <span className="text-xs text-white/60">{quality.label}</span>
            {stats?.rtt > 0 && (
                <span className="text-xs text-white/40 font-mono">{stats.rtt}ms</span>
            )}
        </div>
    );
};

// Peer Info Badge (Omegle-style)
const PeerInfoBadge = ({ label, value, icon: Icon, color = 'blue' }) => (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-${color}-500/20 border border-${color}-500/30 text-${color}-400 text-xs`}>
        <Icon weight="fill" className="w-3.5 h-3.5" />
        <span className="font-medium">{value || label}</span>
    </div>
);

// Video Tile Component
const VideoTile = ({ 
    stream, 
    isLocal = false, 
    userName = '', 
    peerInfo = null,
    isScreenShare = false,
    isMuted = false,
    isVideoOff = false,
    className = ''
}) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
        }
    }, [stream]);

    return (
        <div className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 ${className}`}>
            {(!stream || isVideoOff) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-2">
                        <span className="text-2xl font-bold text-white">
                            {(userName || 'U')[0].toUpperCase()}
                        </span>
                    </div>
                    <span className="text-white/60 text-sm">{userName || 'User'}</span>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isLocal}
                        className={`w-full h-full ${isScreenShare ? 'object-contain' : 'object-cover'}`}
                        style={{ transform: isLocal && !isScreenShare ? 'scaleX(-1)' : 'none' }}
                    />
                    {/* Screen share label */}
                    {isScreenShare && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-emerald-500/90 text-white text-xs font-medium flex items-center gap-1.5">
                            <Monitor weight="fill" className="w-4 h-4" />
                            Screen Sharing
                        </div>
                    )}
                </>
            )}
            
            {/* User info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{userName || (isLocal ? 'You' : 'User')}</span>
                    
                    {/* Peer info badges */}
                    {peerInfo && (
                        <div className="flex items-center gap-1.5">
                            {peerInfo.gender && (
                                <PeerInfoBadge 
                                    icon={peerInfo.gender === 'male' ? GenderMale : GenderFemale}
                                    value={peerInfo.gender}
                                    color={peerInfo.gender === 'male' ? 'blue' : 'pink'}
                                />
                            )}
                            {peerInfo.interests?.slice(0, 2).map((interest, i) => (
                                <PeerInfoBadge key={i} icon={Tag} value={interest} color="violet" />
                            ))}
                        </div>
                    )}
                    
                    {/* Status indicators */}
                    <div className="flex items-center gap-1">
                        {isMuted && (
                            <div className="p-1.5 rounded-full bg-red-500/80">
                                <MicrophoneSlash weight="fill" className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Floating reaction animation
const FloatingReaction = ({ icon: Icon, color, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const colorClasses = {
        red: 'text-red-400',
        yellow: 'text-yellow-400',
        orange: 'text-orange-400',
        purple: 'text-purple-400',
        blue: 'text-blue-400'
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

// Gallery View (Zoom-style)
const GalleryView = ({ localStream, remoteStream, localUser, remoteUser, localPeerInfo, remotePeerInfo, isScreenSharing, connectionStats }) => {
    const [layout, setLayout] = useState('auto'); // 'auto', 'grid', 'spotlight'
    
    const hasRemote = !!remoteStream;
    
    // Determine layout based on participant count
    const getLayoutClass = () => {
        if (layout === 'spotlight') return 'grid-cols-1';
        if (!hasRemote) return 'grid-cols-1';
        return 'grid-cols-1 md:grid-cols-2';
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Layout toggle */}
            <div className="absolute top-20 right-4 z-20 flex items-center gap-2">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLayout(layout === 'auto' ? 'spotlight' : 'auto')}
                    className="p-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white"
                >
                    {layout === 'spotlight' ? <GridFour weight="fill" className="w-5 h-5" /> : <UserSquare weight="fill" className="w-5 h-5" />}
                </motion.button>
            </div>

            {/* Video grid */}
            <div className={`flex-1 grid ${getLayoutClass()} gap-3 p-4`}>
                {/* Local video */}
                <VideoTile 
                    stream={localStream}
                    isLocal
                    userName={localUser}
                    peerInfo={localPeerInfo}
                    isScreenShare={isScreenSharing}
                    className={layout === 'spotlight' && hasRemote ? 'h-1/4' : 'h-full'}
                />
                
                {/* Remote video */}
                {hasRemote && (
                    <VideoTile 
                        stream={remoteStream}
                        userName={remoteUser}
                        peerInfo={remotePeerInfo}
                        className="h-full"
                    />
                )}
                
                {/* Waiting state */}
                {!hasRemote && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <Spinner weight="bold" className="w-12 h-12 animate-spin text-blue-400 mb-4 mx-auto" />
                            <p className="text-lg text-white/50">Waiting for someone to join...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
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
        cleanup,
        toggleScreenShare,
        toggleVideo,
        toggleAudio,
        isScreenSharing,
        connectionStats,
        peerConnection,
    } = useWebRTC();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const initiatorHandledRef = useRef(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [userName, setUserName] = useState(() => localStorage.getItem('echoroom_username') || '');
    const [tempName, setTempName] = useState('');
    const [isGroupCall, setIsGroupCall] = useState(false);
    const [groupPeers, setGroupPeers] = useState([]);
    const [pendingInitiatorRole, setPendingInitiatorRole] = useState(null);
    
    // Peer info (Omegle-style optional fields)
    const [localPeerInfo, setLocalPeerInfo] = useState(() => {
        const saved = localStorage.getItem('echoroom_peer_info');
        return saved ? JSON.parse(saved) : { gender: '', interests: [] };
    });
    const [remotePeerInfo, setRemotePeerInfo] = useState(null);
    const [showPeerInfoModal, setShowPeerInfoModal] = useState(!localPeerInfo.gender);
    
    const [showReactions, setShowReactions] = useState(false);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [remoteReaction, setRemoteReaction] = useState(null);

    const reactions = [
        { icon: Heart, color: 'red', name: 'heart' },
        { icon: Lightning, color: 'yellow', name: 'lightning' },
        { icon: Star, color: 'blue', name: 'star' },
        { icon: Fire, color: 'orange', name: 'fire' },
        { icon: HandsClapping, color: 'purple', name: 'clap' },
    ];

    useEffect(() => {
        if (roomId && roomId.startsWith('group-')) {
            setIsGroupCall(true);
        }
        // Reset all state when room changes
        initiatorHandledRef.current = false;
        setPendingInitiatorRole(null);
        setGroupPeers([]);
        setRemotePeerInfo(null);
        setIsMuted(false);
        setIsVideoOff(false);
    }, [roomId]);

    useEffect(() => {
        const initMedia = async () => {
            try {
                await startLocalStream();
            } catch (err) {
                console.error('Failed to start local stream:', err);
                toast.error('Please allow camera access');
            }
        };
        initMedia();
        return () => cleanup();
    }, []);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(err => {
                console.log('Local video play failed:', err);
            });
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Process initiator role - defined as callback so it can be used from multiple places
    const processInitiatorRole = useCallback(async (isInitiator) => {
        console.log('[Room] Processing initiator role:', isInitiator);
        
        if (initiatorHandledRef.current) {
            console.log('[Room] Skipping - already handled');
            return;
        }

        initiatorHandledRef.current = true;
        console.log('[Room] Creating peer connection, isInitiator:', isInitiator);
        
        const handleIceCandidate = (candidate) => {
            console.log('[Room] Sending ICE candidate');
            socket.emit('ice-candidate', { roomId, candidate });
        };
        
        createPeerConnection(handleIceCandidate);

        if (isInitiator) {
            console.log('[Room] I am initiator, creating offer...');
            try {
                const offer = await createOffer();
                console.log('[Room] Offer created, sending to room:', roomId);
                socket.emit('offer', { roomId, offer });
            } catch (err) {
                console.error('[Room] Error creating offer:', err);
                toast.error('Failed to start video call');
            }
        } else {
            console.log('[Room] I am receiver, waiting for offer...');
        }
    }, [socket, roomId, createPeerConnection, createOffer]);

    // Process initiator role when both stream is ready AND we have a pending role
    useEffect(() => {
        if (localStream && pendingInitiatorRole !== null && !initiatorHandledRef.current) {
            console.log('[Room] Processing pending initiator role:', pendingInitiatorRole);
            processInitiatorRole(pendingInitiatorRole);
            setPendingInitiatorRole(null);
        }
    }, [localStream, pendingInitiatorRole, processInitiatorRole]);

    useEffect(() => {
        if (!socket || !roomId) return;

        console.log('[Room] Setting up socket listeners for room:', roomId);

        // Define all handlers FIRST before emitting join-room
        const handleExistingPeers = async ({ peers }) => {
            console.log('[Room] Received existing peers:', peers);
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
            toast.success('Someone joined the room');
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
            toast('Someone left', { icon: <Info weight="fill" className="w-5 h-5" /> });
            playLeaveSound();
            removePeerConnection(peerId);
            setGroupPeers(prev => prev.filter(p => p.peerId !== peerId));
        };

        const handleIsInitiator = (isInitiator) => {
            console.log('[Room] Received is-initiator:', isInitiator, 'localStream:', !!localStream, 'handled:', initiatorHandledRef.current);
            
            if (isGroupCall) {
                console.log('[Room] Skipping - group call mode');
                return;
            }
            if (initiatorHandledRef.current) {
                console.log('[Room] Skipping - already handled');
                return;
            }
            
            if (!localStream) {
                console.log('[Room] Storing initiator role for later processing');
                setPendingInitiatorRole(isInitiator);
                return;
            }
            
            // Process immediately if stream is ready
            processInitiatorRole(isInitiator);
        };

        const handleOfferReceived = async ({ offer, sender }) => {
            console.log('[Room] Received offer from:', sender);
            
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
            console.log('[Room] Received answer from:', sender);
            if (isGroupCall) {
                try { await handleAnswerFromPeer(answer, sender); } catch (err) {}
            } else {
                if (!peerConnection.current) return;
                try { await handleAnswer(answer); } catch (err) {}
            }
        };

        const handleIceCandidateReceived = async ({ candidate, sender }) => {
            console.log('[Room] Received ICE candidate from:', sender);
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

        // Handle peer info update
        const handlePeerInfo = ({ peerId, info }) => {
            console.log('[Room] Received peer info:', info);
            setRemotePeerInfo(info);
        };

        const handlePeerDisconnected = () => {
            toast('Partner disconnected', { icon: '⚠️', duration: 3000 });
            playLeaveSound();
            cleanup();
            setTimeout(() => {
                navigate('/matching');
            }, 2000);
        };

        const handlePartnerLeft = () => {
            toast('Partner left the chat', { icon: '👋', duration: 2000 });
            playLeaveSound();
            cleanup();
            navigate('/matching');
        };

        // IMPORTANT: Set up ALL listeners FIRST
        socket.on('existing-peers', handleExistingPeers);
        socket.on('peer-joined', handlePeerJoined);
        socket.on('peer-left', handlePeerLeft);
        socket.on('peer-disconnected', handlePeerDisconnected);
        socket.on('partner-left', handlePartnerLeft);
        socket.on('is-initiator', handleIsInitiator);
        socket.on('offer', handleOfferReceived);
        socket.on('answer', handleAnswerReceived);
        socket.on('ice-candidate', handleIceCandidateReceived);
        socket.on('receive-reaction', handleReaction);
        socket.on('peer-info', handlePeerInfo);

        // THEN emit join-room AFTER listeners are ready
        console.log('[Room] Emitting join-room for:', roomId);
        socket.emit('join-room', { roomId, userName, peerInfo: localPeerInfo });

        playJoinSound();

        return () => {
            socket.off('existing-peers', handleExistingPeers);
            socket.off('peer-joined', handlePeerJoined);
            socket.off('peer-left', handlePeerLeft);
            socket.off('peer-disconnected', handlePeerDisconnected);
            socket.off('partner-left', handlePartnerLeft);
            socket.off('is-initiator', handleIsInitiator);
            socket.off('offer', handleOfferReceived);
            socket.off('answer', handleAnswerReceived);
            socket.off('ice-candidate', handleIceCandidateReceived);
            socket.off('receive-reaction', handleReaction);
            socket.off('peer-info', handlePeerInfo);
        };
    }, [socket, roomId, createPeerConnection, isGroupCall, localStream, userName, localPeerInfo, createOffer, handleOffer, handleAnswer, addIceCandidate, createPeerConnectionForPeer, createOfferForPeer, handleOfferFromPeer, handleAnswerFromPeer, addIceCandidateForPeer, removePeerConnection, peerConnection, cleanup, navigate]);

    const handleToggleMute = useCallback(() => {
        const isEnabled = toggleAudio();
        setIsMuted(!isEnabled);
    }, [toggleAudio]);

    const handleToggleVideo = useCallback(() => {
        const isEnabled = toggleVideo();
        setIsVideoOff(!isEnabled);
        socket.emit('toggle-video', { roomId, isVideoOff: !isEnabled });
    }, [toggleVideo, socket, roomId]);

    const resetRoomState = useCallback(() => {
        console.log('[Room] Resetting room state...');
        initiatorHandledRef.current = false;
        setPendingInitiatorRole(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setGroupPeers([]);
        setRemotePeerInfo(null);
        setRemoteReaction(null);
        setFloatingReactions([]);
    }, []);

    const handleLeaveRoom = useCallback(() => {
        console.log('[Room] Leaving room...');
        cleanup();
        socket.emit('leave-room', roomId);
        resetRoomState();
        navigate('/post-chat');
    }, [cleanup, socket, roomId, navigate, resetRoomState]);

    const handleNext = useCallback(() => {
        console.log('[Room] Next button clicked');
        cleanup();
        socket.emit('next', { roomId });
        resetRoomState();
        navigate('/matching');
    }, [cleanup, socket, roomId, navigate, resetRoomState]);

    const sendReaction = useCallback((reaction) => {
        const id = Date.now();
        setFloatingReactions(prev => [...prev, { id, ...reaction }]);
        socket.emit('send-reaction', { roomId, reaction: reaction.name });
        setShowReactions(false);
    }, [socket, roomId]);

    const handleShareRoom = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!', { icon: <CheckCircle weight="fill" className="w-5 h-5 text-emerald-400" /> });
    }, []);

    const savePeerInfo = () => {
        const info = { gender: tempGender, interests: tempInterests.filter(i => i) };
        setLocalPeerInfo(info);
        localStorage.setItem('echoroom_peer_info', JSON.stringify(info));
        setShowPeerInfoModal(false);
        // Send to peer if connected
        socket.emit('update-peer-info', { roomId, info });
    };

    // Temp state for peer info modal
    const [tempGender, setTempGender] = useState(localPeerInfo.gender || '');
    const [tempInterests, setTempInterests] = useState(localPeerInfo.interests?.length ? localPeerInfo.interests : ['', '']);

    return (
        <div className="relative flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden">
            <Toaster position="top-center" />
            
            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowExitConfirm(true)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft weight="bold" className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold"><span className="text-white">echo</span><span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">room</span></h1>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                            {isGroupCall ? <><Users weight="fill" className="w-3 h-3" /> Group</> : 'Private Room'}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <ConnectionQuality stats={connectionStats} />
                    
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPeerInfoModal(true)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <Tag weight="fill" className="w-5 h-5 text-violet-400" />
                    </motion.button>
                    
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShareRoom}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ShareNetwork weight="fill" className="w-5 h-5 text-blue-400" />
                    </motion.button>
                </div>
            </header>

            {/* Video Area - Old UI for 1-on-1, Zoom Gallery for Groups */}
            {isGroupCall ? (
                /* Zoom-style Gallery for Group Calls */
                <GalleryView 
                    localStream={localStream}
                    remoteStream={remoteStream}
                    localUser={userName || 'You'}
                    remoteUser={remotePeerInfo?.name || 'Stranger'}
                    localPeerInfo={localPeerInfo}
                    remotePeerInfo={remotePeerInfo}
                    isScreenSharing={isScreenSharing}
                    connectionStats={connectionStats}
                />
            ) : (
                /* Old UI for 1-on-1 Calls */
                <div className="relative z-10 flex-1 flex flex-col gap-3 p-3 overflow-hidden">
                    {/* Local Video - Floating */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        drag
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        dragElastic={0.1}
                        className="absolute bottom-24 right-4 z-30 w-36 h-48 md:w-44 md:h-56 bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-move"
                    >
                        {!localStream ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                                <Spinner weight="bold" className="w-8 h-8 animate-spin text-blue-400 mb-2" />
                                <span className="text-xs text-white/50">Camera...</span>
                            </div>
                        ) : (
                            <>
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <span className="text-xs font-medium text-white">{userName || 'You'}</span>
                                </div>
                            </>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                            {isMuted && (
                                <div className="p-1 rounded-lg bg-red-500/80">
                                    <MicrophoneSlash weight="fill" className="w-3 h-3 text-white" />
                                </div>
                            )}
                            {isVideoOff && (
                                <div className="p-1 rounded-lg bg-red-500/80">
                                    <VideoCameraSlash weight="fill" className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Remote Video - Full Screen */}
                    <div className="flex-1 h-full">
                        <div className="relative rounded-2xl overflow-hidden bg-neutral-900/50 border border-white/10 h-full">
                            {remoteStream ? (
                                <>
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Peer Info Overlay */}
                                    {remotePeerInfo && (
                                        <div className="absolute top-4 left-4 flex items-center gap-2">
                                            {remotePeerInfo.gender && (
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${remotePeerInfo.gender === 'male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'} text-xs font-medium`}>
                                                    {remotePeerInfo.gender === 'male' ? <GenderMale weight="fill" className="w-3.5 h-3.5" /> : <GenderFemale weight="fill" className="w-3.5 h-3.5" />}
                                                    {remotePeerInfo.gender}
                                                </div>
                                            )}
                                            {remotePeerInfo.interests?.slice(0, 2).map((interest, i) => (
                                                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium">
                                                    <Tag weight="fill" className="w-3.5 h-3.5" />
                                                    {interest}
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                                    className: `w-20 h-20`
                                                })
                                            }
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/30">
                                    <Spinner weight="bold" className="w-12 h-12 animate-spin mb-4 text-blue-400" />
                                    <p className="text-lg">Connecting...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-20 flex items-center justify-center gap-3 p-4 bg-black/40 backdrop-blur-md border-t border-white/5"
            >
                {/* Mute */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleMute}
                    className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {isMuted ? <MicrophoneSlash weight="fill" className="w-6 h-6" /> : <Microphone weight="fill" className="w-6 h-6" />}
                </motion.button>

                {/* Video */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleVideo}
                    className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {isVideoOff ? <VideoCameraSlash weight="fill" className="w-6 h-6" /> : <VideoCamera weight="fill" className="w-6 h-6" />}
                </motion.button>

                {/* Screen Share */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleScreenShare}
                    className={`p-4 rounded-2xl transition-all ${isScreenSharing ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    <Monitor weight="fill" className="w-6 h-6" />
                </motion.button>

                {/* Chat */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`p-4 rounded-2xl transition-all ${isChatOpen ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    <ChatCircle weight="fill" className="w-6 h-6" />
                </motion.button>

                {/* Reactions */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowReactions(!showReactions)}
                        className={`p-4 rounded-2xl transition-all ${showReactions ? 'bg-violet-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        <Smiley weight="fill" className="w-6 h-6" />
                    </motion.button>
                    
                    <AnimatePresence>
                        {showReactions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex gap-2 p-3 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10"
                            >
                                {reactions.map(reaction => (
                                    <motion.button
                                        key={reaction.name}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => sendReaction(reaction)}
                                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <reaction.icon weight="fill" className="w-6 h-6" />
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Next/Skip */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                    <ArrowClockwise weight="bold" className="w-6 h-6" />
                </motion.button>

                {/* End Call */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowExitConfirm(true)}
                    className="p-4 rounded-2xl bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30"
                >
                    <PhoneDisconnect weight="fill" className="w-6 h-6" />
                </motion.button>
            </motion.div>

            {/* Peer Info Modal (Omegle-style) */}
            <AnimatePresence>
                {showPeerInfoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">About You</h3>
                            <p className="text-white/50 text-sm mb-6">Share optional info to find better matches (like Omegle)</p>
                            
                            <div className="space-y-4 mb-6">
                                {/* Gender */}
                                <div>
                                    <label className="text-sm text-white/60 mb-2 block">Gender</label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setTempGender('male')}
                                            className={`flex-1 py-3 rounded-xl border transition-all ${tempGender === 'male' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-white/60'}`}
                                        >
                                            <GenderMale weight="bold" className="w-5 h-5 mx-auto" />
                                        </button>
                                        <button
                                            onClick={() => setTempGender('female')}
                                            className={`flex-1 py-3 rounded-xl border transition-all ${tempGender === 'female' ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-white/5 border-white/10 text-white/60'}`}
                                        >
                                            <GenderFemale weight="bold" className="w-5 h-5 mx-auto" />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Interests */}
                                <div>
                                    <label className="text-sm text-white/60 mb-2 block">Interests</label>
                                    {tempInterests.map((interest, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            value={interest}
                                            onChange={(e) => {
                                                const newInterests = [...tempInterests];
                                                newInterests[i] = e.target.value;
                                                setTempInterests(newInterests);
                                            }}
                                            placeholder={`Interest ${i + 1}`}
                                            className="w-full mb-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPeerInfoModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={savePeerInfo}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-medium"
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
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Leave Room?</h3>
                            <p className="text-white/50 mb-6">Are you sure you want to end this call?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                                >
                                    Stay
                                </button>
                                <button
                                    onClick={handleLeaveRoom}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                                >
                                    Leave
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
        </div>
    );
};

export default Room;
