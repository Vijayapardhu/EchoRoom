import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ThumbsUp, 
    ThumbsDown, 
    House, 
    ArrowClockwise, 
    ChatCircle, 
    UserPlus, 
    Heart, 
    Smiley,
    Question,
    HandWaving,
    Copy,
    CheckCircle,
    Lightning,
    Crosshair,
    Scan,
    X
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

const NeonButton = ({ children, onClick, primary = false, icon: Icon, className = '' }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
            relative group px-8 py-4 font-bold text-sm tracking-widest uppercase overflow-hidden
            transition-all duration-300
            ${primary 
                ? 'bg-transparent text-cyan-400 border-2 border-cyan-400 hover:bg-cyan-400/10' 
                : 'bg-transparent text-white border-2 border-white/30 hover:border-white hover:bg-white/5'
            }
            ${className}
        `}
        style={{
            clipPath: primary ? 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            boxShadow: primary ? '0 0 20px rgba(0, 243, 255, 0.3), inset 0 0 20px rgba(0, 243, 255, 0.1)' : 'none'
        }}
    >
        <span className="relative z-10 flex items-center gap-3">
            {Icon && <Icon weight="fill" className="w-5 h-5" />}
            {children}
        </span>
        {primary && (
            <>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_#00f3ff]" />
                <div className="absolute bottom-0 right-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_#00f3ff]" />
            </>
        )}
    </motion.button>
);

const SharpCard = ({ children, selected, onClick, icon: Icon, label }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
            p-6 border transition-all relative overflow-hidden
            ${selected 
                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' 
                : 'border-white/10 bg-white/5 text-white/50 hover:border-white/30 hover:text-white'
            }
        `}
        style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
    >
        {selected && <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400" />}
        <Icon weight="fill" className="w-8 h-8 mx-auto mb-2" />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </motion.button>
);

const ReactionButton = ({ icon: Icon, color, label, onClick }) => {
    const colorClasses = {
        yellow: 'from-yellow-400 to-orange-500',
        blue: 'from-blue-400 to-cyan-500',
        pink: 'from-pink-400 to-rose-500',
        red: 'from-red-400 to-pink-500'
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className="group relative"
        >
            <div className={`w-12 h-12 border border-white/20 bg-gradient-to-br ${colorClasses[color]} bg-opacity-20 flex items-center justify-center transition-all group-hover:border-white/50`}
                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
            >
                <Icon weight="fill" className="w-6 h-6 text-white" />
            </div>
        </motion.button>
    );
};

const PostChat = () => {
    const navigate = useNavigate();
    const [rating, setRating] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendCode, setFriendCode] = useState('');

    const handleSubmit = () => {
        toast.success('Feedback transmitted', {
            icon: <CheckCircle weight="fill" className="w-5 h-5 text-cyan-400" />
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
        toast.success('Code copied to clipboard', {
            icon: <CheckCircle weight="fill" className="w-5 h-5 text-cyan-400" />
        });
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
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

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full relative z-10"
            >
                <div 
                    className="border border-white/10 bg-black/80 backdrop-blur-xl p-8 relative overflow-hidden"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 40px 100%, 0 calc(100% - 40px))' }}
                >
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-20 h-[2px] bg-cyan-400" />
                    <div className="absolute top-0 left-0 w-[2px] h-20 bg-cyan-400" />
                    <div className="absolute bottom-0 right-0 w-20 h-[2px] bg-cyan-400" />
                    <div className="absolute bottom-0 right-0 w-[2px] h-20 bg-cyan-400" />

                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div 
                            className="w-20 h-20 border border-cyan-400/30 bg-cyan-400/5 flex items-center justify-center mx-auto mb-4"
                            style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        >
                            <Scan weight="fill" className="w-10 h-10 text-cyan-400" />
                        </motion.div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Session Ended</h2>
                        <p className="text-white/40 uppercase tracking-widest text-xs">Transmit session feedback</p>
                    </div>

                    {/* Rating */}
                    <div className="flex justify-center gap-4 mb-8">
                        <SharpCard
                            icon={ThumbsUp}
                            label="Positive"
                            selected={rating === 'good'}
                            onClick={() => setRating('good')}
                        />
                        <SharpCard
                            icon={ThumbsDown}
                            label="Negative"
                            selected={rating === 'bad'}
                            onClick={() => setRating('bad')}
                        />
                    </div>

                    {/* Reactions */}
                    <div className="flex justify-center gap-4 mb-8">
                        {[
                            { icon: Smiley, color: 'yellow', label: 'Happy' },
                            { icon: Question, color: 'blue', label: 'Curious' },
                            { icon: HandWaving, color: 'pink', label: 'Farewell' },
                            { icon: Heart, color: 'red', label: 'Loved' },
                        ].map((emoji) => (
                            <ReactionButton
                                key={emoji.label}
                                icon={emoji.icon}
                                color={emoji.color}
                                label={emoji.label}
                                onClick={() => toast(
                                    <div className="flex items-center gap-2">
                                        <emoji.icon weight="fill" className="w-5 h-5 text-cyan-400" />
                                        <span>{emoji.label}</span>
                                    </div>,
                                    { duration: 1500 }
                                )}
                            />
                        ))}
                    </div>

                    {/* Feedback */}
                    <div className="mb-8">
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Additional telemetry (optional)..."
                            className="w-full bg-black/50 border border-white/10 p-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 transition-colors resize-none h-24 uppercase tracking-wider"
                            style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
                        />
                        {rating && (
                            <motion.button
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                className="w-full mt-3 py-3 border border-cyan-400/30 bg-cyan-400/5 text-cyan-400 text-xs font-bold uppercase tracking-widest hover:bg-cyan-400/10 transition-all"
                            >
                                Transmit Feedback
                            </motion.button>
                        )}
                    </div>

                    {/* Friend Code */}
                    {!showAddFriend ? (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={generateFriendCode}
                            className="w-full py-3 mb-4 border border-purple-400/30 bg-purple-400/5 text-purple-400 font-bold text-xs uppercase tracking-widest hover:bg-purple-400/10 transition-all flex items-center justify-center gap-2"
                        >
                            <UserPlus weight="fill" className="w-5 h-5" />
                            Generate Reconnect Code
                        </motion.button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-4 p-4 border border-purple-400/20 bg-purple-400/5"
                        >
                            <p className="text-xs text-white/40 mb-2 text-center uppercase tracking-wider">Share with partner</p>
                            <div className="flex items-center gap-2">
                                <div 
                                    className="flex-1 bg-black/50 border border-white/10 px-4 py-3 text-center"
                                    style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
                                >
                                    <span className="text-2xl font-mono font-bold text-white tracking-widest">{friendCode}</span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={copyFriendCode}
                                    className="p-3 border-2 border-purple-400 bg-purple-400/10 hover:bg-purple-400 hover:text-black transition-all"
                                    style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                                >
                                    <Copy weight="fill" className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        <NeonButton onClick={() => navigate('/room/matching')} primary icon={ArrowClockwise}>
                            New Connection
                        </NeonButton>
                        <NeonButton onClick={() => navigate('/')} icon={House}>
                            Return to Base
                        </NeonButton>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PostChat;
