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
    Flag,
    ChatCircle,
    Monitor,
    SkipForward,
    ArrowClockwise,
    Spinner,
    ArrowsOutSimple,
    ArrowsInSimple,
    Heart,
    ThumbsUp,
    Smiley,
    Fire,
    HandsClapping,
    ShareNetwork,
    Copy,
    UserPlus,
    X,
    Gear,
    WifiHigh,
    WifiMedium,
    WifiLow,
    WifiSlash,
    CheckCircle,
    Warning,
    Info
} from '@phosphor-icons/react';
import PanicButton from './safety/PanicButton';
import ReportModal from './safety/ReportModal';
import Chat from './Chat';
import { playJoinSound, playLeaveSound } from '../utils/soundEffects';
import PermissionError from './PermissionError';

// Connection quality indicator component
const ConnectionQuality = ({ stats }) => {
    const getQuality = () => {
        if (!stats || stats.rtt === 0) return { icon: WifiSlash, color: 'text-red-400', label: 'Disconnected' };
        if (stats.rtt < 50) return { icon: WifiHigh, color: 'text-green-400', label: 'Excellent' };
        if (stats.rtt < 100) return { icon: WifiHigh, color: 'text-cyan-400', label: 'Good' };
        if (stats.rtt < 200) return { icon: WifiMedium, color: 'text-yellow-400', label: 'Fair' };
        return { icon: WifiLow, color: 'text-orange-400', label: 'Poor' };
    };

    const quality = getQuality();
    const Icon = quality.icon;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
            <Icon weight="fill" className={`w-4 h-4 ${quality.color}`} />
            <span className="text-xs text-white/70">{quality.label}</span>
            {stats?.rtt > 0 && (
                <span className="text-xs text-white/40">{stats.rtt}ms</span>
            )}
        </div>
    );
};

