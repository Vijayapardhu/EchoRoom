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
    Lightning,
    Star,
    Fire,
    HandsClapping,
    Users,
    ArrowLeft
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

// Control button component
const ControlButton = ({ onClick, active, activeIcon, inactiveIcon, color = 'default', label }) => {
    const colorStyles = {
        default: active ? 'bg-white/20 text-white' : 'bg-white/10 text-white hover:bg-white/20',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30',
        success: 'bg-emerald-500 text-white'
    };

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
                p-4 rounded-2xl transition-all duration-300 flex flex-col items-center gap-1
                ${color === 'danger' || color === 'success' ? colorStyles[color] : colorStyles.default}
            `}
        >
            {React.cloneElement(active ? activeIcon : inactiveIcon, { 
                weight: 'fill',
                className: 'w-6 h-6' 
            })}
            {label && <span className="text-[10px] font-medium opacity-70">{label}</span>}
        </motion.button>
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
    } = useWebRTC();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const initiatorHandledRef = useRef(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [userName, setUserName] = useState(() => localStorage.getItem('echoroom_username') || '');
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempName, setTempName] = useState('');
    const [isGroupCall, setIsGroupCall] = useState(false);
    const [groupPeers, setGroupPeers] = useState([]);
    
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
        initiatorHandledRef.current = false;
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
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

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
        toast.success('Link copied!', { icon: <CheckCircle weight="fill" className="w-5 h-5 text-emerald-400" /> });
    }, []);

    return (
        <div className="relative flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden">
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
                        <h1 className="text-lg font-bold">EchoRoom</h1>
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
                        onClick={handleShareRoom}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ShareNetwork weight="fill" className="w-5 h-5 text-blue-400" />
                    </motion.button>
                </div>
            </header>

            {/* Video Area */}
            <div className="relative z-10 flex-1 flex flex-col gap-3 p-3 overflow-hidden">
                {/* Local Video */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.1}
                    className="absolute bottom-24 right-4 z-30 w-36 h-48 md:w-44 md:h-56 bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-move"
                >
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
                                        className="relative rounded-2xl overflow-hidden bg-neutral-900/50 border border-white/10"
                                    >
                                        <video
                                            ref={el => { if (el && stream) { el.srcObject = stream; el.play().catch(() => {}); }}}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                            <span className="text-xs text-white/80">User {peerId.slice(0, 6)}</span>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/30">
                                    <Spinner weight="bold" className="w-12 h-12 animate-spin mb-4 text-blue-400" />
                                    <p className="text-lg">Waiting for others...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative rounded-2xl overflow-hidden bg-neutral-900/50 border border-white/10 h-full">
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
                    )}
                </div>
            </div>

            {/* Controls */}
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-20 flex items-center justify-center gap-3 p-4 bg-black/40 backdrop-blur-md border-t border-white/5"
            >
                <ControlButton
                    onClick={handleToggleMute}
                    active={isMuted}
                    activeIcon={<MicrophoneSlash />}
                    inactiveIcon={<Microphone />}
                    label={isMuted ? 'Unmute' : 'Mute'}
                />

                <ControlButton
                    onClick={handleToggleVideo}
                    active={isVideoOff}
                    activeIcon={<VideoCameraSlash />}
                    inactiveIcon={<VideoCamera />}
                    label={isVideoOff ? 'Start' : 'Stop'}
                />

                <ControlButton
                    onClick={toggleScreenShare}
                    active={isScreenSharing}
                    activeIcon={<Monitor />}
                    inactiveIcon={<Monitor />}
                    label="Screen"
                />

                <ControlButton
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    active={isChatOpen}
                    activeIcon={<ChatCircle />}
                    inactiveIcon={<ChatCircle />}
                    label="Chat"
                />

                {/* Reactions */}
                <div className="relative">
                    <ControlButton
                        onClick={() => setShowReactions(!showReactions)}
                        active={showReactions}
                        activeIcon={<Smiley />}
                        inactiveIcon={<Smiley />}
                        label="React"
                    />
                    
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
                                        <reaction.icon weight="fill" className={`w-6 h-6`} />
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* End Call */}
                <ControlButton
                    onClick={() => setShowExitConfirm(true)}
                    active={true}
                    activeIcon={<PhoneDisconnect />}
                    inactiveIcon={<PhoneDisconnect />}
                    color="danger"
                    label="End"
                />
            </motion.div>

            {/* Exit Confirmation Modal */}
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

            {/* Toast */}
            <Toaster position="top-center" />
        </div>
    );
};

export default Room;
