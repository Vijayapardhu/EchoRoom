import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { useWebRTC } from '../context/WebRTCContext';

const ConnectionIndicator = () => {
    const { peerConnection, connectionStats } = useWebRTC();
    const [quality, setQuality] = useState('unknown'); // unknown, good, fair, poor, disconnected

    useEffect(() => {
        if (!peerConnection.current) return;

        const pc = peerConnection.current;

        const updateConnectionState = () => {
            const state = pc.iceConnectionState;
            console.log('ICE Connection State:', state);

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

    return (
        <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 relative group" title={`Connection: ${getLabel()}`}>
            {quality === 'disconnected' ? (
                <WifiOff className={`w-4 h-4 ${getColor()}`} />
            ) : (
                <Activity className={`w-4 h-4 ${getColor()}`} />
            )}
            <span className={`text-xs font-medium ${getColor()}`}>
                {getLabel()}
            </span>

            {/* Tooltip for Packet Loss */}
            {connectionStats.packetsLost > 0 && (
                <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-black/80 text-xs text-red-400 rounded border border-red-500/20 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Loss: {connectionStats.packetsLost} pkts
                </div>
            )}
        </div>
    );
};

export default ConnectionIndicator;
