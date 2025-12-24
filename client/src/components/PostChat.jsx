import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Home, RefreshCw, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const PostChat = () => {
    const navigate = useNavigate();
    const [rating, setRating] = useState(null);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        // In a real app, send this to backend
        console.log({ rating, feedback });
        toast.success('Thanks for your feedback!');
        setRating(null);
        setFeedback('');
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Chat Ended</h2>
                    <p className="text-neutral-400">How was your conversation?</p>
                </div>

                {/* Rating */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setRating('good')}
                        className={`p-4 rounded-2xl border transition-all ${rating === 'good' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'}`}
                    >
                        <ThumbsUp className="w-8 h-8" />
                    </button>
                    <button
                        onClick={() => setRating('bad')}
                        className={`p-4 rounded-2xl border transition-all ${rating === 'bad' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'}`}
                    >
                        <ThumbsDown className="w-8 h-8" />
                    </button>
                </div>

                {/* Feedback Text */}
                <div className="mb-8">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Any additional comments? (Optional)"
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none h-24"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!rating}
                        className="w-full mt-2 py-2 rounded-lg bg-white/5 text-sm font-medium text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-all"
                    >
                        Submit Feedback
                    </button>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/room/matching')}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors group"
                    >
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        Find New Match
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-white/5 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Return Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PostChat;
