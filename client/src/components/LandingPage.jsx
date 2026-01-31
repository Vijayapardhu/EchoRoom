import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MessageCircle, Video, Shield, ArrowRight, Zap, Activity, Github, Users, 
    Sparkles, Globe, Heart, Star, Play, ChevronDown, Check, Mic, Camera,
    Lock, Shuffle, Smartphone, Monitor, Award, TrendingUp, Clock, Eye
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

// Animated gradient orb component
const GradientOrb = ({ className, color1, color2, delay = 0 }) => (
    <motion.div
        className={`absolute rounded-full blur-3xl ${className}`}
        style={{
            background: `linear-gradient(135deg, ${color1}, ${color2})`,
        }}
        animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 180, 360],
        }}
        transition={{
            duration: 20,
            delay,
            repeat: Infinity,
            ease: "linear",
        }}
    />
);

// Floating icon component
const FloatingIcon = ({ icon: Icon, className, delay = 0 }) => (
    <motion.div
        className={`absolute ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
            opacity: [0.2, 0.5, 0.2],
            y: [-10, 10, -10],
        }}
        transition={{
            duration: 4,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
        }}
    >
        <Icon className="w-8 h-8 text-white/20" />
    </motion.div>
);

// Animated counter
const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        let startTime;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [end, duration]);
    
    return <span>{count.toLocaleString()}{suffix}</span>;
};

const LandingPage = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [activeUsers, setActiveUsers] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const [activeFeature, setActiveFeature] = useState(0);
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

    useEffect(() => {
        if (!socket) return;
        const handleActiveUsers = ({ count }) => setActiveUsers(count);
        socket.on('active-users', handleActiveUsers);
        return () => socket.off('active-users', handleActiveUsers);
    }, [socket]);

    // Mouse tracking
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

    // Auto-rotate features
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % 4);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const features = [
        { icon: Video, title: 'HD Video Chat', desc: 'Crystal clear video quality', color: 'cyan' },
        { icon: Shield, title: '100% Anonymous', desc: 'No registration needed', color: 'purple' },
        { icon: Shuffle, title: 'Smart Matching', desc: 'Interest-based connections', color: 'pink' },
        { icon: Globe, title: 'Global Access', desc: 'Connect worldwide', color: 'green' },
    ];

    const stats = [
        { icon: Users, value: activeUsers || 100, label: 'Online Now', suffix: '+' },
        { icon: Globe, value: 150, label: 'Countries', suffix: '+' },
        { icon: Heart, value: 1, label: 'Million Users', suffix: 'M+' },
        { icon: Star, value: 4.8, label: 'User Rating', suffix: '/5' },
    ];

    const howItWorks = [
        { step: 1, title: 'Allow Access', desc: 'Enable camera & microphone', icon: Camera },
        { step: 2, title: 'Choose Interests', desc: 'Select topics you love', icon: Heart },
        { step: 3, title: 'Get Matched', desc: 'Connect with strangers', icon: Shuffle },
        { step: 4, title: 'Start Chatting', desc: 'Enjoy your conversation', icon: MessageCircle },
    ];

    const testimonials = [
        { name: 'Rahul K.', location: 'Mumbai, India', text: 'Best Omegle alternative! Made so many friends here.', rating: 5 },
        { name: 'Sarah M.', location: 'Singapore', text: 'Love the HD video quality and smart matching!', rating: 5 },
        { name: 'Alex J.', location: 'Philippines', text: 'Finally a safe platform to meet new people.', rating: 5 },
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            {/* Dynamic Cursor Glow */}
            <div 
                className="fixed inset-0 pointer-events-none z-0 transition-all duration-300"
                style={{
                    background: `radial-gradient(800px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(6, 182, 212, 0.06), transparent 40%)`,
                }}
            />

            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <GradientOrb className="w-[600px] h-[600px] -top-40 -left-40" color1="rgba(6, 182, 212, 0.15)" color2="rgba(139, 92, 246, 0.1)" />
                <GradientOrb className="w-[500px] h-[500px] top-1/2 -right-40" color1="rgba(236, 72, 153, 0.1)" color2="rgba(6, 182, 212, 0.1)" delay={5} />
                <GradientOrb className="w-[400px] h-[400px] -bottom-40 left-1/3" color1="rgba(34, 197, 94, 0.1)" color2="rgba(139, 92, 246, 0.1)" delay={10} />
                
                {/* Floating Icons */}
                <FloatingIcon icon={Video} className="top-20 left-[10%]" delay={0} />
                <FloatingIcon icon={MessageCircle} className="top-40 right-[15%]" delay={1} />
                <FloatingIcon icon={Heart} className="bottom-40 left-[20%]" delay={2} />
                <FloatingIcon icon={Star} className="bottom-20 right-[10%]" delay={3} />
            </div>

            {/* Grid Pattern */}
            <div 
                className="fixed inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                                     linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Navigation */}
            <motion.nav 
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <motion.div 
                        className="flex items-center gap-3"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                            EchoRoom
                        </span>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-neutral-400 hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm text-neutral-400 hover:text-white transition-colors">How It Works</a>
                        <a href="#testimonials" className="text-sm text-neutral-400 hover:text-white transition-colors">Reviews</a>
                    </div>

                    <motion.button
                        onClick={() => navigate('/onboarding')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold text-sm shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-shadow"
                    >
                        Start Chatting
                    </motion.button>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <motion.section 
                ref={heroRef}
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="relative min-h-screen flex items-center justify-center px-6 pt-20"
            >
                <div className="max-w-6xl mx-auto text-center z-10">
                    {/* Status Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-3 mb-8"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                            </span>
                            <span className="text-sm text-neutral-300">
                                <span className="text-green-400 font-semibold">{activeUsers || 100}+</span> people online now
                            </span>
                        </div>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-6"
                    >
                        <span className="block text-white">Meet</span>
                        <span className="block bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Strangers
                        </span>
                        <span className="block text-white">Instantly</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg sm:text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto mb-10"
                    >
                        Free anonymous video chat with people worldwide.
                        <span className="text-white"> No login required.</span>
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                    >
                        <motion.button
                            onClick={() => navigate('/onboarding')}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold text-lg shadow-xl shadow-cyan-500/30 flex items-center gap-3"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Start Video Chat
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <motion.button
                            onClick={() => navigate('/onboarding')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-colors flex items-center gap-3"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Text Only Mode
                        </motion.button>
                    </motion.div>

                    {/* Feature Pills */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="flex flex-wrap justify-center gap-3"
                    >
                        {['🔒 100% Anonymous', '🌍 150+ Countries', '⚡ Instant Match', '💬 Free Forever'].map((feature, i) => (
                            <motion.span
                                key={feature}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9 + i * 0.1 }}
                                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-300"
                            >
                                {feature}
                            </motion.span>
                        ))}
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: [0, 10, 0] }}
                        transition={{ delay: 1.2, y: { duration: 2, repeat: Infinity } }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    >
                        <ChevronDown className="w-8 h-8 text-neutral-500" />
                    </motion.div>
                </div>
            </motion.section>

            {/* Stats Section */}
            <section className="relative py-20 px-6 border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center group"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 mb-4 group-hover:scale-110 transition-transform">
                                    <stat.icon className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                                </div>
                                <div className="text-sm text-neutral-500">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-4">
                            Features
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Why Choose <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">EchoRoom</span>?
                        </h2>
                        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                            The most advanced anonymous video chat platform with features you'll love
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                onClick={() => setActiveFeature(i)}
                                className={`group p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${
                                    activeFeature === i 
                                        ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/20' 
                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                }`}
                            >
                                <div className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center transition-all ${
                                    activeFeature === i 
                                        ? 'bg-gradient-to-br from-cyan-500 to-cyan-600' 
                                        : 'bg-white/10 group-hover:bg-white/20'
                                }`}>
                                    <feature.icon className={`w-7 h-7 ${activeFeature === i ? 'text-white' : 'text-neutral-400'}`} />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                                <p className="text-neutral-400">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Additional Features Grid */}
                    <div className="grid md:grid-cols-3 gap-6 mt-12">
                        {[
                            { icon: Lock, title: 'End-to-End Encrypted', desc: 'Your chats are fully private and secure' },
                            { icon: Smartphone, title: 'Mobile Optimized', desc: 'Works perfectly on any device' },
                            { icon: Clock, title: 'Instant Connection', desc: 'Get matched in seconds, not minutes' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/10"
                            >
                                <div className="p-3 rounded-xl bg-purple-500/20">
                                    <item.icon className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                                    <p className="text-sm text-neutral-400">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="relative py-24 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-4">
                            How It Works
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Start Chatting in <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">4 Easy Steps</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {howItWorks.map((step, i) => (
                            <motion.div
                                key={step.step}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="relative text-center group"
                            >
                                {/* Connection Line */}
                                {i < howItWorks.length - 1 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                                )}
                                
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-white/10 group-hover:border-cyan-500/50 transition-colors"
                                >
                                    <step.icon className="w-8 h-8 text-cyan-400" />
                                </motion.div>
                                <div className="text-sm text-cyan-400 font-semibold mb-2">Step {step.step}</div>
                                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                                <p className="text-neutral-400 text-sm">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mt-12"
                    >
                        <motion.button
                            onClick={() => navigate('/onboarding')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-xl shadow-purple-500/30 inline-flex items-center gap-3"
                        >
                            Try It Now - It's Free!
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="relative py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-pink-500/10 text-pink-400 text-sm font-medium mb-4">
                            Testimonials
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Loved by <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">Millions</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial, i) => (
                            <motion.div
                                key={testimonial.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all"
                            >
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-neutral-300 mb-6">"{testimonial.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                        {testimonial.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white">{testimonial.name}</div>
                                        <div className="text-sm text-neutral-500">{testimonial.location}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="relative py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="p-12 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 backdrop-blur-sm"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Ready to Connect?
                        </h2>
                        <p className="text-neutral-400 text-lg mb-8 max-w-xl mx-auto">
                            Join millions of users making new friends every day. No signup, no hassle - just click and chat!
                        </p>
                        <motion.button
                            onClick={() => navigate('/onboarding')}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(6, 182, 212, 0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            className="px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold text-xl shadow-2xl inline-flex items-center gap-3"
                        >
                            <Sparkles className="w-6 h-6" />
                            Start Chatting Now
                            <ArrowRight className="w-6 h-6" />
                        </motion.button>
                        <p className="text-neutral-500 text-sm mt-4">
                            Free forever • No registration • 100% anonymous
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-12 px-6 border-t border-white/5 bg-black/50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-2xl font-bold">EchoRoom</span>
                            </div>
                            <p className="text-neutral-400 mb-6 max-w-sm">
                                The world's most popular anonymous video chat platform. Connect with strangers, make friends, and have meaningful conversations.
                            </p>
                            <div className="flex items-center gap-4">
                                <a 
                                    href="https://github.com/vijayapardhu" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <Github className="w-5 h-5 text-neutral-400 hover:text-white transition-colors" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                {['Features', 'How It Works', 'Reviews', 'Privacy'].map(link => (
                                    <li key={link}>
                                        <a href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-neutral-400 hover:text-white transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Regions */}
                        <div>
                            <h4 className="font-semibold text-white mb-4">Popular In</h4>
                            <ul className="space-y-2 text-neutral-400">
                                <li>🇮🇳 India</li>
                                <li>🇸🇬 Singapore</li>
                                <li>🇵🇭 Philippines</li>
                                <li>🇲🇾 Malaysia</li>
                                <li>🌍 150+ Countries</li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-neutral-500 text-sm">
                            © {new Date().getFullYear()} EchoRoom. All rights reserved.
                        </div>
                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                            <span>Crafted with</span>
                            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                            <span>by</span>
                            <span className="font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                MVP
                            </span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* SEO Hidden Content */}
            <section className="sr-only" aria-label="About EchoRoom">
                <h2>EchoRoom - The Best Free Anonymous Video Chat Platform</h2>
                <p>
                    EchoRoom is the premier Omegle alternative for 2026, offering free anonymous video chat with strangers worldwide. 
                    Connect instantly through HD video calls, text messaging, and interest-based matching without any registration required.
                    Popular in India, Asia, and globally for random stranger video chat.
                </p>
                
                <h3>Why Choose EchoRoom Over Other Video Chat Platforms?</h3>
                <ul>
                    <li>100% Free - No hidden charges or premium features</li>
                    <li>Anonymous - No login or personal information required</li>
                    <li>Interest Matching - Connect with people who share your interests</li>
                    <li>HD Video Quality - Crystal clear video and audio</li>
                    <li>Mobile Friendly - Works on all devices without app download</li>
                    <li>Safe and Secure - Built-in safety features and reporting</li>
                    <li>Real-time Reactions - Express yourself with emoji reactions</li>
                    <li>Text Chat - Send messages alongside video chat</li>
                    <li>Global Community - Connect with users from India, USA, UK, Singapore, Philippines, Malaysia, Australia</li>
                    <li>Low Data Usage - Optimized for mobile networks in Asia</li>
                </ul>

                <h3>How to Use EchoRoom Video Chat</h3>
                <ol>
                    <li>Visit EchoRoom website - No download or registration needed</li>
                    <li>Allow camera and microphone access</li>
                    <li>Select your interests for better matching</li>
                    <li>Click Start and get matched with a random stranger</li>
                    <li>Enjoy your conversation - Skip anytime to meet someone new</li>
                </ol>

                <h3>EchoRoom Features</h3>
                <p>
                    Random video chat with strangers, anonymous text messaging, interest-based matching algorithm, 
                    real-time emoji reactions, HD video streaming, low latency connections, mobile responsive design, 
                    no registration required, completely free to use, end-to-end encrypted chats, safe chat environment,
                    report and block features, friend code system for reconnecting, post-chat feedback.
                </p>

                <h3>Popular in India and Asia</h3>
                <p>
                    EchoRoom is the best Omegle alternative in India. Talk to strangers from Mumbai, Delhi, Bangalore, 
                    Chennai, Kolkata, Hyderabad, and all across India. Connect with people from Singapore, Philippines, 
                    Malaysia, Indonesia, Thailand, Vietnam, and other Asian countries. Make new friends online for free.
                </p>

                <h3>Developer</h3>
                <p>Developed by MVP - Building the future of anonymous communication.</p>

                <h3>Keywords</h3>
                <p>
                    omegle alternative, video chat with strangers, random video chat, anonymous chat, talk to strangers, 
                    free video chat, omegle replacement, chatroulette alternative, online video chat, stranger chat app, 
                    random chat rooms, video calling strangers, meet new people online, anonymous video call, 
                    chat with strangers online free, video chat app, live video chat, webcam chat, instant video chat, 
                    random video call, video chat no registration, free cam chat, stranger video call, omegle like sites,
                    best omegle alternative 2026, random stranger chat, anonymous webcam chat, video chat platform,
                    omegle india, video chat india, talk to strangers india, random video chat india, omegle alternative india,
                    free video call app india, stranger chat india, online chat india, video chat asia, omegle asian,
                    random chat asia, desi chat, indian video chat, asian video chat, omegle mumbai, omegle delhi,
                    omegle bangalore, chat with indian strangers, free video chat india, anonymous chat india,
                    video call strangers india, random call india, meet strangers online india, omegle singapore,
                    omegle philippines, omegle malaysia, video chat southeast asia, free chat app asia
                </p>
            </section>
        </div>
    );
};

export default LandingPage;
