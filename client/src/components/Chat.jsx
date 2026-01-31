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
    Gift,
    Paperclip,
    Image as ImageIcon,
    Ghost,
    Alien,
    Robot,
    Crown,
    Lightning,
    Heart,
    Star,
    Fire,
    Skull,
    GameController,
    Pizza,
    Hamburger,
    Planet,
    Rocket,
    Sparkle,
    Camera
} from '@phosphor-icons/react';

const Chat = ({ roomId, isOpen, onClose, userName }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showPicker, setShowPicker] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Reaction icons instead of emojis
    const quickReactions = [
        { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10', name: 'love' },
        { icon: Fire, color: 'text-orange-400', bg: 'bg-orange-500/10', name: 'fire' },
        { icon: Lightning, color: 'text-yellow-400', bg: 'bg-yellow-500/10', name: 'lightning' },
        { icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10', name: 'star' },
        { icon: Sparkle, color: 'text-cyan-400', bg: 'bg-cyan-500/10', name: 'sparkle' },
        { icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10', name: 'crown' },
    ];

    const stickers = [
        { icon: Ghost, name: 'ghost' },
        { icon: Alien, name: 'alien' },
        { icon: Robot, name: 'robot' },
        { icon: Skull, name: 'skull' },
        { icon: GameController, name: 'game' },
        { icon: Pizza, name: 'pizza' },
        { icon: Hamburger, name: 'burger' },
        { icon: Planet, name: 'planet' },
        { icon: Rocket, name: 'rocket' },
    ];

    useEffect(() => {
        if (!isOpen) return;
        
        const handlePopState = (e) => {
            e.preventDefault();
            onClose();
        };

        window.history.pushState({ chatOpen: true }, '');
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        socket.on('receive-message', (message) => {
            setMessages((prev) => [...prev, { ...message, isLocal: false }]);
            if (!isOpen) {
                playMessageSound();
            }
        });

        return () => {
            socket.off('receive-message');
        };
    }, [socket, isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            type: 'text',
            content: newMessage,
            timestamp: new Date().toISOString(),
        };

        socket.emit('send-message', { roomId, message: messageData });
        setMessages((prev) => [...prev, { ...messageData, isLocal: true }]);
        setNewMessage('');
        setShowPicker(null);
    };

    const sendSticker = (sticker) => {
        const messageData = {
            type: 'sticker',
            content: sticker,
            timestamp: new Date().toISOString(),
        };
        socket.emit('send-message', { roomId, message: messageData });
        setMessages((prev) => [...prev, { ...messageData, isLocal: true }]);
        setShowPicker(null);
    };

    const sendReaction = (reaction) => {
        const messageData = {
            type: 'reaction',
            content: reaction,
            timestamp: new Date().toISOString(),
        };
        socket.emit('send-message', { roomId, message: messageData });
        setMessages((prev) => [...prev, { ...messageData, isLocal: true }]);
        setShowPicker(null);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            alert("File too large! Max 1MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const messageData = {
                type: 'image',
                content: reader.result,
                timestamp: new Date().toISOString(),
            };
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
                        className="max-w-full rounded-lg border border-white/10 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(msg.content, '_blank')}
                    />
                );
            case 'sticker':
                const StickerIcon = msg.content.icon;
                return (
                    <div className="flex items-center justify-center p-2">
                        <StickerIcon weight="fill" className="w-16 h-16 text-cyan-400 animate-bounce" />
                    </div>
                );
            case 'reaction':
                const ReactionIcon = msg.content.icon;
                return (
                    <div className="flex items-center gap-2">
                        <ReactionIcon weight="fill" className={`w-8 h-8 ${msg.content.color}`} />
                        <span className="text-xs text-white/50 capitalize">{msg.content.name}</span>
                    </div>
                );
            default:
                return msg.content || msg.text;
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
                    className="fixed md:absolute inset-0 md:top-0 md:right-0 md:left-auto md:bottom-0 h-full w-full md:w-96 bg-gray-900/98 md:bg-gray-900/95 backdrop-blur-md shadow-2xl z-50 md:z-40 flex flex-col"
                    style={{ boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.5)' }}
                >
                    {/* Header */}
                    <div className="p-3 md:p-4 border-b border-white/10 flex justify-between items-center bg-black/50 safe-area-top">
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="md:hidden p-2 -ml-1 rounded-xl hover:bg-white/10 text-white transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft weight="bold" className="w-5 h-5" />
                            <span className="text-sm font-medium">Back</span>
                        </motion.button>
                        
                        <div className="flex items-center gap-3">
                            <motion.div 
                                className="p-2 rounded-full bg-cyan-500/10 text-cyan-400 hidden md:flex"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <ChatCircle weight="fill" className="w-5 h-5" />
                            </motion.div>
                            <div>
                                <h3 className="font-medium tracking-wide text-white">Live Chat</h3>
                                <p className="text-xs text-neutral-500">{messages.length} messages</p>
                            </div>
                        </div>
                        
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className="hidden md:flex p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        >
                            <X weight="bold" className="w-5 h-5" />
                        </motion.button>
                        
                        <div className="md:hidden w-16"></div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.length === 0 && (
                            <motion.div 
                                className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <ChatCircle weight="thin" className="w-12 h-12 opacity-20" />
                                </motion.div>
                                <p className="text-sm">No messages yet. Say hello!</p>
                                <div className="flex gap-1 mt-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500/30 animate-pulse" />
                                    <span className="w-2 h-2 rounded-full bg-cyan-500/30 animate-pulse delay-75" />
                                    <span className="w-2 h-2 rounded-full bg-cyan-500/30 animate-pulse delay-150" />
                                </div>
                            </motion.div>
                        )}

                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`flex ${msg.isLocal ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all hover:scale-[1.02] ${msg.isLocal
                                        ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 text-cyan-50 border border-cyan-500/30 rounded-tr-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                        : 'bg-white/5 text-neutral-200 border border-white/10 rounded-tl-sm'
                                        }`}
                                >
                                    {renderMessageContent(msg)}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Picker Area */}
                    <AnimatePresence>
                        {showPicker && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-black/50 border-t border-white/10 overflow-hidden"
                            >
                                <div className="p-4">
                                    {showPicker === 'emoji' ? (
                                        <div className="grid grid-cols-6 gap-3">
                                            {quickReactions.map((reaction, i) => (
                                                <motion.button 
                                                    key={reaction.name}
                                                    onClick={() => sendReaction(reaction)} 
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className={`p-3 rounded-xl ${reaction.bg} hover:bg-white/10 transition-colors flex items-center justify-center`}
                                                >
                                                    <reaction.icon weight="fill" className={`w-8 h-8 ${reaction.color}`} />
                                                </motion.button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-5 gap-3">
                                            {stickers.map((sticker, i) => (
                                                <motion.button 
                                                    key={sticker.name}
                                                    onClick={() => sendSticker(sticker)} 
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    whileHover={{ scale: 1.2, rotate: 5 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="p-3 rounded-xl bg-white/5 hover:bg-cyan-500/20 transition-colors flex items-center justify-center"
                                                >
                                                    <sticker.icon weight="fill" className="w-10 h-10 text-cyan-400" />
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input Area */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-black/30">
                        <div className="relative flex items-center gap-2">
                            <motion.button
                                type="button"
                                onClick={() => setShowPicker(showPicker === 'emoji' ? null : 'emoji')}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-2 rounded-full transition-colors ${showPicker === 'emoji' ? 'text-cyan-400 bg-cyan-500/10' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Smiley weight="fill" className="w-6 h-6" />
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={() => setShowPicker(showPicker === 'sticker' ? null : 'sticker')}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-2 rounded-full transition-colors ${showPicker === 'sticker' ? 'text-cyan-400 bg-cyan-500/10' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Gift weight="fill" className="w-6 h-6" />
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <Paperclip weight="bold" className="w-6 h-6" />
                            </motion.button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                            />

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all"
                            />
                            <motion.button
                                type="submit"
                                disabled={!newMessage.trim()}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute right-2 p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white disabled:opacity-50 disabled:hover:from-cyan-500 transition-all shadow-lg shadow-cyan-500/30"
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
