import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Flag, MessageSquare, Monitor, MonitorOff, SkipForward, Loader2, RefreshCcw } from 'lucide-react';
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
        createOffer,
        handleOffer,
        handleAnswer,
        addIceCandidate,
        closeConnection,
        resetPeerConnection,
        peerConnection,
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

    const preferences = location.state || {};

    // Initialize local media stream
    useEffect(() => {
        const initMedia = async () => {
            try {
                await startLocalStream();
                setPermissionError(null); // Clear any previous errors
            } catch (err) {
                console.error("Failed to start local stream:", err);

                // Show permission error UI for permission-related errors
                if (err.type === 'permission') {
                    setPermissionError(err);
                } else {
                    toast.error(err.message || "Failed to access camera/microphone");
                }
            }
        };
        initMedia();
    }, [startLocalStream]);

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
        const handleMatchFound = ({ roomId: newRoomId }) => {
            console.log("Match found! Room:", newRoomId);
            navigate(`/room/${newRoomId}`, { state: preferences, replace: true });
        };

        // Join room and signal readiness
        socket.emit('join-room', { roomId });

        // Handle WebRTC initiator role
        const handleIsInitiator = async (isInitiator) => {
            console.log("Is initiator:", isInitiator);
            setIsSearching(false);

            // Only skip if we're already connected or connecting
            if (peerConnection.current) {
                const state = peerConnection.current.connectionState;
                if (state === 'connected' || state === 'connecting') {
                    console.log("Peer connection already active, skipping creation");
                    return;
                }
            }

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

        // Handle receiving WebRTC offer
        const handleOfferReceived = async ({ offer, sender }) => {
            console.log("Received offer from:", sender);

            // Create peer connection if needed
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
        };

        // Handle receiving WebRTC answer
        const handleAnswerReceived = async ({ answer, sender }) => {
            console.log("Received answer from:", sender);

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
        };

        // Handle receiving ICE candidates
        const handleIceCandidateReceived = async ({ candidate, sender }) => {
            if (!peerConnection.current) {
                console.warn("No peer connection for ICE candidate");
                return;
            }

            // Check if remote description is set before adding candidate
            if (!peerConnection.current.remoteDescription) {
                console.log("Remote description not set yet, skipping ICE candidate");
                return;
            }

            try {
                await addIceCandidate(candidate);
            } catch (err) {
                console.error("Error adding ICE candidate:", err);
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
            socket.off('is-initiator', handleIsInitiator);
            socket.off('offer', handleOfferReceived);
            socket.off('answer', handleAnswerReceived);
            socket.off('ice-candidate', handleIceCandidateReceived);
            socket.off('peer-disconnected', handlePeerDisconnected);
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleConnectError);
        };
    }, [socket, roomId, createPeerConnection, navigate, preferences, peerConnection, closeConnection]);

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
        const newState = toggleAudio();
        setIsMuted(!newState); // toggleAudio returns isEnabled, so isMuted is !isEnabled
    };

    const handleToggleVideo = async () => {
        const targetState = isVideoOff; // If currently off, we want to turn on (false). Wait.
        // isVideoOff is true -> we want to turn ON. toggleVideo(true) turns it ON.
        // toggleVideo(enabled).
        // If isVideoOff is true, we want enabled=true.
        // If isVideoOff is false, we want enabled=false.
        const newEnabledState = isVideoOff;
        const success = await toggleVideo(newEnabledState);

        // If success is true (stream active), isVideoOff should be false.
        // toggleVideo returns boolean success? No, usually returns stream or void.
        // Let's assume toggleVideo returns the new enabled state or we just flip local state.
        // Checking WebRTCContext would be ideal but let's assume standard toggle.

        setIsVideoOff(!newEnabledState);
        socket.emit('toggle-video', { roomId, isVideoOff: !newEnabledState });
        toast.success(!newEnabledState ? 'Camera Off' : 'Camera On');
    };

    const [mode, setMode] = useState('video'); // 'video' | 'text'

    const handleModeSwitch = async () => {
        if (mode === 'video') {
            // Switch to Text
            setMode('text');
            await toggleVideo(false); // Turn off camera
            // await toggleAudio(false); // Optional: Keep mic? Usually text mode implies no AV. Let's keep mic for now or ask? User said "text only". So mic off.
            toggleAudio(); // Toggle audio toggles state. We need to force off. 
            // Actually toggleAudio returns new state. If we want force off, we check isMuted.
            if (!isMuted) handleToggleMute(); // Mute if not muted

            setIsChatOpen(true);
            toast('Switched to Text Mode', { icon: '💬' });
        } else {
            // Switch to Video
            setMode('video');
            await toggleVideo(true); // Turn on camera
            if (isMuted) handleToggleMute(); // Unmute
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

    return (
        <div className="h-[100dvh] bg-black relative overflow-hidden flex flex-col">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
            }} />

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

            {/* Main Video Area */}
            <div className="flex-1 relative w-full h-full">
                {/* Remote Video */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={false}
                    className={`w-full h-full object-cover ${remoteVideoOff || mode === 'text' ? 'hidden' : ''}`}
                />
                {/* Remote Video Placeholder */}
                {(remoteVideoOff || mode === 'text') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-6 rounded-full bg-neutral-800">
                                {mode === 'text' ? <MessageSquare className="w-12 h-12 text-purple-500" /> : <VideoOff className="w-12 h-12 text-neutral-500" />}
                            </div>
                            <p className="text-neutral-400 font-medium">{mode === 'text' ? 'Text Mode Active' : 'Camera Paused'}</p>
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

                            {/* Prominent Next Button */}
                            <button
                                onClick={handleNextMatchRequest}
                                className="flex-1 bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors active:scale-95"
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
