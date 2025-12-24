import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Send, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = ({ roomId, isOpen, onClose }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        socket.on('receive-message', (message) => {
            setMessages((prev) => [...prev, { ...message, isLocal: false }]);
        });

        return () => {
            socket.off('receive-message');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            text: newMessage,
            timestamp: new Date().toISOString(),
        };

        socket.emit('send-message', { roomId, message: messageData });
        setMessages((prev) => [...prev, { ...messageData, isLocal: true }]);
        setNewMessage('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute top-0 right-0 h-full w-full md:w-96 bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 flex flex-col"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-cyan-500/10 text-cyan-400">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h3 className="font-medium tracking-wide text-white">Live Chat</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-2">
                                <MessageSquare className="w-12 h-12 opacity-20" />
                                <p className="text-sm">No messages yet. Say hello!</p>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.isLocal ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.isLocal
                                        ? 'bg-cyan-500/10 text-cyan-50 border border-cyan-500/20 rounded-tr-sm'
                                        : 'bg-white/5 text-neutral-200 border border-white/5 rounded-tl-sm'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-black/50">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-5 pr-12 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="absolute right-2 p-2 rounded-full bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Chat;
