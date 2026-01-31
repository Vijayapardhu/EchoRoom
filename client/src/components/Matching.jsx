import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import { 
    Spinner, 
    CheckCircle,
    Crosshair,
    ArrowLeft,
    Users,
    VideoCamera,
    Lightning,
    Clock
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

const Matching = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocket();
    const [dots, setDots] = useState('');
    const [waitTime, setWaitTime] = useState(0);
    const [pulseScale, setPulseScale] = useState(1);

    const preferences = location.state || {};

    useEffect(() => {
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        const timeInterval = setInterval(() => {
            setWaitTime(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(dotsInterval);
            clearInterval(timeInterval);
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join-queue', preferences);

        const handleMatchFound = ({ roomId }) => {
            toast.success('Match found! Connecting...', { 
                icon: <CheckCircle weight="fill" className="w-5 h-5 text-emerald-400" /> 
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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: '#fff',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                },
            }} />

            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
                    {/* Animated rings */}
                    <motion.div
                        className="absolute inset-0 border border-blue-400/20 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute inset-[15%] border border-violet-400/20 rounded-full"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    />
                    <motion.div
                        className="absolute inset-[30%] border border-blue-400/10 rounded-full"
                        animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.05, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    />
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 max-w-md w-full"
            >
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            {/* Radar animation */}
                            <motion.div
                                className="absolute inset-0 border-2 border-blue-400/30 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa]" />
                            </motion.div>
                            
                            {/* Inner circles */}
                            <div className="absolute inset-[25%] border border-violet-400/30 rounded-full" />
                            <div className="absolute inset-[50%] bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Crosshair weight="bold" className="w-8 h-8 text-white" />
                            </div>

                            {/* Pulse effect */}
                            <motion.div
                                className="absolute inset-0 border-2 border-blue-400/50 rounded-full"
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            Finding your match{dots}
                        </h2>
                        <p className="text-white/50">
                            Looking for someone with similar interests
                        </p>
                    </div>

                    {/* Timer */}
                    <div className="flex justify-center mb-8">
                        <div className="flex items-center gap-4 px-6 py-3 bg-black/30 rounded-2xl border border-white/10">
                            <Clock weight="bold" className="w-5 h-5 text-blue-400" />
                            <span className="text-2xl font-mono text-white font-bold tracking-wider">
                                {formatTime(waitTime)}
                            </span>
                        </div>
                    </div>

                    {/* Preferences */}
                    {preferences && (
                        <div className="mb-8 p-4 bg-black/20 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightning weight="fill" className="w-4 h-4 text-violet-400" />
                                <span className="text-sm font-medium text-white/60">Your Preferences</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {preferences.interests?.map((interest, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-400/20 text-blue-400 rounded-full text-xs font-medium">
                                        {interest}
                                    </span>
                                ))}
                                <span className="px-3 py-1 bg-white/10 text-white/60 rounded-full text-xs font-medium flex items-center gap-1">
                                    <VideoCamera weight="bold" className="w-3 h-3" />
                                    {preferences.mode}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Cancel Button */}
                    <motion.button
                        onClick={handleCancel}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 px-6 rounded-xl bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                    >
                        <ArrowLeft weight="bold" className="w-5 h-5" />
                        Cancel Search
                    </motion.button>
                </div>

                {/* Tips */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="text-center text-white/30 text-sm mt-6"
                >
                    Most matches happen within 30 seconds
                </motion.p>
            </motion.div>
        </div>
    );
};

export default Matching;
