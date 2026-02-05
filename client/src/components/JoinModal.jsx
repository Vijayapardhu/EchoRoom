import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
    <button
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
    </button>
);

const ModeCard = ({ mode, selected, onClick, icon }) => {
    const Icon = icon;
    return (
        <button
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
                <div className="absolute top-4 right-4">
                    <CheckCircle weight="fill" className="w-5 h-5 text-blue-400" />
                </div>
            )}
        </button>
    );
};

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

    const checkDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideo = devices.some(d => d.kind === 'videoinput');
            const hasAudio = devices.some(d => d.kind === 'audioinput');
            setDeviceStatus({ video: hasVideo, audio: hasAudio });
        } catch {
            // Device check failed
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                setStep(1);
                setRoomId(initialRoomId);
                checkDevices();
            }, 0);
        }
    }, [isOpen, initialRoomId, checkDevices]);

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
        } catch {
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
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative px-6 py-5 border-b border-white/5">
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <h2 className="text-xl font-bold text-white">Join Room</h2>
                            <p className="text-sm text-white/50 mt-1">Configure your preferences</p>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center justify-center gap-2 px-6 py-4 border-b border-white/5">
                            {steps.map((s, idx) => (
                                <React.Fragment key={s.number}>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        step >= s.number 
                                            ? 'bg-blue-500/20 text-blue-400' 
                                            : 'bg-white/5 text-white/40'
                                    }`}>
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                            step >= s.number ? 'bg-blue-500 text-white' : 'bg-white/10'
                                        }`}>
                                            {s.number}
                                        </span>
                                        {s.title}
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className="w-8 h-px bg-white/10" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Room ID (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={roomId}
                                            onChange={(e) => setRoomId(e.target.value)}
                                            placeholder="Enter room ID or leave empty for random match"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        <p className="text-xs text-white/40 mt-2">
                                            Leave empty to be matched with a random user
                                        </p>
                                    </div>
                                    
                                    {/* Device Status */}
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className={`flex items-center gap-2 ${deviceStatus.video ? 'text-green-400' : 'text-red-400'}`}>
                                            <VideoCamera weight="fill" className="w-5 h-5" />
                                            <span className="text-sm">{deviceStatus.video ? 'Camera OK' : 'No Camera'}</span>
                                        </div>
                                        <div className="w-px h-4 bg-white/10" />
                                        <div className={`flex items-center gap-2 ${deviceStatus.audio ? 'text-green-400' : 'text-red-400'}`}>
                                            <Microphone weight="fill" className="w-5 h-5" />
                                            <span className="text-sm">{deviceStatus.audio ? 'Mic OK' : 'No Mic'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
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
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
                                            <Sparkle weight="fill" className="w-4 h-4 text-yellow-400" />
                                            Select your interests
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableInterests.map(interest => (
                                                <InterestBadge
                                                    key={interest}
                                                    interest={interest}
                                                    selected={interests.includes(interest)}
                                                    onClick={() => toggleInterest(interest)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {interests.length > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-blue-400">
                                            <CheckCircle weight="fill" className="w-4 h-4" />
                                            {interests.length} interest{interests.length !== 1 ? 's' : ''} selected
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                            {step > 1 ? (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="px-4 py-2 rounded-xl text-white/60 hover:text-white transition-colors"
                                >
                                    Back
                                </button>
                            ) : (
                                <div />
                            )}
                            
                            {step < 3 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                                >
                                    Next
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl font-medium transition-colors"
                                >
                                    {isLoading ? (
                                        <>
                                            <Spinner className="w-4 h-4 animate-spin" />
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            Join
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default JoinModal;
