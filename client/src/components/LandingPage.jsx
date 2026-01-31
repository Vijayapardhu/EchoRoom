import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Video, Shield, ArrowRight, Zap, Activity, Github, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [activeUsers, setActiveUsers] = useState(0);

    useEffect(() => {
        if (!socket) return;

        const handleActiveUsers = ({ count }) => {
            setActiveUsers(count);
        };

        socket.on('active-users', handleActiveUsers);
        return () => socket.off('active-users', handleActiveUsers);
    }, [socket]);

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-black selection:bg-cyan-500/30">
            {/* Cinematic Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-4xl w-full text-center space-y-12"
                >
                    {/* Minimal Status Indicator */}
                    <div className="inline-flex items-center gap-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            <span className="text-xs font-medium tracking-widest uppercase text-cyan-400/80">System Online</span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                            <Users className="w-3 h-3 text-purple-400" />
                            <span className="text-xs font-medium tracking-widest uppercase text-purple-400/80">{activeUsers} Active Users</span>
                        </div>
                    </div>

                    {/* Hero Typography */}
                    <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-white mix-blend-difference">
                        ECHO<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">ROOM</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-neutral-400 font-light tracking-wide max-w-2xl mx-auto">
                        The future of anonymous connection. <br />
                        <span className="text-white">No login. No traces. Just signal.</span>
                    </p>

                    {/* Cyberpunk Button */}
                    <div className="pt-8">
                        <button
                            onClick={() => navigate('/onboarding')}
                            className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-none"
                        >
                            <div className="absolute inset-0 w-full h-full bg-cyan-500/10 border border-cyan-500/50 skew-x-12 transition-all group-hover:bg-cyan-500 group-hover:skew-x-0" />
                            <div className="absolute inset-0 w-full h-full border border-white/10 skew-x-12 scale-105 opacity-50" />

                            <span className="relative flex items-center gap-4 text-cyan-400 font-bold tracking-[0.2em] uppercase group-hover:text-black transition-colors">
                                Initialize Link <ArrowRight className="w-5 h-5" />
                            </span>
                        </button>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 border-t border-white/5 mt-16">
                        <FeatureCard 
                            icon={<Shield />} 
                            label="End-to-End Encrypted" 
                            description="Your conversations are fully private and secure"
                            color="cyan"
                        />
                        <FeatureCard 
                            icon={<Video />} 
                            label="Crystal Clear HD" 
                            description="High quality video and audio streaming"
                            color="purple"
                        />
                        <FeatureCard 
                            icon={<Activity />} 
                            label="Ultra Low Latency" 
                            description="Real-time connection with minimal delay"
                            color="green"
                        />
                    </div>

                    {/* Stats */}
                    <div className="flex justify-center gap-12 mt-16">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">{activeUsers || '0'}</div>
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">Online Now</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">100%</div>
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">Anonymous</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">Free</div>
                            <div className="text-xs text-neutral-500 uppercase tracking-wider">Forever</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <footer className="w-full p-6 border-t border-white/5 bg-black/50 backdrop-blur-md z-20">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-neutral-500 text-sm">
                        &copy; {new Date().getFullYear()} EchoRoom. All systems operational.
                    </div>

                    <div className="flex items-center gap-6">
                        <a href="https://github.com/vijayapardhu" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
                            <Github className="w-4 h-4" />
                            <span className="text-sm">GitHub</span>
                        </a>
                        <div className="text-neutral-600 text-sm">
                            Developed by <span className="text-cyan-500/80">MVP</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, label, description, color }) => {
    const colors = {
        cyan: 'group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 group-hover:text-cyan-400',
        purple: 'group-hover:border-purple-500/30 group-hover:bg-purple-500/5 group-hover:text-purple-400',
        green: 'group-hover:border-green-500/30 group-hover:bg-green-500/5 group-hover:text-green-400',
    };
    
    return (
        <div className={`group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 cursor-default ${colors[color]}`}>
            <div className={`p-3 rounded-xl border border-white/10 bg-white/5 inline-block mb-4 transition-all ${colors[color]}`}>
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </div>
            <h3 className="text-white font-semibold mb-2">{label}</h3>
            <p className="text-neutral-500 text-sm">{description}</p>
        </div>
    );
};

export default LandingPage;
