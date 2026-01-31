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
    Files,
    Smiley,
    Check,
    CheckCheck,
    Clock
} from '@phosphor-icons/react';
import FileUpload from './FileUpload';

const Chat = ({ roomId, isOpen, onClose, userName }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showStickers, setShowStickers] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

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
            inputRef.current.focus();
        }
    }, [isOpen]);

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

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isMe = (sender) => sender === (userName || 'Anonymous');

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="absolute top-0 right-0 w-full max-w-md h-full bg-black/95 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                <Smiley weight="fill" className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Chat</h3>
                                <p className="text-xs text-white/50">{messages.length} messages</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <X weight="bold" className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/30">
                                <Smiley weight="bold" className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-sm">No messages yet</p>
                                <p className="text-xs">Say hello to start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${isMe(msg.sender) ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] ${isMe(msg.sender) ? 'items-end' : 'items-start'} flex flex-col`}>
                                        {msg.type === 'text' && (
                                            <div className={`
                                                px-4 py-3 rounded-2xl text-sm
                                                ${isMe(msg.sender) 
                                                    ? 'bg-blue-500 text-white rounded-br-md' 
                                                    : 'bg-white/10 text-white rounded-bl-md'
                                                }
                                            `}>
                                                <p>{msg.text}</p>
                                            </div>
                                        )}

                                        {msg.type === 'sticker' && (
                                            <div className={`
                                                p-4 rounded-2xl
                                                ${isMe(msg.sender) 
                                                    ? 'bg-blue-500/20 border border-blue-500/30 rounded-br-md' 
                                                    : 'bg-white/10 rounded-bl-md'
                                                }
                                            `}>
                                                <msg.sticker.icon 
                                                    weight="fill" 
                                                    className={`w-12 h-12 ${msg.sticker.color}`} 
                                                />
                                            </div>
                                        )}

                                        {msg.type === 'image' && (
                                            <div className="rounded-2xl overflow-hidden max-w-[240px]">
                                                <img 
                                                    src={msg.image} 
                                                    alt="Shared" 
                                                    className="w-full h-auto object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Timestamp */}
                                        <div className="flex items-center gap-1 mt-1 px-1">
                                            <span className="text-[10px] text-white/40">
                                                {formatTime(msg.timestamp)}
                                            </span>
                                            {isMe(msg.sender) && (
                                                <span className="text-white/40">
                                                    {msg.status === 'sending' && <Clock weight="bold" className="w-3 h-3" />}
                                                    {msg.status === 'sent' && <Check weight="bold" className="w-3 h-3" />}
                                                    {msg.status === 'received' && <CheckCheck weight="bold" className="w-3 h-3 text-blue-400" />}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
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
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => sendSticker(sticker)}
                                            className={`p-3 rounded-xl ${sticker.bg} hover:opacity-80 transition-opacity`}
                                        >
                                            <sticker.icon weight="fill" className={`w-6 h-6 ${sticker.color}`} />
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input */}
                    <div className="p-4 bg-white/5 border-t border-white/10">
                        <form onSubmit={sendMessage} className="flex items-center gap-2">
                            <FileUpload onFileSelect={handleFileSelect} accept="image/*">
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                >
                                    <ImageIcon weight="bold" className="w-5 h-5" />
                                </motion.button>
                            </FileUpload>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowStickers(!showStickers)}
                                className={`p-3 rounded-xl transition-colors ${showStickers ? 'bg-blue-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'}`}
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
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>

                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                disabled={!input.trim()}
                                className="p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <PaperPlaneRight weight="fill" className="w-5 h-5" />
                            </motion.button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Chat;
