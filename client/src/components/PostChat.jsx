import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ArrowRight,
    ThumbsUp,
    ThumbsDown,
    ArrowClockwise,
    House,
    ShareNetwork,
    Heart,
    Star,
    Users,
    ChatCircleText,
    ShieldCheck,
    Copy,
    CheckCircle
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';

const PostChat = () => {
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleFeedback = (type) => {
        setFeedback(type);
        toast.success('Thanks for your feedback!');
    };

    const handleNewChat = () => {
        navigate('/matching', { state: { mode: 'video', interests: [] } });
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleShare = () => {
        navigator.clipboard.writeText('https://echoroom.app');
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-950 to-slate-950" />
                
                {/* Animated particles */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-ping" />
                <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-violet-400/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-emerald-400/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 max-w-lg w-full"
            >
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="relative w-24 h-24 mx-auto mb-6"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full animate-pulse" />
                            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <CheckCircle weight="bold" className="w-10 h-10 text-white" />
                            </div>
                            {/* Orbit effect */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-[-8px] border border-white/10 rounded-full"
                            />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl md:text-3xl font-bold text-white mb-3"
                        >
                            Chat Ended
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/50"
                        >
                            Thanks for using EchoRoom. Your conversation was private and secure.
                        </motion.p>
                    </div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="grid grid-cols-3 gap-4 mb-10"
                    >
                        <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                            <ChatCircleText weight="fill" className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">P2P</div>
                            <div className="text-xs text-white/40">Direct Connection</div>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                            <ShieldCheck weight="fill" className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">100%</div>
                            <div className="text-xs text-white/40">Encrypted</div>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                            <Users weight="fill" className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">0</div>
                            <div className="text-xs text-white/40">Data Stored</div>
                        </div>
                    </motion.div>

                    {/* Feedback */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mb-10"
                    >
                        <p className="text-sm text-white/50 text-center mb-4">How was your experience?</p>
                        <div className="flex justify-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleFeedback('positive')}
                                className={`
                                    p-4 rounded-2xl transition-all
                                    ${feedback === 'positive' 
                                        ? 'bg-emerald-500/20 border-emerald-500/50' 
                                        : 'bg-white/5 hover:bg-white/10 border-transparent'
                                    }
                                    border
                                `}
                            >
                                <ThumbsUp 
                                    weight={feedback === 'positive' ? 'fill' : 'bold'}
                                    className={`w-6 h-6 ${feedback === 'positive' ? 'text-emerald-400' : 'text-white/60'}`}
                                />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleFeedback('negative')}
                                className={`
                                    p-4 rounded-2xl transition-all
                                    ${feedback === 'negative' 
                                        ? 'bg-red-500/20 border-red-500/50' 
                                        : 'bg-white/5 hover:bg-white/10 border-transparent'
                                    }
                                    border
                                `}
                            >
                                <ThumbsDown 
                                    weight={feedback === 'negative' ? 'fill' : 'bold'}
                                    className={`w-6 h-6 ${feedback === 'negative' ? 'text-red-400' : 'text-white/60'}`}
                                />
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="space-y-3"
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNewChat}
                            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowClockwise weight="bold" className="w-5 h-5" />
                            Start New Chat
                        </motion.button>

                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGoHome}
                                className="flex-1 py-4 px-6 rounded-2xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <House weight="bold" className="w-5 h-5" />
                                Home
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleShare}
                                className="flex-1 py-4 px-6 rounded-2xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle weight="fill" className="w-5 h-5 text-emerald-400" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <ShareNetwork weight="bold" className="w-5 h-5" />
                                        Share
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>

                {/* Footer note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-center text-white/30 text-sm mt-6"
                >
                    Spread the word about private video chat
                </motion.p>
            </motion.div>
        </div>
    );
};

export default PostChat;
