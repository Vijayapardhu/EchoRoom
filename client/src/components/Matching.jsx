import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Spinner, 
    Users, 
    Sparkle, 
    Broadcast, 
    Waveform,
    Lightning,
    CheckCircle,
    Planet,
    ChatCircle,
    VideoCamera,
    ArrowLeft
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

const OrbitRing = ({ size, duration, delay, children }) => (
    <motion.div
        className="absolute rounded-full border border-cyan-500/20"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
    >
        {children}
    </motion.div>
);

const ScanLine = ({ delay }) => (
    <motion.div
        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
        initial={{ top: '0%', opacity: 0 }}
        animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay, ease: 'linear' }}
    />
);

const waitingFacts = [
    { icon: VideoCamera, text: "The first video call was made in 1927!" },
    { icon: Planet, text: "People from 190+ countries use video chat daily" },
    { icon: ChatCircle, text: "Anonymous connections lead to more genuine conversations" },
    { icon: CheckCircle, text: "Your connection is end-to-end encrypted" },
    { icon: Lightning, text: "WebRTC allows peer-to-peer connection for lower latency" },
    { icon: Users, text: "Most matches happen within 30 seconds" },
];

const Matching = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocket();
    const [dots, setDots] = useState('');
    const [waitTime, setWaitTime] = useState(0);
    const [currentFact, setCurrentFact] = useState(0);
    const [pulseIntensity, setPulseIntensity] = useState(0);

    const preferences = location.state || {};

    useEffect(() => {
        const factInterval = setInterval(() => {
            setCurrentFact(prev => (prev + 1) % waitingFacts.length);
        }, 5000);
        return () => clearInterval(factInterval);
    }, []);

    useEffect(() => {
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        const timeInterval = setInterval(() => {
            setWaitTime(prev => prev + 1);
        }, 1000);

        const pulseInterval = setInterval(() => {
            setPulseIntensity(prev => Math.min(prev + 0.1, 1));
        }, 2000);

        return () => {
            clearInterval(dotsInterval);
            clearInterval(timeInterval);
            clearInterval(pulseInterval);
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        console.log('Joining queue with preferences:', preferences);
        socket.emit('join-queue', preferences);

        const handleMatchFound = ({ roomId }) => {
            console.log('Match found! Navigating to room:', roomId);
            toast.success('Match found! Connecting...', { 
                icon: <CheckCircle weight="fill" className="w-5 h-5 text-green-400" /> 
            });
            navigate(`/room/${roomId}`, { state: preferences, replace: true });
        };

        socket.on('match-found', handleMatchFound);

        return () => {
            socket.off('match-found', handleMatchFound);
        };
    }, [socket, navigate, preferences]);

    const handleCancel = () => {
        if (socket) {
            socket.emit('leave-queue');
        }
        navigate('/');
    };

    const orbitDots = useMemo(() => 
        Array.from({ length: 6 }, (_, i) => ({
            id: i,
            angle: (i * 60) * (Math.PI / 180),
        })), []
    );

    const FactIcon = waitingFacts[currentFact].icon;

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: 'rgba(0,0,0,0.9)',
                    color: '#fff',
                    borderRadius: '16px',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    backdropFilter: 'blur(10px)',
                },
            }} />

            <div className="absolute inset-0">
                <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2 + pulseIntensity * 0.1, 0.1],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div 
                    className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]"
                    animate={{ 
                        scale: [1, 1.3, 1],
                        x: [0, 30, 0],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div 
                    className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[80px]"
                    animate={{ 
                        scale: [1, 1.2, 1],
                        y: [0, -20, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <ScanLine delay={0} />
                <ScanLine delay={0.7} />
                <ScanLine delay={1.4} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 max-w-md w-full"
            >
                <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
                    <div className="flex justify-center mb-8">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <OrbitRing size={160} duration={8} delay={0}>
                                {orbitDots.map((dot) => (
                                    <motion.div
                                        key={dot.id}
                                        className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                                        style={{
                                            left: '50%',
                                            top: '50%',
                                            transform: `translate(-50%, -50%) rotate(${dot.angle}rad) translateY(-80px)`,
                                        }}
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: dot.id * 0.2 }}
                                    />
                                ))}
                            </OrbitRing>
                            <OrbitRing size={120} duration={6} delay={0.5} />
                            <OrbitRing size={80} duration={4} delay={1} />

                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                className="relative z-10"
                            >
                                <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl" />
                                <div className="relative bg-gradient-to-br from-cyan-500 to-purple-500 p-5 rounded-full shadow-lg shadow-cyan-500/30">
                                    <Broadcast weight="fill" className="w-10 h-10 text-white" />
                                </div>
                            </motion.div>

                            <motion.div
                                className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"
                                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                            />
                            <motion.div
                                className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"
                                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                            />
                        </div>
                    </div>

                    <div className="text-center space-y-4 mb-8">
                        <motion.h2 
                            className="text-3xl font-bold text-white"
                            animate={{ opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            Finding Your Match{dots}
                        </motion.h2>
                        <p className="text-neutral-400">
                            Scanning the frequencies for someone special
                        </p>

                        <motion.div 
                            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10"
                            animate={{ boxShadow: pulseIntensity > 0.5 ? '0 0 20px rgba(6, 182, 212, 0.2)' : 'none' }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                                <Spinner weight="bold" className="w-4 h-4 text-cyan-400" />
                            </motion.div>
                            <span className="text-sm font-mono text-neutral-300">
                                {Math.floor(waitTime / 60).toString().padStart(2, '0')}:{(waitTime % 60).toString().padStart(2, '0')}
                            </span>
                            <Waveform weight="fill" className="w-4 h-4 text-purple-400 animate-pulse" />
                        </motion.div>
                    </div>

                    <AnimatePresence>
                        {preferences && Object.keys(preferences).length > 0 && (
                            <motion.div 
                                className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkle weight="fill" className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-medium text-white">Your Preferences</span>
                                </div>
                                <div className="space-y-2 text-sm text-neutral-400">
                                    {preferences.interests && preferences.interests.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {preferences.interests.map((interest, i) => (
                                                <span key={i} className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs border border-cyan-500/20">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {preferences.mode && (
                                        <div className="flex items-center gap-2">
                                            <Lightning weight="fill" className="w-3 h-3 text-purple-400" />
                                            <span className="text-purple-400 capitalize">{preferences.mode} mode</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentFact}
                            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-white/5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center gap-3">
                                <FactIcon weight="fill" className="w-5 h-5 text-cyan-400 shrink-0" />
                                <p className="text-sm text-neutral-400">
                                    {waitingFacts[currentFact].text}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <motion.button
                        onClick={handleCancel}
                        className="w-full py-4 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ArrowLeft weight="bold" className="w-5 h-5" />
                        Cancel Search
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default Matching;