// Premium reaction component
const ReactionButton = ({ icon: Icon, color, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={`p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-${color}-500/50 transition-all`}
    >
        <Icon weight="fill" className={`w-6 h-6 text-${color}-400`} />
    </motion.button>
);

// Floating reaction animation
const FloatingReaction = ({ icon: Icon, color, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -200, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute bottom-32 left-1/2 pointer-events-none z-40"
        >
            <Icon weight="fill" className={`w-16 h-16 text-${color}-400`} />
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
        isScreenSharing,
        connectionStats,
        connectionState
    } = useWebRTC();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteVideoRefs = useRef(new Map());
    const initiatorHandledRef = useRef(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [remoteVideoOff, setRemoteVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    
    // Group call state
    const [isGroupCall, setIsGroupCall] = useState(false);
    const [groupPeers, setGroupPeers] = useState([]);
    const [fullscreenPeer, setFullscreenPeer] = useState(null);
    
    // Reactions state
    const [showReactions, setShowReactions] = useState(false);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [remoteReaction, setRemoteReaction] = useState(null);
    
    // User name state
    const [userName, setUserName] = useState(() => localStorage.getItem('echoroom_username') || '');
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempName, setTempName] = useState('');
    
    // Reconnection state
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeoutRef = useRef(null);
    
    // Local stream ready state and ref for reliable access
    const [localStreamReady, setLocalStreamReady] = useState(false);
    const localStreamRef = useRef(null);
    const pendingInitiatorRef = useRef(null);
    const streamWaitTimeoutRef = useRef(null);

    const preferences = location.state || {};

    // Check if group room
    useEffect(() => {
        if (roomId && roomId.startsWith('group-')) {
            setIsGroupCall(true);
        } else {
            setIsGroupCall(false);
        }
        initiatorHandledRef.current = false;
        
        return () => {
            initiatorHandledRef.current = false;
        };
    }, [roomId]);

    // Initialize local media stream
    useEffect(() => {
        let mounted = true;
        
        const initMedia = async () => {
            try {
                console.log('[Room] Initializing local media...');
                const stream = await startLocalStream();
                
                if (!mounted) return;
                
                localStreamRef.current = stream;
                setLocalStreamReady(true);
                setPermissionError(null);
                console.log('[Room] Local media initialized successfully');
            } catch (err) {
                if (!mounted) return;
                
                console.error('[Room] Failed to start local stream:', err);
                if (err.type === 'permission') {
                    setPermissionError(err);
                } else {
                    toast.error(err.message || 'Failed to access camera/microphone');
                }
            }
        };
        initMedia();

        return () => {
            mounted = false;
            console.log('[Room] Cleaning up on unmount...');
            localStreamRef.current = null;
            setLocalStreamReady(false);
            pendingInitiatorRef.current = null;
            if (streamWaitTimeoutRef.current) {
                clearTimeout(streamWaitTimeoutRef.current);
            }
            cleanup();
        };
    }, []);

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            console.log('[Room] Attaching local stream to video element');
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Process pending initiator when local stream becomes ready
    useEffect(() => {
        if (localStreamReady && pendingInitiatorRef.current !== null && socket && roomId) {
            console.log('[Room] Stream ready, processing pending initiator');
            
            const processPending = async () => {
                const isInitiator = pendingInitiatorRef.current;
                if (isInitiator === null || !localStreamRef.current) return;
                
                console.log('[Room] Processing initiator:', isInitiator);
                pendingInitiatorRef.current = null;
                
                if (streamWaitTimeoutRef.current) {
                    clearTimeout(streamWaitTimeoutRef.current);
                    streamWaitTimeoutRef.current = null;
                }
                
                initiatorHandledRef.current = true;
                
                const handleIceCandidate = (candidate) => {
                    socket.emit('ice-candidate', { roomId, candidate });
                };

                createPeerConnection(handleIceCandidate);

                if (isInitiator) {
                    try {
                        console.log('[Room] Creating offer as initiator');
                        const offer = await createOffer();
                        socket.emit('offer', { roomId, offer });
                    } catch (err) {
                        console.error('[Room] Error creating offer:', err);
                        initiatorHandledRef.current = false;
                        toast.error('Connection failed. Please try again.');
                    }
                }
            };
            
            processPending();
        }
    }, [localStreamReady, socket, roomId, createPeerConnection, createOffer]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            console.log('[Room] Attaching remote stream:', remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(err => {
                console.error('[Room] Error playing remote video:', err);
            });
        }
    }, [remoteStream]);

    // Save username
    const saveUserName = useCallback((name) => {
        const trimmedName = name.trim();
        if (trimmedName) {
            setUserName(trimmedName);
            localStorage.setItem('echoroom_username', trimmedName);
            setShowNameModal(false);
            toast.success(`Name set to "${trimmedName}"`);
            
            if (socket && roomId) {
                socket.emit('user-name-update', { roomId, userName: trimmedName });
            }
        }
    }, [socket, roomId]);

    // Reconnection logic
    const attemptReconnect = useCallback(async () => {
        if (reconnectAttempts >= maxReconnectAttempts) {
            toast.error('Failed to reconnect after multiple attempts');
            setIsReconnecting(false);
            return;
        }

        setIsReconnecting(true);
        setReconnectAttempts(prev => prev + 1);
        
        try {
            console.log(`[Room] Reconnect attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
            
            initiatorHandledRef.current = false;
            cleanup();
            await startLocalStream();
            
            if (socket && roomId) {
                socket.emit('join-room', { roomId, userName });
                toast.success('Reconnected successfully!');
                setIsReconnecting(false);
                setReconnectAttempts(0);
            }
        } catch (err) {
            console.error('[Room] Reconnect failed:', err);
            toast.error(`Reconnect attempt ${reconnectAttempts + 1} failed`);
            
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            reconnectTimeoutRef.current = setTimeout(attemptReconnect, delay);
        }
    }, [reconnectAttempts, cleanup, startLocalStream, socket, roomId, userName]);

    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    // Socket event handlers
    useEffect(() => {
        if (!socket || !roomId) return;

        console.log('[Room] Setting up socket listeners for room:', roomId);

        const handleMatchFound = ({ roomId: newRoomId, isGroup }) => {
            console.log('[Room] Match found! Room:', newRoomId, 'isGroup:', isGroup);
            if (isGroup) setIsGroupCall(true);
            navigate(`/room/${newRoomId}`, { state: preferences, replace: true });
        };

        // Join room
        socket.emit('join-room', { roomId, userName });

        // Group call handlers
        const handleExistingPeers = async ({ peers }) => {
            console.log('[Room] Existing peers:', peers);
            if (!localStreamRef.current) {
                console.log('[Room] Waiting for local stream before connecting to peers...');
                setTimeout(() => handleExistingPeers({ peers }), 200);
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
                    console.error('[Room] Error creating offer for peer:', peerId, err);
                }
            }
        };

        const handlePeerJoined = async ({ peerId }) => {
            console.log('[Room] New peer joined:', peerId);
            toast.success('A new person joined!');
            playJoinSound();

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
        };

        const handlePeerLeft = ({ peerId }) => {
            console.log('[Room] Peer left:', peerId);
            toast('Someone left the room', { icon: <HandWaving weight="fill" className="w-5 h-5" /> });
            playLeaveSound();
            removePeerConnection(peerId);
            setGroupPeers(prev => prev.filter(p => p.peerId !== peerId));
        };

        // 1-on-1 handlers
        const handleIsInitiator = async (isInitiator) => {
            if (isGroupCall) {
                console.log('[Room] Skipping initiator for group call');
                return;
            }
            
            console.log('[Room] Is initiator:', isInitiator, 'handled:', initiatorHandledRef.current);

            if (initiatorHandledRef.current) {
                console.log('[Room] Initiator already handled, skipping');
                return;
            }

            setIsSearching(false);

            if (peerConnection.current) {
                const state = peerConnection.current.connectionState;
                const iceState = peerConnection.current.iceConnectionState;
                
                if (state === 'connected' || state === 'connecting') {
                    console.log('[Room] Connection already active');
                    initiatorHandledRef.current = true;
                    return;
                }
                
                if (state === 'failed' || state === 'closed' || iceState === 'failed') {
                    console.log('[Room] Closing stale connection');
                    closeConnection();
                }
            }

            // Check if local stream is ready using ref (more reliable than state)
            if (!localStreamRef.current) {
                console.log('[Room] Local stream not ready, queuing initiator request');
                pendingInitiatorRef.current = isInitiator;
                
                // Set a timeout to prevent infinite waiting
                if (streamWaitTimeoutRef.current) {
                    clearTimeout(streamWaitTimeoutRef.current);
                }
                streamWaitTimeoutRef.current = setTimeout(() => {
                    if (!localStreamRef.current && pendingInitiatorRef.current !== null) {
                        console.error('[Room] Timeout waiting for local stream');
                        toast.error('Failed to access camera. Please refresh and try again.');
                        pendingInitiatorRef.current = null;
                    }
                }, 15000); // 15 second timeout
                return;
            }

            // Stream is ready, proceed immediately
            initiatorHandledRef.current = true;

            const handleIceCandidate = (candidate) => {
                socket.emit('ice-candidate', { roomId, candidate });
            };

            createPeerConnection(handleIceCandidate);

            if (isInitiator) {
                try {
                    console.log('[Room] Creating offer as initiator');
                    const offer = await createOffer();
                    socket.emit('offer', { roomId, offer });
                } catch (err) {
                    console.error('[Room] Error creating offer:', err);
                    initiatorHandledRef.current = false;
                    toast.error('Connection failed. Please try reconnecting.');
                }
            }
        };

        // WebRTC signaling handlers
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
                        if (existing) {
                            return prev.map(p => p.peerId === pid ? { ...p, stream } : p);
                        }
                        return [...prev, { peerId: pid, stream }];
                    });
                };
                
                createPeerConnectionForPeer(sender, onIceCandidate, onRemoteStream);
                
                try {
                    const answer = await handleOfferFromPeer(offer, sender);
                    socket.emit('answer', { roomId, answer, targetPeerId: sender });
                } catch (err) {
                    console.error('[Room] Error handling offer:', err);
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
                    console.error('[Room] Error handling offer:', err);
                    toast.error('Failed to connect. Please try reconnecting.');
                }
            }
        };

        const handleAnswerReceived = async ({ answer, sender }) => {
            console.log('[Room] Received answer from:', sender);

            if (isGroupCall) {
                try {
                    await handleAnswerFromPeer(answer, sender);
                } catch (err) {
                    console.error('[Room] Error handling answer:', err);
                }
            } else {
                if (!peerConnection.current) return;
                try {
                    await handleAnswer(answer);
                } catch (err) {
                    console.error('[Room] Error handling answer:', err);
                }
            }
        };

        const handleIceCandidateReceived = async ({ candidate, sender }) => {
            if (isGroupCall) {
                try {
                    await addIceCandidateForPeer(candidate, sender);
                } catch (err) {
                    console.error('[Room] Error adding ICE candidate:', err);
                }
            } else {
                if (!peerConnection.current) return;
                try {
                    await addIceCandidate(candidate);
                } catch (err) {
                    console.error('[Room] Error adding ICE candidate:', err);
                }
            }
        };

        const handlePeerDisconnected = () => {
            console.log('[Room] Peer disconnected');
            playLeaveSound();
            toast('Partner disconnected. Click Next to find a new match.', {
                icon: <Info weight="fill" className="w-5 h-5" />,
                duration: 5000
            });
        };

        const handleReaction = ({ reaction }) => {
            setRemoteReaction(reaction);
            setTimeout(() => setRemoteReaction(null), 2000);
        };

        const handleRemoteVideoToggle = ({ isVideoOff }) => {
            setRemoteVideoOff(isVideoOff);
        };

        // Register listeners
        socket.on('match-found', handleMatchFound);
        socket.on('existing-peers', handleExistingPeers);
        socket.on('peer-joined', handlePeerJoined);
        socket.on('peer-left', handlePeerLeft);
        socket.on('is-initiator', handleIsInitiator);
        socket.on('offer', handleOfferReceived);
        socket.on('answer', handleAnswerReceived);
        socket.on('ice-candidate', handleIceCandidateReceived);
        socket.on('peer-disconnected', handlePeerDisconnected);
        socket.on('receive-reaction', handleReaction);
        socket.on('toggle-video', handleRemoteVideoToggle);

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
            socket.off('receive-reaction', handleReaction);
            socket.off('toggle-video', handleRemoteVideoToggle);
        };
    }, [socket, roomId, createPeerConnection, navigate, preferences, peerConnection, closeConnection, isGroupCall, localStream, userName, createOffer, handleOffer, handleAnswer, addIceCandidate, createPeerConnectionForPeer, createOfferForPeer, handleOfferFromPeer, handleAnswerFromPeer, addIceCandidateForPeer, removePeerConnection]);

    // Control handlers
    const handleToggleMute = useCallback(() => {
        const isEnabled = toggleAudio();
        setIsMuted(!isEnabled);
        toast.success(isEnabled ? 'Microphone On' : 'Microphone Off', {
            icon: isEnabled ? <Microphone weight="fill" className="w-5 h-5" /> : <MicrophoneSlash weight="fill" className="w-5 h-5" />
        });
    }, [toggleAudio]);

    const handleToggleVideo = useCallback(() => {
        const isEnabled = toggleVideo();
        setIsVideoOff(!isEnabled);
        socket.emit('toggle-video', { roomId, isVideoOff: !isEnabled });
        toast.success(isEnabled ? 'Camera On' : 'Camera Off', {
            icon: isEnabled ? <VideoCamera weight="fill" className="w-5 h-5" /> : <VideoCameraSlash weight="fill" className="w-5 h-5" />
        });
    }, [toggleVideo, socket, roomId]);

    const handleLeaveRoom = useCallback(() => {
        cleanup();
        socket.emit('leave-room', roomId);
        navigate('/post-chat');
    }, [cleanup, socket, roomId, navigate]);

    const handleReportSubmit = useCallback((data) => {
        socket.emit('report', { roomId, reason: data.reason, details: data.details || '' });
        setIsReportOpen(false);
        toast.success('Report submitted. Thank you for keeping EchoRoom safe.');
    }, [socket, roomId]);

    // Reactions
    const reactions = [
        { icon: Heart, color: 'red', name: 'heart' },
        { icon: ThumbsUp, color: 'cyan', name: 'thumbsup' },
        { icon: Smiley, color: 'yellow', name: 'smile' },
        { icon: Fire, color: 'orange', name: 'fire' },
        { icon: HandsClapping, color: 'purple', name: 'clap' },
    ];

    const sendReaction = useCallback((reaction) => {
        const id = Date.now();
        setFloatingReactions(prev => [...prev, { id, ...reaction }]);
        socket.emit('send-reaction', { roomId, reaction: reaction.name });
        setShowReactions(false);
    }, [socket, roomId]);

    const handleShareRoom = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Room link copied to clipboard!', {
            icon: <CheckCircle weight="fill" className="w-5 h-5 text-green-400" />
        });
    }, []);

    if (permissionError) {
        return <PermissionError error={permissionError} />;
    }

    return (
        <div className="relative flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                        <VideoCamera weight="fill" className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            EchoRoom
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            {isGroupCall ? (
                                <><Users weight="fill" className="w-3 h-3" /> Group Call</>
                            ) : (
                                <><VideoCamera weight="fill" className="w-3 h-3" /> 1-on-1</>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <ConnectionQuality stats={connectionStats} />
                    
                    {isReconnecting ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="p-2"
                        >
                            <Spinner weight="bold" className="w-5 h-5 text-cyan-400" />
                        </motion.div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={attemptReconnect}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            title="Reconnect"
                        >
                            <ArrowClockwise weight="bold" className="w-5 h-5 text-cyan-400" />
                        </motion.button>
                    )}
                    
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShareRoom}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        title="Share Room"
                    >
                        <ShareNetwork weight="fill" className="w-5 h-5 text-purple-400" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowExitConfirm(true)}
                        className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-colors flex items-center gap-2"
                    >
                        <PhoneDisconnect weight="fill" className="w-5 h-5" />
                        <span className="hidden sm:inline">Leave</span>
                    </motion.button>
                </div>
            </header>

            {/* Main Video Area */}
            <div className="relative z-10 flex-1 flex flex-col gap-3 p-3 overflow-hidden">
                {/* Local Video - Floating */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.1}
                    className="absolute bottom-20 right-3 z-30 w-24 h-32 md:w-36 md:h-48 lg:w-44 lg:h-56
                        bg-black/60 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20
                        shadow-2xl transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/20
                        cursor-move"
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    
                    {/* Name Badge */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white truncate max-w-[60%]">
                                {userName || 'You'}
                            </span>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => { setTempName(userName); setShowNameModal(true); }}
                                className="p-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <UserPlus weight="bold" className="w-3 h-3" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="absolute top-2 left-2 flex gap-1">
                        {isMuted && (
                            <div className="p-1 rounded bg-red-500/80">
                                <MicrophoneSlash weight="fill" className="w-3 h-3" />
                            </div>
                        )}
                        {isVideoOff && (
                            <div className="p-1 rounded bg-red-500/80">
                                <VideoCameraSlash weight="fill" className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Remote Videos */}
                <div className="flex-1 h-full">
                    {isGroupCall ? (
                        <div className={`
                            h-full grid gap-2 md:gap-3
                            ${groupPeers.length <= 1 
                                ? 'grid-cols-1' 
                                : groupPeers.length <= 4 
                                    ? 'grid-cols-1 md:grid-cols-2' 
                                    : 'grid-cols-2 md:grid-cols-3'
                            }
                        `}>
                            {groupPeers.length > 0 ? (
                                groupPeers.map(({ peerId, stream, peerName }) => (
                                    <motion.div 
                                        key={peerId}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="relative rounded-xl md:rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-sm border border-white/10 cursor-pointer hover:border-cyan-500/50 transition-all"
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
                                            className="w-full h-full object-cover min-h-[150px] md:min-h-[200px]"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                            <span className="text-xs md:text-sm font-medium text-white">
                                                {peerName || `User ${peerId.slice(0, 6)}`}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/40">
                                    <Spinner weight="bold" className="w-12 h-12 animate-spin mb-4" />
                                    <p className="text-lg font-medium">Waiting for others...</p>
                                    <p className="text-sm mt-2">Share the room link to invite friends</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* 1-on-1 Remote Video */
                        <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-neutral-900/50 backdrop-blur-sm border border-white/10 h-full">
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
                                <div className="flex flex-col items-center justify-center h-full text-white/40 min-h-[250px] md:min-h-[300px]">
                                    <Spinner weight="bold" className="w-12 h-12 animate-spin mb-4" />
                                    <p className="text-lg font-medium">Connecting...</p>
                                    <p className="text-sm mt-2">Establishing secure connection</p>
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
                className="relative z-20 flex items-center justify-center gap-2 md:gap-4 p-3 md:p-4 bg-black/40 backdrop-blur-xl border-t border-white/10"
            >
                {/* Mic */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleMute}
                    className={`p-3 md:p-4 rounded-2xl transition-all ${
                        isMuted 
                            ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    {isMuted ? <MicrophoneSlash weight="fill" className="w-6 h-6" /> : <Microphone weight="fill" className="w-6 h-6" />}
                </motion.button>

                {/* Video */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleVideo}
                    className={`p-3 md:p-4 rounded-2xl transition-all ${
                        isVideoOff 
                            ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    {isVideoOff ? <VideoCameraSlash weight="fill" className="w-6 h-6" /> : <VideoCamera weight="fill" className="w-6 h-6" />}
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
                    <Monitor weight="fill" className="w-6 h-6" />
                </motion.button>

                {/* Chat */}
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
                    <ChatCircle weight="fill" className="w-6 h-6" />
                </motion.button>

                {/* Reactions */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowReactions(!showReactions)}
                        className="p-3 md:p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        <Smiley weight="fill" className="w-6 h-6" />
                    </motion.button>
                    
                    <AnimatePresence>
                        {showReactions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 flex gap-2 p-3 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10"
                            >
                                {reactions.map(reaction => (
                                    <ReactionButton
                                        key={reaction.name}
                                        icon={reaction.icon}
                                        color={reaction.color}
                                        onClick={() => sendReaction(reaction)}
                                    />
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
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-white/10"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Set Your Display Name</h3>
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                placeholder="Enter your name..."
                                maxLength={20}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') saveUserName(tempName); }}
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
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/30"
                                >
                                    Save
                                </motion.button>
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
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-white/10"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Leave Room?</h3>
                            <p className="text-white/60 mb-6">Are you sure you want to leave? You&apos;ll be disconnected from the call.</p>
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowExitConfirm(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors font-medium border border-white/10"
                                >
                                    Stay
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleLeaveRoom}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/30"
                                >
                                    Leave
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <Chat 
                roomId={roomId} 
                isOpen={isChatOpen}
                userName={userName}
                onClose={() => setIsChatOpen(false)} 
            />

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
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                    },
                }}
            />
        </div>
    );
};

export default Room;
