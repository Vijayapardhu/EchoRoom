import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, MeshDistortMaterial, Sphere, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useSocket } from '../context/SocketContext';
import gsap from 'gsap';
import { 
    VideoCamera, 
    Users, 
    Shield, 
    Globe, 
    Lightning, 
    ChatCircle,
    LockKey,
    DeviceMobile,
    Clock,
    Check,
    Play,
    ArrowRight,
    Star,
    Heart,
    GithubLogo,
    TwitterLogo,
    InstagramLogo,
    CaretDown,
    Microphone,
    MicrophoneSlash,
    VideoCameraSlash,
    HandWaving,
    Sparkle,
    Planet,
    Rocket,
    Waveform
} from '@phosphor-icons/react';

// ============================================
// 3D BACKGROUND COMPONENTS
// ============================================

const FloatingParticles = () => {
    const mesh = useRef();
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 100; i++) {
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;
            temp.push({ x, y, z, speed: Math.random() * 0.02 + 0.01 });
        }
        return temp;
    }, []);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.y = state.clock.getElapsedTime() * 0.02;
            mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.1;
        }
    });

    return (
        <group ref={mesh}>
            {particles.map((p, i) => (
                <Float key={i} speed={p.speed} rotationIntensity={0.5} floatIntensity={0.5}>
                    <mesh position={[p.x, p.y, p.z]}>
                        <sphereGeometry args={[0.03, 8, 8]} />
                        <meshBasicMaterial color={i % 3 === 0 ? '#00f3ff' : i % 3 === 1 ? '#bc13fe' : '#ffffff'} transparent opacity={0.6} />
                    </mesh>
                </Float>
            ))}
        </group>
    );
};

const EnergyOrb = ({ position, color }) => {
    const mesh = useRef();
    
    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.x = state.clock.getElapsedTime() * 0.3;
            mesh.current.rotation.y = state.clock.getElapsedTime() * 0.2;
            const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
            mesh.current.scale.setScalar(scale);
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={mesh} position={position}>
                <sphereGeometry args={[1.5, 64, 64]} />
                <MeshDistortMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.3}
                    roughness={0.1}
                    metalness={0.8}
                    distort={0.3}
                    speed={2}
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </Float>
    );
};

const ConnectionLines = () => {
    const lines = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 20; i++) {
            const start = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15
            );
            const end = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15
            );
            temp.push({ start, end });
        }
        return temp;
    }, []);

    return (
        <group>
            {lines.map((line, i) => (
                <Trail key={i} width={0.02} length={4} decay={2} color={i % 2 === 0 ? '#00f3ff' : '#bc13fe'}>
                    <mesh position={line.start}>
                        <sphereGeometry args={[0.02, 8, 8]} />
                        <meshBasicMaterial color={i % 2 === 0 ? '#00f3ff' : '#bc13fe'} />
                    </mesh>
                </Trail>
            ))}
        </group>
    );
};

const Scene3D = () => {
    return (
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 2]}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={0.5} color="#00f3ff" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#bc13fe" />
            <FloatingParticles />
            <EnergyOrb position={[-4, 2, -5]} color="#00f3ff" />
            <EnergyOrb position={[4, -2, -5]} color="#bc13fe" />
            <EnergyOrb position={[0, 3, -8]} color="#ffffff" />
            <ConnectionLines />
            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0.5} fade speed={1} />
        </Canvas>
    );
};

// ============================================
// ANIMATED COMPONENTS
// ============================================

const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(null);

    useEffect(() => {
        const obj = { value: 0 };
        gsap.to(obj, {
            value: end,
            duration,
            ease: 'power2.out',
            onUpdate: () => setCount(Math.floor(obj.value)),
        });
    }, [end, duration]);

    return <span ref={countRef}>{count.toLocaleString()}{suffix}</span>;
};

