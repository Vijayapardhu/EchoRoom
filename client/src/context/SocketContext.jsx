import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [, forceUpdate] = useState({});

    useEffect(() => {
        // Prevent creating multiple socket instances
        if (socketRef.current) return;

        // Use environment variable for production, fallback to localhost for dev
        const serverUrl = import.meta.env.VITE_SERVER_URL || 
                         (import.meta.env.PROD ? 'https://echoroom-server.onrender.com' : 'http://localhost:5000');
        
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
        
        // Force re-render after socket is created
        forceUpdate({});

        newSocket.on('connect', () => {
            forceUpdate({});
        });

        newSocket.on('connect_error', () => {
            // Try polling if websocket fails
            if (newSocket.io.opts.transports[0] === 'websocket') {
                newSocket.io.opts.transports = ['polling', 'websocket'];
            }
        });
        
        newSocket.on('disconnect', () => {
            forceUpdate({});
        });

        return () => {
            newSocket.close();
            socketRef.current = null;
        };
    }, []);

    const socket = useMemo(() => socketRef.current, [socketRef.current]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
