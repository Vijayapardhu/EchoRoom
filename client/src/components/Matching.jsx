import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Spinner, 
    CheckCircle,
    Crosshair,
    ArrowLeft,
    Lightning,
    Clock,
    GenderMale,
    GenderFemale,
    Tag,
    User,
    ArrowRight,
    Warning
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

const INTERESTS_LIST = [
    'Technology', 'Music', 'Sports', 'Gaming', 'Art', 'Movies',
    'Travel', 'Food', 'Books', 'Science', 'Photography', 'Business',
    'Fashion', 'Fitness', 'Education', 'Politics', 'History', 'Nature',
    'Dancing', 'Singing', 'Cooking', 'Coding', 'Design', 'Writing'
];

const Matching = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocket();
    
    // Check if we have required info from location state (from Create Room)
    const hasInitialInfo = location.state?.peerInfo || location.state?.interests?.length > 0;
    
    const [showSetup, setShowSetup] = useState(!hasInitialInfo);
    const [isMatching, setIsMatching] = useState(hasInitialInfo);
    
    // User info states
    const [userName, setUserName] = useState(() => localStorage.getItem('echoroom_username') || '');
    const [gender, setGender] = useState(() => localStorage.getItem('echoroom_gender') || '');
    const [selectedInterests, setSelectedInterests] = useState(() => {
        const saved = localStorage.getItem('echoroom_interests');
        return saved ? JSON.parse(saved) : [];
    });
    const [errors, setErrors] = useState({});
    
    // Matching states
    const [dots, setDots] = useState('');
    const [waitTime, setWaitTime] = useState(0);

    const preferences = location.state || {};

    // Validation
    const validate = () => {
        const newErrors = {};
        if (!gender) newErrors.gender = 'Please select your gender';
        if (selectedInterests.length === 0) newErrors.interests = 'Select at least one interest';
        if (selectedInterests.length > 5) newErrors.interests = 'Max 5 interests allowed';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleStartMatching = () => {
        if (!validate()) return;
        
        // Save to localStorage
        localStorage.setItem('echoroom_username', userName);
        localStorage.setItem('echoroom_gender', gender);
        localStorage.setItem('echoroom_interests', JSON.stringify(selectedInterests));
        
        setShowSetup(false);
        setIsMatching(true);
    };

    const toggleInterest = (interest) => {
        setSelectedInterests(prev => {
            if (prev.includes(interest)) {
                return prev.filter(i => i !== interest);
            }
            if (prev.length >= 5) return prev;
            return [...prev, interest];
        });
    };

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
        if (!socket || !isMatching) return;

        const peerInfo = {
            name: userName || 'Anonymous',
            gender,
            interests: selectedInterests
        };

        socket.emit('join-queue', { 
            ...preferences, 
            peerInfo,
            interests: selectedInterests 
        });

        const handleMatchFound = ({ roomId }) => {
            toast.success('Match found! Connecting...', { 
                icon: <CheckCircle weight="fill" className="w-5 h-5 text-emerald-400" /> 
            });
            navigate(`/room/${roomId}`, { 
                state: { 
                    ...preferences, 
                    peerInfo,
                    userName,
                    gender,
                    interests: selectedInterests
                }, 
                replace: true 
            });
        };

        socket.on('match-found', handleMatchFound);

        return () => {
            socket.off('match-found', handleMatchFound);
        };
    }, [socket, navigate, preferences, isMatching, userName, gender, selectedInterests]);

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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
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
            </div>

            <AnimatePresence mode="wait">
                {showSetup ? (
                    /* Setup Screen - Omegle Style */
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative z-10 w-full max-w-md"
                    >
                        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">Tell us about you</h2>
                                <p className="text-white/50 text-sm">Help us find the perfect match</p>
                            </div>

                            {/* Name Input (Optional) */}
                            <div className="mb-6">
                                <label className="flex items-center gap-2 text-sm text-white/70 mb-3">
                                    <User weight="bold" className="w-4 h-4 text-blue-400" />
                                    Your Name <span className="text-white/30">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Enter your name"
                                    maxLength={20}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>

                            {/* Gender Selection (Required) */}
                            <div className="mb-6">
                                <label className="flex items-center gap-2 text-sm text-white/70 mb-3">
                                    <GenderMale weight="bold" className="w-4 h-4 text-blue-400" />
                                    Gender <span className="text-red-400">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setGender('male')}
                                        className={`flex items-center justify-center gap-2 py-4 rounded-xl border transition-all ${
                                            gender === 'male' 
                                                ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                        }`}
                                    >
                                        <GenderMale weight="bold" className="w-5 h-5" />
                                        <span className="font-medium">Male</span>
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setGender('female')}
                                        className={`flex items-center justify-center gap-2 py-4 rounded-xl border transition-all ${
                                            gender === 'female' 
                                                ? 'bg-pink-500/20 border-pink-500 text-pink-400' 
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                        }`}
                                    >
                                        <GenderFemale weight="bold" className="w-5 h-5" />
                                        <span className="font-medium">Female</span>
                                    </motion.button>
                                </div>
                                {errors.gender && (
                                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                        <Warning weight="fill" className="w-3 h-3" /> {errors.gender}
                                    </p>
                                )}
                            </div>

                            {/* Interests Selection (Required) */}
                            <div className="mb-8">
                                <label className="flex items-center gap-2 text-sm text-white/70 mb-3">
                                    <Tag weight="bold" className="w-4 h-4 text-violet-400" />
                                    Interests <span className="text-red-400">*</span>
                                    <span className="text-white/30 ml-auto">{selectedInterests.length}/5</span>
                                </label>
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                                    {INTERESTS_LIST.map((interest) => (
                                        <motion.button
                                            key={interest}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleInterest(interest)}
                                            disabled={!selectedInterests.includes(interest) && selectedInterests.length >= 5}
                                            className={`
                                                px-3 py-2 rounded-full text-sm font-medium transition-all
                                                ${selectedInterests.includes(interest) 
                                                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' 
                                                    : selectedInterests.length >= 5
                                                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                                                }
                                            `}
                                        >
                                            {interest}
                                        </motion.button>
                                    ))}
                                </div>
                                {errors.interests && (
                                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                        <Warning weight="fill" className="w-3 h-3" /> {errors.interests}
                                    </p>
                                )}
                            </div>

                            {/* Start Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleStartMatching}
                                className="w-full py-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
                            >
                                Start Matching
                                <ArrowRight weight="bold" className="w-5 h-5" />
                            </motion.button>

                            {/* Back Button */}
                            <button
                                onClick={() => navigate('/')}
                                className="w-full mt-4 py-3 text-white/50 hover:text-white text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft weight="bold" className="w-4 h-4" />
                                Back to Home
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    /* Matching Screen */
                    <motion.div
                        key="matching"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
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

                            {/* Your Info Display */}
                            <div className="mb-8 p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightning weight="fill" className="w-4 h-4 text-violet-400" />
                                    <span className="text-sm font-medium text-white/60">You</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {userName && (
                                        <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-medium">
                                            {userName}
                                        </span>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                        gender === 'male' ? 'bg-blue-400/20 text-blue-400' : 'bg-pink-400/20 text-pink-400'
                                    }`}>
                                        {gender === 'male' ? <GenderMale weight="fill" className="w-3 h-3" /> : <GenderFemale weight="fill" className="w-3 h-3" />}
                                        {gender}
                                    </span>
                                    {selectedInterests.map((interest, i) => (
                                        <span key={i} className="px-3 py-1 bg-violet-400/20 text-violet-400 rounded-full text-xs font-medium">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>

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
                )}
            </AnimatePresence>
        </div>
    );
};

export default Matching;
