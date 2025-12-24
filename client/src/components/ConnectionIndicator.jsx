import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useWebRTC } from '../context/WebRTCContext';

const ConnectionIndicator = () => {
    const { peerConnection } = useWebRTC();
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
        pc.oniceconnectionstatechange = updateConnectionState;

        return () => {
            pc.oniceconnectionstatechange = null;
        };
    }, [peerConnection]);

    const getColor = () => {
        switch (quality) {
            case 'good': return 'text-green-400';
            case 'fair': return 'text-yellow-400';
            case 'poor': return 'text-orange-400';
            case 'disconnected': return 'text-red-400';
            default: return 'text-slate-500';
        }
    };

    const getLabel = () => {
        switch (quality) {
            case 'good': return 'Excellent';
            case 'fair': return 'Connecting...';
            case 'poor': return 'Weak Signal';
            case 'disconnected': return 'Disconnected';
            default: return 'Waiting...';
        }
    };

    return (
        <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2" title={`Connection: ${getLabel()}`}>
            {quality === 'disconnected' ? (
                <WifiOff className={`w-4 h-4 ${getColor()}`} />
            ) : (
                <Wifi className={`w-4 h-4 ${getColor()}`} />
            )}
            <span className={`text-xs font-medium ${getColor()}`}>
                {getLabel()}
            </span>
        </div>
    );
};

export default ConnectionIndicator;
