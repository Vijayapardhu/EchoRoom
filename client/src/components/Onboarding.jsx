import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Activity, X } from 'lucide-react';

const Onboarding = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [step, setStep] = useState(1);
    const [interests, setInterests] = useState([]);
    const [customInterest, setCustomInterest] = useState('');
    const [intent, setIntent] = useState('');

    const availableInterests = ['Tech', 'Music', 'Gaming', 'Art', 'Movies', 'Travel', 'Food', 'Science'];

    const toggleInterest = (interest) => {
        if (interests.includes(interest)) {
            setInterests(interests.filter(i => i !== interest));
        } else {
            if (interests.length < 3) {
                setInterests([...interests, interest]);
            }
        }
    };

    const addCustomInterest = () => {
        if (customInterest.trim() && !interests.includes(customInterest.trim()) && interests.length < 3) {
            setInterests([...interests, customInterest.trim()]);
            setCustomInterest('');
        }
    };

    const handleMatch = () => {
        socket.emit('join-queue', { interests, intent });
        navigate('/room/matching');
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-cyan-500/30">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full z-10"
            >
                {/* Progress Bar */}
                <div className="flex gap-2 mb-12">
                    <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/10'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/10'}`} />
                </div>

                {step === 1 ? (
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-bold text-white tracking-tight">
                                Signal <span className="text-cyan-400">Calibration</span>
                            </h2>
                            <p className="text-neutral-400 text-lg">Select up to 3 frequencies to tune your connection.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {availableInterests.map((interest) => (
                                <button
                                    key={interest}
                                    onClick={() => toggleInterest(interest)}
                                    className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${interests.includes(interest)
                                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                        : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                >
                                    <span className="relative z-10 font-medium tracking-wide">{interest}</span>
                                    {interests.includes(interest) && (
                                        <motion.div
                                            layoutId="activeGlow"
                                            className="absolute inset-0 bg-cyan-500/5"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Custom Interest Input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={customInterest}
                                onChange={(e) => setCustomInterest(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
                                placeholder="Type your own topic..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-5 pr-12 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                            />
                            <button
                                onClick={addCustomInterest}
                                disabled={!customInterest.trim() || interests.length >= 3}
                                className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black disabled:opacity-0 disabled:pointer-events-none transition-all font-medium"
                            >
                                Add
                            </button>
                        </div>

                        {/* Selected Interests Tags */}
                        {interests.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {interests.map(interest => (
                                    <span key={interest} className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-sm border border-cyan-500/30 flex items-center gap-2">
                                        {interest}
                                        <button onClick={() => toggleInterest(interest)} className="hover:text-white"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setStep(2)}
                            disabled={interests.length === 0}
                            className="w-full py-4 bg-white text-black font-bold text-lg tracking-wider uppercase hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:hover:bg-white mt-8 flex items-center justify-center gap-2 group"
                        >
                            Next Phase <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-bold text-white tracking-tight">
                                Connection <span className="text-purple-400">Intent</span>
                            </h2>
                            <p className="text-neutral-400 text-lg">What are you looking for right now?</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: 'casual', label: 'Casual Chat', icon: <Sparkles className="w-5 h-5" />, desc: 'Just vibing' },
                                { id: 'deep', label: 'Deep Talk', icon: <Activity className="w-5 h-5" />, desc: 'Meaningful conversation' },
                                { id: 'fun', label: 'Entertainment', icon: <Zap className="w-5 h-5" />, desc: 'Jokes and fun' }
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setIntent(option.id)}
                                    className={`w-full p-6 rounded-xl border text-left transition-all duration-300 flex items-center gap-4 group ${intent === option.id
                                        ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`p-3 rounded-full ${intent === option.id ? 'bg-purple-500 text-black' : 'bg-white/10 text-neutral-400 group-hover:text-white'
                                        }`}>
                                        {option.icon}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg ${intent === option.id ? 'text-white' : 'text-neutral-300'}`}>
                                            {option.label}
                                        </h3>
                                        <p className="text-sm text-neutral-500">{option.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleMatch}
                            disabled={!intent}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-lg tracking-wider uppercase hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50 disabled:shadow-none mt-8"
                        >
                            Initialize Link
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Onboarding;
