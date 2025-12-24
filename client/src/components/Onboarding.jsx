import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Activity, X } from 'lucide-react';

const Onboarding = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [step, setStep] = useState(1);

    // State
    const [interests, setInterests] = useState([]);
    const [customInterest, setCustomInterest] = useState('');
    const [gender, setGender] = useState('');
    const [partnerGender, setPartnerGender] = useState('any');
    const [mode, setMode] = useState('video'); // video | text
    const [groupMode, setGroupMode] = useState('double'); // double | group

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
        const preferences = {
            interests,
            gender,
            partnerGender,
            mode,
            groupMode
        };
        socket.emit('join-queue', preferences);
        navigate('/room/matching', { state: preferences });
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

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
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/10'}`} />
                    ))}
                </div>

                {/* Step 1: Interests */}
                {step === 1 && (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
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
                                        <motion.div layoutId="activeGlow" className="absolute inset-0 bg-cyan-500/5" />
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
                            onClick={nextStep}
                            disabled={interests.length === 0}
                            className="w-full py-4 bg-white text-black font-bold text-lg tracking-wider uppercase hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:hover:bg-white mt-8 flex items-center justify-center gap-2 group"
                        >
                            Next Phase <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                )}

                {/* Step 2: Identity */}
                {step === 2 && (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-bold text-white tracking-tight">
                                Identity <span className="text-purple-400">Matrix</span>
                            </h2>
                            <p className="text-neutral-400 text-lg">Who are you, and who are you looking for?</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-neutral-500 uppercase tracking-wider">I am</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Male', 'Female', 'Non-binary'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setGender(g.toLowerCase())}
                                            className={`p-3 rounded-xl border transition-all ${gender === g.toLowerCase() ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Looking for</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Male', 'Female', 'Any'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setPartnerGender(g.toLowerCase())}
                                            className={`p-3 rounded-xl border transition-all ${partnerGender === g.toLowerCase() ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/10">Back</button>
                            <button
                                onClick={nextStep}
                                disabled={!gender}
                                className="flex-1 py-4 bg-white text-black font-bold text-lg tracking-wider uppercase hover:bg-purple-400 transition-colors disabled:opacity-50"
                            >
                                Next Phase
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Mode */}
                {step === 3 && (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-bold text-white tracking-tight">
                                Transmission <span className="text-green-400">Mode</span>
                            </h2>
                            <p className="text-neutral-400 text-lg">Select your communication protocol.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setMode('video')}
                                    className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${mode === 'video' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-neutral-400'}`}
                                >
                                    <Zap className="w-8 h-8" />
                                    <span className="font-bold">Video</span>
                                </button>
                                <button
                                    onClick={() => setMode('text')}
                                    className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${mode === 'text' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-neutral-400'}`}
                                >
                                    <Sparkles className="w-8 h-8" />
                                    <span className="font-bold">Text Only</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Group Size</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setGroupMode('double')}
                                        className={`p-4 rounded-xl border text-left transition-all ${groupMode === 'double' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-neutral-400'}`}
                                    >
                                        <div className="font-bold">Double (1v1)</div>
                                        <div className="text-xs opacity-70">Classic pairing</div>
                                    </button>
                                    <button
                                        onClick={() => setGroupMode('group')}
                                        className={`p-4 rounded-xl border text-left transition-all ${groupMode === 'group' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-neutral-400'}`}
                                    >
                                        <div className="font-bold">Group</div>
                                        <div className="text-xs opacity-70">Multi-user chat</div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/10">Back</button>
                            <button
                                onClick={handleMatch}
                                className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-green-500 text-black font-bold text-lg tracking-wider uppercase hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                            >
                                Initialize Link
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default Onboarding;
