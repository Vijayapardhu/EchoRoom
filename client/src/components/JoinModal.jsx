import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    VideoCamera, 
    Microphone, 
    Users, 
    ArrowRight,
    Spinner,
    Sparkle,
    CheckCircle
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';

const InterestBadge = ({ interest, selected, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
            ${selected 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
            }
        `}
    >
        {interest}
    </motion.button>
);

const ModeCard = ({ mode, selected, onClick, icon: Icon }) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
            relative p-6 rounded-2xl border transition-all duration-300 text-left w-full
            ${selected 
                ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }
        `}
    >
        <div className={`
            inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-colors
            ${selected ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}
        `}>
            <Icon weight="fill" className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-white mb-1">{mode === 'video' ? 'Video Chat' : 'Text Only'}</h4>
        <p className="text-sm text-white/50">
            {mode === 'video' ? 'Face-to-face conversations' : 'Chat without camera'}
        </p>
        
        {selected && (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4"
            >
                <CheckCircle weight="fill" className="w-5 h-5 text-blue-400" />
            </motion.div>
        )}
    </motion.button>
);

const JoinModal = ({ isOpen, onClose, initialRoomId = '' }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [roomId, setRoomId] = useState(initialRoomId);
    const [mode, setMode] = useState('video');
    const [interests, setInterests] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deviceStatus, setDeviceStatus] = useState({ video: false, audio: false });

    const availableInterests = [
        'Technology', 'Music', 'Sports', 'Gaming', 'Art', 'Movies',
        'Travel', 'Food', 'Books', 'Science', 'Photography', 'Business'
    ];

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setRoomId(initialRoomId);
            checkDevices();
        }
    }, [isOpen, initialRoomId]);

    const checkDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideo = devices.some(d => d.kind === 'videoinput');
            const hasAudio = devices.some(d => d.kind === 'audioinput');
            setDeviceStatus({ video: hasVideo, audio: hasAudio });
        } catch (err) {
            console.error('Device check failed:', err);
        }
    };

    const toggleInterest = (interest) => {
        setInterests(prev => 
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleJoin = useCallback(async () => {
        setIsLoading(true);
        
        try {
            if (roomId) {
                navigate(`/room/${roomId}`, { state: { mode, interests } });
            } else {
                navigate('/matching', { state: { mode, interests } });
            }
        } catch (err) {
            toast.error('Failed to join. Please try again.');
            setIsLoading(false);
        }
    }, [roomId, mode, interests, navigate]);

    const steps = [
        { number: 1, title: 'Room' },
        { number: 2, title: 'Mode' },
        { number: 3, title: 'Interests' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative px-6 py-5 border-b border-white/5">
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <X weight="bold" className="w-5 h-5" />
                            </button>
                            
                            <div className="flex items-center gap-2">
                                <Sparkle weight="fill" className="w-5 h-5 text-violet-400" />
                                <h2 className="text-xl font-bold text-white">
                                    {roomId ? 'Join Room' : 'Start Chatting'}
                                </h2>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="flex px-6 py-4 bg-white/[0.02]">
                            {steps.map((s, index) => (
                                <div key={s.number} className="flex items-center">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                                        ${step >= s.number ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'}
                                    `}>
                                        {s.number}
                                    </div>
                                    <span className={`
                                        ml-2 text-sm transition-colors hidden sm:inline
                                        ${step >= s.number ? 'text-white' : 'text-white/40'}
                                    `}>
                                        {s.title}
                                    </span>
                                    {index < steps.length - 1 && (
                                        <div className={`
                                            w-8 h-px mx-2 transition-colors
                                            ${step > s.number ? 'bg-blue-500' : 'bg-white/10'}
                                        `} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Step 1: Room ID */}
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <p className="text-white/50 text-sm">
                                        {roomId 
                                            ? 'Ready to join this room:' 
                                            : 'Leave empty to be matched with a random partner, or enter a room ID:'
                                        }
                                    </p>
                                    
                                    <input
                                        type="text"
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                        placeholder="Enter room ID (optional)"
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors text-center font-mono tracking-widest text-lg"
                                    />
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setStep(2)}
                                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25"
                                    >
                                        Continue
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* Step 2: Mode */}
                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <p className="text-white/50 text-sm">Choose how you want to connect:</p>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <ModeCard
                                            mode="video"
                                            selected={mode === 'video'}
                                            onClick={() => setMode('video')}
                                            icon={VideoCamera}
                                        />
                                        <ModeCard
                                            mode="text"
                                            selected={mode === 'text'}
                                            onClick={() => setMode('text')}
                                            icon={Users}
                                        />
                                    </div>

                                    {mode === 'video' && !deviceStatus.video && (
                                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
                                            <Microphone weight="fill" className="w-5 h-5 text-yellow-400" />
                                            <span className="text-sm text-yellow-400/80">
                                                No camera detected. You'll use audio only.
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setStep(1)}
                                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            Back
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setStep(3)}
                                            className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25"
                                        >
                                            Continue
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Interests */}
                            {step === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <p className="text-white/50 text-sm">
                                        Select interests to find better matches (optional):
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto py-2">
                                        {availableInterests.map((interest) => (
                                            <InterestBadge
                                                key={interest}
                                                interest={interest}
                                                selected={interests.includes(interest)}
                                                onClick={() => toggleInterest(interest)}
                                            />
                                        ))}
                                    </div>
                                    
                                    {interests.length > 0 && (
                                        <p className="text-sm text-blue-400">
                                            {interests.length} interest{interests.length !== 1 ? 's' : ''} selected
                                        </p>
                                    )}
                                    
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setStep(2)}
                                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            Back
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleJoin}
                                            disabled={isLoading}
                                            className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <Spinner weight="bold" className="w-5 h-5 animate-spin mx-auto" />
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    Start <ArrowRight weight="bold" className="w-5 h-5" />
                                                </span>
                                            )}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5">
                            <div className="flex items-center justify-center gap-6 text-xs text-white/30">
                                <div className="flex items-center gap-2">
                                    <VideoCamera weight="fill" className="w-4 h-4" />
                                    <span>HD Video</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Microphone weight="fill" className="w-4 h-4" />
                                    <span>Crystal Audio</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle weight="fill" className="w-4 h-4" />
                                    <span>No Data Stored</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default JoinModal;
