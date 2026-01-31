import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowRight, 
    Lightning, 
    X, 
    VideoCamera, 
    ChatCircle, 
    UsersThree, 
    User,
    Check,
    Fire,
    Crosshair,
    GenderMale,
    GenderFemale,
    GenderNeuter,
    Asterisk,
    Scan,
    Cpu,
    Waveform,
    ArrowLeft
} from '@phosphor-icons/react';

const NeonButton = ({ children, onClick, primary = false, icon: Icon, disabled = false, className = '' }) => (
    <motion.button
        onClick={onClick}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        className={`
            relative group px-8 py-4 font-bold text-sm tracking-widest uppercase overflow-hidden
            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
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

const SharpCard = ({ children, selected, onClick, icon: Icon, title, subtitle }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
            relative p-6 w-full text-left transition-all overflow-hidden
            ${selected 
                ? 'border-2 border-cyan-400 bg-cyan-400/10 text-cyan-400' 
                : 'border border-white/10 bg-white/5 text-white hover:border-white/30'
            }
        `}
        style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
    >
        <div className={`absolute top-0 left-0 h-[2px] transition-all duration-300 ${selected ? 'w-full bg-cyan-400' : 'w-0 group-hover:w-full bg-white/30'}`} />
        <div className="flex flex-col items-center gap-3">
            <Icon weight="fill" className={`w-8 h-8 ${selected ? 'text-cyan-400' : 'text-white/50'}`} />
            <div className="text-center">
                <div className="font-bold uppercase tracking-wider text-sm">{title}</div>
                {subtitle && <div className="text-xs text-white/40 mt-1">{subtitle}</div>}
            </div>
        </div>
    </motion.button>
);

