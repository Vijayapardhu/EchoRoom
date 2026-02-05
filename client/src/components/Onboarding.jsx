import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { AnimatePresence } from 'framer-motion';
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
    GenderMale,
    GenderFemale,
    GenderNeuter,
    ArrowLeft,
    Sparkle,
    Scan
} from '@phosphor-icons/react';

const Button = ({ children, onClick, variant = 'primary', disabled = false, icon: Icon }) => {
    const baseStyles = 'w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2';
    const variants = {
        primary: 'bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
        outline: 'border-2 border-white/20 text-white hover:border-blue-400 hover:text-blue-400'
    };

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={!disabled ? { y: -2 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={`${baseStyles} ${variants[variant]}`}
        >
            {children}
            {Icon && <Icon weight="bold" className="w-5 h-5" />}
        </motion.button>
    );
};

const SelectionCard = ({ icon, title, subtitle, selected, onClick }) => {
    const IconComponent = icon;
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 text-left w-full
                ${selected 
                    ? 'border-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20' 
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                }
            `}
        >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${selected ? 'bg-blue-400 text-white' : 'bg-white/10 text-white/60'}`}>
                <IconComponent weight="fill" className="w-7 h-7" />
            </div>
            <h3 className={`font-semibold text-lg mb-1 ${selected ? 'text-white' : 'text-white/80'}`}>{title}</h3>
            <p className="text-sm text-white/40">{subtitle}</p>
            {selected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center"
                >
                    <Check weight="bold" className="w-4 h-4 text-white" />
                </motion.div>
            )}
        </motion.button>
    );
};

