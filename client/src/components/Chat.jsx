import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { playMessageSound } from '../utils/soundEffects';
import { 
    PaperPlaneRight, 
    X, 
    ChatCircle, 
    ArrowLeft,
    Smiley,
    Image as ImageIcon,
    Heart,
    Lightning,
    Star,
    Fire,
    HandsClapping,
    Ghost,
    Alien,
    Robot,
    Skull,
    GameController,
    Planet,
    Rocket,
    Paperclip,
    CheckCircle
} from '@phosphor-icons/react';

const quickReactions = [
    { icon: Heart, color: 'red', name: 'heart' },
    { icon: Lightning, color: 'cyan', name: 'lightning' },
    { icon: Star, color: 'yellow', name: 'star' },
    { icon: Fire, color: 'orange', name: 'fire' },
    { icon: HandsClapping, color: 'purple', name: 'clap' },
];

const stickers = [
    { icon: Ghost, name: 'ghost' },
    { icon: Alien, name: 'alien' },
    { icon: Robot, name: 'robot' },
    { icon: Skull, name: 'skull' },
    { icon: GameController, name: 'game' },
    { icon: Planet, name: 'planet' },
    { icon: Rocket, name: 'rocket' },
];

const Chat = ({ roomId, isOpen, onClose, userName }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showPicker, setShowPicker] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handlePopState = (e) => { e.preventDefault(); onClose(); };
        window.history.pushState({ chatOpen: true }, '');
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen, onClose]);

    useEffect(() => {
        socket.on('receive-message', (message) => {
            setMessages((prev) => [...prev, { ...message, isLocal: false }]);
            if (!isOpen) playMessageSound();
        });
        return () => socket.off('receive-message');
    }, [socket, isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;
        const messageData = { type: 'text', content: newMessage, timestamp: new Date().toISOString() };
        socket.emit('send-message', { roomId, message: messageData });
        setMessages((prev) => [...prev, { ...messageData, isLocal: true }]);
        setNewMessage('');
        setShowPicker(null);
    };

    const sendSticker = (sticker) => {
        const messageData = { type: 'sticker', content: sticker, timestamp: new Date().toISOString() };
        socket.emit('send-message', { roomId, message: messageData });
        setMessages((prev) => [...prev, { ...messageData, isLocal: true }]);
        setShowPicker(null);
    };

    const sendReaction = (reaction) => {
        const messageData = { type: 'reaction', content: reaction, timestamp: new Date().toISOString() };
        socket.emit('send-message', { roomId, message: messageData });
        setMessages((prev) => [...prev, { ...messageData, isLocal: true }]);
        setShowPicker(null);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 1024 * 1024) {
            alert('File too large! Max 1MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const messageData = { type: 'image', content: reader.result, timestamp: new Date().toISOString() };
            socket.emit('send-message', { roomId, message: messageData });
            setMessages((prev) => [...prev, { ...messageData, isLocal: true }]);
        };
        reader.readAsDataURL(file);
    };

    const renderMessageContent = (msg) => {
        switch (msg.type) {
            case 'image':
                return (
                    <img
                        src={msg.content}
                        alt="Shared"
                        className="max-w-full border border-white/10 cursor-pointer hover:border-cyan-400/50 transition-colors"
                        onClick={() => window.open(msg.content, '_blank')}
                    />
                );
            case 'sticker':
                const StickerIcon = msg.content.icon;
                return (
                    <div className="flex items-center justify-center p-2">
                        <StickerIcon weight="fill" className="w-12 h-12 text-cyan-400" />
                    </div>
                );
            case 'reaction':
                const ReactionIcon = msg.content.icon;
                return (
                    <div className="flex items-center gap-2">
                        <ReactionIcon weight="fill" className={`w-6 h-6 text-${msg.content.color}-400`} />
                        <span className="text-xs text-white/50 uppercase tracking-wider">{msg.content.name}</span>
                    </div>
                );
            default:
                return <span className="text-sm">{msg.content}</span>;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed md:absolute inset-0 md:top-0 md:right-0 md:left-auto md:bottom-0 h-full w-full md:w-96 bg-black/95 border-l border-white/10 z-50 flex flex-col"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="md:hidden p-2 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all flex items-center gap-2"
                            style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0% 100%)' }}
                        >
                            <ArrowLeft weight="bold" className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Back</span>
                        </motion.button>
                        
                        <div className="flex items-center gap-3">
                            <div className="p-2 border border-cyan-400/30 bg-cyan-400/10 hidden md:flex">
                                <ChatCircle weight="fill" className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="font-black tracking-widest uppercase text-sm text-white">Data Link</h3>
                                <p className="text-xs text-white/30 font-mono">{messages.length} packets</p>
                            </div>
                        </div>
                        
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className="hidden md:flex p-2 border border-white/10 hover:border-red-400/50 hover:bg-red-400/10 transition-all"
                            style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                        >
                            <X weight="bold" className="w-5 h-5" />
                        </motion.button>
                        
                        <div className="md:hidden w-20" />
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.length === 0 && (
                            <motion.div 
                                className="flex flex-col items-center justify-center h-full text-white/20 space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <ChatCircle weight="thin" className="w-12 h-12 opacity-20" />
                                <p className="text-xs uppercase tracking-widest">No data transmitted</p>
                            </motion.div>
                        )}

                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.isLocal ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 text-white ${msg.isLocal
                                        ? 'border border-cyan-400/30 bg-cyan-400/5'
                                        : 'border border-white/10 bg-white/5'
                                    }`}
                                    style={{ clipPath: msg.isLocal ? 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' : 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                                >
                                    {renderMessageContent(msg)}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Picker */}
                    <AnimatePresence>
                        {showPicker && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-black/80 border-t border-white/10 overflow-hidden"
                            >
                                <div className="p-4">
                                    {showPicker === 'emoji' ? (
                                        <div className="grid grid-cols-5 gap-3">
                                            {quickReactions.map((reaction, i) => (
                                                <motion.button 
                                                    key={reaction.name}
                                                    onClick={() => sendReaction(reaction)} 
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="p-3 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all flex items-center justify-center"
                                                    style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                                                >
                                                    <reaction.icon weight="fill" className={`w-6 h-6 text-${reaction.color}-400`} />
                                                </motion.button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-3">
                                            {stickers.map((sticker, i) => (
                                                <motion.button 
                                                    key={sticker.name}
                                                    onClick={() => sendSticker(sticker)} 
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="p-3 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all flex items-center justify-center"
                                                    style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                                                >
                                                    <sticker.icon weight="fill" className="w-8 h-8 text-cyan-400" />
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-black/50">
                        <div className="relative flex items-center gap-2">
                            <motion.button
                                type="button"
                                onClick={() => setShowPicker(showPicker === 'emoji' ? null : 'emoji')}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-2 border transition-all ${showPicker === 'emoji' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/10 text-white/50 hover:text-white hover:border-white/30'}`}
                                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                            >
                                <Smiley weight="fill" className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
                                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                            >
                                <Paperclip weight="bold" className="w-5 h-5" />
                            </motion.button>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Transmit data..."
                                className="flex-1 bg-black/50 border border-white/10 px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 transition-colors"
                                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
                            />
                            <motion.button
                                type="submit"
                                disabled={!newMessage.trim()}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-3 border-2 border-cyan-400 bg-cyan-400 text-black disabled:opacity-30 disabled:hover:bg-cyan-400 hover:bg-cyan-300 transition-all"
                                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                            >
                                <PaperPlaneRight weight="fill" className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Chat;
