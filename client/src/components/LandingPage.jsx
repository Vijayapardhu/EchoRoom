import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Video, Shield, ArrowRight, Zap, Activity, Github, Users, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

// Floating particle component
const Particle = ({ delay, duration, size, left, top }) => (
    <motion.div
        className="absolute rounded-full bg-cyan-500/20"
        style={{ width: size, height: size, left: `${left}%`, top: `${top}%` }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
            opacity: [0, 0.5, 0],
            scale: [0, 1, 0],
            y: [-20, -100],
        }}
        transition={{
            duration: duration,
            delay: delay,
            repeat: Infinity,
            ease: "easeOut",
        }}
    />
);

const LandingPage = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [activeUsers, setActiveUsers] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const [isHovering, setIsHovering] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleActiveUsers = ({ count }) => {
            setActiveUsers(count);
        };

        socket.on('active-users', handleActiveUsers);
        return () => socket.off('active-users', handleActiveUsers);
    }, [socket]);

    // Mouse tracking for spotlight effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({
                    x: ((e.clientX - rect.left) / rect.width) * 100,
                    y: ((e.clientY - rect.top) / rect.height) * 100,
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Generate particles
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: i * 0.3,
        duration: 3 + Math.random() * 2,
        size: 4 + Math.random() * 8,
        left: Math.random() * 100,
        top: 60 + Math.random() * 40,
    }));

    return (
        <div 
            ref={containerRef}
            className="min-h-screen flex flex-col relative overflow-hidden bg-black selection:bg-cyan-500/30"
            style={{
                '--mouse-x': `${mousePosition.x}%`,
                '--mouse-y': `${mousePosition.y}%`,
            }}
        >
            {/* Dynamic Spotlight Effect */}
            <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(6, 182, 212, 0.08), transparent 40%)`,
                }}
            />

            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px]"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                    className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]"
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, 50, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                    className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-[80px]"
                    animate={{
                        scale: [1, 1.2, 1],
                        y: [0, -30, 0],
                    }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((p) => (
                    <Particle key={p.id} {...p} />
                ))}
            </div>

            {/* Grid Pattern Overlay */}
            <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                }}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-4xl w-full text-center space-y-12"
                >
                    {/* Minimal Status Indicator */}
                    <motion.div 
                        className="inline-flex items-center gap-4 flex-wrap justify-center"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            <span className="text-xs font-medium tracking-widest uppercase text-cyan-400/80">System Online</span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                            <Users className="w-3 h-3 text-purple-400" />
                            <span className="text-xs font-medium tracking-widest uppercase text-purple-400/80">{activeUsers} Active</span>
                        </div>
                    </motion.div>

                    {/* Hero Typography */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-white">
                            <span className="inline-block hover:scale-105 transition-transform duration-300">ECHO</span>
                            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-gradient bg-[length:200%_auto] hover:scale-105 transition-transform duration-300">ROOM</span>
                        </h1>
                    </motion.div>

                    <motion.p 
                        className="text-xl md:text-2xl text-neutral-400 font-light tracking-wide max-w-2xl mx-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        The future of anonymous connection. <br />
                        <span className="text-white">No login. No traces. Just signal.</span>
                    </motion.p>

                    {/* Cyberpunk Button */}
                    <motion.div 
                        className="pt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <button
                            onClick={() => navigate('/onboarding')}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                            className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-none"
                        >
                            <motion.div 
                                className="absolute inset-0 w-full h-full bg-cyan-500/10 border border-cyan-500/50 skew-x-12 transition-all group-hover:bg-cyan-500 group-hover:skew-x-0"
                                animate={isHovering ? { boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)' } : {}}
                            />
                            <div className="absolute inset-0 w-full h-full border border-white/10 skew-x-12 scale-105 opacity-50" />

                            <span className="relative flex items-center gap-4 text-cyan-400 font-bold tracking-[0.2em] uppercase group-hover:text-black transition-colors">
                                <Sparkles className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Initialize Link 
                                <motion.div
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </motion.div>
                            </span>
                        </button>
                    </motion.div>

                    {/* Features Grid */}
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 border-t border-white/5 mt-16"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                    >
                        <FeatureCard 
                            icon={<Shield />} 
                            label="End-to-End Encrypted" 
                            description="Your conversations are fully private and secure"
                            color="cyan"
                            delay={0}
                        />
                        <FeatureCard 
                            icon={<Video />} 
                            label="Crystal Clear HD" 
                            description="High quality video and audio streaming"
                            color="purple"
                            delay={0.1}
                        />
                        <FeatureCard 
                            icon={<Activity />} 
                            label="Ultra Low Latency" 
                            description="Real-time connection with minimal delay"
                            color="green"
                            delay={0.2}
                        />
                    </motion.div>

                    {/* Stats */}
                    <motion.div 
                        className="flex justify-center gap-12 mt-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                    >
                        <StatCard value={activeUsers || '0'} label="Online Now" />
                        <StatCard value="100%" label="Anonymous" />
                        <StatCard value="Free" label="Forever" />
                    </motion.div>
                </motion.div>
            </div>

            {/* Footer */}
            <footer className="w-full p-6 border-t border-white/5 bg-black/50 backdrop-blur-md z-20">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-neutral-500 text-sm">
                        &copy; {new Date().getFullYear()} EchoRoom. All systems operational.
                    </div>

                    <div className="flex items-center gap-6">
                        <a href="https://github.com/vijayapardhu" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2 group">
                            <Github className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span className="text-sm">GitHub</span>
                        </a>
                        <div className="text-neutral-600 text-sm">
                            Developed by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">MVP</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, label, description, color, delay = 0 }) => {
    const colors = {
        cyan: 'group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 group-hover:shadow-glow-cyan',
        purple: 'group-hover:border-purple-500/30 group-hover:bg-purple-500/5 group-hover:shadow-glow-purple',
        green: 'group-hover:border-green-500/30 group-hover:bg-green-500/5 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    };

    const iconColors = {
        cyan: 'group-hover:text-cyan-400',
        purple: 'group-hover:text-purple-400',
        green: 'group-hover:text-green-400',
    };
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.9 }}
            className={`group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 cursor-default transform hover:-translate-y-1 ${colors[color]}`}
        >
            <div className={`p-3 rounded-xl border border-white/10 bg-white/5 inline-block mb-4 transition-all duration-300 ${iconColors[color]}`}>
                {React.cloneElement(icon, { className: "w-6 h-6 transition-transform group-hover:scale-110" })}
            </div>
            <h3 className="text-white font-semibold mb-2">{label}</h3>
            <p className="text-neutral-500 text-sm">{description}</p>
        </motion.div>
    );
};

const StatCard = ({ value, label }) => (
    <motion.div 
        className="text-center group cursor-default"
        whileHover={{ scale: 1.05 }}
    >
        <div className="text-3xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-500 transition-all">{value}</div>
        <div className="text-xs text-neutral-500 uppercase tracking-wider">{label}</div>
    </motion.div>
);

export default LandingPage;