const GlowButton = ({ children, onClick, primary = false, icon: Icon, className = '' }) => {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
                relative group px-8 py-4 rounded-2xl font-bold text-lg overflow-hidden
                flex items-center gap-3 transition-all duration-300
                ${primary 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)]' 
                    : 'bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20'
                }
                ${className}
            `}
        >
            <span className="relative z-10 flex items-center gap-2">
                {Icon && <Icon weight="fill" className="w-5 h-5" />}
                {children}
            </span>
            {primary && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white blur-xl transition-opacity" />
        </motion.button>
    );
};

const FeatureCard = ({ icon: Icon, title, description, color, index }) => {
    const colors = {
        cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:border-cyan-400',
        purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-400',
        green: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-400',
        orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30 hover:border-orange-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className={`
                relative p-8 rounded-3xl bg-gradient-to-br ${colors[color]} 
                border backdrop-blur-xl overflow-hidden group cursor-pointer
                transition-all duration-500
            `}
        >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
                <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-6
                    bg-gradient-to-br ${colors[color]} border border-white/10
                    group-hover:scale-110 transition-transform duration-300
                `}>
                    <Icon weight="duotone" className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-white/60 leading-relaxed">{description}</p>
            </div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        </motion.div>
    );
};

const StepCard = ({ number, icon: Icon, title, description, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15, duration: 0.6 }}
            className="relative flex gap-6"
        >
            {index < 3 && (
                <div className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-cyan-500/50 to-transparent hidden md:block" />
            )}
            <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0"
            >
                <Icon weight="fill" className="w-8 h-8 text-white" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">
                    {number}
                </div>
            </motion.div>
            <div className="pb-12">
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-white/60">{description}</p>
            </div>
        </motion.div>
    );
};

const StatCard = ({ icon: Icon, value, label, suffix, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center group hover:border-cyan-500/50 transition-colors"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon weight="duotone" className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                    <AnimatedCounter end={value} suffix={suffix} />
                </div>
                <div className="text-sm text-white/50">{label}</div>
            </div>
        </motion.div>
    );
};

