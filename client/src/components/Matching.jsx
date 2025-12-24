import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import { Loader2, Users, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Matching = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocket();
    const [dots, setDots] = useState('');
    const [waitTime, setWaitTime] = useState(0);

    const preferences = location.state || {};

    useEffect(() => {
        // Animated dots
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        // Wait time counter
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

        // Join the matching queue
        console.log("Joining queue with preferences:", preferences);
        socket.emit('join-queue', preferences);

        // Handle match found
        const handleMatchFound = ({ roomId }) => {
            console.log("Match found! Navigating to room:", roomId);
            toast.success("Match found! Connecting...");
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

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
            }} />

            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 max-w-md w-full"
            >
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Animated Icon */}
                    <div className="flex justify-center mb-8">
                        <motion.div
                            animate={{
                                rotate: 360,
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                            }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
                            <div className="relative bg-gradient-to-br from-cyan-500 to-purple-500 p-6 rounded-full">
                                <Users className="w-12 h-12 text-white" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Status Text */}
                    <div className="text-center space-y-4 mb-8">
                        <h2 className="text-3xl font-bold text-white">
                            Finding Your Match{dots}
                        </h2>
                        <p className="text-neutral-400">
                            Scanning the frequencies for someone special
                        </p>

                        {/* Wait Time */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                            <span className="text-sm text-neutral-300">
                                {Math.floor(waitTime / 60)}:{(waitTime % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    {/* Preferences Display */}
                    {preferences && Object.keys(preferences).length > 0 && (
                        <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-medium text-white">Your Preferences</span>
                            </div>
                            <div className="space-y-2 text-sm text-neutral-400">
                                {preferences.interests && preferences.interests.length > 0 && (
                                    <div>
                                        <span className="text-neutral-500">Interests: </span>
                                        <span className="text-cyan-400">{preferences.interests.join(', ')}</span>
                                    </div>
                                )}
                                {preferences.mode && (
                                    <div>
                                        <span className="text-neutral-500">Mode: </span>
                                        <span className="text-purple-400 capitalize">{preferences.mode}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Cancel Button */}
                    <button
                        onClick={handleCancel}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all duration-300 hover:scale-[1.02]"
                    >
                        Cancel Search
                    </button>

                    {/* Tips */}
                    <div className="mt-6 text-center text-xs text-neutral-500">
                        <p>💡 Tip: Make sure your camera and microphone are ready</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Matching;
