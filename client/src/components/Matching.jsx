import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import { 
    Spinner, 
    Users, 
    Globe, 
    Lightning,
    CheckCircle,
    Crosshair,
    Waveform,
    Radar,
    Scan,
    Cpu,
    ArrowLeft,
    Asterisk
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

const NeonButton = ({ children, onClick, icon: Icon, className = '' }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
            relative group px-6 py-3 font-bold text-xs tracking-widest uppercase overflow-hidden
            transition-all duration-300 border-2 border-white/30 text-white hover:border-white hover:bg-white/5
            ${className}
        `}
    >
        <span className="relative z-10 flex items-center gap-2">
            {Icon && <Icon weight="fill" className="w-4 h-4" />}
            {children}
        </span>
    </motion.button>
);

const Matching = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocket();
    const [dots, setDots] = useState('');
    const [waitTime, setWaitTime] = useState(0);
    const [scanAngle, setScanAngle] = useState(0);

    const preferences = location.state || {};

    useEffect(() => {
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        const timeInterval = setInterval(() => {
            setWaitTime(prev => prev + 1);
        }, 1000);

        const scanInterval = setInterval(() => {
            setScanAngle(prev => (prev + 2) % 360);
        }, 50);

        return () => {
            clearInterval(dotsInterval);
            clearInterval(timeInterval);
            clearInterval(scanInterval);
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join-queue', preferences);

        const handleMatchFound = ({ roomId }) => {
            toast.success('Connection established', { 
                icon: <CheckCircle weight="fill" className="w-5 h-5 text-cyan-400" /> 
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
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: 'rgba(0,0,0,0.9)',
                    color: '#fff',
                    border: '1px solid rgba(0, 243, 255, 0.3)',
                    borderRadius: '0',
                },
            }} />

            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black" />
                <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px)`,
                        backgroundSize: '80px 80px'
                    }}
                />
            </div>

            {/* Scan Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
                <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,243,255,0.03) 2px, rgba(0,243,255,0.03) 4px)' }} />
            </div>

            {/* Radar Animation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20 pointer-events-none">
                <div className="absolute inset-0 border border-cyan-400/30 rounded-full" />
                <div className="absolute inset-[20%] border border-cyan-400/20 rounded-full" />
                <div className="absolute inset-[40%] border border-cyan-400/10 rounded-full" />
                <motion.div 
                    className="absolute top-0 left-1/2 w-[1px] h-1/2 bg-gradient-to-b from-cyan-400 to-transparent origin-bottom"
                    style={{ rotate: scanAngle }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 max-w-lg w-full"
            >
                <div 
                    className="border border-white/10 bg-black/80 backdrop-blur-xl p-8 relative overflow-hidden"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))' }}
                >
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-20 h-[2px] bg-cyan-400" />
                    <div className="absolute top-0 left-0 w-[2px] h-20 bg-cyan-400" />
                    <div className="absolute bottom-0 right-0 w-20 h-[2px] bg-cyan-400" />
                    <div className="absolute bottom-0 right-0 w-[2px] h-20 bg-cyan-400" />

                    {/* Content */}
                    <div className="text-center space-y-8">
                        {/* Radar Icon */}
                        <div className="relative w-32 h-32 mx-auto">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0"
                            >
                                <div className="absolute inset-0 border-2 border-cyan-400/30 rounded-full" />
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#00f3ff]" />
                            </motion.div>
                            <div className="absolute inset-[30%] border border-cyan-400/20 rounded-full" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Crosshair weight="fill" className="w-12 h-12 text-cyan-400" />
                            </div>
                            {/* Pulse Rings */}
                            <motion.div
                                className="absolute inset-0 border border-cyan-400/50 rounded-full"
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute inset-0 border border-cyan-400/50 rounded-full"
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
                                Scanning{dots}
                            </h2>
                            <p className="text-white/40 uppercase tracking-widest text-xs">
                                    Initializing connection protocol
                            </p>

                            {/* Timer */}
                            <div className="inline-flex items-center gap-4 px-6 py-3 bg-black/50 border border-cyan-400/30">
                                <Spinner weight="bold" className="w-5 h-5 text-cyan-400 animate-spin" />
                                <span className="text-2xl font-mono text-cyan-400 tracking-wider">
                                    {formatTime(waitTime)}
                                </span>
                                <Waveform weight="fill" className="w-5 h-5 text-cyan-400/50" />
                            </div>
                        </div>

                        {/* Preferences */}
                        {preferences && (
                            <div className="p-4 bg-white/5 border border-white/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Asterisk weight="bold" className="w-4 h-4 text-cyan-400" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">Parameters</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {preferences.interests?.map((interest, i) => (
                                        <span key={i} className="px-2 py-1 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-xs uppercase">
                                            {interest}
                                        </span>
                                    ))}
                                    <span className="px-2 py-1 bg-white/5 border border-white/20 text-white/60 text-xs uppercase">
                                        {preferences.mode}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Cancel */}
                        <NeonButton onClick={handleCancel} icon={ArrowLeft}>
                            Abort Connection
                        </NeonButton>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Matching;
