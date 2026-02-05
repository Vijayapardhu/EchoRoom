import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [connectionState, setConnectionState] = useState('disconnected');
    const [, forceUpdate] = useState({});

    useEffect(() => {
        // Prevent creating multiple socket instances
        if (socketRef.current) return;

        // Use environment variable for production, fallback to localhost for dev
        const serverUrl = import.meta.env.VITE_SERVER_URL || 
                         (import.meta.env.PROD ? 'https://echoroom-server.onrender.com' : 'http://localhost:5000');
        
        console.log('[Socket] Connecting to:', serverUrl);
        
        const newSocket = io(serverUrl, {
            transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: false,
            autoConnect: true,
            withCredentials: false, // Disable credentials to avoid CORS issues
            upgrade: true, // Allow transport upgrade
            rememberUpgrade: true
        });
        
        socketRef.current = newSocket;
        
        // Force re-render after socket is created
        forceUpdate({});

        newSocket.on('connect', () => {
            console.log('[Socket] Connected successfully:', newSocket.id);
            setConnectionState('connected');
            forceUpdate({});
        });

        newSocket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            setConnectionState('error');
            // Polling is already prioritized, so it will keep trying
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            setConnectionState('disconnected');
            forceUpdate({});
            
            // Auto reconnect on disconnect (except for manual disconnect)
            if (reason !== 'io client disconnect') {
                console.log('[Socket] Will attempt to reconnect...');
            }
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
            setConnectionState('connected');
            forceUpdate({});
        });

        newSocket.on('reconnect_attempt', (attemptNumber) => {
            console.log('[Socket] Reconnection attempt', attemptNumber);
            setConnectionState('reconnecting');
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('[Socket] Reconnection error:', error.message);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('[Socket] Failed to reconnect after all attempts');
            setConnectionState('failed');
        });

        return () => {
            console.log('[Socket] Cleaning up socket connection');
            newSocket.close();
            socketRef.current = null;
        };
    }, []);

    const socket = useMemo(() => socketRef.current, [socketRef.current]);

    // Debug: log connection state changes
    useEffect(() => {
        console.log('[Socket] Connection state:', connectionState);
    }, [connectionState]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
