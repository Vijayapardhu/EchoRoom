import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useSocket } from '../context/SocketContext';
import gsap from 'gsap';
import { 
    VideoCamera, 
    Users, 
    Shield, 
    Globe, 
    Lightning, 
    LockKey,
    DeviceMobile,
    Clock,
    Check,
    Play,
    ArrowRight,
    Star,
    GithubLogo,
    TwitterLogo,
    InstagramLogo,
    CaretDown,
    Microphone,
    VideoCameraSlash,
    Planet,
    Rocket,
    Waveform,
    Asterisk,
    Crosshair,
    Scan,
    Fingerprint,
    Cpu,
    Network,
    Broadcast
} from '@phosphor-icons/react';

// ============================================
// 3D SPACE BACKGROUND
// ============================================

const StarField = () => {
    const starsRef = useRef();
    
    useFrame((state) => {
        if (starsRef.current) {
            starsRef.current.rotation.y = state.clock.getElapsedTime() * 0.005;
            starsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.002) * 0.1;
        }
    });

    return (
        <group ref={starsRef}>
            <Stars 
                radius={200} 
                depth={100} 
                count={5000} 
                factor={6} 
                saturation={0} 
                fade 
                speed={0.5}
                color="#ffffff"
            />
        </group>
    );
};

const ShootingStars = () => {
    const mesh = useRef();
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 20; i++) {
            temp.push({
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 100,
                z: (Math.random() - 0.5) * 50 - 20,
                speed: Math.random() * 0.5 + 0.2,
                delay: Math.random() * 10
            });
        }
        return temp;
    }, []);

    return (
        <group>
            {particles.map((p, i) => (
                <ShootingStarParticle key={i} {...p} />
            ))}
        </group>
    );
};

const ShootingStarParticle = ({ x, y, z, speed, delay }) => {
    const mesh = useRef();
    
    useFrame((state) => {
        if (mesh.current) {
            const time = state.clock.getElapsedTime();
            const adjustedTime = (time + delay) % 15;
            if (adjustedTime < 2) {
                mesh.current.position.x = x - adjustedTime * 20 * speed;
                mesh.current.position.y = y - adjustedTime * 10 * speed;
                mesh.current.visible = true;
            } else {
                mesh.current.visible = false;
            }
        }
    });

    return (
        <mesh ref={mesh} position={[x, y, z]} visible={false}>
            <boxGeometry args={[3, 0.05, 0.05]} />
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.8} />
        </mesh>
    );
};

