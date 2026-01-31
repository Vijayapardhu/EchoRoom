import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        // Prevent creating multiple socket instances
        if (socketRef.current) return;

        // Use environment variable for production, fallback to local IP/localhost for dev
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://10.20.172.99:5000';
        const newSocket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 500,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            forceNew: false,
            autoConnect: true
        });
        
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[Socket] Connected:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });

        return () => {
            newSocket.close();
            socketRef.current = null;
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
