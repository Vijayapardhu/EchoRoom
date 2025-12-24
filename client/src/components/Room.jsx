import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Flag, MessageSquare, Monitor, MonitorOff, SkipForward, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import PanicButton from './safety/PanicButton';
import ReportModal from './safety/ReportModal';
import Chat from './Chat';
import ConnectionIndicator from './ConnectionIndicator';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocket();
    const { localStream, remoteStream, startLocalStream, createPeerConnection, closeConnection, resetPeerConnection, peerConnection, startScreenShare, stopScreenShare, toggleVideo, toggleAudio } = useWebRTC();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [showNextConfirm, setShowNextConfirm] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const controlsTimeoutRef = useRef(null);

    // Get preferences from location state or defaults
    const preferences = location.state || { interests: [], intent: 'casual' };

    // Effect 1: Initialize Local Stream (Runs ONCE)
    // Effect 1: Initialize Local Stream (Runs ONCE)
    useEffect(() => {
        const initStream = async () => {
            const stream = await startLocalStream();
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            // Signal server we are ready in the room
            socket.emit('join-room', { roomId });
        };
        initStream();
        // startLocalStream is stable (useCallback with []), so this runs only once.
    }, [startLocalStream, roomId, socket]);

    // Effect 2: Socket Event Listeners (Runs when dependencies change)
    // Effect 2: Socket Event Listeners (Runs when dependencies change)
    useEffect(() => {
        const handleIceCandidate = (candidate) => {
            socket.emit('ice-candidate', { roomId, candidate });
        };

        socket.on('is-initiator', async (isInitiator) => {
            const pc = createPeerConnection(handleIceCandidate);
            if (isInitiator) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('offer', { roomId, offer });
            }
        });

        socket.on('offer', async ({ offer }) => {
            const pc = createPeerConnection(handleIceCandidate);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { roomId, answer });
        });

        socket.on('answer', async ({ answer }) => {
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('ice-candidate', async ({ candidate }) => {
            if (peerConnection.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        // Listen for match found to stop searching state
        socket.on('match-found', ({ roomId: newRoomId }) => {
            setIsSearching(false);
            navigate(`/room/${newRoomId}`, { state: preferences });
        });

        return () => {
            socket.off('is-initiator'); // Added cleanup for is-initiator
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            socket.off('match-found');
        };
    }, [roomId, socket, createPeerConnection, navigate, preferences]); // Dependencies for socket logic

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Auto-hide controls
    useEffect(() => {
        const resetTimer = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        resetTimer();

        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const handleToggleMute = () => {
        const newState = toggleAudio();
        setIsMuted(!newState); // toggleAudio returns current enabled state
        toast.success(!newState ? 'Microphone Off' : 'Microphone On', { icon: !newState ? '🔇' : '🎙️' });
    };

    const handleToggleVideo = async () => {
        // If isVideoOff is true, we want to turn ON (true).
        // If isVideoOff is false, we want to turn OFF (false).
        const targetState = isVideoOff;
        const success = await toggleVideo(targetState);

        // success is true if video is ON, false if video is OFF.
        setIsVideoOff(!success);
        toast.success(success ? 'Camera On' : 'Camera Off', { icon: success ? '📷' : '🚫' });
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            await stopScreenShare();
            setIsScreenSharing(false);
            toast('Screen Share Stopped');
        } else {
            await startScreenShare();
            setIsScreenSharing(true);
            toast.success('Screen Share Started');
        }
    };

    const handleNextMatchRequest = () => {
        setShowNextConfirm(true);
    };

    const confirmNextMatch = () => {
        setShowNextConfirm(false);
        setIsSearching(true);
        resetPeerConnection();
        socket.emit('leave-room', { roomId });
        socket.emit('join-queue', preferences);
        setIsChatOpen(false);
        toast.loading('Finding next match...', { duration: 2000 });
    };

    const handleLeaveRoomRequest = () => {
        setShowExitConfirm(true);
    };

    const confirmLeaveRoom = () => {
        setShowExitConfirm(false);
        closeConnection();
        socket.emit('leave-room', { roomId });
        navigate('/');
    };

    const handleReportSubmit = (data) => {
        socket.emit('report', { roomId, ...data });
        toast.success('Report submitted. We will take action.');
        confirmNextMatch(); // Auto-skip after report, no confirmation needed
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
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase">Live</span>
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
                    className="w-full h-full object-cover"
                />

                {/* Cinematic Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

                {/* Local Video - Mobile Optimized Position */}
                <motion.div
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    className="absolute top-20 right-4 w-28 md:w-56 aspect-[3/4] md:aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 cursor-grab active:cursor-grabbing z-30 group"
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
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
                                <ControlButton onClick={toggleScreenShare} isActive={isScreenSharing} activeIcon={<MonitorOff />} inactiveIcon={<Monitor />} />
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