const SpaceGrid = () => {
    const gridRef = useRef();
    
    useFrame((state) => {
        if (gridRef.current) {
            gridRef.current.position.z = (state.clock.getElapsedTime() * 2) % 10;
        }
    });

    return (
        <group ref={gridRef}>
            <gridHelper args={[200, 100, '#1a1a2e', '#0f0f1a']} position={[0, -20, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        </group>
    );
};

const Scene3D = () => {
    return (
        <Canvas camera={{ position: [0, 0, 30], fov: 60 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
            <color attach="background" args={['#000000']} />
            <fog attach="fog" args={['#000000', 20, 100]} />
            <ambientLight intensity={0.1} />
            <pointLight position={[10, 10, 10]} intensity={0.3} color="#00f3ff" />
            <pointLight position={[-10, -10, -10]} intensity={0.3} color="#bc13fe" />
            <StarField />
            <ShootingStars />
            <SpaceGrid />
        </Canvas>
    );
};

// ============================================
// SHARP NEON COMPONENTS
// ============================================

const NeonButton = ({ children, onClick, primary = false, icon: Icon, className = '' }) => {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
                relative group px-8 py-4 font-bold text-sm tracking-widest uppercase overflow-hidden
                transition-all duration-300 clip-path-slant
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
};

const SharpCard = ({ icon: Icon, title, description, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            whileHover={{ y: -5 }}
            className="relative p-8 bg-black/40 border border-white/10 overflow-hidden group"
            style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-0 w-20 h-[1px] bg-cyan-400/50 group-hover:w-full transition-all duration-500" />
            <div className="absolute bottom-0 right-0 w-20 h-[1px] bg-purple-400/50 group-hover:w-full transition-all duration-500" />
            
            <div className="relative z-10">
                <div className="w-16 h-16 mb-6 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5 group-hover:border-cyan-400 group-hover:bg-cyan-400/10 transition-all">
                    <Icon weight="fill" className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide uppercase">{title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{description}</p>
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-400/5 rotate-45 group-hover:rotate-90 transition-transform duration-700" />
        </motion.div>
    );
};

const StatBox = ({ icon: Icon, value, label, suffix, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="relative p-6 bg-black/60 border border-white/10 group hover:border-cyan-400/50 transition-colors"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
        >
            <div className="absolute top-0 left-0 w-0 h-[1px] bg-cyan-400 group-hover:w-full transition-all duration-300" />
            <div className="relative z-10">
                <Icon weight="fill" className="w-6 h-6 text-cyan-400 mb-4" />
                <div className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tighter">
                    {value.toLocaleString()}{suffix}
                </div>
                <div className="text-xs text-white/40 uppercase tracking-widest">{label}</div>
            </div>
        </motion.div>
    );
};

const StepLine = ({ number, icon: Icon, title, description, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15, duration: 0.6 }}
            className="relative flex gap-6"
        >
            {index < 3 && (
                <div className="absolute left-6 top-16 w-[1px] h-full bg-gradient-to-b from-cyan-400/50 to-transparent hidden md:block" />
            )}
            
            <motion.div 
                whileHover={{ scale: 1.1 }}
                className="relative z-10 w-12 h-12 shrink-0 flex items-center justify-center border-2 border-cyan-400 bg-black text-cyan-400 font-black text-lg"
                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
            >
                {number}
            </motion.div>
            <div className="pb-12">
                <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">{title}</h3>
                <p className="text-white/40 text-sm">{description}</p>
            </div>
        </motion.div>
    );
};

const TechBadge = ({ icon: Icon, text }) => (
    <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-xs text-white/60 uppercase tracking-wider"
    >
        <Icon weight="fill" className="w-4 h-4 text-cyan-400" />
        {text}
    </motion.span>
);

const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const obj = { value: 0 };
        gsap.to(obj, {
            value: end,
            duration,
            ease: 'power2.out',
            onUpdate: () => setCount(Math.floor(obj.value)),
        });
    }, [end, duration]);

    return <span>{count.toLocaleString()}{suffix}</span>;
};

// ============================================
// MAIN LANDING PAGE
// ============================================

