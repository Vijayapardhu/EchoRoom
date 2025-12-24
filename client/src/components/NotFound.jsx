import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 text-center max-w-md"
            >
                <div className="mb-8">
                    <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
                    <h1 className="text-9xl font-bold text-white mb-4">404</h1>
                    <h2 className="text-2xl font-bold text-white mb-2">Signal Lost</h2>
                    <p className="text-neutral-400">
                        The frequency you're looking for doesn't exist in our spectrum.
                    </p>
                </div>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all duration-300 hover:scale-105"
                >
                    <Home className="w-5 h-5" />
                    Return to Base
                </Link>
            </motion.div>
        </div>
    );
};

export default NotFound;
