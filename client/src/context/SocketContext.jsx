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

        // Use environment variable for production, fallback to localhost for dev
        // In production on Vercel, set VITE_SERVER_URL to your Render server URL
        const serverUrl = import.meta.env.VITE_SERVER_URL || 
                         (import.meta.env.PROD ? 'https://echoroom-server.onrender.com' : 'http://localhost:5000');
        
        console.log('[Socket] Connecting to:', serverUrl);
        
        const newSocket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 500,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: false,
            autoConnect: true,
            withCredentials: true
        });
        
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[Socket] Connected:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
            // Try polling if websocket fails
            if (newSocket.io.opts.transports[0] === 'websocket') {
                console.log('[Socket] Retrying with polling...');
                newSocket.io.opts.transports = ['polling', 'websocket'];
            }
        });
        
        newSocket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
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
