import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    House, 
    WarningCircle,
    ArrowLeft,
    Ghost
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const NotFound = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    navigate('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-slate-950 to-slate-950" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 border border-white/5 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-[10%] border border-white/5 rounded-full"
                    />
                </div>
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 text-center max-w-lg"
            >
                <motion.div
                    animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="mb-8"
                >
                    <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <Ghost weight="fill" className="w-16 h-16 text-white/30" />
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-4 mb-8">
                    <h1 className="text-8xl sm:text-9xl font-bold">
                        <span className="bg-gradient-to-br from-white to-white/20 bg-clip-text text-transparent">404</span>
                    </h1>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Page Not Found</h2>
                    <p className="text-white/50 max-w-sm mx-auto">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                {/* Countdown */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-sm text-white/60">
                            Redirecting home in <span className="text-blue-400 font-mono font-bold">{countdown}</span>s
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        to="/"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                    >
                        <House weight="fill" className="w-5 h-5" />
                        Go Home
                    </Link>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold rounded-2xl border border-white/10 transition-all"
                    >
                        <ArrowLeft weight="bold" className="w-5 h-5" />
                        Go Back
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
