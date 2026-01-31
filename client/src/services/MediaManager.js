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
    }

    /**
     * Get default media constraints
     */
    getDefaultConstraints() {
        return {
            video: {
                width: { ideal: 1920, max: 3840, min: 1280 },
                height: { ideal: 1080, max: 2160, min: 720 },
                frameRate: { ideal: 30, max: 60 },
                facingMode: 'user'
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000
            }
        };
    }

    /**
     * Initialize local media stream
     * @param {Object} constraints - Optional custom constraints
     * @returns {Promise<MediaStream>}
     */
    async initializeStream(constraints = null) {
        try {
            const mediaConstraints = constraints || this.currentConstraints;

            console.log('[MediaManager] Requesting media with constraints:', mediaConstraints);
            this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

            console.log('[MediaManager] Stream initialized:', {
                id: this.localStream.id,
                tracks: this.localStream.getTracks().map(t => ({
                    kind: t.kind,
                    label: t.label,
                    enabled: t.enabled
                }))
            });

            // Update available devices
            await this.updateDevices();

            return this.localStream;
        } catch (error) {
            console.error('[MediaManager] Failed to initialize stream:', error);
            return this.handleStreamError(error);
        }
    }

    /**
     * Handle stream initialization errors with fallbacks
     */
    async handleStreamError(error) {
        const errorType = this.categorizeError(error);

        console.warn('[MediaManager] Error type:', errorType);

        // Try fallback strategies
        if (errorType === 'permission') {
            throw {
                type: 'permission',
                message: 'Camera and microphone access denied. Please allow permissions.',
                originalError: error
            };
        }

        if (errorType === 'notfound') {
            // Try audio-only
            console.log('[MediaManager] Attempting audio-only fallback');
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

            console.log('[MediaManager] Available devices:', {
                video: this.devices.video.length,
                audio: this.devices.audio.length
            });
        } catch (error) {
            console.error('[MediaManager] Failed to enumerate devices:', error);
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

            console.log('[MediaManager] Camera switched to:', newFacingMode);
            return newVideoTrack;
        } catch (error) {
            console.error('[MediaManager] Failed to switch camera:', error);
            throw error;
        }
    }

    /**
     * Toggle video track
     */
    toggleVideo(enabled) {
        if (!this.localStream) return false;

        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = enabled;
            console.log('[MediaManager] Video toggled:', enabled);
            return videoTrack.enabled;
        }
        return false;
    }

    /**
     * Toggle audio track
     */
    toggleAudio(enabled) {
        if (!this.localStream) return false;

        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = enabled;
            console.log('[MediaManager] Audio toggled:', enabled);
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
                console.log('[MediaManager] Stopped track:', track.kind);
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
