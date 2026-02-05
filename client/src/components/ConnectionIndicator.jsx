import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Activity, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { useWebRTC } from '../context/WebRTCContext';
import { AnimatePresence } from 'framer-motion';

const ConnectionIndicator = () => {
    const { peerConnection, connectionStats } = useWebRTC();
    const [quality, setQuality] = useState('unknown'); // unknown, good, fair, poor, disconnected
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (!peerConnection.current) return;

        const pc = peerConnection.current;

        const updateConnectionState = () => {
            const state = pc.iceConnectionState;

            if (state === 'connected' || state === 'completed') {
                setQuality('good');
            } else if (state === 'checking') {
                setQuality('fair');
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                setQuality('disconnected');
            }
        };

        // Initial check
        updateConnectionState();

        // Listen for changes
        pc.addEventListener('iceconnectionstatechange', updateConnectionState);

        return () => {
            pc.removeEventListener('iceconnectionstatechange', updateConnectionState);
        };
    }, [peerConnection]);

    const getColor = () => {
        // Use RTT for more accurate quality indicator
        if (connectionStats.rtt > 0) {
            if (connectionStats.rtt < 100) return 'text-green-400';
            if (connectionStats.rtt < 200) return 'text-yellow-400';
            if (connectionStats.rtt < 400) return 'text-orange-400';
            return 'text-red-400';
        }
        
        switch (quality) {
            case 'good': return 'text-green-400';
            case 'fair': return 'text-yellow-400';
            case 'poor': return 'text-orange-400';
            case 'disconnected': return 'text-red-400';
            default: return 'text-slate-500';
        }
    };

    const getBgGlow = () => {
        if (connectionStats.rtt > 0) {
            if (connectionStats.rtt < 100) return 'shadow-[0_0_10px_rgba(34,197,94,0.3)]';
            if (connectionStats.rtt < 200) return 'shadow-[0_0_10px_rgba(234,179,8,0.3)]';
            if (connectionStats.rtt < 400) return 'shadow-[0_0_10px_rgba(249,115,22,0.3)]';
            return 'shadow-[0_0_10px_rgba(239,68,68,0.3)]';
        }
        
        switch (quality) {
            case 'good': return 'shadow-[0_0_10px_rgba(34,197,94,0.3)]';
            case 'fair': return 'shadow-[0_0_10px_rgba(234,179,8,0.3)]';
            case 'disconnected': return 'shadow-[0_0_10px_rgba(239,68,68,0.3)]';
            default: return '';
        }
    };

    const getLabel = () => {
        if (connectionStats.rtt > 0) {
            return `${connectionStats.rtt}ms`;
        }
        
        switch (quality) {
            case 'good': return 'Connected';
            case 'fair': return 'Connecting...';
            case 'poor': return 'Weak Signal';
            case 'disconnected': return 'Disconnected';
            default: return 'Waiting...';
        }
    };

    const getSignalIcon = () => {
        if (connectionStats.rtt > 0) {
            if (connectionStats.rtt < 100) return <SignalHigh className={`w-4 h-4 ${getColor()}`} />;
            if (connectionStats.rtt < 200) return <SignalMedium className={`w-4 h-4 ${getColor()}`} />;
            if (connectionStats.rtt < 400) return <SignalLow className={`w-4 h-4 ${getColor()}`} />;
            return <Signal className={`w-4 h-4 ${getColor()}`} />;
        }
        
        if (quality === 'disconnected') {
            return <WifiOff className={`w-4 h-4 ${getColor()}`} />;
        }
        
        return <Activity className={`w-4 h-4 ${getColor()}`} />;
    };

    return (
        <motion.div 
            className={`glass px-3 py-1.5 rounded-full flex items-center gap-2 relative cursor-pointer transition-all ${getBgGlow()}`}
            onClick={() => setShowDetails(!showDetails)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <motion.div
                animate={quality === 'good' ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {getSignalIcon()}
            </motion.div>
            <span className={`text-xs font-medium ${getColor()}`}>
                {getLabel()}
            </span>

            {/* Detailed Stats Popup */}
            <AnimatePresence>
                {showDetails && connectionStats.rtt > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute top-full mt-2 right-0 glass-panel rounded-xl p-3 min-w-[160px] z-50"
                    >
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-neutral-400">Latency</span>
                                <span className={getColor()}>{connectionStats.rtt}ms</span>
                            </div>
                            {connectionStats.packetsLost > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">Packet Loss</span>
                                    <span className="text-red-400">{connectionStats.packetsLost}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-neutral-400">Status</span>
                                <span className={getColor()}>{quality}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ConnectionIndicator;