const PremiumLanding = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [activeUsers, setActiveUsers] = useState(0);
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    
    const mouseX = useMotionValue(50);
    const mouseY = useMotionValue(50);

    useEffect(() => {
        if (!socket) return;
        const handleActiveUsers = ({ count }) => setActiveUsers(count);
        socket.on('active-users', handleActiveUsers);
        return () => socket.off('active-users', handleActiveUsers);
    }, [socket]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set((e.clientX / window.innerWidth) * 100);
            mouseY.set((e.clientY / window.innerHeight) * 100);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    const features = [
        { icon: VideoCamera, title: 'Crystal Clear HD', description: 'Experience video calls in stunning high definition with adaptive bitrate technology.' },
        { icon: Shield, title: 'Military-Grade Privacy', description: 'End-to-end encryption ensures your conversations remain completely private.' },
        { icon: Lightning, title: 'Lightning Fast', description: 'Connect with strangers in under 2 seconds with our optimized matching algorithm.' },
        { icon: Globe, title: 'Global Network', description: 'Connect with people from over 150 countries with our distributed infrastructure.' },
    ];

    const steps = [
        { icon: VideoCamera, title: 'Grant Permissions', description: 'Allow access to your camera and microphone for the best experience.' },
        { icon: Users, title: 'Set Your Preferences', description: 'Choose your interests and preferred connection type.' },
        { icon: Lightning, title: 'Get Matched', description: 'Our AI algorithm finds the perfect conversation partner for you.' },
        { icon: Star, title: 'Start Connecting', description: 'Begin your conversation and make meaningful connections worldwide.' },
    ];

    const stats = [
        { icon: Users, value: activeUsers || 100, label: 'Online Now', suffix: '+' },
        { icon: Globe, value: 150, label: 'Countries', suffix: '' },
        { icon: Star, value: 1, label: 'Happy Users', suffix: 'M+' },
        { icon: Lightning, value: 48, label: 'Rating', suffix: '/50' },
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden relative selection:bg-cyan-400/30">
            {/* 3D Space Background */}
            <div className="fixed inset-0 z-0">
                <Scene3D />
            </div>

            {/* Grid Overlay */}
            <div 
                className="fixed inset-0 pointer-events-none z-0 opacity-20"
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px), 
                                     linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px)`,
                    backgroundSize: '100px 100px',
                }}
            />

            {/* Scan Lines */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-5">
                <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,243,255,0.03) 2px, rgba(0,243,255,0.03) 4px)' }} />
            </div>

            {/* Navigation */}
            <motion.nav 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/5 bg-black/50 backdrop-blur-md"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <motion.div 
                        className="flex items-center gap-3"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="w-10 h-10 flex items-center justify-center border-2 border-cyan-400 bg-black">
                            <Crosshair weight="fill" className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-xl font-black tracking-widest uppercase text-white">
                            Echo<span className="text-cyan-400">Room</span>
                        </span>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'How It Works', 'Reviews'].map((item) => (
                            <motion.a
                                key={item}
                                href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                                className="text-xs text-white/50 hover:text-cyan-400 transition-colors uppercase tracking-widest font-medium"
                                whileHover={{ y: -2 }}
                            >
                                {item}
                            </motion.a>
                        ))}
                    </div>

                    <NeonButton onClick={() => navigate('/onboarding')} primary icon={Rocket}>
                        Launch
                    </NeonButton>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <motion.section 
                ref={heroRef}
                style={{ opacity: heroOpacity }}
                className="relative min-h-screen flex items-center justify-center px-6 pt-20"
            >
                <div className="max-w-6xl mx-auto text-center z-10">
                    {/* Live Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-3 mb-8"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-cyan-400/30">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                            </span>
                            <span className="text-xs text-white/60 uppercase tracking-widest">
                                <span className="text-cyan-400 font-bold">{activeUsers || 100}+</span> Nodes Online
                            </span>
                        </div>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8"
                    >
                        <span className="block text-white">CONNECT</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                            INSTANTLY
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-12 uppercase tracking-widest"
                    >
                        Secure Anonymous Video Communication Protocol
                        <span className="text-cyan-400 block mt-2 text-sm">No Registration Required</span>
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                    >
                        <NeonButton onClick={() => navigate('/onboarding')} primary icon={Play} className="px-12 py-5 text-base">
                            Initiate Connection
                        </NeonButton>
                        <NeonButton onClick={() => navigate('/onboarding')} icon={Waveform}>
                            Text Protocol
                        </NeonButton>
                    </motion.div>

                    {/* Tech Tags */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex flex-wrap justify-center gap-3"
                    >
                        {[
                            { icon: LockKey, text: 'Encrypted' },
                            { icon: Globe, text: 'Global Network' },
                            { icon: Lightning, text: 'Low Latency' },
                            { icon: Cpu, text: 'AI Matching' }
                        ].map((feature, i) => (
                            <motion.div
                                key={feature.text}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 + i * 0.1 }}
                            >
                                <TechBadge icon={feature.icon} text={feature.text} />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: [0, 10, 0] }}
                        transition={{ delay: 1.5, y: { duration: 2, repeat: Infinity } }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    >
                        <CaretDown weight="bold" className="w-6 h-6 text-cyan-400" />
                    </motion.div>
                </div>
            </motion.section>

            {/* Stats Section */}
            <section className="relative py-20 px-6 border-y border-white/5 bg-black/50 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map((stat, i) => (
                            <StatBox key={stat.label} {...stat} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/5 border border-cyan-400/20 text-cyan-400 text-xs uppercase tracking-widest mb-6">
                            <Asterisk weight="bold" className="w-4 h-4" />
                            System Features
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase">
                            Why <span className="text-cyan-400">EchoRoom</span>?
                        </h2>
                        <p className="text-white/40 text-lg max-w-2xl mx-auto uppercase tracking-widest text-xs">
                            Advanced anonymous video communication platform
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, i) => (
                            <SharpCard key={feature.title} {...feature} index={i} />
                        ))}
                    </div>

                    {/* Additional Features */}
                    <div className="grid md:grid-cols-3 gap-4 mt-12">
                        {[
                            { icon: LockKey, title: 'Zero Data Storage', description: 'No conversation logs. Complete privacy.' },
                            { icon: DeviceMobile, title: 'Universal Access', description: 'Works on all devices without downloads.' },
                            { icon: Clock, title: 'Sub-Second Matching', description: 'Connect in under one second.' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-4 p-6 bg-white/5 border border-white/10"
                            >
                                <div className="p-3 border border-purple-400/30 bg-purple-400/5 shrink-0">
                                    <item.icon weight="fill" className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1 uppercase text-sm tracking-wide">{item.title}</h4>
                                    <p className="text-xs text-white/40">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="relative py-32 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-400/5 border border-purple-400/20 text-purple-400 text-xs uppercase tracking-widest mb-6">
                            <Scan weight="bold" className="w-4 h-4" />
                            Connection Protocol
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase">
                            4 Step <span className="text-purple-400">Process</span>
                        </h2>
                    </motion.div>

                    <div className="max-w-xl mx-auto">
                        {steps.map((step, i) => (
                            <StepLine key={step.title} {...step} index={i} number={i + 1} />
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mt-12"
                    >
                        <NeonButton onClick={() => navigate('/onboarding')} primary icon={ArrowRight}>
                            Initialize Protocol
                        </NeonButton>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative p-12 md:p-16 overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 40px 100%, 0 calc(100% - 40px))' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                        
                        <div className="relative z-10 text-center">
                            <motion.h2 
                                className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                Ready to <span className="text-cyan-400">Connect</span>?
                            </motion.h2>
                            <motion.p 
                                className="text-white/40 text-lg mb-10 max-w-xl mx-auto uppercase tracking-widest text-xs"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                            >
                                Join millions of users making new connections daily
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                <NeonButton onClick={() => navigate('/onboarding')} primary icon={Rocket} className="px-16 py-6 text-base">
                                    Initialize Connection
                                </NeonButton>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-16 px-6 border-t border-white/5 bg-black/80">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 flex items-center justify-center border-2 border-cyan-400 bg-black">
                                    <Crosshair weight="fill" className="w-5 h-5 text-cyan-400" />
                                </div>
                                <span className="text-2xl font-black tracking-widest uppercase">
                                    Echo<span className="text-cyan-400">Room</span>
                                </span>
                            </div>
                            <p className="text-white/30 mb-6 max-w-sm text-sm leading-relaxed">
                                Advanced anonymous video communication platform. Secure, fast, and completely private.
                            </p>
                            <div className="flex items-center gap-4">
                                {[GithubLogo, TwitterLogo, InstagramLogo].map((Icon, i) => (
                                    <motion.a 
                                        key={i}
                                        href="#" 
                                        whileHover={{ scale: 1.1 }}
                                        className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all"
                                    >
                                        <Icon weight="fill" className="w-5 h-5 text-white/50 hover:text-cyan-400 transition-colors" />
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Navigation</h4>
                            <ul className="space-y-3">
                                {['Features', 'How It Works', 'Privacy'].map(link => (
                                    <li key={link}>
                                        <a href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-white/30 hover:text-cyan-400 transition-colors text-sm uppercase tracking-wider">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Regions</h4>
                            <ul className="space-y-3 text-white/30 text-sm">
                                {['India', 'Singapore', 'Philippines', 'Malaysia', '150+ Countries'].map(country => (
                                    <li key={country} className="flex items-center gap-2">
                                        <Globe weight="fill" className="w-3 h-3 text-cyan-400" />
                                        {country}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-white/20 text-xs uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} EchoRoom. All rights reserved.
                        </div>
                        <div className="flex items-center gap-2 text-white/20 text-xs uppercase tracking-widest">
                            <span>Secured with</span>
                            <LockKey weight="fill" className="w-3 h-3 text-cyan-400" />
                            <span>Military-Grade Encryption</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PremiumLanding;
