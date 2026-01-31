import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Activity, X, Video, MessageCircle, Users, User, Check } from 'lucide-react';

const Onboarding = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [step, setStep] = useState(1);
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

    // State
    const [interests, setInterests] = useState([]);
    const [customInterest, setCustomInterest] = useState('');
    const [gender, setGender] = useState('');
    const [partnerGender, setPartnerGender] = useState('any');
    const [mode, setMode] = useState('video'); // video | text
    const [groupMode, setGroupMode] = useState('double'); // double | group

    // Mouse tracking for spotlight
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const availableInterests = ['Tech', 'Music', 'Gaming', 'Art', 'Movies', 'Travel', 'Food', 'Science'];
    const trendingInterests = ['Gaming', 'Music', 'Tech']; // 🔥 Trending topics

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
        <div 
            className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-cyan-500/30"
            style={{
                '--mouse-x': `${mousePosition.x}%`,
                '--mouse-y': `${mousePosition.y}%`,
            }}
        >
            {/* Dynamic Spotlight */}
            <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(6, 182, 212, 0.06), transparent 40%)`,
                }}
            />

            {/* Background Effects - Enhanced */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <motion.div 
                className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 30, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
                className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"
                animate={{
                    scale: [1, 1.3, 1],
                    y: [0, 30, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none"
                animate={{
                    opacity: step === 3 ? 0.15 : 0.05,
                }}
                transition={{ duration: 0.5 }}
            />

            {/* Grid Pattern */}
            <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full z-10"
            >
                {/* Progress Bar - Enhanced */}
                <div className="flex gap-2 mb-12">
                    {[1, 2, 3].map(i => (
                        <motion.div 
                            key={i} 
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 relative overflow-hidden ${step >= i ? 'bg-cyan-500' : 'bg-white/10'}`}
                            animate={step >= i ? { boxShadow: '0 0 15px rgba(6,182,212,0.6)' } : {}}
                        >
                            {step === i && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Step Indicator */}
                <motion.div 
                    className="flex justify-center gap-4 mb-8"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {['Interests', 'Identity', 'Mode'].map((label, i) => (
                        <div key={label} className="flex items-center gap-2">
                            <motion.div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                    step > i + 1 
                                        ? 'bg-cyan-500 text-black' 
                                        : step === i + 1 
                                            ? 'bg-white/10 text-white border border-cyan-500' 
                                            : 'bg-white/5 text-white/30'
                                }`}
                            >
                                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                            </motion.div>
                            <span className={`text-xs hidden md:block ${step >= i + 1 ? 'text-white' : 'text-white/30'}`}>{label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Step 1: Interests */}
                <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div 
                        key="step1"
                        initial={{ x: 20, opacity: 0 }} 
                        animate={{ x: 0, opacity: 1 }} 
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-8"
                    >
                        <div className="space-y-2">
                            <motion.h2 
                                className="text-4xl font-bold text-white tracking-tight"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                Signal <span className="gradient-text">Calibration</span>
                            </motion.h2>
                            <motion.p 
                                className="text-neutral-400 text-lg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                Select up to 3 frequencies to tune your connection.
                            </motion.p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {availableInterests.map((interest, index) => {
                                const isTrending = trendingInterests.includes(interest);
                                const isSelected = interests.includes(interest);
                                return (
                                    <motion.button
                                        key={interest}
                                        onClick={() => toggleInterest(interest)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${isSelected
                                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                                : isTrending
                                                    ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 text-white hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                                    : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <span className="font-medium tracking-wide">{interest}</span>
                                            {isTrending && !isSelected && (
                                                <span className="text-sm">🔥</span>
                                            )}
                                        </div>
                                        {isTrending && !isSelected && (
                                            <div className="absolute top-1 right-1">
                                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full shadow-lg">
                                                    HOT
                                                </span>
                                            </div>
                                        )}
                                        {isSelected && (
                                            <motion.div 
                                                layoutId="activeGlow" 
                                                className="absolute inset-0 bg-cyan-500/5"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Custom Interest Input - Enhanced */}
                        <motion.div 
                            className="relative"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <input
                                type="text"
                                value={customInterest}
                                onChange={(e) => setCustomInterest(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
                                placeholder="Type your own topic..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-5 pr-12 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all"
                            />
                            <motion.button
                                onClick={addCustomInterest}
                                disabled={!customInterest.trim() || interests.length >= 3}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black disabled:opacity-0 disabled:pointer-events-none transition-all font-medium"
                            >
                                Add
                            </motion.button>
                        </motion.div>

                        {/* Selected Interests Tags - Enhanced */}
                        <AnimatePresence>
                            {interests.length > 0 && (
                                <motion.div 
                                    className="flex flex-wrap gap-2"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {interests.map(interest => (
                                        <motion.span 
                                            key={interest} 
                                            layout
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                            className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-sm border border-cyan-500/30 flex items-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                        >
                                            {interest}
                                            <button onClick={() => toggleInterest(interest)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                                        </motion.span>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            onClick={nextStep}
                            disabled={interests.length === 0}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 bg-white text-black font-bold text-lg tracking-wider uppercase hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:hover:bg-white mt-8 flex items-center justify-center gap-2 group rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                            Next Phase <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </motion.div>
                )}

                {/* Step 2: Identity */}
                {step === 2 && (
                    <motion.div 
                        key="step2"
                        initial={{ x: 20, opacity: 0 }} 
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-8"
                    >
                        <div className="space-y-2">
                            <h2 className="text-4xl font-bold text-white tracking-tight">
                                Identity <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Matrix</span>
                            </h2>
                            <p className="text-neutral-400 text-lg">Who are you, and who are you looking for?</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-neutral-500 uppercase tracking-wider">I am</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Male', 'Female', 'Non-binary'].map((g, i) => (
                                        <motion.button
                                            key={g}
                                            onClick={() => setGender(g.toLowerCase())}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`p-3 rounded-xl border transition-all ${gender === g.toLowerCase() ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                                        >
                                            {g}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Looking for</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Male', 'Female', 'Any'].map((g, i) => (
                                        <motion.button
                                            key={g}
                                            onClick={() => setPartnerGender(g.toLowerCase())}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + i * 0.1 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`p-3 rounded-xl border transition-all ${partnerGender === g.toLowerCase() ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                                        >
                                            {g}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <motion.button 
                                onClick={prevStep} 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all"
                            >
                                Back
                            </motion.button>
                            <motion.button
                                onClick={nextStep}
                                disabled={!gender}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-4 bg-white text-black font-bold text-lg tracking-wider uppercase hover:bg-purple-400 transition-all disabled:opacity-50 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                            >
                                Next Phase
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Mode */}
                {step === 3 && (
                    <motion.div 
                        key="step3"
                        initial={{ x: 20, opacity: 0 }} 
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-8"
                    >
                        <div className="space-y-2">
                            <h2 className="text-4xl font-bold text-white tracking-tight">
                                Transmission <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">Mode</span>
                            </h2>
                            <p className="text-neutral-400 text-lg">Select your communication protocol.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <motion.button
                                    onClick={() => setMode('video')}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${mode === 'video' ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.3)]' : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                                >
                                    <motion.div
                                        animate={mode === 'video' ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <Video className="w-8 h-8" />
                                    </motion.div>
                                    <span className="font-bold">Video</span>
                                    <span className="text-xs opacity-60">Face-to-face chat</span>
                                </motion.button>
                                <motion.button
                                    onClick={() => setMode('text')}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${mode === 'text' ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.3)]' : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                                >
                                    <MessageCircle className="w-8 h-8" />
                                    <span className="font-bold">Text Only</span>
                                    <span className="text-xs opacity-60">Anonymous messaging</span>
                                </motion.button>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Group Size</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <motion.button
                                        onClick={() => setGroupMode('double')}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${groupMode === 'double' ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                                    >
                                        <User className="w-6 h-6" />
                                        <div>
                                            <div className="font-bold">1v1</div>
                                            <div className="text-xs opacity-70">Classic pairing</div>
                                        </div>
                                    </motion.button>
                                    <motion.button
                                        onClick={() => setGroupMode('group')}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${groupMode === 'group' ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                                    >
                                        <Users className="w-6 h-6" />
                                        <div>
                                            <div className="font-bold">Group</div>
                                            <div className="text-xs opacity-70">Multi-user chat</div>
                                        </div>
                                    </motion.button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <motion.button 
                                onClick={prevStep} 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-6 py-4 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all"
                            >
                                Back
                            </motion.button>
                            <motion.button
                                onClick={handleMatch}
                                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(34,197,94,0.5)' }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-green-500 text-black font-bold text-lg tracking-wider uppercase rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-2"
                            >
                                <Zap className="w-5 h-5" />
                                Initialize Link
                            </motion.button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Onboarding;
