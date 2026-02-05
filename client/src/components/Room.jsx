import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { AnimatePresence, motion } from 'framer-motion';
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
    GenderMale,
    GenderFemale,
    Tag,
    CornersOut,
    CornersIn,
    WifiHigh,
    WifiMedium,
    WifiLow,
    WifiSlash,
    Warning,
    DotsThree
} from '@phosphor-icons/react';
import Chat from './Chat';
import { playJoinSound, playLeaveSound } from '../utils/soundEffects';

// Connection quality indicator with enhanced styling
const ConnectionQuality = ({ stats }) => {
    const getQuality = () => {
        if (!stats || stats.rtt === 0) return { icon: WifiSlash, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', label: 'Disconnected' };
        if (stats.rtt < 50) return { icon: WifiHigh, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', label: 'Excellent' };
        if (stats.rtt < 100) return { icon: WifiHigh, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', label: 'Good' };
        if (stats.rtt < 200) return { icon: WifiMedium, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', label: 'Fair' };
        return { icon: WifiLow, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', label: 'Poor' };
    };

    const quality = getQuality();
    const Icon = quality.icon;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${quality.bg} backdrop-blur-md border ${quality.border} transition-all duration-300 hover:scale-105`}>
            <Icon weight="fill" className={`w-4 h-4 ${quality.color}`} />
            <span className={`text-xs font-medium ${quality.color}`}>{quality.label}</span>
            {stats?.rtt > 0 && (
                <span className="text-xs text-white/50 font-mono">{stats.rtt}ms</span>
            )}
        </div>
    );
};

// Enhanced Video Tile Component
const VideoTile = ({ 
    stream, 
    isLocal = false, 
    userName = '', 
    peerInfo = null,
    isScreenShare = false,
    isMuted = false,
    isVideoOff = false,
    className = '',
    showOverlay = true
}) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
        }
    }, [stream]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className={`relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-2xl ${className}`}
        >
            {(!stream || isVideoOff) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800/80 to-slate-900/80">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-2xl shadow-purple-500/30"
                    >
                        <span className="text-4xl font-bold text-white">
                            {(userName || 'U')[0].toUpperCase()}
                        </span>
                    </motion.div>
                    <span className="text-white/80 text-base font-medium">{userName || 'User'}</span>
                    {isVideoOff && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-400 text-sm border border-red-500/30"
                        >
                            <VideoCameraSlash weight="fill" className="w-4 h-4" />
                            Camera Off
                        </motion.div>
                    )}
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
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-4 left-4 px-4 py-2 rounded-xl bg-emerald-500/90 backdrop-blur-md text-white text-sm font-semibold flex items-center gap-2 shadow-lg border border-emerald-400/30"
                        >
                            <Monitor weight="fill" className="w-4 h-4" />
                            Screen Sharing
                        </motion.div>
                    )}
                </>
            )}
            
            {/* User info overlay */}
            {showOverlay && (
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-base font-semibold text-white">{userName || (isLocal ? 'You' : 'User')}</span>
                            
                            {/* Peer info badges */}
                            {peerInfo && (
                                <div className="hidden sm:flex items-center gap-2">
                                    {peerInfo.gender && (
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            peerInfo.gender === 'male' 
                                                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' 
                                                : 'bg-pink-500/30 text-pink-300 border border-pink-500/40'
                                        }`}>
                                            {peerInfo.gender === 'male' ? 'Male' : 'Female'}
                                        </span>
                                    )}
                                    {peerInfo.interests?.slice(0, 2).map((interest, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/30 text-violet-300 border border-violet-500/40">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Status indicators */}
                        {isMuted && (
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="p-2.5 rounded-full bg-red-500/90 shadow-lg"
                            >
                                <MicrophoneSlash weight="fill" className="w-4 h-4 text-white" />
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// Floating reaction animation
const FloatingReaction = ({ icon: Icon, color, onComplete, offset }) => {
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
        <div
            className="fixed bottom-32 left-1/2 pointer-events-none z-[100] animate-float-up"
            style={{ marginLeft: `${offset}px` }}
        >
            <Icon weight="fill" className={`w-14 h-14 md:w-16 md:h-16 ${colorClasses[color]}`} />
        </div>
    );
};

// Gallery View for Group Calls
const GalleryView = ({ localStream, remoteStream, localUser, remoteUser, localPeerInfo, remotePeerInfo, isScreenSharing, connectionStats, isVideoOff }) => {
    const [layout, setLayout] = useState('grid');
    
    const hasRemote = !!remoteStream;
    
    return (
        <div className="flex-1 flex flex-col h-full p-4 gap-4">
            {/* Layout toggle */}
            <div className="absolute top-20 right-4 z-20">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLayout(layout === 'grid' ? 'spotlight' : 'grid')}
                    className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white shadow-lg"
                >
                    {layout === 'spotlight' ? <Users weight="fill" className="w-5 h-5" /> : <CornersOut weight="fill" className="w-5 h-5" />}
                </motion.button>
            </div>

            {/* Video grid */}
            <div className={`flex-1 grid ${layout === 'spotlight' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                <VideoTile 
                    stream={localStream}
                    isLocal
                    userName={localUser}
                    peerInfo={localPeerInfo}
                    isScreenShare={isScreenSharing}
                    isVideoOff={isVideoOff}
                    className="h-full"
                />
                
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
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="text-center bg-black/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Spinner weight="bold" className="w-12 h-12 text-blue-400 mb-4 mx-auto" />
                            </motion.div>
                            <p className="text-lg text-white/60 font-medium">Waiting for someone to join...</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// Control Button Component
const ControlButton = ({ onClick, active, activeColor, children, label, disabled = false }) => (
    <div className="flex flex-col items-center gap-1.5">
        <motion.button
            whileHover={disabled ? {} : { scale: 1.1 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
            onClick={onClick}
            disabled={disabled}
            className={`
                relative p-4 rounded-2xl transition-all duration-300 shadow-lg
                ${disabled 
                    ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                    : active 
                        ? `${activeColor} text-white shadow-xl` 
                        : 'bg-white/10 text-white hover:bg-white/20 hover:shadow-xl'
                }
            `}
        >
            {children}
        </motion.button>
        <span className="text-[10px] text-white/50 font-medium">{label}</span>
    </div>
);

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocket();
    const {
        localStream,
        remoteStream,
        setRemoteStream,
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
        peerConnections,
    } = useWebRTC();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const initiatorHandledRef = useRef(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [userName] = useState(() => {
        const navName = location.state?.userName;
        if (navName) {
            localStorage.setItem('echoroom_username', navName);
            return navName;
        }
        return localStorage.getItem('echoroom_username') || '';
    });
    const [isGroupCall, setIsGroupCall] = useState(false);
    const [groupPeers, setGroupPeers] = useState([]);
    const [pendingInitiatorRole, setPendingInitiatorRole] = useState(null);
    
    const [localPeerInfo, setLocalPeerInfo] = useState(() => {
        const navPeerInfo = location.state?.peerInfo;
        if (navPeerInfo) {
            localStorage.setItem('echoroom_peer_info', JSON.stringify(navPeerInfo));
            return navPeerInfo;
        }
        const saved = localStorage.getItem('echoroom_peer_info');
        return saved ? JSON.parse(saved) : { gender: '', interests: [], name: '' };
    });
    const [remotePeerInfo, setRemotePeerInfo] = useState(null);
    const [showPeerInfoModal, setShowPeerInfoModal] = useState(!localPeerInfo.gender);
    
    const [showReactions, setShowReactions] = useState(false);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [remoteReaction, setRemoteReaction] = useState(null);
    
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenControls, setShowFullscreenControls] = useState(false);
    const fullscreenTimeoutRef = useRef(null);
    const connectionTimeoutRef = useRef(null);

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
        initiatorHandledRef.current = false;
        setPendingInitiatorRole(null);
        setGroupPeers([]);
        setRemotePeerInfo(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setRemoteStream(null);
        
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
        
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        
        connectionTimeoutRef.current = setTimeout(() => {
            if (!remoteStream && !isGroupCall) {
                console.log('[Room] Connection timeout - no remote stream after 15s');
            }
        }, 15000);
        
        return () => {
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
            }
        };
    }, [roomId, setRemoteStream, isGroupCall]);

    // Ref to track if media has been initialized
    const mediaInitializedRef = useRef(false);

    useEffect(() => {
        const savedUserName = localStorage.getItem('echoroom_username');
        const stateUserName = location.state?.userName;
        console.log('[Room] Checking username - saved:', savedUserName, 'state:', stateUserName);
        
        // Use state username first, then saved, then default
        const effectiveUserName = stateUserName || savedUserName;
        if (effectiveUserName) {
            localStorage.setItem('echoroom_username', effectiveUserName);
        }
        
        // Only initialize media once
        if (mediaInitializedRef.current) {
            console.log('[Room] Media already initialized, skipping');
            return;
        }
        
        console.log('[Room] Username check passed, initializing media');
        mediaInitializedRef.current = true;
        
        const initMedia = async () => {
            try {
                await startLocalStream();
                console.log('[Room] Media initialized successfully');
            } catch (err) {
                console.error('[Room] Media initialization failed:', err);
                toast.error('Please allow camera access');
                mediaInitializedRef.current = false;
            }
        };
        initMedia();
    }, []); // Empty dependency array - only run once on mount

    // Cleanup effect - runs only on unmount
    useEffect(() => {
        return () => {
            console.log('[Room] Component unmounting, cleaning up');
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(() => {});
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current) {
            if (remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play().catch(() => {});
            } else {
                remoteVideoRef.current.srcObject = null;
            }
        }
    }, [remoteStream]);

    const processInitiatorRole = useCallback(async (isInitiator) => {
        if (initiatorHandledRef.current) {
            console.log('[Room] Initiator role already handled, skipping');
            return;
        }

        initiatorHandledRef.current = true;
        console.log('[Room] Processing initiator role:', isInitiator);
        
        const handleIceCandidate = (candidate) => {
            if (candidate && socket) {
                socket.emit('ice-candidate', { roomId, candidate });
            }
        };
        
        createPeerConnection(handleIceCandidate);

        if (isInitiator) {
            try {
                console.log('[Room] Creating offer as initiator');
                const offer = await createOffer();
                socket.emit('offer', { roomId, offer });
                console.log('[Room] Offer sent');
            } catch (err) {
                console.error('[Room] Failed to create offer:', err);
                toast.error('Failed to start video call');
            }
        }
    }, [socket, roomId, createPeerConnection, createOffer]);

    useEffect(() => {
        if (localStream && pendingInitiatorRole !== null && !initiatorHandledRef.current) {
            console.log('[Room] Stream ready, processing pending initiator role');
            processInitiatorRole(pendingInitiatorRole);
            setPendingInitiatorRole(null);
        }
    }, [localStream, pendingInitiatorRole, processInitiatorRole]);

    useEffect(() => {
        if (remoteStream) {
            console.log('[Room] Remote stream received');
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
            }
        }
    }, [remoteStream]);

    // Use refs to avoid dependency changes causing effect re-runs
    const localStreamRef = useRef(localStream);
    const processInitiatorRoleRef = useRef(processInitiatorRole);
    const createPeerConnectionRef = useRef(createPeerConnection);
    const handleOfferRef = useRef(handleOffer);
    const handleAnswerRef = useRef(handleAnswer);
    const addIceCandidateRef = useRef(addIceCandidate);
    const isGroupCallRef = useRef(isGroupCall);
    
    // Update refs when values change
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
    useEffect(() => { processInitiatorRoleRef.current = processInitiatorRole; }, [processInitiatorRole]);
    useEffect(() => { createPeerConnectionRef.current = createPeerConnection; }, [createPeerConnection]);
    useEffect(() => { handleOfferRef.current = handleOffer; }, [handleOffer]);
    useEffect(() => { handleAnswerRef.current = handleAnswer; }, [handleAnswer]);
    useEffect(() => { addIceCandidateRef.current = addIceCandidate; }, [addIceCandidate]);
    useEffect(() => { isGroupCallRef.current = isGroupCall; }, [isGroupCall]);

    useEffect(() => {
        if (!socket || !roomId) {
            console.log('[Room] Waiting for socket and roomId...', { socket: !!socket, roomId });
            return;
        }

        console.log('[Room] Setting up socket event handlers for room:', roomId);
        
        // Emit join-room to notify server we're ready
        socket.emit('join-room', { roomId });

        const handleIsInitiator = (isInitiator) => {
            console.log('[Room] Received is-initiator:', isInitiator);
            
            if (isGroupCallRef.current) {
                console.log('[Room] Skipping initiator role in group call');
                return;
            }
            
            if (initiatorHandledRef.current) {
                console.log('[Room] Already handled initiator role');
                return;
            }
            
            if (!localStreamRef.current) {
                console.log('[Room] Stream not ready, queuing initiator role');
                setPendingInitiatorRole(isInitiator);
                return;
            }
            
            console.log('[Room] Processing initiator role immediately');
            processInitiatorRoleRef.current(isInitiator);
        };

        const handleOfferReceived = async ({ offer, sender }) => {
            console.log('[Room] Received offer from:', sender || 'peer');
            try {
                if (!peerConnection.current) {
                    console.log('[Room] Creating peer connection for offer');
                    const handleIceCandidate = (candidate) => {
                        if (candidate && socket) {
                            console.log('[Room] Sending ICE candidate');
                            socket.emit('ice-candidate', { roomId, candidate });
                        }
                    };
                    createPeerConnectionRef.current(handleIceCandidate);
                }
                console.log('[Room] Handling offer...');
                const answer = await handleOfferRef.current(offer);
                console.log('[Room] Sending answer...');
                socket.emit('answer', { roomId, answer });
                initiatorHandledRef.current = true;
                console.log('[Room] Answer sent successfully');
            } catch (err) {
                console.error('[Room] Error handling offer:', err);
                toast.error('Connection failed');
            }
        };

        const handleAnswerReceived = async ({ answer, sender }) => {
            console.log('[Room] Received answer from:', sender || 'peer');
            try {
                console.log('[Room] Processing answer...');
                await handleAnswerRef.current(answer);
                console.log('[Room] Answer processed successfully');
            } catch (err) {
                console.error('[Room] Error handling answer:', err);
            }
        };

        const handleIceCandidateReceived = async ({ candidate, sender }) => {
            console.log('[Room] Received ICE candidate from:', sender || 'peer');
            if (!candidate) {
                console.log('[Room] Received null ICE candidate, ignoring');
                return;
            }
            try {
                console.log('[Room] Adding ICE candidate...');
                await addIceCandidateRef.current(candidate);
                console.log('[Room] ICE candidate added successfully');
            } catch (err) {
                console.error('[Room] Error adding ICE candidate:', err);
            }
        };

        console.log('[Room] Registering socket event handlers');
        socket.on('is-initiator', handleIsInitiator);
        socket.on('offer', handleOfferReceived);
        socket.on('answer', handleAnswerReceived);
        socket.on('ice-candidate', handleIceCandidateReceived);

        // Request initiator status in case we missed it
        const requestInitiatorStatus = () => {
            if (!initiatorHandledRef.current) {
                console.log('[Room] Requesting initiator status...');
                socket.emit('request-initiator-status', { roomId });
            }
        };
        
        // Request status after a short delay to ensure handlers are registered
        const statusTimeout = setTimeout(requestInitiatorStatus, 500);

        return () => {
            console.log('[Room] Cleaning up socket event handlers');
            clearTimeout(statusTimeout);
            socket.off('is-initiator', handleIsInitiator);
            socket.off('offer', handleOfferReceived);
            socket.off('answer', handleAnswerReceived);
            socket.off('ice-candidate', handleIceCandidateReceived);
        };
    }, [socket, roomId]); // Only re-run when socket or roomId changes

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
        initiatorHandledRef.current = false;
        setPendingInitiatorRole(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setGroupPeers([]);
        setRemotePeerInfo(null);
        setRemoteReaction(null);
        setFloatingReactions([]);
        setIsFullscreen(false);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
                setShowFullscreenControls(true);
                if (fullscreenTimeoutRef.current) clearTimeout(fullscreenTimeoutRef.current);
                fullscreenTimeoutRef.current = setTimeout(() => {
                    setShowFullscreenControls(false);
                }, 3000);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
                setShowFullscreenControls(false);
            }
        } catch {
            toast.error('Fullscreen not supported');
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            if (!document.fullscreenElement) {
                setShowFullscreenControls(false);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        const handleMouseMove = () => {
            if (document.fullscreenElement) {
                setShowFullscreenControls(true);
                if (fullscreenTimeoutRef.current) clearTimeout(fullscreenTimeoutRef.current);
                fullscreenTimeoutRef.current = setTimeout(() => {
                    setShowFullscreenControls(false);
                }, 3000);
            }
        };
        document.addEventListener('mousemove', handleMouseMove);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const handleLeaveRoom = useCallback(() => {
        cleanup();
        socket.emit('leave-room', roomId);
        resetRoomState();
        navigate('/post-chat');
    }, [cleanup, socket, roomId, navigate, resetRoomState]);

    const handleNext = useCallback(() => {
        cleanup();
        socket.emit('next', { roomId });
        resetRoomState();
        navigate('/matching');
    }, [cleanup, socket, roomId, navigate, resetRoomState]);

    const sendReaction = useCallback((reaction) => {
        const id = `${Date.now()}-${Math.random()}`;
        const offset = (Math.random() - 0.5) * 100;
        setFloatingReactions(prev => [...prev, { id, offset, ...reaction }]);
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
        socket.emit('update-peer-info', { roomId, info });
    };

    const [tempGender, setTempGender] = useState(localPeerInfo.gender || '');
    const [tempInterests, setTempInterests] = useState(localPeerInfo.interests?.length ? localPeerInfo.interests : ['', '']);

    return (
        <div className="relative flex flex-col h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    color: 'white'
                }
            }} />
            
            {/* Enhanced Header */}
            {!isFullscreen && (
                <motion.header 
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    className="relative z-50 flex items-center justify-between px-4 md:px-6 py-4 bg-black/30 backdrop-blur-xl border-b border-white/5"
                >
                    <div className="flex items-center gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowExitConfirm(true)}
                            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                        >
                            <ArrowLeft weight="bold" className="w-5 h-5" />
                        </motion.button>
                        <div>
                            <h1 className="text-xl font-bold">
                                <span className="text-white">echo</span>
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">room</span>
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-white/50">
                                {isGroupCall ? (
                                    <><Users weight="fill" className="w-3.5 h-3.5" /> Group Call</>
                                ) : (
                                    <><WifiHigh weight="fill" className="w-3.5 h-3.5" /> Private Room</>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-3">
                        <ConnectionQuality stats={connectionStats} />
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNext}
                            className="hidden sm:flex p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 transition-all border border-emerald-500/30"
                            title="Next person"
                        >
                            <ArrowClockwise weight="bold" className="w-5 h-5 text-emerald-400" />
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowPeerInfoModal(true)}
                            className="hidden sm:flex p-3 rounded-2xl bg-violet-500/20 hover:bg-violet-500/30 transition-all border border-violet-500/30"
                        >
                            <Tag weight="fill" className="w-5 h-5 text-violet-400" />
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleShareRoom}
                            className="p-3 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 transition-all border border-blue-500/30"
                        >
                            <ShareNetwork weight="fill" className="w-5 h-5 text-blue-400" />
                        </motion.button>
                    </div>
                </motion.header>
            )}

            {/* Main Video Area */}
            <div className="flex-1 relative overflow-hidden">
                {isGroupCall ? (
                    <GalleryView 
                        localStream={localStream}
                        remoteStream={remoteStream}
                        localUser={userName || 'You'}
                        remoteUser={remotePeerInfo?.name || 'Stranger'}
                        localPeerInfo={localPeerInfo}
                        remotePeerInfo={remotePeerInfo}
                        isScreenSharing={isScreenSharing}
                        connectionStats={connectionStats}
                        isVideoOff={isVideoOff}
                    />
                ) : (
                    <div className="relative h-full w-full p-4 md:p-6">
                        {/* Remote Video */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="relative h-full w-full rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-2xl"
                        >
                            {remoteStream ? (
                                <>
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Remote Peer Info Overlay */}
                                    {remotePeerInfo && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-6 left-6 right-6 flex items-start justify-between pointer-events-none"
                                        >
                                            <div className="space-y-3">
                                                <div className="bg-black/50 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10">
                                                    <span className="text-xl font-bold text-white">{remotePeerInfo.name || 'Anonymous'}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {remotePeerInfo.gender && (
                                                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm ${
                                                            remotePeerInfo.gender === 'male' 
                                                                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' 
                                                                : 'bg-pink-500/30 text-pink-300 border border-pink-500/40'
                                                        }`}>
                                                            {remotePeerInfo.gender === 'male' ? <GenderMale weight="fill" className="w-4 h-4" /> : <GenderFemale weight="fill" className="w-4 h-4" />}
                                                            {remotePeerInfo.gender}
                                                        </span>
                                                    )}
                                                    {remotePeerInfo.interests?.slice(0, 3).map((interest, i) => (
                                                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-violet-500/30 text-violet-300 border border-violet-500/40 backdrop-blur-sm">
                                                            <Tag weight="fill" className="w-4 h-4" />
                                                            {interest}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                    
                                    {/* Remote Reaction */}
                                    {remoteReaction && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 2.5, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                        >
                                            {React.createElement(reactions.find(r => r.name === remoteReaction)?.icon, {
                                                weight: 'fill',
                                                className: 'w-20 h-20'
                                            })}
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="mb-6"
                                    >
                                        <Spinner weight="bold" className="w-16 h-16 text-blue-400" />
                                    </motion.div>
                                    <p className="text-xl text-white/60 font-medium">Connecting...</p>
                                    <p className="text-sm text-white/40 mt-2">Waiting for peer to join</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Local Video - Picture in Picture */}
                        {!isVideoOff && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8, x: 100 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                                drag
                                dragConstraints={{ left: -500, right: 50, top: -400, bottom: 50 }}
                                dragElastic={0.1}
                                className="absolute z-30 bottom-24 right-4 md:bottom-28 md:right-6 w-36 h-48 md:w-48 md:h-64 bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-move"
                            >
                                {!localStream ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                                        <Spinner weight="bold" className="w-8 h-8 animate-spin text-blue-400 mb-2" />
                                        <span className="text-xs text-white/50">Starting camera...</span>
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
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <span className="text-xs font-semibold text-white">{userName || 'You'}</span>
                                        </div>
                                        {isMuted && (
                                            <div className="absolute top-2 right-2 p-2 rounded-full bg-red-500/90">
                                                <MicrophoneSlash weight="fill" className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </div>
                )}
            </div>

            {/* Enhanced Controls */}
            <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className={`relative z-50 ${isFullscreen ? 'fixed bottom-0 left-0 right-0' : ''}`}
            >
                <div className={`
                    flex items-center justify-center gap-3 md:gap-6 p-4 md:p-6
                    ${isFullscreen 
                        ? 'bg-gradient-to-t from-black/95 via-black/60 to-transparent' 
                        : 'bg-black/40 backdrop-blur-xl border-t border-white/5'
                    }
                `}>
                    <ControlButton 
                        onClick={handleToggleMute} 
                        active={isMuted} 
                        activeColor="bg-red-500"
                        label={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <MicrophoneSlash weight="fill" className="w-6 h-6" /> : <Microphone weight="fill" className="w-6 h-6" />}
                    </ControlButton>

                    <ControlButton 
                        onClick={handleToggleVideo} 
                        active={isVideoOff} 
                        activeColor="bg-red-500"
                        label={isVideoOff ? 'Show Video' : 'Hide Video'}
                    >
                        {isVideoOff ? <VideoCameraSlash weight="fill" className="w-6 h-6" /> : <VideoCamera weight="fill" className="w-6 h-6" />}
                    </ControlButton>

                    {/* Screen Share - Desktop only */}
                    <div className="hidden md:block">
                        <ControlButton 
                            onClick={toggleScreenShare} 
                            active={isScreenSharing} 
                            activeColor="bg-emerald-500"
                            label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
                        >
                            <Monitor weight="fill" className="w-6 h-6" />
                        </ControlButton>
                    </div>

                    {/* Chat */}
                    <ControlButton 
                        onClick={() => setIsChatOpen(!isChatOpen)} 
                        active={isChatOpen} 
                        activeColor="bg-blue-500"
                        label="Chat"
                    >
                        <ChatCircle weight="fill" className="w-6 h-6" />
                    </ControlButton>

                    {/* Reactions */}
                    <div className="relative">
                        <ControlButton 
                            onClick={() => setShowReactions(!showReactions)} 
                            active={showReactions} 
                            activeColor="bg-violet-500"
                            label="React"
                        >
                            <Smiley weight="fill" className="w-6 h-6" />
                        </ControlButton>
                        
                        <AnimatePresence>
                            {showReactions && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex gap-2 p-3 bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl"
                                >
                                    {reactions.map(reaction => (
                                        <motion.button
                                            key={reaction.name}
                                            whileHover={{ scale: 1.2, y: -5 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => sendReaction(reaction)}
                                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                                        >
                                            <reaction.icon weight="fill" className="w-7 h-7" />
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Fullscreen */}
                    <ControlButton 
                        onClick={toggleFullscreen} 
                        active={isFullscreen} 
                        activeColor="bg-slate-600"
                        label={isFullscreen ? 'Exit Full' : 'Fullscreen'}
                    >
                        {isFullscreen ? <CornersIn weight="fill" className="w-6 h-6" /> : <CornersOut weight="fill" className="w-6 h-6" />}
                    </ControlButton>

                    {/* End Call */}
                    <ControlButton 
                        onClick={() => setShowExitConfirm(true)} 
                        active={true}
                        activeColor="bg-red-600 hover:bg-red-700"
                        label="End"
                    >
                        <PhoneDisconnect weight="fill" className="w-6 h-6" />
                    </ControlButton>
                </div>
            </motion.div>

            {/* Chat Sidebar */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute top-16 right-0 bottom-0 w-full md:w-96 z-40 bg-black/60 backdrop-blur-2xl border-l border-white/10"
                    >
                        <Chat roomId={roomId} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userName={userName} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Reactions */}
            <AnimatePresence>
                {floatingReactions.map(({ id, icon, color, offset }) => (
                    <FloatingReaction
                        key={id}
                        icon={icon}
                        color={color}
                        offset={offset}
                        onComplete={() => setFloatingReactions(prev => prev.filter(r => r.id !== id))}
                    />
                ))}
            </AnimatePresence>

            {/* Exit Confirmation Modal */}
            <AnimatePresence>
                {showExitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900/95 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <Warning weight="fill" className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Leave Room?</h3>
                            <p className="text-white/60 mb-6">Are you sure you want to end this call?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
                                >
                                    Stay
                                </button>
                                <button
                                    onClick={handleLeaveRoom}
                                    className="flex-1 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all"
                                >
                                    Leave
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Peer Info Modal */}
            <AnimatePresence>
                {showPeerInfoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900/95 border border-white/10 rounded-3xl p-8 max-w-md w-full"
                        >
                            <h3 className="text-2xl font-bold text-white mb-2">About You</h3>
                            <p className="text-white/50 text-sm mb-6">Share optional info to find better matches</p>
                            
                            <div className="space-y-5 mb-6">
                                {/* Gender */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-3">Gender</label>
                                    <div className="flex gap-3">
                                        {['male', 'female'].map(gender => (
                                            <button
                                                key={gender}
                                                onClick={() => setTempGender(gender)}
                                                className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                                                    tempGender === gender 
                                                        ? 'bg-blue-500 border-blue-500 text-white' 
                                                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                                }`}
                                            >
                                                {gender === 'male' ? 'Male' : 'Female'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Interests */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-3">Interests (optional)</label>
                                    <div className="space-y-2">
                                        {tempInterests.map((interest, idx) => (
                                            <input
                                                key={idx}
                                                type="text"
                                                value={interest}
                                                onChange={(e) => {
                                                    const newInterests = [...tempInterests];
                                                    newInterests[idx] = e.target.value;
                                                    setTempInterests(newInterests);
                                                }}
                                                placeholder={`Interest ${idx + 1}`}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPeerInfoModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={savePeerInfo}
                                    className="flex-1 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Room;
