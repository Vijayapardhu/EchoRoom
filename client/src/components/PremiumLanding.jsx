import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
    VideoCamera, 
    Users, 
    ShieldCheck, 
    Lightning, 
    ArrowRight, 
    Sparkle,
    Globe,
    Lock,
    Star,
    Cursor,
    Check,
    X,
    Envelope,
    FileText,
    Shield,
    GithubLogo,
    ChatCircleText,
    Info
} from '@phosphor-icons/react';
import StarField from './StarField';
import Footer from './Footer';

// Modal Component for pages
const PageModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="relative w-full max-w-3xl max-h-[80vh] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <X weight="bold" className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {children}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Privacy Policy Content
const PrivacyContent = () => (
    <div className="space-y-6 text-white/70">
        <section>
            <h3 className="text-lg font-semibold text-white mb-3">Our Privacy Promise</h3>
            <p className="leading-relaxed">
                At echo, we believe privacy is a fundamental right. We built our platform with privacy-first principles, 
                ensuring your conversations remain truly private and secure.
            </p>
        </section>
        
        <section>
            <h3 className="text-lg font-semibold text-white mb-3">What We Don't Do</h3>
            <ul className="space-y-2">
                {[
                    'We do not store your video or audio conversations',
                    'We do not log chat messages or file transfers',
                    'We do not track your browsing behavior',
                    'We do not sell your data to third parties',
                    'We do not require personal information to use our service'
                ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <Check weight="bold" className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </section>
        
        <section>
            <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
            <p className="leading-relaxed mb-3">
                echo uses WebRTC technology to establish direct peer-to-peer connections between users. 
                This means your video and audio data flows directly between you and the person you're chatting with, 
                never passing through our servers.
            </p>
            <p className="leading-relaxed">
                Our servers only handle the initial connection setup (signaling) and are not involved in the actual 
                data transfer. Once the connection is established, it's completely private between the participants.
            </p>
        </section>
        
        <section>
            <h3 className="text-lg font-semibold text-white mb-3">Technical Security</h3>
            <p className="leading-relaxed">
                All connections use DTLS (Datagram Transport Layer Security) and SRTP (Secure Real-time Transport Protocol) 
                for encryption. This ensures your conversations are protected with industry-standard encryption.
            </p>
        </section>
    </div>
);

// Terms of Service Content
const TermsContent = () => (
    <div className="space-y-6 text-white/70">
        <section>
            <h3 className="text-lg font-semibold text-white mb-3">Terms of Service</h3>
            <p className="leading-relaxed">
                By using echo, you agree to these terms. Please read them carefully.
            </p>
        </section>
        
        <section>
            <h3 className="text-lg font-semibold text-white mb-3">Acceptable Use</h3>
            <p className="leading-relaxed mb-3">You agree not to use echo for:</p>
            <ul className="space-y-2">
                {[
                    'Any illegal activities or content',
                    'Harassment, bullying, or hate speech',
                    'Sharing explicit or adult content without consent',
                    'Impersonating others or spreading false information',
                    'Automated data collection or scraping',
                    'Attempting to breach security measures'
                ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <X weight="bold" className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </section>
        
        <section>
            <h3 className="text-lg font-semibold text-white mb-3">Service Availability</h3>
            <p className="leading-relaxed">
                We strive to maintain high availability, but echo is provided "as is" without warranties. 
                We reserve the right to modify or discontinue the service at any time.
            </p>
        </section>
        
        <section>
            <h3 className="text-lg font-semibold text-white mb-3">Liability</h3>
            <p className="leading-relaxed">
                echo is not liable for any damages arising from your use of the service. 
                You use the service at your own risk and discretion.
            </p>
        </section>
    </div>
);

// Contact Content
const ContactContent = () => (
    <div className="space-y-6 text-white/70">
        <section>
            <h3 className="text-lg font-semibold text-white mb-3">Get in Touch</h3>
            <p className="leading-relaxed mb-6">
                Have questions, feedback, or need support? We'd love to hear from you.
            </p>
        </section>
        
        <div className="grid gap-4">
            <a 
                href="mailto:hello@echoroom.app" 
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
            >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Envelope weight="bold" className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <div className="font-semibold text-white">Email Us</div>
                    <div className="text-sm text-white/50 group-hover:text-white/70 transition-colors">hello@echoroom.app</div>
                </div>
            </a>
            
            <a 
                href="https://github.com/echoroom" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
            >
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <GithubLogo weight="bold" className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                    <div className="font-semibold text-white">GitHub</div>
                    <div className="text-sm text-white/50 group-hover:text-white/70 transition-colors">Open source on GitHub</div>
                </div>
            </a>
            
            <a 
                href="#" 
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
            >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Shield weight="bold" className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <div className="font-semibold text-white">Security</div>
                    <div className="text-sm text-white/50 group-hover:text-white/70 transition-colors">Report security issues</div>
                </div>
            </a>
        </div>
        
        <section className="pt-4">
            <p className="text-sm text-white/40">
                We typically respond within 24-48 hours. For security issues, please use responsible disclosure practices.
            </p>
        </section>
    </div>
);

const PremiumLanding = () => {
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [activeModal, setActiveModal] = useState(null);
    
    // Create Room modal state
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [createRoomInterests, setCreateRoomInterests] = useState([]);
    const [createRoomMode, setCreateRoomMode] = useState('video'); // 'video' or 'text'
    const availableInterests = [
        'Technology', 'Music', 'Sports', 'Gaming', 'Art', 'Movies',
        'Travel', 'Food', 'Books', 'Science', 'Photography', 'Business',
        'Fashion', 'Fitness', 'Education', 'Politics', 'History', 'Nature'
    ];

    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const features = [
        { 
            icon: VideoCamera, 
            title: 'Crystal Clear Video', 
            desc: 'HD quality video calls with adaptive bitrate for any connection',
            color: 'from-blue-500 to-cyan-500'
        },
        { 
            icon: ShieldCheck, 
            title: 'Private & Secure', 
            desc: 'End-to-end encryption. No data stored. Your conversations stay yours',
            color: 'from-emerald-500 to-teal-500'
        },
        { 
            icon: Lightning, 
            title: 'Instant Connection', 
            desc: 'Connect with someone new in seconds. No registration required',
            color: 'from-violet-500 to-purple-500'
        },
        { 
            icon: Users, 
            title: 'Group Calls', 
            desc: 'Chat with multiple people at once. Perfect for team meetings or hangouts',
            color: 'from-orange-500 to-amber-500'
        },
    ];

    const stats = [
        { value: '50K+', label: 'Daily Users', icon: Users },
        { value: '1M+', label: 'Calls Made', icon: VideoCamera },
        { value: '100%', label: 'Secure', icon: ShieldCheck },
        { value: '0', label: 'Data Stored', icon: Lock },
    ];

    const startQuickChat = () => {
        navigate('/matching', { state: { mode: 'video', interests: [] } });
    };

    const openCreateRoomModal = () => {
        setShowCreateRoomModal(true);
    };

    const handleCreateRoom = () => {
        const roomId = Math.random().toString(36).substring(2, 9);
        const roomType = createRoomMode === 'text' ? 'group-text-' : 'group-';
        const fullRoomId = `${roomType}${roomId}`;
        navigate(`/room/${fullRoomId}`, { 
            state: { 
                mode: createRoomMode, 
                isHost: true, 
                interests: createRoomInterests 
            } 
        });
        setShowCreateRoomModal(false);
    };

    const toggleCreateRoomInterest = (interest) => {
        setCreateRoomInterests(prev => 
            prev.includes(interest) 
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const openModal = (modal) => {
        setActiveModal(modal);
    };

    const closeModal = () => {
        setActiveModal(null);
    };

    return (
        <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
            {/* Mouse following spotlight */}
            <div 
                className="pointer-events-none fixed inset-0 z-50 opacity-30"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59,130,246,0.06), transparent 40%)`
                }}
            />

            {/* Navigation */}
            <motion.nav 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="fixed top-0 left-0 right-0 z-40 px-6 py-4"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between px-6 py-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5">
                        {/* Logo: echo in white, room in blue gradient */}
                        <div className="flex items-center">
                            <span className="text-2xl font-bold tracking-tight text-white">echo</span>
                            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">room</span>
                        </div>
                        
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-white/60 hover:text-white transition-colors text-sm">Features</a>
                            <a href="#how-it-works" className="text-white/60 hover:text-white transition-colors text-sm">How it Works</a>
                            <a href="#security" className="text-white/60 hover:text-white transition-colors text-sm">Security</a>
                            <button onClick={() => openModal('privacy')} className="text-white/60 hover:text-white transition-colors text-sm">Privacy</button>
                            <button onClick={() => openModal('contact')} className="text-white/60 hover:text-white transition-colors text-sm">Contact</button>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startQuickChat}
                            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors"
                        >
                            Start Chat
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <motion.section 
                ref={heroRef}
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="relative min-h-screen flex items-center justify-center pt-24 pb-16"
            >
                {/* Background effects */}
                <div className="absolute inset-0">
                    <StarField />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
                    >
                        <Sparkle weight="fill" className="w-4 h-4 text-violet-400" />
                        <span className="text-sm text-white/70">Now with Group Calls</span>
                    </motion.div>

                    {/* Main headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
                    >
                        Connect with{' '}
                        <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                            anyone
                        </span>
                        <br />
                        without compromise
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12"
                    >
                        Secure, private video chat with crystal-clear quality. 
                        No registration. No data collection. Just pure connection.
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startQuickChat}
                            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                        >
                            <VideoCamera weight="fill" className="w-5 h-5" />
                            Start Video Chat
                            <ArrowRight weight="bold" className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={openCreateRoomModal}
                            className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-semibold transition-all"
                        >
                            <Users weight="fill" className="w-5 h-5" />
                            Create Room
                        </motion.button>
                    </motion.div>

                    {/* Social proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-16 flex items-center justify-center gap-8 text-white/40"
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[1,2,3,4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 border-2 border-slate-950" />
                                ))}
                            </div>
                            <span className="text-sm">50K+ users today</span>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-white/10" />
                        <div className="hidden sm:flex items-center gap-2">
                            <Star weight="fill" className="w-4 h-4 text-yellow-400" />
                            <Star weight="fill" className="w-4 h-4 text-yellow-400" />
                            <Star weight="fill" className="w-4 h-4 text-yellow-400" />
                            <Star weight="fill" className="w-4 h-4 text-yellow-400" />
                            <Star weight="fill" className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm">4.9/5 rating</span>
                        </div>
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
                    >
                        <div className="w-1 h-2 rounded-full bg-white/40" />
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* Stats Section */}
            <section className="relative py-24 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 mb-4">
                                    <stat.icon weight="fill" className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-white/50">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <span className="inline-block px-4 py-2 rounded-full bg-white/5 text-sm text-white/60 mb-4">Features</span>
                        <h2 className="text-4xl sm:text-5xl font-bold mb-6">Built for <span className="text-blue-400">privacy</span></h2>
                        <p className="text-lg text-white/50 max-w-2xl mx-auto">
                            Every feature designed with your security in mind. No compromises.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -4 }}
                                className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-500"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity`} />
                                
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} mb-6`}>
                                    <feature.icon weight="fill" className="w-7 h-7 text-white" />
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-white/50 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="relative py-32 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <span className="inline-block px-4 py-2 rounded-full bg-white/5 text-sm text-white/60 mb-4">How it Works</span>
                        <h2 className="text-4xl sm:text-5xl font-bold mb-6">Get started in <span className="text-violet-400">seconds</span></h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Click Start', desc: 'No registration required. Just hit the button and go.', icon: Cursor },
                            { step: '02', title: 'Get Matched', desc: 'We connect you with someone instantly using smart matching.', icon: Lightning },
                            { step: '03', title: 'Start Chatting', desc: 'Enjoy crystal-clear video and audio. End anytime.', icon: VideoCamera },
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="relative"
                            >
                                <div className="text-7xl font-bold text-white/5 absolute -top-4 -left-2">
                                    {item.step}
                                </div>
                                <div className="relative pt-8">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                                        <item.icon weight="fill" className="w-8 h-8 text-white/80" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                    <p className="text-white/50">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security section */}
            <section id="security" className="relative py-32">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-950 to-slate-950" />
                </div>
                
                <div className="relative max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm mb-4">Security First</span>
                            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Your privacy is our <span className="text-emerald-400">priority</span></h2>
                            <p className="text-lg text-white/50 mb-8">
                                Unlike other platforms, we don't store your conversations, don't track your activity, 
                                and don't sell your data. Your video calls are truly private.
                            </p>
                            
                            <ul className="space-y-4">
                                {[
                                    'End-to-end encryption',
                                    'No data collection',
                                    'No registration required',
                                    'Open source code'
                                ].map((item, index) => (
                                    <motion.li
                                        key={item}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <ShieldCheck weight="bold" className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <span className="text-white/70">{item}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-violet-500 blur-3xl opacity-20" />
                            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <Lock weight="bold" className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Secure Connection</div>
                                        <div className="text-sm text-emerald-400">Encrypted with WebRTC</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                                        <span className="text-white/50">Connection Type</span>
                                        <span className="text-white font-medium">Direct P2P</span>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                                        <span className="text-white/50">Encryption</span>
                                        <span className="text-white font-medium">AES-256</span>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                                        <span className="text-white/50">Data Storage</span>
                                        <span className="text-white font-medium">None</span>
                                    </div>
                                    <div className="flex items-center justify-between py-3">
                                        <span className="text-white/50">Session Logs</span>
                                        <span className="text-white font-medium">Not Retained</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-32 border-t border-white/5">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to connect?</h2>
                        <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto">
                            Join thousands of people who trust echo for their private conversations.
                        </p>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startQuickChat}
                            className="px-10 py-5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                        >
                            Start Chatting Now
                        </motion.button>
                        
                        <p className="mt-6 text-sm text-white/30">
                            Free forever. No credit card required.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <Footer onOpenModal={openModal} />

            {/* Modals */}
            <PageModal 
                isOpen={activeModal === 'privacy'} 
                onClose={closeModal} 
                title="Privacy Policy"
            >
                <PrivacyContent />
            </PageModal>

            <PageModal 
                isOpen={activeModal === 'terms'} 
                onClose={closeModal} 
                title="Terms of Service"
            >
                <TermsContent />
            </PageModal>

            <PageModal 
                isOpen={activeModal === 'contact'} 
                onClose={closeModal} 
                title="Contact Us"
            >
                <ContactContent />
            </PageModal>

            {/* Create Room Modal */}
            <AnimatePresence>
                {showCreateRoomModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowCreateRoomModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Users weight="fill" className="w-5 h-5 text-violet-400" />
                                    <h2 className="text-xl font-bold text-white">Create Room</h2>
                                </div>
                                <button
                                    onClick={() => setShowCreateRoomModal(false)}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                >
                                    <X weight="bold" className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Mode Selection */}
                                <div>
                                    <label className="text-sm text-white/60 mb-3 block">Room Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setCreateRoomMode('video')}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                                                createRoomMode === 'video' 
                                                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                            }`}
                                        >
                                            <VideoCamera weight="fill" className="w-5 h-5" />
                                            <span className="font-medium">Video Chat</span>
                                        </button>
                                        <button
                                            onClick={() => setCreateRoomMode('text')}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                                                createRoomMode === 'text' 
                                                    ? 'bg-violet-500/10 border-violet-500/50 text-violet-400' 
                                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                            }`}
                                        >
                                            <ChatCircleText weight="fill" className="w-5 h-5" />
                                            <span className="font-medium">Text Only</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Interests Selection */}
                                <div>
                                    <label className="text-sm text-white/60 mb-3 block">
                                        Select Interests 
                                        <span className="text-white/30 ml-1">(optional)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto py-2">
                                        {availableInterests.map((interest) => (
                                            <motion.button
                                                key={interest}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => toggleCreateRoomInterest(interest)}
                                                className={`
                                                    px-4 py-2 rounded-full text-sm font-medium transition-all
                                                    ${createRoomInterests.includes(interest) 
                                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                                                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                                                    }
                                                `}
                                            >
                                                {interest}
                                            </motion.button>
                                        ))}
                                    </div>
                                    {createRoomInterests.length > 0 && (
                                        <p className="text-sm text-blue-400 mt-2">
                                            {createRoomInterests.length} interest{createRoomInterests.length !== 1 ? 's' : ''} selected
                                        </p>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="flex items-start gap-3">
                                        <Info weight="fill" className="w-5 h-5 text-blue-400 mt-0.5" />
                                        <div className="text-sm text-white/60">
                                            <p className="mb-1">You'll get a unique room link to share with friends.</p>
                                            <p>People with matching interests will be prioritized.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Create Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCreateRoom}
                                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                                >
                                    Create Room
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PremiumLanding;
