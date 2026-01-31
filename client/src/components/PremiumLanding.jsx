import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useSocket } from '../context/SocketContext';
import { 
    VideoCamera, 
    ShieldCheck, 
    Zap, 
    Globe, 
    ArrowRight,
    Play,
    Users,
    MessageCircle,
    Lock,
    Clock,
    Check,
    ChevronDown,
    Sparkles,
    GithubLogo,
    TwitterLogo,
    Star,
    Heart,
    ArrowUpRight
} from '@phosphor-icons/react';

// ============================================
// 3D BACKGROUND - SOFT & ELEGANT
// ============================================

const AnimatedSphere = ({ position, color, scale = 1 }) => {
    const meshRef = useRef();
    
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={meshRef} position={position} scale={scale}>
                <sphereGeometry args={[1, 64, 64]} />
                <MeshDistortMaterial
                    color={color}
                    transparent
                    opacity={0.15}
                    roughness={0.1}
                    metalness={0.8}
                    distort={0.2}
                    speed={1}
                />
            </mesh>
        </Float>
    );
};

const ParticleField = () => {
    const points = useRef();
    const particleCount = 200;
    
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    useFrame((state) => {
        if (points.current) {
            points.current.rotation.y = state.clock.getElapsedTime() * 0.02;
        }
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                color="#60a5fa"
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
};

const Scene3D = () => (
    <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 2]}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.3} color="#60a5fa" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#a78bfa" />
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0.5} fade speed={0.5} />
        <ParticleField />
        <AnimatedSphere position={[-4, 2, -5]} color="#3b82f6" scale={1.5} />
        <AnimatedSphere position={[4, -2, -5]} color="#8b5cf6" scale={1.2} />
        <AnimatedSphere position={[0, 3, -8]} color="#06b6d4" scale={0.8} />
    </Canvas>
);

// ============================================
// UI COMPONENTS
// ============================================

const Button = ({ children, onClick, variant = 'primary', size = 'md', icon: Icon, className = '' }) => {
    const baseStyles = 'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 ease-out group overflow-hidden';
    
    const variants = {
        primary: 'bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]',
        secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm',
        ghost: 'text-white/60 hover:text-white hover:bg-white/5'
    };
    
    const sizes = {
        sm: 'px-4 py-2 text-sm rounded-lg',
        md: 'px-6 py-3 text-sm rounded-xl',
        lg: 'px-8 py-4 text-base rounded-2xl'
    };

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            <span className="relative z-10 flex items-center gap-2">
                {children}
                {Icon && <Icon weight="bold" className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 ${variant === 'primary' ? 'text-white/80' : ''}`} />}
            </span>
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
        </motion.button>
    );
};

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ y: -4 }}
        className="group relative p-6 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">
            <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Icon weight="duotone" className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-white/50 leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

const StatCard = ({ value, label, suffix = '', delay }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [value]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="text-center p-6"
        >
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
                {count}{suffix}
            </div>
            <div className="text-sm text-white/40 font-medium">{label}</div>
        </motion.div>
    );
};

const StepCard = ({ number, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="flex gap-5"
    >
        <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                {number}
            </div>
            <div className="w-0.5 h-full bg-gradient-to-b from-blue-500/50 to-transparent mt-2" />
        </div>
        <div className="pb-8">
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-white/50">{description}</p>
        </div>
    </motion.div>
);

const TestimonialCard = ({ name, location, text, rating, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="p-6 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl hover:bg-white/[0.05] transition-colors duration-300"
    >
        <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
                <Star key={i} weight={i < rating ? "fill" : "regular"} className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-white/20"}`} />
            ))}
        </div>
        <p className="text-white/70 mb-6 leading-relaxed text-sm">&ldquo;{text}&rdquo;</p>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold">
                {name[0]}
            </div>
            <div>
                <div className="font-medium text-white text-sm">{name}</div>
                <div className="text-xs text-white/40">{location}</div>
            </div>
        </div>
    </motion.div>
);

