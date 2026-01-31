import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Send, X, MessageSquare, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playMessageSound } from '../utils/soundEffects';

const Chat = ({ roomId, isOpen, onClose, userName }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showPicker, setShowPicker] = useState(null); // 'emoji' | 'sticker' | null
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const emojis = ['😀', '😂', '😍', '🔥', '👍', '🎉', '❤️', '😎', '🤔', '😭', '😡', '👋', '✨', '💯', '🚀', '👀'];
    const stickers = ['👻', '👽', '🤖', '💩', '🦄', '🦖', '🍕', '🍔']; // Using large emojis as stickers for MVP

    // Handle mobile back button
    useEffect(() => {
        if (!isOpen) return;
        
        const handlePopState = (e) => {
            e.preventDefault();
            onClose();
        };

        // Push a state to history so back button closes chat instead of navigating away
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

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) { // 1MB limit
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
                return <div className="text-6xl animate-bounce">{msg.content}</div>;
            default:
                // Handle legacy text messages (if any) or standard text
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
                        {/* Back button for mobile */}
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="md:hidden p-2 -ml-1 rounded-xl hover:bg-white/10 text-white transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Back</span>
                        </motion.button>
                        
                        <div className="flex items-center gap-3">
                            <motion.div 
                                className="p-2 rounded-full bg-cyan-500/10 text-cyan-400 hidden md:flex"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <MessageSquare className="w-5 h-5" />
                            </motion.div>
                            <div>
                                <h3 className="font-medium tracking-wide text-white">Live Chat</h3>
                                <p className="text-xs text-neutral-500">{messages.length} messages</p>
                            </div>
                        </div>
                        
                        {/* Close button for desktop */}
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className="hidden md:flex p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </motion.button>
                        
                        {/* Spacer for mobile to center title */}
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
                                    <MessageSquare className="w-12 h-12 opacity-20" />
                                </motion.div>
                                <p className="text-sm">No messages yet. Say hello!</p>
                                <div className="typing-indicator flex gap-1 mt-2">
                                    <span></span>
                                    <span></span>
                                    <span></span>
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
                                <div className="p-4 grid grid-cols-8 gap-2">
                                    {showPicker === 'emoji' ? emojis.map((e, i) => (
                                        <motion.button 
                                            key={e} 
                                            onClick={() => setNewMessage(prev => prev + e)} 
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            whileHover={{ scale: 1.3 }}
                                            className="text-2xl hover:bg-white/10 rounded-lg p-1 transition-colors"
                                        >
                                            {e}
                                        </motion.button>
                                    )) : stickers.map((s, i) => (
                                        <motion.button 
                                            key={s} 
                                            onClick={() => sendSticker(s)} 
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            whileHover={{ scale: 1.3 }}
                                            className="text-4xl hover:bg-white/10 rounded-lg p-2 transition-colors"
                                        >
                                            {s}
                                        </motion.button>
                                    ))}
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
                                <span className="text-xl">😊</span>
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={() => setShowPicker(showPicker === 'sticker' ? null : 'sticker')}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-2 rounded-full transition-colors ${showPicker === 'sticker' ? 'text-cyan-400 bg-cyan-500/10' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <span className="text-xl">🎁</span>
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <span className="text-xl">📎</span>
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
                                className="absolute right-2 p-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:from-cyan-400 hover:to-cyan-300 disabled:opacity-50 disabled:hover:from-cyan-500 transition-all shadow-lg shadow-cyan-500/30"
                            >
                                <Send className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Chat;