const InterestTag = ({ label, selected, onClick, trending }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${selected 
                ? 'bg-blue-400 text-white shadow-lg shadow-blue-400/30' 
                : trending
                    ? 'bg-orange-400/20 text-orange-400 border border-orange-400/30 hover:bg-orange-400/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
            }
        `}
    >
        <span className="flex items-center gap-1.5">
            {trending && !selected && <Fire weight="fill" className="w-3.5 h-3.5" />}
            {label}
        </span>
    </motion.button>
);

const StepIndicator = ({ step, currentStep, label }) => {
    const isCompleted = currentStep > step;
    const isActive = currentStep === step;
    
    return (
        <div className="flex items-center gap-3">
            <motion.div 
                className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                    ${isCompleted ? 'bg-blue-400 text-white' : isActive ? 'bg-blue-400/20 text-blue-400 border-2 border-blue-400' : 'bg-white/5 text-white/30 border border-white/10'}
                `}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {isCompleted ? <Check weight="bold" className="w-5 h-5" /> : step}
            </motion.div>
            <span className={`text-sm font-medium hidden md:block ${isActive ? 'text-white' : 'text-white/30'}`}>
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

    const availableInterests = ['Technology', 'Music', 'Gaming', 'Movies', 'Travel', 'Sports', 'Art', 'Food'];
    const trendingInterests = ['Gaming', 'Music', 'Technology'];

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

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl z-10"
            >
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex gap-2 mb-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-blue-400 to-violet-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: step >= i ? '100%' : 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center">
                        <StepIndicator step={1} currentStep={step} label="Interests" />
                        <div className="flex-1 h-px bg-white/10 mx-4" />
                        <StepIndicator step={2} currentStep={step} label="Identity" />
                        <div className="flex-1 h-px bg-white/10 mx-4" />
                        <StepIndicator step={3} currentStep={step} label="Mode" />
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-400/10 text-blue-400 text-xs font-medium mb-4">
                                        <Scan weight="bold" className="w-4 h-4" />
                                        Step 1 of 3
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">What are your interests?</h2>
                                    <p className="text-white/50">Select up to 3 topics you&apos;d like to talk about</p>
                                </div>

                                <div className="flex flex-wrap gap-3 justify-center">
                                    {availableInterests.map((interest) => (
                                        <InterestTag
                                            key={interest}
                                            label={interest}
                                            selected={interests.includes(interest)}
                                            trending={trendingInterests.includes(interest)}
                                            onClick={() => toggleInterest(interest)}
                                        />
                                    ))}
                                    </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={customInterest}
                                        onChange={(e) => setCustomInterest(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
                                        placeholder="Add a custom interest..."
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400/50 transition-colors"
                                    />
                                    <button
                                        onClick={addCustomInterest}
                                        disabled={!customInterest.trim() || interests.length >= 3}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-400 text-white rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>

                                {interests.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex flex-wrap gap-2 justify-center pt-2"
                                    >
                                        {interests.map(interest => (
                                            <span 
                                                key={interest} 
                                                className="px-3 py-1.5 bg-blue-400/20 text-blue-400 rounded-full text-sm flex items-center gap-2"
                                            >
                                                {interest}
                                                <button onClick={() => toggleInterest(interest)} className="hover:text-white">
                                                    <X weight="bold" className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </motion.div>
                                )}

                                <div className="pt-4">
                                    <Button 
                                        onClick={() => setStep(2)}
                                        disabled={interests.length === 0}
                                        icon={ArrowRight}
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-400/10 text-violet-400 text-xs font-medium mb-4">
                                        <Sparkle weight="bold" className="w-4 h-4" />
                                        Step 2 of 3
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">Tell us about yourself</h2>
                                    <p className="text-white/50">This helps us find better matches for you</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-sm font-medium text-white/60 mb-3 block">I am</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'Male', icon: GenderMale, value: 'male' },
                                                { label: 'Female', icon: GenderFemale, value: 'female' },
                                                { label: 'Other', icon: GenderNeuter, value: 'non-binary' }
                                            ].map((g) => (
                                                <SelectionCard
                                                    key={g.value}
                                                    icon={g.icon}
                                                    title={g.label}
                                                    selected={gender === g.value}
                                                    onClick={() => setGender(g.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-white/60 mb-3 block">Looking for</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'Male', icon: GenderMale, value: 'male' },
                                                { label: 'Female', icon: GenderFemale, value: 'female' },
                                                { label: 'Anyone', icon: UsersThree, value: 'any' }
                                            ].map((g) => (
                                                <SelectionCard
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

                                <div className="flex gap-3 pt-4">
                                    <Button variant="secondary" onClick={() => setStep(1)} icon={ArrowLeft}>
                                        Back
                                    </Button>
                                    <Button 
                                        onClick={() => setStep(3)}
                                        disabled={!gender}
                                        icon={ArrowRight}
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-xs font-medium mb-4">
                                        <Lightning weight="bold" className="w-4 h-4" />
                                        Step 3 of 3
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">Choose your mode</h2>
                                    <p className="text-white/50">How would you like to connect?</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <SelectionCard
                                        icon={VideoCamera}
                                        title="Video Chat"
                                        subtitle="Face-to-face"
                                        selected={mode === 'video'}
                                        onClick={() => setMode('video')}
                                    />
                                    <SelectionCard
                                        icon={ChatCircle}
                                        title="Text Only"
                                        subtitle="Anonymous chat"
                                        selected={mode === 'text'}
                                        onClick={() => setMode('text')}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-white/60 mb-3 block">Connection Type</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <SelectionCard
                                            icon={User}
                                            title="One-on-One"
                                            subtitle="Private chat"
                                            selected={groupMode === 'double'}
                                            onClick={() => setGroupMode('double')}
                                        />
                                        <SelectionCard
                                            icon={UsersThree}
                                            title="Group"
                                            subtitle="Multiple people"
                                            selected={groupMode === 'group'}
                                            onClick={() => setGroupMode('group')}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button variant="secondary" onClick={() => setStep(2)} icon={ArrowLeft}>
                                        Back
                                    </Button>
                                    <Button onClick={handleMatch} icon={Lightning}>
                                        Start Matching
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center gap-6 mt-8 text-white/30 text-xs">
                    <span className="flex items-center gap-1.5">
                        <Check weight="bold" className="w-3.5 h-3.5 text-emerald-400" />
                        Free Forever
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Check weight="bold" className="w-3.5 h-3.5 text-emerald-400" />
                        No Signup
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Check weight="bold" className="w-3.5 h-3.5 text-emerald-400" />
                        Encrypted
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default Onboarding;