const PremiumLanding = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [activeUsers, setActiveUsers] = useState(0);
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

    useEffect(() => {
        if (!socket) return;
        socket.on('active-users', ({ count }) => setActiveUsers(count));
        return () => socket.off('active-users');
    }, [socket]);

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden relative">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
                <div className="absolute inset-0 opacity-50">
                    <Scene3D />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
            </div>

            {/* Navigation */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-slate-950/50 backdrop-blur-xl border-b border-white/5"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles weight="fill" className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            EchoRoom
                        </span>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'How it Works', 'Reviews'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} className="text-sm text-white/50 hover:text-white transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>

                    <Button onClick={() => navigate('/onboarding')} size="sm" icon={ArrowRight}>
                        Start Chatting
                    </Button>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <motion.section ref={heroRef} style={{ opacity: heroOpacity }} className="relative min-h-screen flex items-center justify-center px-6 pt-20">
                <div className="max-w-5xl mx-auto text-center z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span className="text-sm text-white/60">
                            <span className="text-emerald-400 font-semibold">{activeUsers || 100}+</span> people online now
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
                    >
                        <span className="block text-white">Connect with</span>
                        <span className="block bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                            Strangers
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        Experience seamless video chat with people worldwide.
                        <span className="text-white"> No signup required, completely free.</span>
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                    >
                        <Button onClick={() => navigate('/onboarding')} size="lg" icon={Play}>
                            Start Video Chat
                        </Button>
                        <Button onClick={() => navigate('/onboarding')} variant="secondary" size="lg" icon={MessageCircle}>
                            Text Chat
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="flex flex-wrap justify-center gap-3"
                    >
                        {[
                            { icon: Lock, text: 'End-to-End Encrypted' },
                            { icon: Globe, text: '150+ Countries' },
                            { icon: Zap, text: 'Lightning Fast' },
                            { icon: Heart, text: '100% Free' }
                        ].map((feature) => (
                            <span key={feature.text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/60">
                                <feature.icon weight="fill" className="w-4 h-4 text-blue-400" />
                                {feature.text}
                            </span>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: [0, 8, 0] }}
                        transition={{ delay: 1.2, y: { duration: 2, repeat: Infinity } }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    >
                        <ChevronDown weight="bold" className="w-6 h-6 text-white/30" />
                    </motion.div>
                </div>
            </motion.section>

            {/* Stats Section */}
            <section className="relative py-20 px-6 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatCard value={activeUsers || 100} suffix="+" label="Online Now" delay={0} />
                        <StatCard value={150} suffix="+" label="Countries" delay={0.1} />
                        <StatCard value={1} suffix="M+" label="Total Users" delay={0.2} />
                        <StatCard value={48} suffix="/50" label="Rating" delay={0.3} />
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
                        className="text-center mb-16"
                    >
                        <span className="inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
                            Features
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose EchoRoom?</h2>
                        <p className="text-white/50 text-lg max-w-2xl mx-auto">
                            The most advanced anonymous video chat platform with features you&apos;ll love
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={VideoCamera}
                            title="Crystal Clear HD"
                            description="Experience video calls in stunning high definition with adaptive quality"
                            delay={0}
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="100% Private"
                            description="End-to-end encryption ensures your conversations stay confidential"
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Lightning Fast"
                            description="Connect with strangers in under 2 seconds with optimized matching"
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={Globe}
                            title="Global Network"
                            description="Connect with people from over 150 countries worldwide"
                            delay={0.3}
                        />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mt-8">
                        {[
                            { icon: Lock, title: 'Zero Data Storage', description: 'We never store your conversations' },
                            { icon: Users, title: 'Group Chats', description: 'Chat with multiple people at once' },
                            { icon: Clock, title: 'Instant Match', description: 'No waiting, get connected instantly' }
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                                className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
                            >
                                <div className="p-3 rounded-xl bg-violet-500/20">
                                    <item.icon weight="duotone" className="w-5 h-5 text-violet-400" />
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

            {/* How It Works */}
            <section id="how-it-works" className="relative py-32 px-6 bg-white/[0.02]">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="inline-block px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-4">
                            How It Works
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Get Started in 4 Easy Steps</h2>
                    </motion.div>

                    <div className="max-w-lg mx-auto">
                        <StepCard number={1} title="Allow Access" description="Enable camera and microphone permissions" delay={0} />
                        <StepCard number={2} title="Set Preferences" description="Choose your interests and chat mode" delay={0.1} />
                        <StepCard number={3} title="Get Matched" description="Our AI finds the perfect chat partner" delay={0.2} />
                        <StepCard number={4} title="Start Chatting" description="Enjoy your conversation and make new friends" delay={0.3} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mt-12"
                    >
                        <Button onClick={() => navigate('/onboarding')} size="lg" icon={ArrowRight}>
                            Try It Now
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="reviews" className="relative py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-4">
                            Testimonials
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Millions</h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <TestimonialCard
                            name="Rahul K."
                            location="Mumbai, India"
                            text="The video quality is incredible. Best platform I've used for meeting new people!"
                            rating={5}
                            delay={0}
                        />
                        <TestimonialCard
                            name="Sarah M."
                            location="Singapore"
                            text="Love the clean interface and instant connections. The 3D effects are stunning!"
                            rating={5}
                            delay={0.1}
                        />
                        <TestimonialCard
                            name="Alex J."
                            location="Philippines"
                            text="Finally a safe and beautiful platform to make friends globally. Highly recommended!"
                            rating={5}
                            delay={0.2}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative p-12 md:p-16 rounded-3xl bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-purple-500/10 border border-white/10 backdrop-blur-xl overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
                        
                        <div className="relative z-10 text-center">
                            <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Connect?</h2>
                            <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
                                Join millions of users making new friends every day. No signup required.
                            </p>
                            <Button onClick={() => navigate('/onboarding')} size="lg" icon={ArrowRight}>
                                Start Chatting Now
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-16 px-6 border-t border-white/5 bg-slate-950">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                    <Sparkles weight="fill" className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold">EchoRoom</span>
                            </div>
                            <p className="text-white/40 mb-6 max-w-sm">
                                The world&apos;s most popular anonymous video chat platform. Connect with strangers, make friends worldwide.
                            </p>
                            <div className="flex items-center gap-3">
                                {[GithubLogo, TwitterLogo].map((Icon, i) => (
                                    <a key={i} href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                        <Icon weight="fill" className="w-5 h-5 text-white/50 hover:text-white" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                            <ul className="space-y-3">
                                {['Features', 'How It Works', 'Privacy Policy'].map(link => (
                                    <li key={link}>
                                        <a href="#" className="text-white/40 hover:text-white transition-colors">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Popular In</h4>
                            <ul className="space-y-3 text-white/40">
                                {['India', 'Singapore', 'Philippines', 'Malaysia', '150+ Countries'].map(country => (
                                    <li key={country} className="flex items-center gap-2">
                                        <Globe weight="fill" className="w-4 h-4 text-blue-400" />
                                        {country}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/30">
                        <span>&copy; {new Date().getFullYear()} EchoRoom. All rights reserved.</span>
                        <span className="flex items-center gap-2">
                            Made with <Heart weight="fill" className="w-4 h-4 text-red-500" /> for the world
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PremiumLanding;
