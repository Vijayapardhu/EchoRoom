import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useWebRTC } from '../../context/WebRTCContext';
import { useNavigate } from 'react-router-dom';

const PanicButton = ({ roomId, onPanic }) => {
    const socket = useSocket();
    const { closeConnection } = useWebRTC();
    const navigate = useNavigate();

    const handlePanic = () => {
        if (window.confirm("Are you sure? This will immediately end the chat and block this user.")) {
            closeConnection();
            socket.emit('panic', { roomId });
            if (onPanic) onPanic();
            navigate('/');
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePanic}
            className="fixed bottom-[122px] right-8 z-50 group"
            title="Panic Button: End & Block"
        >
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 group-hover:opacity-40" />
            <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-5 rounded-full shadow-xl shadow-red-600/40 border-2 border-red-400/50 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white fill-white/20" />
            </div>
        </motion.button>
    );
};

export default PanicButton;
