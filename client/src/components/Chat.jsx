import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    Lightning,
    Star,
    Fire,
    HandsClapping,
    X,
    PaperPlaneRight,
    Image as ImageIcon,
    Smiley,
    Check,
    CheckCircle,
    Clock,
    ArrowLeft,
    Trash
} from '@phosphor-icons/react';
import FileUpload from './FileUpload';

const Chat = ({ roomId, isOpen, onClose, userName }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showStickers, setShowStickers] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const stickers = [
        { icon: Heart, label: 'Heart', color: 'text-red-400', bg: 'bg-red-400/20' },
        { icon: Lightning, label: 'Lightning', color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
        { icon: Star, label: 'Star', color: 'text-blue-400', bg: 'bg-blue-400/20' },
        { icon: Fire, label: 'Fire', color: 'text-orange-400', bg: 'bg-orange-400/20' },
        { icon: HandsClapping, label: 'Clap', color: 'text-purple-400', bg: 'bg-purple-400/20' },
    ];

    useEffect(() => {
        if (!socket || !roomId) return;

        const handleMessage = (message) => {
            setMessages(prev => [...prev, { ...message, status: 'received' }]);
        };

        socket.on('receive-message', handleMessage);
        return () => socket.off('receive-message', handleMessage);
    }, [socket, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 300);
        }
    }, [isOpen]);

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const sendMessage = (e) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const message = {
            id: Date.now(),
            text: input.trim(),
            sender: userName || 'Anonymous',
            timestamp: new Date().toISOString(),
            type: 'text',
            status: 'sending'
        };

        socket.emit('send-message', { roomId, message });
        setMessages(prev => [...prev, message]);
        setInput('');
        
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: 'sent' } : m));
        }, 300);
    };

    const sendSticker = (sticker) => {
        const message = {
            id: Date.now(),
            type: 'sticker',
            sticker,
            sender: userName || 'Anonymous',
            timestamp: new Date().toISOString(),
            status: 'sent'
        };
        socket.emit('send-message', { roomId, message });
        setMessages(prev => [...prev, message]);
        setShowStickers(false);
    };

    const handleFileSelect = (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const message = {
                id: Date.now(),
                type: 'image',
                image: reader.result,
                sender: userName || 'Anonymous',
                timestamp: new Date().toISOString(),
                status: 'sending'
            };
            socket.emit('send-message', { roomId, message });
            setMessages(prev => [...prev, message]);
        };
        reader.readAsDataURL(file);
    };

    const clearChat = () => {
        if (window.confirm('Clear all messages?')) {
            setMessages([]);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isMe = (sender) => sender === (userName || 'Anonymous');

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                    
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 w-full sm:w-[400px] md:w-[380px] h-full bg-slate-950/98 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors md:hidden"
                                >
                                    <ArrowLeft weight="bold" className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                        <Smiley weight="fill" className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">Chat</h3>
                                        <p className="text-xs text-white/50">{messages.length} messages</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearChat}
                                    className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors"
                                    title="Clear chat"
                                >
                                    <Trash weight="bold" className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors hidden md:block"
                                >
                                    <X weight="bold" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div 
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3"
                        >
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-white/30 py-12">
                                    <Smiley weight="bold" className="w-16 h-16 mb-4 opacity-30" />
                                    <p className="text-base">No messages yet</p>
                                    <p className="text-sm mt-1">Say hello to start!</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const showAvatar = index === 0 || messages[index - 1].sender !== msg.sender;
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${isMe(msg.sender) ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex gap-2 max-w-[85%] ${isMe(msg.sender) ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {/* Avatar */}
                                                {showAvatar && (
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        isMe(msg.sender) 
                                                            ? 'bg-gradient-to-br from-blue-500 to-violet-500' 
                                                            : 'bg-white/10'
                                                    }`}>
                                                        {msg.sender[0].toUpperCase()}
                                                    </div>
                                                )}
                                                {!showAvatar && <div className="w-8" />}
                                                
                                                <div className={`flex flex-col ${isMe(msg.sender) ? 'items-end' : 'items-start'}`}>
                                                    {showAvatar && (
                                                        <span className="text-[10px] text-white/40 mb-1 px-1">
                                                            {msg.sender}
                                                        </span>
                                                    )}
                                                    
                                                    {msg.type === 'text' && (
                                                        <div className={`
                                                            px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                                                            ${isMe(msg.sender) 
                                                                ? 'bg-blue-500 text-white rounded-br-md' 
                                                                : 'bg-white/10 text-white rounded-bl-md'
                                                            }
                                                        `}>
                                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                                        </div>
                                                    )}

                                                    {msg.type === 'sticker' && (
                                                        <div className={`
                                                            p-3 rounded-2xl
                                                            ${isMe(msg.sender) 
                                                                ? 'bg-blue-500/20 border border-blue-500/30 rounded-br-md' 
                                                                : 'bg-white/10 rounded-bl-md'
                                                            }
                                                        `}>
                                                            <msg.sticker.icon weight="fill" className={`w-10 h-10 ${msg.sticker.color}`} />
                                                        </div>
                                                    )}

                                                    {msg.type === 'image' && (
                                                        <div className="rounded-2xl overflow-hidden max-w-[260px] border border-white/10">
                                                            <img 
                                                                src={msg.image} 
                                                                alt="Shared" 
                                                                className="w-full h-auto object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Timestamp */}
                                                    <div className="flex items-center gap-1 mt-1 px-1">
                                                        <span className="text-[10px] text-white/30">
                                                            {formatTime(msg.timestamp)}
                                                        </span>
                                                        {isMe(msg.sender) && (
                                                            <span className="text-white/30">
                                                                {msg.status === 'sending' && <Clock weight="bold" className="w-3 h-3" />}
                                                                {msg.status === 'sent' && <Check weight="bold" className="w-3 h-3" />}
                                                                {msg.status === 'received' && <CheckCircle weight="fill" className="w-3 h-3 text-blue-400" />}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Sticker Picker */}
                        <AnimatePresence>
                            {showStickers && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    className="px-4 py-3 bg-white/5 border-t border-white/10"
                                >
                                    <div className="flex gap-2 justify-center">
                                        {stickers.map((sticker) => (
                                            <motion.button
                                                key={sticker.label}
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => sendSticker(sticker)}
                                                className={`p-3 rounded-xl ${sticker.bg} hover:opacity-80 transition-colors`}
                                            >
                                                <sticker.icon weight="fill" className={`w-7 h-7 ${sticker.color}`} />
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input */}
                        <div className="p-3 bg-white/5 border-t border-white/10">
                            <form onSubmit={sendMessage} className="flex items-center gap-2">
                                <FileUpload onFileSelect={handleFileSelect} accept="image/*">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors flex-shrink-0"
                                    >
                                        <ImageIcon weight="bold" className="w-5 h-5" />
                                    </motion.button>
                                </FileUpload>

                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowStickers(!showStickers)}
                                    className={`p-3 rounded-xl transition-colors flex-shrink-0 ${showStickers ? 'bg-blue-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'}`}
                                >
                                    <Smiley weight="fill" className="w-5 h-5" />
                                </motion.button>

                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    disabled={!input.trim()}
                                    className="p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                >
                                    <PaperPlaneRight weight="fill" className="w-5 h-5" />
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Chat;
