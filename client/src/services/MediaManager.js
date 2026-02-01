/**
 * MediaManager - Handles all media stream operations
 * - Device enumeration and selection
 * - Stream initialization with fallbacks
 * - Quality adaptation
 * - Error recovery
 */

class MediaManager {
    constructor() {
        this.localStream = null;
        this.devices = { video: [], audio: [] };
        this.currentConstraints = this.getDefaultConstraints();
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
    }

    /**
     * Get default media constraints - optimized for quick connection
     */
    getDefaultConstraints() {
        return {
            video: {
                width: { ideal: 1280, max: 1920, min: 640 },
                height: { ideal: 720, max: 1080, min: 480 },
                frameRate: { ideal: 30, max: 30 },
                facingMode: 'user'
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };
    }
    
    /**
     * Get minimal constraints for quick fallback
     */
    getMinimalConstraints() {
        return {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 24 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true
            }
        };
    }

    /**
     * Initialize local media stream with progressive fallback
     * @param {Object} constraints - Optional custom constraints
     * @returns {Promise<MediaStream>}
     */
    async initializeStream(constraints = null) {
        this.initializationAttempts++;
        
        // Try strategies in order of preference
        const strategies = [
            { name: 'optimal', constraints: constraints || this.currentConstraints },
            { name: 'minimal', constraints: this.getMinimalConstraints() },
            { name: 'basic', constraints: { video: true, audio: true } },
            { name: 'audio-only', constraints: { video: false, audio: true } }
        ];
        
        let lastError = null;
        
        for (const strategy of strategies) {
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia(strategy.constraints);

                // Update available devices asynchronously
                this.updateDevices().catch(() => {});

                this.initializationAttempts = 0;
                return this.localStream;
            } catch (error) {
                lastError = error;
                
                // If permission denied, don't try other strategies
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    throw {
                        type: 'permission',
                        message: 'Camera and microphone access denied. Please allow permissions.',
                        originalError: error
                    };
                }
            }
        }
        
        // All strategies failed
        return this.handleStreamError(lastError);
    }

    /**
     * Handle stream initialization errors with fallbacks
     */
    async handleStreamError(error) {
        const errorType = this.categorizeError(error);

        // Try fallback strategies
        if (errorType === 'permission') {
            throw {
                type: 'permission',
                message: 'Camera and microphone access denied. Please allow permissions.',
                originalError: error
            };
        }

        if (errorType === 'constraints') {
            // Try with lower quality constraints
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 24 }
                    },
                    audio: this.currentConstraints.audio
                });
                return this.localStream;
            } catch (lowerQualityError) {
                try {
                    this.localStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    return this.localStream;
                } catch (basicError) {
                    // Continue to notfound handling
                }
            }
        }

        if (errorType === 'notfound') {
            // Try audio-only
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: this.currentConstraints.audio
                });
                return this.localStream;
            } catch (audioError) {
                throw {
                    type: 'notfound',
                    message: 'No camera or microphone found.',
                    originalError: error
                };
            }
        }

        if (errorType === 'inuse') {
            throw {
                type: 'inuse',
                message: 'Camera/microphone is already in use by another application.',
                originalError: error
            };
        }

        // Generic error
        throw {
            type: 'unknown',
            message: 'Failed to access media devices.',
            originalError: error
        };
    }

    /**
     * Categorize media error
     */
    categorizeError(error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            return 'permission';
        }
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            return 'notfound';
        }
        if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            return 'inuse';
        }
        if (error.name === 'OverconstrainedError') {
            return 'constraints';
        }
        return 'unknown';
    }

    /**
     * Update available devices
     */
    async updateDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.devices.video = devices.filter(d => d.kind === 'videoinput');
            this.devices.audio = devices.filter(d => d.kind === 'audioinput');
        } catch (error) {
            // Failed to enumerate devices
        }
    }

    /**
     * Switch camera (front/back)
     */
    async switchCamera() {
        if (!this.localStream) {
            throw new Error('No active stream to switch camera');
        }

        const videoTrack = this.localStream.getVideoTracks()[0];
        if (!videoTrack) {
            throw new Error('No video track available');
        }

        const currentFacingMode = videoTrack.getSettings().facingMode;
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

        try {
            // Stop current video track
            videoTrack.stop();

            // Get new stream with different facing mode
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { ...this.currentConstraints.video, facingMode: newFacingMode },
                audio: false
            });

            // Replace video track
            const newVideoTrack = newStream.getVideoTracks()[0];
            this.localStream.removeTrack(videoTrack);
            this.localStream.addTrack(newVideoTrack);

            return newVideoTrack;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Toggle video track
     * @param {boolean|undefined} enabled - If provided, sets to this value. Otherwise toggles.
     */
    toggleVideo(enabled) {
        if (!this.localStream) return false;

        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            // If enabled is undefined, toggle current state
            const newState = enabled !== undefined ? enabled : !videoTrack.enabled;
            videoTrack.enabled = newState;
            return videoTrack.enabled;
        }
        return false;
    }

    /**
     * Toggle audio track
     * @param {boolean|undefined} enabled - If provided, sets to this value. Otherwise toggles.
     */
    toggleAudio(enabled) {
        if (!this.localStream) return false;

        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            // If enabled is undefined, toggle current state
            const newState = enabled !== undefined ? enabled : !audioTrack.enabled;
            audioTrack.enabled = newState;
            return audioTrack.enabled;
        }
        return false;
    }

    /**
     * Stop all tracks and clean up
     */
    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
            });
            this.localStream = null;
        }
    }

    /**
     * Get current stream
     */
    getStream() {
        return this.localStream;
    }

    /**
     * Check if stream has video
     */
    hasVideo() {
        return this.localStream && this.localStream.getVideoTracks().length > 0;
    }

    /**
     * Check if stream has audio
     */
    hasAudio() {
        return this.localStream && this.localStream.getAudioTracks().length > 0;
    }
}

export default MediaManager;
