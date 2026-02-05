import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { AnimatePresence, motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { 
    Microphone, 
    MicrophoneSlash, 
    VideoCamera, 
    VideoCameraSlash, 
    PhoneDisconnect, 
    ChatCircle,
    Monitor,
    ArrowClockwise,
    Spinner,
    ShareNetwork,
    CheckCircle,
    Smiley,
    Heart,
    Lightning,
    Star,
    Fire,
    HandsClapping,
    Users,
    ArrowLeft,
    GenderMale,
    GenderFemale,
    Tag,
    CornersOut,
    CornersIn,
    WifiHigh,
    WifiMedium,
    WifiLow,
    WifiSlash,
    Warning
} from '@phosphor-icons/react';
import Chat from './Chat';

// Connection quality indicator with enhanced styling
const ConnectionQuality = ({ stats }) => {
    const getQuality = () => {
        if (!stats || stats.rtt === 0) return { icon: WifiSlash, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', label: 'Disconnected' };
        if (stats.rtt < 50) return { icon: WifiHigh, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', label: 'Excellent' };
        if (stats.rtt < 100) return { icon: WifiHigh, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', label: 'Good' };
        if (stats.rtt < 200) return { icon: WifiMedium, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', label: 'Fair' };
        return { icon: WifiLow, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', label: 'Poor' };
    };

    const quality = getQuality();
    const Icon = quality.icon;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${quality.bg} backdrop-blur-md border ${quality.border} transition-all duration-300 hover:scale-105`}>
            <Icon weight="fill" className={`w-4 h-4 ${quality.color}`} />
            <span className={`text-xs font-medium ${quality.color}`}>{quality.label}</span>
            {stats?.rtt > 0 && (
                <span className="text-xs text-white/50 font-mono">{stats.rtt}ms</span>
            )}
        </div>
    );
};

// Enhanced Video Tile Component with improved states and features
const VideoTile = ({ 
    stream, 
    isLocal = false, 
    userName = '', 
    peerInfo = null,
    isScreenShare = false,
    isMuted = false,
    isVideoOff = false,
    isSpeaking = false,
    isPinned = false,
    className = '',
    showOverlay = true,
    tileId = '',
    onClick,
    onPin,
    containerRef,
    isFullscreen = false,
    isSpotlight = false,
    children
}) => {
    const videoRef = useRef(null);
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
        }
    }, [stream]);

    const videoFitClass = (isFullscreen || isScreenShare) ? 'object-contain' : 'object-cover';

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            ref={containerRef}
            data-tile-id={tileId}
            onClick={onClick}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            className={`
                relative rounded-2xl md:rounded-3xl overflow-hidden 
                bg-gradient-to-br from-slate-800 to-slate-900 
                border-2 shadow-2xl transition-all duration-300
                ${onClick ? 'cursor-pointer' : ''} 
                ${isSpeaking ? 'border-emerald-400/70 shadow-emerald-500/20' : 'border-white/10'}
                ${isPinned ? 'border-yellow-400/70 shadow-yellow-500/20' : ''}
                ${className}
            `}
        >
            {/* Speaking indicator ring */}
            {isSpeaking && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-2xl md:rounded-3xl ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-transparent"
                />
            )}
            
            {(!stream || isVideoOff) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800/80 to-slate-900/80">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className={`
                            rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 
                            flex items-center justify-center mb-4 shadow-2xl shadow-purple-500/30
                            ${isSpotlight ? 'w-36 h-36 md:w-48 md:h-48' : 'w-20 h-20 md:w-28 md:h-28'}
                        `}
                    >
                        <span className={`font-bold text-white ${isSpotlight ? 'text-5xl md:text-7xl' : 'text-3xl md:text-4xl'}`}>
                            {(userName || 'U')[0].toUpperCase()}
                        </span>
                    </motion.div>
                    <span className={`text-white/80 font-medium ${isSpotlight ? 'text-xl md:text-2xl' : 'text-sm md:text-base'}`}>
                        {userName || 'User'}
                    </span>
                    {isVideoOff && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-400 text-sm border border-red-500/30"
                        >
                            <VideoCameraSlash weight="fill" className="w-4 h-4" />
                            Camera Off
                        </motion.div>
                    )}
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isLocal}
                        className={`w-full h-full ${videoFitClass}`}
                        style={{ transform: isLocal && !isScreenShare ? 'scaleX(-1)' : 'none' }}
                    />
                    
                    {/* Screen share label */}
                    {isScreenShare && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-3 left-3 md:top-4 md:left-4 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-emerald-500/90 backdrop-blur-md text-white text-xs md:text-sm font-semibold flex items-center gap-2 shadow-lg border border-emerald-400/30"
                        >
                            <Monitor weight="fill" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            Screen Sharing
                        </motion.div>
                    )}
                    
                    {/* Pin indicator */}
                    {isPinned && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-3 right-3 md:top-4 md:right-4 p-2 rounded-full bg-yellow-500/90 backdrop-blur-md shadow-lg border border-yellow-400/30"
                        >
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"/>
                            </svg>
                        </motion.div>
                    )}
                    
                    {/* Speaking indicator */}
                    {isSpeaking && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-3 left-3 md:top-4 md:left-4 p-2 rounded-full bg-emerald-500/90 backdrop-blur-md shadow-lg border border-emerald-400/30"
                        >
                            <div className="flex items-center gap-1">
                                <div className="w-1 h-3 bg-white rounded-full animate-pulse" />
                                <div className="w-1 h-4 bg-white rounded-full animate-pulse delay-75" />
                                <div className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
                            </div>
                        </motion.div>
                    )}
                </>
            )}
            
            {/* Hover controls */}
            <AnimatePresence>
                {showControls && onPin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onPin();
                            }}
                            className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                                isPinned 
                                    ? 'bg-yellow-500/80 border-yellow-400/50 text-white' 
                                    : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"/>
                            </svg>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* User info overlay */}
            {showOverlay && (
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                            <span className="text-sm md:text-base font-semibold text-white">{userName || (isLocal ? 'You' : 'User')}</span>
                            
                            {/* You badge for local user */}
                            {isLocal && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold bg-blue-500/30 text-blue-300 border border-blue-500/40">
                                    You
                                </span>
                            )}
                            
                            {/* Peer info badges */}
                            {peerInfo && (
                                <div className="hidden sm:flex items-center gap-2">
                                    {peerInfo.gender && (
                                        <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold ${
                                            peerInfo.gender === 'male' 
                                                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' 
                                                : 'bg-pink-500/30 text-pink-300 border border-pink-500/40'
                                        }`}>
                                            {peerInfo.gender === 'male' ? 'Male' : 'Female'}
                                        </span>
                                    )}
                                    {peerInfo.interests?.slice(0, 2).map((interest, i) => (
                                        <span key={i} className="hidden md:inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/30 text-violet-300 border border-violet-500/40">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Status indicators */}
                        {isMuted && (
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="p-1.5 md:p-2.5 rounded-full bg-red-500/90 shadow-lg"
                            >
                                <MicrophoneSlash weight="fill" className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
            {children}
        </motion.div>
    );
};

// Floating reaction animation
const FloatingReaction = ({ icon, color, onComplete, offset }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const colorClasses = {
        red: 'text-red-400',
        yellow: 'text-yellow-400',
        orange: 'text-orange-400',
        purple: 'text-purple-400',
        blue: 'text-blue-400'
    };

    const IconComponent = icon;

    return (
        <div
            className="fixed bottom-32 left-1/2 pointer-events-none z-[100] animate-float-up"
            style={{ marginLeft: `${offset}px` }}
        >
            <IconComponent weight="fill" className={`w-14 h-14 md:w-16 md:h-16 ${colorClasses[color]}`} />
        </div>
    );
};

// Gallery View for Group Calls - Enhanced with multiple layouts
const GalleryView = ({
    localStream,
    remoteStream,
    localUser,
    remoteUser,
    localPeerInfo,
    remotePeerInfo,
    isScreenSharing,
    isVideoOff,
    isMuted,
    isFullscreen,
    fullscreenTileId,
    onTileSelect,
    tileRefs,
    groupPeers,
    pinnedPeerId,
    onPinPeer,
    showParticipantsPanel,
    setShowParticipantsPanel
}) => {
    const [layout, setLayout] = useState('grid'); // 'grid', 'spotlight', 'sidebar'
    
    const hasRemote = !!remoteStream;
    const additionalPeers = (groupPeers || []).filter(peer => peer.stream);
    const allPeers = [
        { id: 'local', stream: localStream, userName: localUser, peerInfo: localPeerInfo, isLocal: true, isMuted, isVideoOff },
        ...(hasRemote ? [{ id: 'remote', stream: remoteStream, userName: remoteUser, peerInfo: remotePeerInfo, isLocal: false }] : []),
        ...additionalPeers.map(p => ({ ...p, id: p.peerId, isLocal: false }))
    ].filter(p => p.stream || p.isLocal);
    
    const totalPeers = allPeers.length;
    const hasAnyRemote = hasRemote || additionalPeers.length > 0;
    
    // Determine spotlight peer (pinned > first remote > local)
    const spotlightPeer = allPeers.find(p => p.id === pinnedPeerId) ||
                         allPeers.find(p => !p.isLocal) ||
                         allPeers[0];
    
    const otherPeers = allPeers.filter(p => p.id !== spotlightPeer?.id);
    
    // Grid layout calculation
    const getGridCols = (count) => {
        if (count <= 1) return 'grid-cols-1';
        if (count === 2) return 'grid-cols-1 md:grid-cols-2';
        if (count <= 4) return 'grid-cols-2';
        if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    };
    
    const renderVideoTile = (peer, className = '', isSpotlight = false) => (
        <VideoTile 
            key={peer.id}
            stream={peer.stream}
            isLocal={peer.isLocal}
            userName={peer.userName}
            peerInfo={peer.peerInfo}
            isScreenShare={peer.isLocal && isScreenSharing}
            isVideoOff={peer.isLocal ? isVideoOff : peer.isVideoOff}
            isMuted={peer.isLocal ? isMuted : peer.isMuted}
            isPinned={peer.id === pinnedPeerId}
            className={`${className} ${fullscreenTileId === peer.id ? 'ring-2 ring-blue-400/70' : ''}`}
            tileId={peer.id}
            onClick={() => onTileSelect?.(peer.id)}
            onPin={() => onPinPeer?.(peer.id === pinnedPeerId ? null : peer.id)}
            containerRef={peer.isLocal ? tileRefs?.local : peer.id === 'remote' ? tileRefs?.remote : (el) => {
                if (el) tileRefs?.group?.current.set(peer.id, el);
                else tileRefs?.group?.current.delete(peer.id);
            }}
            isFullscreen={isFullscreen && fullscreenTileId === peer.id}
            isSpotlight={isSpotlight}
        />
    );
    
    return (
        <div className="flex-1 flex h-full overflow-hidden">
            {/* Main Video Area */}
            <div className={`flex-1 flex flex-col h-full p-3 md:p-4 gap-3 md:gap-4 transition-all duration-300 ${showParticipantsPanel ? 'mr-80' : ''}`}>
                {/* Enhanced Layout Controls */}
                <div className="absolute top-20 right-4 z-20 flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowParticipantsPanel?.(!showParticipantsPanel)}
                        className={`p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg transition-all ${showParticipantsPanel ? 'bg-blue-500/30 text-blue-300 border-blue-500/40' : 'bg-black/60 text-white/70 hover:text-white'}`}
                        title="Toggle Participants"
                    >
                        <Users weight="fill" className="w-5 h-5" />
                        <span className="ml-2 text-xs font-medium">{totalPeers}</span>
                    </motion.button>
                    
                    <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
                        {['grid', 'spotlight', 'sidebar'].map((mode) => (
                            <motion.button
                                key={mode}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setLayout(mode)}
                                className={`p-2.5 rounded-xl transition-all ${
                                    layout === mode 
                                        ? 'bg-white/20 text-white' 
                                        : 'text-white/50 hover:text-white/80'
                                }`}
                                title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} View`}
                            >
                                {mode === 'grid' && <CornersOut weight="fill" className="w-4 h-4" />}
                                {mode === 'spotlight' && <Users weight="fill" className="w-4 h-4" />}
                                {mode === 'sidebar' && <Monitor weight="fill" className="w-4 h-4" />}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Spotlight Layout */}
                {layout === 'spotlight' && spotlightPeer && (
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex-1 min-h-0">
                            {renderVideoTile(spotlightPeer, 'h-full w-full', true)}
                        </div>
                        {otherPeers.length > 0 && (
                            <div className="h-24 md:h-32 flex gap-2 overflow-x-auto pb-2">
                                {otherPeers.map(peer => (
                                    <div key={peer.id} className="flex-shrink-0 w-40 md:w-48">
                                        {renderVideoTile(peer, 'h-full w-full')}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Sidebar Layout */}
                {layout === 'sidebar' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-3">
                        <div className="flex-1 min-h-0">
                            {spotlightPeer && renderVideoTile(spotlightPeer, 'h-full w-full', true)}
                        </div>
                        {otherPeers.length > 0 && (
                            <div className="flex md:flex-col gap-2 h-24 md:h-auto md:w-48 overflow-x-auto md:overflow-y-auto">
                                {otherPeers.map(peer => (
                                    <div key={peer.id} className="flex-shrink-0 w-40 md:w-full md:h-28">
                                        {renderVideoTile(peer, 'h-full w-full')}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Grid Layout */}
                {layout === 'grid' && (
                    <div className={`flex-1 grid ${getGridCols(totalPeers)} gap-3 md:gap-4`}>
                        {allPeers.map(peer => renderVideoTile(peer, 'min-h-0'))}
                    </div>
                )}
                
                {/* Waiting state */}
                {!hasAnyRemote && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="text-center bg-black/80 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-2xl">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="mb-6"
                            >
                                <div className="relative">
                                    <Spinner weight="bold" className="w-16 h-16 text-blue-400" />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl"
                                    />
                                </div>
                            </motion.div>
                            <p className="text-xl text-white font-semibold mb-2">Waiting for others...</p>
                            <p className="text-sm text-white/50">Share the room link to invite participants</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// Participants Panel Component for Group Calls
const ParticipantsPanel = ({ 
    isOpen, 
    onClose, 
    participants = [], 
    localUser,
    isMuted,
    isVideoOff,
    onPinPeer,
    pinnedPeerId
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    />
                    
                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Users weight="fill" className="w-5 h-5 text-blue-400" />
                                <h3 className="text-lg font-semibold text-white">Participants</h3>
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-sm">
                                    {participants.length + 1}
                                </span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                            >
                                <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>
                        
                        {/* Participants List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {/* Local User */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`
                                    flex items-center gap-3 p-3 rounded-xl transition-all
                                    ${'bg-white/5 border border-transparent'}
                                    ${pinnedPeerId === 'local' ? 'border-yellow-500/50' : ''}
                                `}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                                        {(localUser || 'Y')[0].toUpperCase()}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium truncate">{localUser || 'You'}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/30 text-blue-300">You</span>
                                    </div>
                                    <span className="text-xs text-white/50">
                                        {isMuted ? 'Muted' : isVideoOff ? 'Camera off' : 'Active'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {isMuted && <MicrophoneSlash weight="fill" className="w-4 h-4 text-red-400" />}
                                    {isVideoOff && <VideoCameraSlash weight="fill" className="w-4 h-4 text-red-400" />}
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onPinPeer?.(pinnedPeerId === 'local' ? null : 'local')}
                                        className={`p-1.5 rounded-lg transition-all ${
                                            pinnedPeerId === 'local' 
                                                ? 'bg-yellow-500/30 text-yellow-400' 
                                                : 'bg-white/5 text-white/50 hover:text-white'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"/>
                                        </svg>
                                    </motion.button>
                                </div>
                            </motion.div>
                            
                            {/* Remote Participants */}
                            {participants.map((peer, index) => (
                                <motion.div 
                                    key={peer.peerId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (index + 1) * 0.05 }}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-xl transition-all
                                        ${'bg-white/5 border border-transparent'}
                                        ${pinnedPeerId === peer.peerId ? 'border-yellow-500/50' : ''}
                                    `}
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                                            {(peer.userName || 'U')[0].toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-white font-medium truncate">{peer.userName || 'User'}</span>
                                        <div className="flex items-center gap-1 text-xs text-white/50">
                                            {peer.peerInfo?.gender && (
                                                <>
                                                    {peer.peerInfo.gender === 'male' ? (
                                                        <GenderMale weight="fill" className="w-3 h-3 text-blue-400" />
                                                    ) : (
                                                        <GenderFemale weight="fill" className="w-3 h-3 text-pink-400" />
                                                    )}
                                                    <span className="capitalize">{peer.peerInfo.gender}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {peer.isMuted && <MicrophoneSlash weight="fill" className="w-4 h-4 text-red-400" />}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onPinPeer?.(pinnedPeerId === peer.peerId ? null : peer.peerId)}
                                            className={`p-1.5 rounded-lg transition-all ${
                                                pinnedPeerId === peer.peerId 
                                                    ? 'bg-yellow-500/30 text-yellow-400' 
                                                    : 'bg-white/5 text-white/50 hover:text-white'
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"/>
                                            </svg>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* Footer */}
                        <div className="p-4 border-t border-white/10">
                            <div className="text-xs text-white/40 text-center">
                                {participants.length + 1} participant{participants.length !== 0 ? 's' : ''} in call
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Enhanced Control Button Component
const ControlButton = ({ onClick, active, activeColor, children, label, disabled = false, badge = null }) => (
    <div className="flex flex-col items-center gap-1.5">
        <motion.button
            whileHover={disabled ? {} : { scale: 1.1 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
            onClick={onClick}
            disabled={disabled}
            className={`
                relative p-4 rounded-2xl transition-all duration-300 shadow-lg
                ${disabled 
                    ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                    : active 
                        ? `${activeColor} text-white shadow-xl` 
                        : 'bg-white/10 text-white hover:bg-white/20 hover:shadow-xl'
                }
            `}
        >
            {children}
            {badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {badge}
                </span>
            )}
        </motion.button>
        <span className="text-[10px] text-white/50 font-medium">{label}</span>
    </div>
);

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocket();
    const {
        localStream,
        remoteStream,
        setRemoteStream,
        startLocalStream,
        createPeerConnection,
        createPeerConnectionForPeer,
        createOffer,
        createOfferForPeer,
        handleOffer,
        handleOfferFromPeer,
        handleAnswer,
        handleAnswerFromPeer,
        addIceCandidate,
        addIceCandidateForPeer,
        removePeerConnection,
        cleanup,
        toggleScreenShare,
        toggleVideo,
        toggleAudio,
        isScreenSharing,
        connectionStats,
        peerConnection,
        peerConnections,
    } = useWebRTC();

    const localTileRef = useRef(null);
    const remoteTileRef = useRef(null);
    const groupTileRefs = useRef(new Map());
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const initiatorHandledRef = useRef(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);
    const [pinnedPeerId, setPinnedPeerId] = useState(null);
    const [connectionTime, setConnectionTime] = useState('00:00');
    const connectionTimeRef = useRef(null);
    const [userName] = useState(() => {
        const navName = location.state?.userName;
        if (navName) {
            localStorage.setItem('echoroom_username', navName);
            return navName;
        }
        return localStorage.getItem('echoroom_username') || '';
    });
    const [isGroupCall, setIsGroupCall] = useState(false);
    const [groupPeers, setGroupPeers] = useState([]);
    const [pendingInitiatorRole, setPendingInitiatorRole] = useState(null);
    
    const [localPeerInfo, setLocalPeerInfo] = useState(() => {
        const navPeerInfo = location.state?.peerInfo;
        if (navPeerInfo) {
            localStorage.setItem('echoroom_peer_info', JSON.stringify(navPeerInfo));
            return navPeerInfo;
        }
        const saved = localStorage.getItem('echoroom_peer_info');
        return saved ? JSON.parse(saved) : { gender: '', interests: [], name: '' };
    });
    const [remotePeerInfo, setRemotePeerInfo] = useState(null);
    const [showPeerInfoModal, setShowPeerInfoModal] = useState(!localPeerInfo.gender);
    
    const [showReactions, setShowReactions] = useState(false);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [remoteReaction, setRemoteReaction] = useState(null);
    
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenControls, setShowFullscreenControls] = useState(false);
    const [fullscreenTileId, setFullscreenTileId] = useState(null);
    const fullscreenTimeoutRef = useRef(null);
    const connectionTimeoutRef = useRef(null);

    const reactions = [
        { icon: Heart, color: 'red', name: 'heart' },
        { icon: Lightning, color: 'yellow', name: 'lightning' },
        { icon: Star, color: 'blue', name: 'star' },
        { icon: Fire, color: 'orange', name: 'fire' },
        { icon: HandsClapping, color: 'purple', name: 'clap' },
    ];

    useEffect(() => {
        if (roomId && roomId.startsWith('group-')) {
            setTimeout(() => setIsGroupCall(true), 0);
        }
        initiatorHandledRef.current = false;
        setTimeout(() => {
            setPendingInitiatorRole(null);
            setGroupPeers([]);
            setRemotePeerInfo(null);
            setIsMuted(false);
            setIsVideoOff(false);
            setRemoteStream(null);
        }, 0);
        
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
        
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        
        connectionTimeoutRef.current = setTimeout(() => {
            if (!remoteStream && !isGroupCall) {
                console.log('[Room] Connection timeout - no remote stream after 15s');
            }
        }, 15000);
        
        return () => {
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
            }
        };
    }, [roomId, setRemoteStream, isGroupCall, peerConnection, peerConnections, remoteStream]);

    // Connection time tracking
    useEffect(() => {
        if (remoteStream || (isGroupCall && groupPeers.length > 0)) {
            if (!connectionTimeRef.current) {
                let seconds = 0;
                connectionTimeRef.current = setInterval(() => {
                    seconds++;
                    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
                    const secs = (seconds % 60).toString().padStart(2, '0');
                    setConnectionTime(`${mins}:${secs}`);
                }, 1000);
            }
        } else {
            if (connectionTimeRef.current) {
                clearInterval(connectionTimeRef.current);
                connectionTimeRef.current = null;
                setConnectionTime('00:00');
            }
        }
        
        return () => {
            if (connectionTimeRef.current) {
                clearInterval(connectionTimeRef.current);
                connectionTimeRef.current = null;
            }
        };
    }, [remoteStream, isGroupCall, groupPeers.length]);

    // Ref to track if media has been initialized
    const mediaInitializedRef = useRef(false);

    useEffect(() => {
        const savedUserName = localStorage.getItem('echoroom_username');
        const stateUserName = location.state?.userName;
        console.log('[Room] Checking username - saved:', savedUserName, 'state:', stateUserName);
        
        // Use state username first, then saved, then default
        const effectiveUserName = stateUserName || savedUserName;
        if (effectiveUserName) {
            localStorage.setItem('echoroom_username', effectiveUserName);
        }
        
        // Only initialize media once
        if (mediaInitializedRef.current) {
            console.log('[Room] Media already initialized, skipping');
            return;
        }
        
        console.log('[Room] Username check passed, initializing media');
        mediaInitializedRef.current = true;
        
        const initMedia = async () => {
            try {
                await startLocalStream();
                console.log('[Room] Media initialized successfully');
            } catch (err) {
                console.error('[Room] Media initialization failed:', err);
                toast.error('Please allow camera access');
                mediaInitializedRef.current = false;
            }
        };
        initMedia();
    }, [startLocalStream, location.state?.userName]);

    // Cleanup effect - runs only on unmount
    useEffect(() => {
        return () => {
            console.log('[Room] Component unmounting, cleaning up');
            cleanup();
        };
    }, [cleanup]);

    const processInitiatorRole = useCallback(async (isInitiator) => {
        if (initiatorHandledRef.current) {
            console.log('[Room] Initiator role already handled, skipping');
            return;
        }

        initiatorHandledRef.current = true;
        console.log('[Room] Processing initiator role:', isInitiator);
        
        const handleIceCandidate = (candidate) => {
            if (candidate && socket) {
                socket.emit('ice-candidate', { roomId, candidate });
            }
        };
        
        createPeerConnection(handleIceCandidate);

        if (isInitiator) {
            try {
                console.log('[Room] Creating offer as initiator');
                const offer = await createOffer();
                socket.emit('offer', { roomId, offer });
                console.log('[Room] Offer sent');
            } catch (err) {
                console.error('[Room] Failed to create offer:', err);
                toast.error('Failed to start video call');
            }
        }
    }, [socket, roomId, createPeerConnection, createOffer]);

    useEffect(() => {
        if (localStream && pendingInitiatorRole !== null && !initiatorHandledRef.current) {
            console.log('[Room] Stream ready, processing pending initiator role');
            processInitiatorRole(pendingInitiatorRole);
            setTimeout(() => setPendingInitiatorRole(null), 0);
        }
    }, [localStream, pendingInitiatorRole, processInitiatorRole]);

    useEffect(() => {
        if (remoteStream) {
            console.log('[Room] Remote stream received');
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
            }
        }
    }, [remoteStream]);

    // Use refs to avoid dependency changes causing effect re-runs
    const localStreamRef = useRef(localStream);
    const processInitiatorRoleRef = useRef(processInitiatorRole);
    const createPeerConnectionRef = useRef(createPeerConnection);
    const handleOfferRef = useRef(handleOffer);
    const handleAnswerRef = useRef(handleAnswer);
    const addIceCandidateRef = useRef(addIceCandidate);
    const isGroupCallRef = useRef(isGroupCall);
    
    // Define resetRoomState before it's used
    const resetRoomState = useCallback(() => {
        initiatorHandledRef.current = false;
        setPendingInitiatorRole(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setGroupPeers([]);
        setRemotePeerInfo(null);
        setRemoteReaction(null);
        setFloatingReactions([]);
        setIsFullscreen(false);
        setFullscreenTileId(null);
    }, []);
    
    // Update refs when values change
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
    useEffect(() => { processInitiatorRoleRef.current = processInitiatorRole; }, [processInitiatorRole]);
    useEffect(() => { createPeerConnectionRef.current = createPeerConnection; }, [createPeerConnection]);
    useEffect(() => { handleOfferRef.current = handleOffer; }, [handleOffer]);
    useEffect(() => { handleAnswerRef.current = handleAnswer; }, [handleAnswer]);
    useEffect(() => { addIceCandidateRef.current = addIceCandidate; }, [addIceCandidate]);
    useEffect(() => { isGroupCallRef.current = isGroupCall; }, [isGroupCall]);

    useEffect(() => {
        if (!socket || !roomId) {
            console.log('[Room] Waiting for socket and roomId...', { socket: !!socket, roomId });
            return;
        }

        console.log('[Room] Setting up socket event handlers for room:', roomId);
        
        // Emit join-room to notify server we're ready
        socket.emit('join-room', { roomId, userName, peerInfo: localPeerInfo });

        const handleIsInitiator = (isInitiator) => {
            console.log('[Room] Received is-initiator:', isInitiator);
            
            if (isGroupCallRef.current) {
                console.log('[Room] Skipping initiator role in group call');
                return;
            }
            
            if (initiatorHandledRef.current) {
                console.log('[Room] Already handled initiator role');
                return;
            }
            
            if (!localStreamRef.current) {
                console.log('[Room] Stream not ready, queuing initiator role');
                setPendingInitiatorRole(isInitiator);
                return;
            }
            
            console.log('[Room] Processing initiator role immediately');
            processInitiatorRoleRef.current(isInitiator);
        };

        const handleOfferReceived = async ({ offer, sender }) => {
            console.log('[Room] Received offer from:', sender || 'peer');
            try {
                if (isGroupCallRef.current && sender) {
                    await handleOfferFromPeerEvent({ offer, sender });
                    return;
                }
                if (!peerConnection.current) {
                    console.log('[Room] Creating peer connection for offer');
                    const handleIceCandidate = (candidate) => {
                        if (candidate && socket) {
                            console.log('[Room] Sending ICE candidate');
                            socket.emit('ice-candidate', { roomId, candidate });
                        }
                    };
                    createPeerConnectionRef.current(handleIceCandidate);
                }
                console.log('[Room] Handling offer...');
                const answer = await handleOfferRef.current(offer);
                console.log('[Room] Sending answer...');
                socket.emit('answer', { roomId, answer });
                initiatorHandledRef.current = true;
                console.log('[Room] Answer sent successfully');
            } catch (err) {
                console.error('[Room] Error handling offer:', err);
                toast.error('Connection failed');
            }
        };

        const handleAnswerReceived = async ({ answer, sender }) => {
            console.log('[Room] Received answer from:', sender || 'peer');
            try {
                if (isGroupCallRef.current && sender) {
                    await handleAnswerFromPeerEvent({ answer, sender });
                    return;
                }
                console.log('[Room] Processing answer...');
                await handleAnswerRef.current(answer);
                console.log('[Room] Answer processed successfully');
            } catch (err) {
                console.error('[Room] Error handling answer:', err);
            }
        };

        const handleIceCandidateReceived = async ({ candidate, sender }) => {
            console.log('[Room] Received ICE candidate from:', sender || 'peer');
            if (!candidate) {
                console.log('[Room] Received null ICE candidate, ignoring');
                return;
            }
            try {
                if (isGroupCallRef.current && sender) {
                    console.log('[Room] Adding ICE candidate for peer:', sender);
                    await addIceCandidateForPeer(candidate, sender);
                    return;
                }
                console.log('[Room] Adding ICE candidate...');
                await addIceCandidateRef.current(candidate);
                console.log('[Room] ICE candidate added successfully');
            } catch (err) {
                console.error('[Room] Error adding ICE candidate:', err);
            }
        };

        const handleExistingPeers = async ({ peers }) => {
            if (!isGroupCallRef.current) return;
            const peerList = peers || [];
            setGroupPeers(peerList.map(peerId => ({ peerId })));
            for (const peerId of peerList) {
                const handleIceCandidate = (candidate) => {
                    if (candidate && socket) {
                        socket.emit('ice-candidate', { roomId, candidate, targetPeerId: peerId });
                    }
                };
                const handleRemoteStream = (stream) => {
                    setGroupPeers(prev => {
                        const existing = prev.find(p => p.peerId === peerId);
                        if (existing) {
                            return prev.map(p => p.peerId === peerId ? { ...p, stream } : p);
                        }
                        return [...prev, { peerId, stream }];
                    });
                };
                createPeerConnectionForPeer(peerId, handleIceCandidate, handleRemoteStream);
                const offer = await createOfferForPeer(peerId);
                socket.emit('offer', { roomId, offer, targetPeerId: peerId });
            }
        };

        const handlePeerJoined = async ({ peerId }) => {
            if (!isGroupCallRef.current || !peerId) return;
            setGroupPeers(prev => (prev.find(peer => peer.peerId === peerId) ? prev : [...prev, { peerId }]));
            const handleIceCandidate = (candidate) => {
                if (candidate && socket) {
                    socket.emit('ice-candidate', { roomId, candidate, targetPeerId: peerId });
                }
            };
            const handleRemoteStream = (stream) => {
                setGroupPeers(prev => {
                    const existing = prev.find(p => p.peerId === peerId);
                    if (existing) {
                        return prev.map(p => p.peerId === peerId ? { ...p, stream } : p);
                    }
                    return [...prev, { peerId, stream }];
                });
            };
            createPeerConnectionForPeer(peerId, handleIceCandidate, handleRemoteStream);
            const offer = await createOfferForPeer(peerId);
            socket.emit('offer', { roomId, offer, targetPeerId: peerId });
        };

        const handlePeerLeft = ({ peerId }) => {
            if (!peerId) return;
            removePeerConnection(peerId);
            setGroupPeers(prev => prev.filter(peer => peer.peerId !== peerId));
        };

        const handleOfferFromPeerEvent = async ({ offer, sender }) => {
            if (!isGroupCallRef.current || !sender || !offer) return;
            if (!peerConnections.current.has(sender)) {
                const handleIceCandidate = (candidate) => {
                    if (candidate && socket) {
                        socket.emit('ice-candidate', { roomId, candidate, targetPeerId: sender });
                    }
                };
                const handleRemoteStream = (stream) => {
                    setGroupPeers(prev => {
                        const existing = prev.find(p => p.peerId === sender);
                        if (existing) {
                            return prev.map(p => p.peerId === sender ? { ...p, stream } : p);
                        }
                        return [...prev, { peerId: sender, stream }];
                    });
                };
                createPeerConnectionForPeer(sender, handleIceCandidate, handleRemoteStream);
            }
            const answer = await handleOfferFromPeer(offer, sender);
            socket.emit('answer', { roomId, answer, targetPeerId: sender });
        };

        const handleAnswerFromPeerEvent = async ({ answer, sender }) => {
            if (!isGroupCallRef.current || !sender || !answer) return;
            await handleAnswerFromPeer(answer, sender);
        };

        const handlePartnerLeft = () => {
            if (isGroupCallRef.current) return;
            cleanup();
            resetRoomState();
            navigate('/matching', {
                state: {
                    userName,
                    gender: localPeerInfo?.gender,
                    interests: localPeerInfo?.interests,
                    peerInfo: { ...localPeerInfo, name: userName || localPeerInfo?.name || 'Anonymous' }
                },
                replace: true
            });
        };

        const handlePeerInfo = ({ peerId, info }) => {
            if (!info) return;
            if (isGroupCallRef.current) {
                setGroupPeers(prev => {
                    const existing = prev.find(peer => peer.peerId === peerId);
                    if (existing) {
                        return prev.map(peer => peer.peerId === peerId ? { ...peer, peerInfo: info, userName: info.name } : peer);
                    }
                    return [...prev, { peerId, peerInfo: info, userName: info.name }];
                });
                return;
            }
            setRemotePeerInfo(info);
        };

        console.log('[Room] Registering socket event handlers');
        socket.on('is-initiator', handleIsInitiator);
        socket.on('offer', handleOfferReceived);
        socket.on('answer', handleAnswerReceived);
        socket.on('ice-candidate', handleIceCandidateReceived);
        socket.on('existing-peers', handleExistingPeers);
        socket.on('peer-joined', handlePeerJoined);
        socket.on('peer-left', handlePeerLeft);
        socket.on('partner-left', handlePartnerLeft);
        socket.on('peer-info', handlePeerInfo);

        // Request initiator status in case we missed it
        const requestInitiatorStatus = () => {
            if (!initiatorHandledRef.current) {
                console.log('[Room] Requesting initiator status...');
                socket.emit('request-initiator-status', { roomId });
            }
        };
        
        // Request status after a short delay to ensure handlers are registered
        const statusTimeout = setTimeout(requestInitiatorStatus, 500);

        return () => {
            console.log('[Room] Cleaning up socket event handlers');
            clearTimeout(statusTimeout);
            socket.off('is-initiator', handleIsInitiator);
            socket.off('offer', handleOfferReceived);
            socket.off('answer', handleAnswerReceived);
            socket.off('ice-candidate', handleIceCandidateReceived);
            socket.off('existing-peers', handleExistingPeers);
            socket.off('peer-joined', handlePeerJoined);
            socket.off('peer-left', handlePeerLeft);
            socket.off('partner-left', handlePartnerLeft);
            socket.off('peer-info', handlePeerInfo);
        };
    }, [socket, roomId, userName, localPeerInfo, cleanup, resetRoomState, navigate, createPeerConnectionForPeer, createOfferForPeer, handleOfferFromPeer, handleAnswerFromPeer, addIceCandidateForPeer, removePeerConnection, peerConnection, peerConnections]); // Include peerConnection and peerConnections refs

    const handleToggleMute = useCallback(() => {
        const isEnabled = toggleAudio();
        setIsMuted(!isEnabled);
    }, [toggleAudio]);

    const handleToggleVideo = useCallback(() => {
        const isEnabled = toggleVideo();
        setIsVideoOff(!isEnabled);
        socket.emit('toggle-video', { roomId, isVideoOff: !isEnabled });
    }, [toggleVideo, socket, roomId]);

    const getFullscreenTarget = useCallback((tileId) => {
        if (tileId === 'local') return localTileRef.current;
        if (tileId === 'remote') return remoteTileRef.current;
        return groupTileRefs.current.get(tileId);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                const target = getFullscreenTarget(fullscreenTileId);
                if (target?.requestFullscreen) {
                    await target.requestFullscreen();
                } else if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } else {
                await document.exitFullscreen();
            }
        } catch {
            toast.error('Fullscreen not supported');
        }
    }, [fullscreenTileId, getFullscreenTarget]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isActive = !!document.fullscreenElement;
            setIsFullscreen(isActive);
            setShowFullscreenControls(isActive);
            if (!isActive) {
                setFullscreenTileId(null);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        const handleMouseMove = () => {
            if (document.fullscreenElement) {
                setShowFullscreenControls(true);
                if (fullscreenTimeoutRef.current) clearTimeout(fullscreenTimeoutRef.current);
                fullscreenTimeoutRef.current = setTimeout(() => {
                    setShowFullscreenControls(false);
                }, 3000);
            }
        };
        const handleTouch = () => {
            if (document.fullscreenElement) {
                setShowFullscreenControls(prev => !prev);
                if (fullscreenTimeoutRef.current) clearTimeout(fullscreenTimeoutRef.current);
                fullscreenTimeoutRef.current = setTimeout(() => {
                    setShowFullscreenControls(false);
                }, 3000);
            }
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchstart', handleTouch);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchstart', handleTouch);
        };
    }, []);

    const handleTileSelect = useCallback(async (tileId) => {
        setFullscreenTileId(tileId);
        setIsChatOpen(false);
        try {
            const target = getFullscreenTarget(tileId);
            if (target?.requestFullscreen) {
                await target.requestFullscreen();
            } else if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch {
            toast.error('Fullscreen not supported');
        }
    }, [getFullscreenTarget]);

    useEffect(() => {
        if (isGroupCall && isChatOpen) {
            setTimeout(() => setIsChatOpen(false), 0);
        }
    }, [isGroupCall, isChatOpen]);

    const handleLeaveRoom = useCallback(() => {
        cleanup();
        socket.emit('leave-room', roomId);
        resetRoomState();
        navigate('/post-chat');
    }, [cleanup, socket, roomId, navigate, resetRoomState]);

    const handleNext = useCallback(() => {
        cleanup();
        socket.emit('next', { roomId });
        resetRoomState();
        navigate('/matching');
    }, [cleanup, socket, roomId, navigate, resetRoomState]);

    const sendReaction = useCallback((reaction) => {
        const id = `${Date.now()}-${Math.random()}`;
        const offset = (Math.random() - 0.5) * 100;
        setFloatingReactions(prev => [...prev, { id, offset, ...reaction }]);
        socket.emit('send-reaction', { roomId, reaction: reaction.name });
        setShowReactions(false);
    }, [socket, roomId]);

    const handleShareRoom = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!', { icon: <CheckCircle weight="fill" className="w-5 h-5 text-emerald-400" /> });
    }, []);

    const savePeerInfo = () => {
        const info = { gender: tempGender, interests: tempInterests.filter(i => i) };
        setLocalPeerInfo(info);
        localStorage.setItem('echoroom_peer_info', JSON.stringify(info));
        setShowPeerInfoModal(false);
        socket.emit('update-peer-info', { roomId, info });
    };

    const [tempGender, setTempGender] = useState(localPeerInfo.gender || '');
    const [tempInterests, setTempInterests] = useState(localPeerInfo.interests?.length ? localPeerInfo.interests : ['', '']);

    return (
        <div className="relative flex flex-col h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    color: 'white'
                }
            }} />
            
            {/* Enhanced Header */}
            {!isFullscreen && (
                <motion.header 
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    className="relative z-50 flex items-center justify-between px-4 md:px-6 py-4 bg-black/30 backdrop-blur-xl border-b border-white/5"
                >
                    <div className="flex items-center gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowExitConfirm(true)}
                            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                        >
                            <ArrowLeft weight="bold" className="w-5 h-5" />
                        </motion.button>
                        <div>
                            <h1 className="text-xl font-bold">
                                <span className="text-white">echo</span>
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">room</span>
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-white/50">
                                {isGroupCall ? (
                                    <><Users weight="fill" className="w-3.5 h-3.5" /> Group Call</>
                                ) : (
                                    <><WifiHigh weight="fill" className="w-3.5 h-3.5" /> Private Room</>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-3">
                        <ConnectionQuality stats={connectionStats} />
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNext}
                            className="hidden sm:flex p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 transition-all border border-emerald-500/30"
                            title="Next person"
                        >
                            <ArrowClockwise weight="bold" className="w-5 h-5 text-emerald-400" />
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowPeerInfoModal(true)}
                            className="hidden sm:flex p-3 rounded-2xl bg-violet-500/20 hover:bg-violet-500/30 transition-all border border-violet-500/30"
                        >
                            <Tag weight="fill" className="w-5 h-5 text-violet-400" />
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleShareRoom}
                            className="p-3 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 transition-all border border-blue-500/30"
                        >
                            <ShareNetwork weight="fill" className="w-5 h-5 text-blue-400" />
                        </motion.button>
                    </div>
                </motion.header>
            )}

            {/* Main Video Area */}
            <div className="flex-1 relative overflow-hidden">
                {isGroupCall ? (
                    <GalleryView 
                        localStream={localStream}
                        remoteStream={remoteStream}
                        localUser={userName || 'You'}
                        remoteUser={remotePeerInfo?.name || 'Stranger'}
                        localPeerInfo={localPeerInfo}
                        remotePeerInfo={remotePeerInfo}
                        isScreenSharing={isScreenSharing}
                        isMuted={isMuted}
                        isVideoOff={isVideoOff}
                        isFullscreen={isFullscreen}
                        fullscreenTileId={fullscreenTileId}
                        onTileSelect={handleTileSelect}
                        tileRefs={{ local: localTileRef, remote: remoteTileRef, group: groupTileRefs }}
                        groupPeers={groupPeers}
                        pinnedPeerId={pinnedPeerId}
                        onPinPeer={setPinnedPeerId}
                        null={null}
                        showParticipantsPanel={showParticipantsPanel}
                        setShowParticipantsPanel={setShowParticipantsPanel}
                    />
                ) : (
                    <div className={`relative h-full w-full ${isFullscreen ? 'p-0' : 'p-3 md:p-5'}`}>
                        {/* Enhanced Remote Video Container */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            ref={remoteTileRef}
                            data-tile-id="remote"
                            onClick={() => handleTileSelect('remote')}
                            className={`relative h-full w-full rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-2xl cursor-pointer ${fullscreenTileId === 'remote' ? 'ring-2 ring-blue-400/70' : ''}`}
                        >
                            {remoteStream ? (
                                <>
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className={`w-full h-full ${isFullscreen && fullscreenTileId === 'remote' ? 'object-contain' : 'object-cover'}`}
                                    />
                                    
                                    {/* Enhanced Remote Peer Info Overlay */}
                                    {remotePeerInfo && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-2 md:space-y-3">
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.2 }}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                                            <span className="text-2xl md:text-3xl font-bold text-white">
                                                                {(remotePeerInfo.name || 'A')[0].toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-lg md:text-2xl font-bold text-white block">{remotePeerInfo.name || 'Anonymous'}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs border border-emerald-500/40">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                                    Connected
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                    
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.3 }}
                                                        className="flex items-center gap-2 flex-wrap"
                                                    >
                                                        {remotePeerInfo.gender && (
                                                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium backdrop-blur-md ${
                                                                remotePeerInfo.gender === 'male' 
                                                                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' 
                                                                    : 'bg-pink-500/30 text-pink-300 border border-pink-500/40'
                                                            }`}>
                                                                {remotePeerInfo.gender === 'male' ? <GenderMale weight="fill" className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <GenderFemale weight="fill" className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                                                                <span className="capitalize">{remotePeerInfo.gender}</span>
                                                            </span>
                                                        )}
                                                        {remotePeerInfo.interests?.slice(0, 4).map((interest, i) => (
                                                            <motion.span 
                                                                key={i}
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ delay: 0.4 + i * 0.1 }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium bg-violet-500/30 text-violet-300 border border-violet-500/40 backdrop-blur-md"
                                                            >
                                                                <Tag weight="fill" className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                                {interest}
                                                            </motion.span>
                                                        ))}
                                                    </motion.div>
                                                </div>
                                                
                                                {/* Connection Time */}
                                                <div className="hidden md:block bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                                    <span className="text-white/80 text-sm font-medium font-mono">{connectionTime}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                    
                                    {/* Remote Reaction with Enhanced Animation */}
                                    {remoteReaction && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0, y: 50 }}
                                            animate={{ scale: 2.5, opacity: 1, y: -100 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ 
                                                type: "spring",
                                                stiffness: 200,
                                                damping: 15
                                            }}
                                            className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 pointer-events-none"
                                        >
                                            {React.createElement(reactions.find(r => r.name === remoteReaction)?.icon, {
                                                weight: 'fill',
                                                className: 'w-20 h-20 drop-shadow-2xl'
                                            })}
                                        </motion.div>
                                    )}
                                    
                                    {/* Mute indicator for remote */}
                                    {remotePeerInfo?.isMuted && (
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 rounded-full bg-red-500/90 shadow-2xl border-2 border-red-400/50"
                                        >
                                            <MicrophoneSlash weight="fill" className="w-10 h-10 text-white" />
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800/80 to-slate-900/80">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="text-center"
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="relative mb-8"
                                        >
                                            <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-2xl animate-pulse" />
                                            <Spinner weight="bold" className="relative w-20 h-20 text-blue-400" />
                                        </motion.div>
                                        <motion.h3 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-2xl text-white font-semibold mb-3"
                                        >
                                            Looking for someone...
                                        </motion.h3>
                                        <motion.p 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="text-white/50"
                                        >
                                            Matching you with a random stranger
                                        </motion.p>
                                        
                                        {/* Animated dots */}
                                        <motion.div className="flex items-center justify-center gap-1 mt-6">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ 
                                                        scale: [1, 1.5, 1],
                                                        opacity: [0.5, 1, 0.5]
                                                    }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        delay: i * 0.2
                                                    }}
                                                    className="w-2 h-2 rounded-full bg-blue-400"
                                                />
                                            ))}
                                        </motion.div>
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>

                        {/* Enhanced Local Video - Picture in Picture */}
                        {!isVideoOff && !isFullscreen && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8, x: 100 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 200 }}
                                drag
                                dragConstraints={{ left: -window.innerWidth + 200, right: 20, top: -window.innerHeight + 300, bottom: 100 }}
                                dragElastic={0.1}
                                dragMomentum={false}
                                ref={localTileRef}
                                data-tile-id="local"
                                onClick={() => handleTileSelect('local')}
                                className={`absolute z-30 bottom-20 right-3 md:bottom-24 md:right-5 w-32 h-44 md:w-44 md:h-60 bg-slate-900 rounded-xl md:rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-pointer hover:border-white/40 transition-all ${fullscreenTileId === 'local' ? 'ring-2 ring-blue-400/70' : ''}`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />
                                {!localStream ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Spinner weight="bold" className="w-8 h-8 text-blue-400 mb-2" />
                                        </motion.div>
                                        <span className="text-xs text-white/50">Camera...</span>
                                    </div>
                                ) : (
                                    <>
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                            style={{ transform: 'scaleX(-1)' }}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <span className="text-xs font-semibold text-white">{userName || 'You'}</span>
                                        </div>
                                        {isMuted && (
                                            <div className="absolute top-2 right-2 p-2 rounded-full bg-red-500/90">
                                                <MicrophoneSlash weight="fill" className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </div>
                )}
            </div>

            {/* Enhanced Controls */}
            <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className={`relative z-50 ${isFullscreen ? 'fixed bottom-0 left-0 right-0' : ''} ${isFullscreen && !showFullscreenControls ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <div className={`
                    flex items-center justify-center gap-3 md:gap-6 p-4 md:p-6
                    ${isFullscreen 
                        ? 'bg-gradient-to-t from-black/95 via-black/60 to-transparent' 
                        : 'bg-black/40 backdrop-blur-xl border-t border-white/5'
                    }
                `}>
                    <ControlButton 
                        onClick={handleToggleMute} 
                        active={isMuted} 
                        activeColor="bg-red-500"
                        label={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <MicrophoneSlash weight="fill" className="w-6 h-6" /> : <Microphone weight="fill" className="w-6 h-6" />}
                    </ControlButton>

                    <ControlButton 
                        onClick={handleToggleVideo} 
                        active={isVideoOff} 
                        activeColor="bg-red-500"
                        label={isVideoOff ? 'Show Video' : 'Hide Video'}
                    >
                        {isVideoOff ? <VideoCameraSlash weight="fill" className="w-6 h-6" /> : <VideoCamera weight="fill" className="w-6 h-6" />}
                    </ControlButton>

                    {/* Screen Share - Desktop only */}
                    <div className="hidden md:block">
                        <ControlButton 
                            onClick={toggleScreenShare} 
                            active={isScreenSharing} 
                            activeColor="bg-emerald-500"
                            label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
                        >
                            <Monitor weight="fill" className="w-6 h-6" />
                        </ControlButton>
                    </div>

                    {/* Chat */}
                    {!isGroupCall && (
                        <ControlButton 
                            onClick={() => setIsChatOpen(!isChatOpen)} 
                            active={isChatOpen} 
                            activeColor="bg-blue-500"
                            label="Chat"
                        >
                            <ChatCircle weight="fill" className="w-6 h-6" />
                        </ControlButton>
                    )}

                    {/* Reactions */}
                    <div className="relative">
                        <ControlButton 
                            onClick={() => setShowReactions(!showReactions)} 
                            active={showReactions} 
                            activeColor="bg-violet-500"
                            label="React"
                        >
                            <Smiley weight="fill" className="w-6 h-6" />
                        </ControlButton>
                        
                        <AnimatePresence>
                            {showReactions && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex gap-2 p-3 bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl"
                                >
                                    {reactions.map(reaction => (
                                        <motion.button
                                            key={reaction.name}
                                            whileHover={{ scale: 1.2, y: -5 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => sendReaction(reaction)}
                                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                                        >
                                            <reaction.icon weight="fill" className="w-7 h-7" />
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Fullscreen */}
                    {fullscreenTileId && (
                        <ControlButton 
                            onClick={toggleFullscreen} 
                            active={isFullscreen} 
                            activeColor="bg-slate-600"
                            label={isFullscreen ? 'Exit Full' : 'Fullscreen'}
                        >
                            {isFullscreen ? <CornersIn weight="fill" className="w-6 h-6" /> : <CornersOut weight="fill" className="w-6 h-6" />}
                        </ControlButton>
                    )}

                    {/* End Call */}
                    <ControlButton 
                        onClick={() => setShowExitConfirm(true)} 
                        active={true}
                        activeColor="bg-red-600 hover:bg-red-700"
                        label="End"
                    >
                        <PhoneDisconnect weight="fill" className="w-6 h-6" />
                    </ControlButton>
                </div>
            </motion.div>

            {/* Chat Sidebar */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute top-16 right-0 bottom-0 w-full md:w-[360px] z-40 bg-black/60 backdrop-blur-2xl border-l border-white/10"
                    >
                        <Chat roomId={roomId} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userName={userName} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Reactions */}
            <AnimatePresence>
                {floatingReactions.map(({ id, icon, color, offset }) => (
                    <FloatingReaction
                        key={id}
                        icon={icon}
                        color={color}
                        offset={offset}
                        onComplete={() => setFloatingReactions(prev => prev.filter(r => r.id !== id))}
                    />
                ))}
            </AnimatePresence>

            {/* Exit Confirmation Modal */}
            <AnimatePresence>
                {showExitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900/95 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <Warning weight="fill" className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Leave Room?</h3>
                            <p className="text-white/60 mb-6">Are you sure you want to end this call?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
                                >
                                    Stay
                                </button>
                                <button
                                    onClick={handleLeaveRoom}
                                    className="flex-1 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all"
                                >
                                    Leave
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Peer Info Modal */}
            <AnimatePresence>
                {showPeerInfoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900/95 border border-white/10 rounded-3xl p-8 max-w-md w-full"
                        >
                            <h3 className="text-2xl font-bold text-white mb-2">About You</h3>
                            <p className="text-white/50 text-sm mb-6">Share optional info to find better matches</p>
                            
                            <div className="space-y-5 mb-6">
                                {/* Gender */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-3">Gender</label>
                                    <div className="flex gap-3">
                                        {['male', 'female'].map(gender => (
                                            <button
                                                key={gender}
                                                onClick={() => setTempGender(gender)}
                                                className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                                                    tempGender === gender 
                                                        ? 'bg-blue-500 border-blue-500 text-white' 
                                                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                                }`}
                                            >
                                                {gender === 'male' ? 'Male' : 'Female'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Interests */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-3">Interests (optional)</label>
                                    <div className="space-y-2">
                                        {tempInterests.map((interest, idx) => (
                                            <input
                                                key={idx}
                                                type="text"
                                                value={interest}
                                                onChange={(e) => {
                                                    const newInterests = [...tempInterests];
                                                    newInterests[idx] = e.target.value;
                                                    setTempInterests(newInterests);
                                                }}
                                                placeholder={`Interest ${idx + 1}`}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPeerInfoModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={savePeerInfo}
                                    className="flex-1 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Participants Panel for Group Calls */}
            {isGroupCall && (
                <ParticipantsPanel
                    isOpen={showParticipantsPanel}
                    onClose={() => setShowParticipantsPanel(false)}
                    participants={groupPeers}
                    localUser={userName}
                    localPeerInfo={localPeerInfo}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    onPinPeer={setPinnedPeerId}
                    pinnedPeerId={pinnedPeerId}
                    null={null}
                />
            )}
        </div>
    );
};

export default Room;
