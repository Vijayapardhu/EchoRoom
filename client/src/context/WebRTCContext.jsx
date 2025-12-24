import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';

const WebRTCContext = createContext(null);

export const useWebRTC = () => {
    return useContext(WebRTCContext);
};

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
};

export const WebRTCProvider = ({ children }) => {
    const socket = useSocket();
    const [localStream, setLocalStream] = useState(null);
    const localStreamRef = useRef(null); // Ref to track current stream synchronously
    const [remoteStream, setRemoteStream] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const peerConnection = useRef(null);

    const startLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream; // Update ref
            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    }, []);

    const createPeerConnection = useCallback((onIceCandidate) => {
        // Cleanup old connection if it exists
        if (peerConnection.current) {
            console.warn("Closing existing PeerConnection before creating new one.");
            peerConnection.current.close();
        }

        const pc = new RTCPeerConnection(servers);

        pc.onicecandidate = (event) => {
            if (event.candidate && onIceCandidate) {
                onIceCandidate(event.candidate);
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        // Use ref to get the latest stream without dependency issues
        if (localStreamRef.current) {
            console.log("Adding tracks to PeerConnection:", localStreamRef.current.getTracks().map(t => t.kind));
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current);
            });
        } else {
            console.warn("No local stream found when creating PeerConnection!");
        }

        peerConnection.current = pc;
        return pc;
    }, []); // No dependencies needed now!

    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            if (peerConnection.current) {
                const sender = peerConnection.current.getSenders().find((s) => s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            }

            setLocalStream(screenStream);
            localStreamRef.current = screenStream;
            setIsScreenSharing(true);

            // Handle user stopping screen share via browser UI
            screenTrack.onended = () => {
                stopScreenShare();
            };
        } catch (error) {
            console.error('Error starting screen share:', error);
        }
    }, []);

    const stopScreenShare = useCallback(async () => {
        try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const cameraTrack = cameraStream.getVideoTracks()[0];

            if (peerConnection.current) {
                const sender = peerConnection.current.getSenders().find((s) => s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(cameraTrack);
                }
            }

            setLocalStream(cameraStream);
            localStreamRef.current = cameraStream;
            setIsScreenSharing(false);
        } catch (error) {
            console.error('Error stopping screen share:', error);
        }
    }, []);

    const resetPeerConnection = useCallback(() => {
        if (peerConnection.current) {
            peerConnection.current.onicecandidate = null;
            peerConnection.current.ontrack = null;
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }
    }, [remoteStream]);

    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }, [localStream]);

    const switchCamera = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            if (videoDevices.length < 2) {
                console.warn("No alternative camera found.");
                return false;
            }

            const currentTrack = localStream?.getVideoTracks()[0];
            const currentDeviceId = currentTrack?.getSettings().deviceId;

            const nextDevice = videoDevices.find(device => device.deviceId !== currentDeviceId) || videoDevices[0];

            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: nextDevice.deviceId } },
                audio: false // Don't touch audio
            });

            const newVideoTrack = newStream.getVideoTracks()[0];

            if (localStream) {
                const oldVideoTrack = localStream.getVideoTracks()[0];
                if (oldVideoTrack) {
                    localStream.removeTrack(oldVideoTrack);
                    oldVideoTrack.stop();
                }
                localStream.addTrack(newVideoTrack);

                if (peerConnection.current) {
                    const sender = peerConnection.current.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        await sender.replaceTrack(newVideoTrack);
                    }
                }
            }
            return true;
        } catch (error) {
            console.error("Error switching camera:", error);
            return false;
        }
    }, [localStream]);

    const toggleVideo = useCallback(async (currentStatus) => {
        if (currentStatus) { // Turning ON (was off)
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newStream.getVideoTracks()[0];

                if (localStream) {
                    const oldVideoTrack = localStream.getVideoTracks()[0];
                    if (oldVideoTrack) {
                        localStream.removeTrack(oldVideoTrack);
                        oldVideoTrack.stop();
                    }
                    localStream.addTrack(newVideoTrack);

                    if (peerConnection.current) {
                        const sender = peerConnection.current.getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) {
                            await sender.replaceTrack(newVideoTrack);
                        } else {
                            // If no video sender, add one (rare case if started with video)
                            peerConnection.current.addTrack(newVideoTrack, localStream);
                        }
                    }
                }
                return true; // Video is ON
            } catch (err) {
                console.error("Error restarting video:", err);
                return false;
            }
        } else { // Turning OFF (was on)
            if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.stop(); // Stops hardware
                    if (peerConnection.current) {
                        const sender = peerConnection.current.getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) {
                            await sender.replaceTrack(null); // Stop sending
                        }
                    }
                    // We keep the track in localStream object but it's stopped. 
                    // When we restart, we replace it.
                }
            }
            return false; // Video is OFF
        }
    }, [localStream]);

    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            await stopScreenShare();
        } else {
            await startScreenShare();
        }
    }, [isScreenSharing, startScreenShare, stopScreenShare]);

    const closeConnection = useCallback(() => {
        resetPeerConnection();
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
    }, [localStream, resetPeerConnection]);

    return (
        <WebRTCContext.Provider value={{ localStream, remoteStream, startLocalStream, createPeerConnection, closeConnection, resetPeerConnection, peerConnection, startScreenShare, stopScreenShare, toggleScreenShare, toggleVideo, toggleAudio, switchCamera, isScreenSharing }}>
            {children}
        </WebRTCContext.Provider>
    );
};