const InterestTag = ({ label, selected, onClick, trending }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
            px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all
            ${selected 
                ? 'border-2 border-cyan-400 bg-cyan-400/20 text-cyan-400' 
                : trending
                    ? 'border border-orange-400/50 bg-orange-400/10 text-orange-400 hover:border-orange-400'
                    : 'border border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'
            }
        `}
        style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
    >
        <span className="flex items-center gap-2">
            {trending && !selected && <Fire weight="fill" className="w-3 h-3" />}
            {label}
        </span>
    </motion.button>
);

const StepIndicator = ({ step, currentStep, label }) => {
    const isCompleted = currentStep > step;
    const isActive = currentStep === step;
    
    return (
        <div className="flex items-center gap-3">
            <div className={`
                w-10 h-10 flex items-center justify-center font-black text-sm
                ${isCompleted ? 'bg-cyan-400 text-black' : isActive ? 'border-2 border-cyan-400 text-cyan-400' : 'border border-white/20 text-white/30'}
            `}
            style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
            >
                {isCompleted ? <Check weight="bold" className="w-5 h-5" /> : step}
            </div>
            <span className={`text-xs uppercase tracking-widest hidden md:block ${isActive ? 'text-cyan-400' : 'text-white/30'}`}>
                {label}
            </span>
        </div>
    );
};

const Onboarding = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [step, setStep] = useState(1);

    const [interests, setInterests] = useState([]);
    const [customInterest, setCustomInterest] = useState('');
    const [gender, setGender] = useState('');
    const [partnerGender, setPartnerGender] = useState('any');
    const [mode, setMode] = useState('video');
    const [groupMode, setGroupMode] = useState('double');

    const availableInterests = ['Tech', 'Music', 'Gaming', 'Art', 'Movies', 'Travel', 'Food', 'Science'];
    const trendingInterests = ['Gaming', 'Music', 'Tech'];

    const toggleInterest = (interest) => {
        if (interests.includes(interest)) {
            setInterests(interests.filter(i => i !== interest));
        } else if (interests.length < 3) {
            setInterests([...interests, interest]);
        }
    };

    const addCustomInterest = () => {
        if (customInterest.trim() && !interests.includes(customInterest.trim()) && interests.length < 3) {
            setInterests([...interests, customInterest.trim()]);
            setCustomInterest('');
        }
    };

    const handleMatch = () => {
        const preferences = { interests, gender, partnerGender, mode, groupMode };
        socket.emit('join-queue', preferences);
        navigate('/room/matching', { state: preferences });
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
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

            {/* Scan Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
                <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,243,255,0.03) 2px, rgba(0,243,255,0.03) 4px)' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full z-10"
            >
                {/* Progress */}
                <div className="flex gap-2 mb-12">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1 flex-1 ${step >= i ? 'bg-cyan-400' : 'bg-white/10'}`}>
                            {step === i && (
                                <motion.div
                                    className="h-full bg-white"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Indicators */}
                <div className="flex justify-center gap-8 mb-12">
                    {['Interests', 'Identity', 'Mode'].map((label, i) => (
                        <StepIndicator key={label} step={i + 1} currentStep={step} label={label} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 border border-cyan-400/30 text-cyan-400 text-xs uppercase tracking-widest mb-4">
                                    <Scan weight="bold" className="w-4 h-4" />
                                    Step 01
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                                    Signal <span className="text-cyan-400">Calibration</span>
                                </h2>
                                <p className="text-white/40 uppercase tracking-widest text-xs">
                                    Select up to 3 frequencies to tune your connection
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center">
                                {availableInterests.map((interest) => {
                                    const isTrending = trendingInterests.includes(interest);
                                    const isSelected = interests.includes(interest);
                                    return (
                                        <InterestTag
                                            key={interest}
                                            label={interest}
                                            selected={isSelected}
                                            trending={isTrending}
                                            onClick={() => toggleInterest(interest)}
                                        />
                                    );
                                })}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={customInterest}
                                    onChange={(e) => setCustomInterest(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
                                    placeholder="ENTER CUSTOM FREQUENCY..."
                                    className="w-full bg-black/50 border border-white/10 px-6 py-4 text-white uppercase tracking-widest text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 transition-colors"
                                    style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
                                />
                                <button
                                    onClick={addCustomInterest}
                                    disabled={!customInterest.trim() || interests.length >= 3}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 disabled:text-white/20 uppercase text-xs font-bold tracking-wider"
                                >
                                    Add
                                </button>
                            </div>

                            {interests.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {interests.map(interest => (
                                        <span 
                                            key={interest} 
                                            className="px-3 py-1 bg-cyan-400/20 border border-cyan-400 text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-2"
                                            style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
                                        >
                                            {interest}
                                            <button onClick={() => toggleInterest(interest)} className="hover:text-white">
                                                <X weight="bold" className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <NeonButton 
                                onClick={nextStep}
                                disabled={interests.length === 0}
                                primary 
                                icon={ArrowRight}
                                className="w-full"
                            >
                                Next Phase
                            </NeonButton>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 border border-purple-400/30 text-purple-400 text-xs uppercase tracking-widest mb-4">
                                    <Cpu weight="bold" className="w-4 h-4" />
                                    Step 02
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                                    Identity <span className="text-purple-400">Matrix</span>
                                </h2>
                                <p className="text-white/40 uppercase tracking-widest text-xs">
                                    Configure your identity parameters
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">I Am</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Male', icon: GenderMale, value: 'male' },
                                            { label: 'Female', icon: GenderFemale, value: 'female' },
                                            { label: 'Other', icon: GenderNeuter, value: 'non-binary' }
                                        ].map((g) => (
                                            <SharpCard
                                                key={g.value}
                                                icon={g.icon}
                                                title={g.label}
                                                selected={gender === g.value}
                                                onClick={() => setGender(g.value)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Seeking</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Male', icon: GenderMale, value: 'male' },
                                            { label: 'Female', icon: GenderFemale, value: 'female' },
                                            { label: 'Any', icon: UsersThree, value: 'any' }
                                        ].map((g) => (
                                            <SharpCard
                                                key={g.value}
                                                icon={g.icon}
                                                title={g.label}
                                                selected={partnerGender === g.value}
                                                onClick={() => setPartnerGender(g.value)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <NeonButton onClick={prevStep} icon={ArrowLeft} className="flex-1">
                                    Back
                                </NeonButton>
                                <NeonButton 
                                    onClick={nextStep}
                                    disabled={!gender}
                                    primary 
                                    icon={ArrowRight}
                                    className="flex-1"
                                >
                                    Next
                                </NeonButton>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 border border-green-400/30 text-green-400 text-xs uppercase tracking-widest mb-4">
                                    <Waveform weight="bold" className="w-4 h-4" />
                                    Step 03
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                                    Transmission <span className="text-green-400">Mode</span>
                                </h2>
                                <p className="text-white/40 uppercase tracking-widest text-xs">
                                    Select communication protocol
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <SharpCard
                                    icon={VideoCamera}
                                    title="Video"
                                    subtitle="Face-to-face"
                                    selected={mode === 'video'}
                                    onClick={() => setMode('video')}
                                />
                                <SharpCard
                                    icon={ChatCircle}
                                    title="Text"
                                    subtitle="Anonymous chat"
                                    selected={mode === 'text'}
                                    onClick={() => setMode('text')}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Connection Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <SharpCard
                                        icon={User}
                                        title="1v1"
                                        subtitle="Direct link"
                                        selected={groupMode === 'double'}
                                        onClick={() => setGroupMode('double')}
                                    />
                                    <SharpCard
                                        icon={UsersThree}
                                        title="Group"
                                        subtitle="Multi-node"
                                        selected={groupMode === 'group'}
                                        onClick={() => setGroupMode('group')}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <NeonButton onClick={prevStep} icon={ArrowLeft} className="flex-1">
                                    Back
                                </NeonButton>
                                <NeonButton 
                                    onClick={handleMatch}
                                    primary 
                                    icon={Lightning}
                                    className="flex-1"
                                >
                                    Initialize
                                </NeonButton>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Onboarding;