const TestimonialCard = ({ name, location, text, rating, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all backdrop-blur-sm"
        >
            <div className="flex gap-1 mb-4">
                {[...Array(rating)].map((_, i) => (
                    <Star key={i} weight="fill" className="w-5 h-5 text-yellow-400" />
                ))}
            </div>
            <p className="text-white/70 mb-6 italic">&ldquo;{text}&rdquo;</p>
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {name[0]}
                </div>
                <div>
                    <div className="font-semibold text-white">{name}</div>
                    <div className="text-sm text-white/50">{location}</div>
                </div>
            </div>
        </motion.div>
    );
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
    const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);
    
    const mouseX = useMotionValue(50);
    const mouseY = useMotionValue(50);
    const background = useMotionTemplate`radial-gradient(800px circle at ${mouseX}% ${mouseY}%, rgba(6, 182, 212, 0.08), transparent 40%)`;

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
        { icon: VideoCamera, title: 'Crystal Clear HD', description: 'Experience video calls in stunning high definition with adaptive bitrate technology.', color: 'cyan' },
        { icon: Shield, title: 'Military-Grade Privacy', description: 'End-to-end encryption ensures your conversations remain completely private.', color: 'purple' },
        { icon: Lightning, title: 'Lightning Fast', description: 'Connect with strangers in under 2 seconds with our optimized matching algorithm.', color: 'green' },
        { icon: Globe, title: 'Global Network', description: 'Connect with people from over 150 countries with our distributed infrastructure.', color: 'orange' },
    ];

    const steps = [
        { icon: VideoCamera, title: 'Grant Permissions', description: 'Allow access to your camera and microphone for the best experience.' },
        { icon: ChatCircle, title: 'Set Your Preferences', description: 'Choose your interests and preferred connection type.' },
        { icon: Users, title: 'Get Matched', description: 'Our AI algorithm finds the perfect conversation partner for you.' },
        { icon: Heart, title: 'Start Connecting', description: 'Begin your conversation and make meaningful connections worldwide.' },
    ];

    const stats = [
        { icon: Users, value: activeUsers || 100, label: 'Online Now', suffix: '+' },
        { icon: Globe, value: 150, label: 'Countries', suffix: '+' },
        { icon: Heart, value: 1, label: 'Happy Users', suffix: 'M+' },
        { icon: Star, value: 48, label: 'App Rating', suffix: '/50' },
    ];

    const testimonials = [
        { name: 'Rahul K.', location: 'Mumbai, India', text: 'The video quality is absolutely incredible. Best platform I have ever used for meeting new people!', rating: 5 },
        { name: 'Sarah M.', location: 'Singapore', text: 'Love the premium feel and the instant connections. The 3D interface is stunning!', rating: 5 },
        { name: 'Alex J.', location: 'Philippines', text: 'Finally a safe and beautiful platform to make friends globally. Highly recommended!', rating: 5 },
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
            {/* Dynamic Background */}
            <motion.div 
                className="fixed inset-0 pointer-events-none z-0"
                style={{ background }}
            />
            
            {/* 3D Background */}
            <div className="fixed inset-0 z-0 opacity-60">
                <Scene3D />
            </div>

            {/* Gradient Overlays */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]" />
            </div>

            {/* Grid Pattern */}
            <div 
                className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                                     linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                }}
            />

            {/* Navigation */}
            <motion.nav 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <motion.div 
                        className="flex items-center gap-3"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Planet weight="fill" className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
                            EchoRoom
                        </span>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'How It Works', 'Reviews'].map((item) => (
                            <motion.a
                                key={item}
                                href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                                className="text-sm text-white/60 hover:text-white transition-colors relative group"
                                whileHover={{ y: -2 }}
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 group-hover:w-full transition-all duration-300" />
                            </motion.a>
                        ))}
                    </div>

                    <GlowButton onClick={() => navigate('/onboarding')} primary icon={Rocket}>
                        Start Now
                    </GlowButton>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <motion.section 
                ref={heroRef}
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="relative min-h-screen flex items-center justify-center px-6 pt-20"
            >
                <div className="max-w-6xl mx-auto text-center z-10">
                    {/* Live Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-3 mb-8"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                            </span>
                            <span className="text-sm text-white/70">
                                <span className="text-green-400 font-semibold">{activeUsers || 100}+</span> people connecting now
                            </span>
                        </div>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-8"
                    >
                        <span className="block text-white">Connect</span>
                        <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                            Instantly
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-lg sm:text-xl md:text-2xl text-white/50 max-w-2xl mx-auto mb-12"
                    >
                        Experience the future of video chat. 
                        <span className="text-white"> No signup. No limits. Pure connection.</span>
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                    >
                        <GlowButton onClick={() => navigate('/onboarding')} primary icon={Play} className="px-10 py-5 text-xl">
                            Start Video Chat
                        </GlowButton>
                        <GlowButton onClick={() => navigate('/onboarding')} icon={ChatCircle}>
                            Text Only Mode
                        </GlowButton>
                    </motion.div>

                    {/* Feature Tags */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex flex-wrap justify-center gap-3"
                    >
                        {[
                            { icon: LockKey, text: '100% Anonymous' },
                            { icon: Globe, text: '150+ Countries' },
                            { icon: Lightning, text: 'Instant Match' },
                            { icon: Heart, text: 'Free Forever' }
                        ].map((feature, i) => (
                            <motion.span
                                key={feature.text}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1 + i * 0.1 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/60"
                            >
                                <feature.icon weight="fill" className="w-4 h-4 text-cyan-400" />
                                {feature.text}
                            </motion.span>
                        ))}
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: [0, 10, 0] }}
                        transition={{ delay: 1.5, y: { duration: 2, repeat: Infinity } }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    >
                        <CaretDown weight="bold" className="w-8 h-8 text-white/30" />
                    </motion.div>
                </div>
            </motion.section>

            {/* Stats Section */}
            <section className="relative py-20 px-6 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <StatCard key={stat.label} {...stat} index={i} />
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
                        <motion.span 
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Sparkle weight="fill" className="w-4 h-4" />
                            Features
                        </motion.span>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6">
                            Why Choose <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">EchoRoom</span>?
                        </h2>
                        <p className="text-white/50 text-lg max-w-2xl mx-auto">
                            The most advanced anonymous video chat platform with cutting-edge features
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, i) => (
                            <FeatureCard key={feature.title} {...feature} index={i} />
                        ))}
                    </div>

                    {/* Additional Features */}
                    <div className="grid md:grid-cols-3 gap-6 mt-12">
                        {[
                            { icon: LockKey, title: 'Zero Data Storage', description: 'We never store your conversations or personal data.' },
                            { icon: DeviceMobile, title: 'Universal Access', description: 'Works flawlessly on any device without downloads.' },
                            { icon: Clock, title: 'Sub-Second Matching', description: 'Connect with someone new in under a second.' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="flex items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors"
                            >
                                <div className="p-3 rounded-xl bg-purple-500/20 shrink-0">
                                    <item.icon weight="duotone" className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                                    <p className="text-sm text-white/50">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <motion.span 
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Rocket weight="fill" className="w-4 h-4" />
                            How It Works
                        </motion.span>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6">
                            Start in <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">4 Simple Steps</span>
                        </h2>
                    </motion.div>

                    <div className="max-w-2xl mx-auto">
                        {steps.map((step, i) => (
                            <StepCard key={step.title} {...step} index={i} />
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mt-12"
                    >
                        <GlowButton onClick={() => navigate('/onboarding')} primary icon={ArrowRight}>
                            Try It Now - It&apos;s Free!
                        </GlowButton>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="reviews" className="relative py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <motion.span 
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium mb-6"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Heart weight="fill" className="w-4 h-4" />
                            Testimonials
                        </motion.span>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6">
                            Loved by <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">Millions</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial, i) => (
                            <TestimonialCard key={testimonial.name} {...testimonial} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative p-12 md:p-16 rounded-3xl overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 backdrop-blur-xl rounded-3xl" />
                        <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.3),transparent_70%)]" />
                        </div>
                        
                        <div className="relative z-10 text-center">
                            <motion.h2 
                                className="text-4xl md:text-6xl font-bold mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                Ready to Connect?
                            </motion.h2>
                            <motion.p 
                                className="text-white/60 text-lg mb-10 max-w-xl mx-auto"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                            >
                                Join millions of users making new friends every day. No signup, no hassle — just pure connection.
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                <GlowButton onClick={() => navigate('/onboarding')} primary icon={Rocket} className="px-12 py-6 text-xl">
                                    Start Chatting Now
                                </GlowButton>
                            </motion.div>
                            <motion.p 
                                className="text-white/40 text-sm mt-6 flex items-center justify-center gap-4"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                            >
                                <span className="flex items-center gap-1"><Check weight="bold" className="w-4 h-4 text-green-400" /> Free forever</span>
                                <span className="flex items-center gap-1"><Check weight="bold" className="w-4 h-4 text-green-400" /> No registration</span>
                                <span className="flex items-center gap-1"><Check weight="bold" className="w-4 h-4 text-green-400" /> 100% anonymous</span>
                            </motion.p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-16 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                                    <Planet weight="fill" className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                    EchoRoom
                                </span>
                            </div>
                            <p className="text-white/50 mb-6 max-w-sm leading-relaxed">
                                The world&apos;s most advanced anonymous video chat platform. Connect with strangers, make friends, and have meaningful conversations.
                            </p>
                            <div className="flex items-center gap-4">
                                {[GithubLogo, TwitterLogo, InstagramLogo].map((Icon, i) => (
                                    <motion.a 
                                        key={i}
                                        href="#" 
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <Icon weight="fill" className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                            <ul className="space-y-3">
                                {['Features', 'How It Works', 'Reviews', 'Privacy'].map(link => (
                                    <li key={link}>
                                        <a href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-white/50 hover:text-white transition-colors flex items-center gap-2 group">
                                            <ArrowRight weight="bold" className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Popular In</h4>
                            <ul className="space-y-3 text-white/50">
                                {['India', 'Singapore', 'Philippines', 'Malaysia', '150+ Countries'].map(country => (
                                    <li key={country} className="flex items-center gap-2">
                                        <Globe weight="fill" className="w-4 h-4 text-cyan-400" />
                                        {country}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-white/40 text-sm">
                            &copy; {new Date().getFullYear()} EchoRoom. All rights reserved.
                        </div>
                        <div className="flex items-center gap-2 text-white/40 text-sm">
                            <span>Crafted with</span>
                            <Heart weight="fill" className="w-4 h-4 text-red-500" />
                            <span>for the world</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PremiumLanding;
