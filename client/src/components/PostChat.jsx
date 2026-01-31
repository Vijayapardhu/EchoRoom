import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ThumbsUp, 
    ThumbsDown, 
    House, 
    ArrowClockwise, 
    ChatCircle, 
    UserPlus, 
    Heart, 
    Star, 
    Copy,
    Smiley,
    Question,
    HandWaving,
    Sparkle,
    CheckCircle,
    Lightning
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

const emojiReactions = [
    { id: 'happy', icon: Smiley, color: 'text-yellow-400', bg: 'from-yellow-400 to-orange-500', label: 'Happy' },
    { id: 'thinking', icon: Question, color: 'text-cyan-400', bg: 'from-blue-400 to-cyan-500', label: 'Interesting' },
    { id: 'wave', icon: HandWaving, color: 'text-pink-400', bg: 'from-pink-400 to-rose-500', label: 'Goodbye' },
    { id: 'love', icon: Heart, color: 'text-red-400', bg: 'from-red-400 to-pink-500', label: 'Loved it' },
];

const PostChat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [rating, setRating] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendCode, setFriendCode] = useState('');

    const partnerInfo = location.state?.partner || null;

    const handleSubmit = () => {
        console.log({ rating, feedback });
        toast.success('Thanks for your feedback!', {
            icon: <CheckCircle weight="fill" className="w-5 h-5 text-green-400" />
        });
        setRating(null);
        setFeedback('');
    };

    const generateFriendCode = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setFriendCode(code);
        setShowAddFriend(true);
    };

    const copyFriendCode = () => {
        navigator.clipboard.writeText(friendCode);
        toast.success('Friend code copied!', {
            icon: <CheckCircle weight="fill" className="w-5 h-5 text-green-400" />
        });
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: 'rgba(0,0,0,0.9)',
                    color: '#fff',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                },
            }} />
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
            <motion.div 
                className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div 
                className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"
                animate={{ scale: [1, 1.3, 1], x: [0, 30, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl"
            >
                <motion.div 
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <motion.div 
                        className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        <ChatCircle weight="fill" className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-2">Chat Ended</h2>
                    <p className="text-neutral-400">How was your conversation?</p>
                </motion.div>

                <motion.div 
                    className="flex justify-center gap-4 mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <motion.button
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRating('good')}
                        className={`p-5 rounded-2xl border-2 transition-all ${rating === 'good' ? 'bg-green-500/20 border-green-500 text-green-400 shadow-lg shadow-green-500/30' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20'}`}
                    >
                        <ThumbsUp weight="fill" className="w-8 h-8" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRating('bad')}
                        className={`p-5 rounded-2xl border-2 transition-all ${rating === 'bad' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/30' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:border-white/20'}`}
                    >
                        <ThumbsDown weight="fill" className="w-8 h-8" />
                    </motion.button>
                </motion.div>

                <motion.div 
                    className="flex justify-center gap-3 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {emojiReactions.map((emoji, i) => (
                        <motion.button
                            key={emoji.id}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 400 }}
                            whileHover={{ scale: 1.2, y: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toast(
                                <div className="flex items-center gap-2">
                                    <emoji.icon weight="fill" className={`w-5 h-5 ${emoji.color}`} />
                                    <span>{emoji.label}</span>
                                </div>,
                                { duration: 1500 }
                            )}
                            className="group relative"
                            title={emoji.label}
                        >
                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${emoji.bg} flex items-center justify-center shadow-lg transition-shadow group-hover:shadow-xl`}>
                                <emoji.icon weight="fill" className="w-5 h-5 text-white drop-shadow-md" />
                            </div>
                        </motion.button>
                    ))}
                </motion.div>

                <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Any additional comments? (Optional)"
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all resize-none h-24"
                    />
                    {rating && (
                        <motion.button
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/10 text-sm font-medium text-white hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
                        >
                            Submit Feedback
                        </motion.button>
                    )}
                </motion.div>

                {!showAddFriend ? (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={generateFriendCode}
                        className="w-full py-3 mb-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400 font-medium rounded-xl flex items-center justify-center gap-2 hover:from-pink-500/30 hover:to-purple-500/30 transition-all shadow-[0_0_20px_rgba(236,72,153,0.1)]"
                    >
                        <UserPlus weight="fill" className="w-5 h-5" />
                        Want to reconnect? Get Friend Code
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-4 p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl"
                    >
                        <p className="text-sm text-neutral-400 mb-2 text-center">Share this code with your chat partner</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-black/50 rounded-lg px-4 py-3 text-center border border-white/10">
                                <span className="text-2xl font-mono font-bold text-white tracking-widest">{friendCode}</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={copyFriendCode}
                                className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 rounded-lg transition-colors shadow-lg shadow-pink-500/30"
                            >
                                <Copy weight="fill" className="w-5 h-5 text-white" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/room/matching')}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/30 group"
                    >
                        <ArrowClockwise weight="bold" className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        Find New Match
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-white/5 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors border border-white/10"
                    >
                        <House weight="fill" className="w-5 h-5" />
                        Return Home
                    </motion.button>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default PostChat;
