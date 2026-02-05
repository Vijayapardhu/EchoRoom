import React from 'react';
import { 
    WarningCircle, 
    VideoCamera, 
    Microphone, 
    ArrowClockwise 
} from '@phosphor-icons/react';

const PermissionError = ({ type = 'camera', onRetry, onDismiss }) => {
    const getInstructions = () => {
        const isChrome = /Chrome/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

        if (isChrome) {
            return [
                'Click the camera icon in the address bar',
                'Select "Always allow" for camera and microphone',
                'Click "Done" and refresh the page'
            ];
        } else if (isFirefox) {
            return [
                'Click the permissions icon in the address bar',
                'Enable camera and microphone permissions',
                'Refresh the page'
            ];
        } else if (isSafari) {
            return [
                'Go to Safari > Settings for This Website',
                'Allow camera and microphone access',
                'Refresh the page'
            ];
        }

        return [
            'Check your browser settings',
            'Allow camera and microphone access',
            'Refresh the page'
        ];
    };

    const Icon = type === 'camera' ? VideoCamera : Microphone;
    const instructions = getInstructions();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
        >
            <div className="max-w-md w-full bg-slate-900/95 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-red-500/20 rounded-2xl">
                        <WarningCircle weight="bold" className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Permission Required</h2>
                        <p className="text-sm text-white/50">Camera and microphone access needed</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-6 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <Icon weight="bold" className="w-6 h-6 text-red-400 flex-shrink-0" />
                    <p className="text-white/70 text-sm">
                        <span className="text-white">echo</span><span className="text-blue-400">room</span> needs access to your {type} to connect with others.
                    </p>
                </div>

                <div className="mb-8">
                    <p className="text-sm font-medium text-white/40 mb-4">How to enable:</p>
                    <ol className="space-y-3">
                        {instructions.map((instruction, index) => (
                            <li key={index} className="flex gap-4 text-sm text-white/70">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                </span>
                                <span>{instruction}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="flex gap-3">
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={onRetry}
                        className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                    >
                        <ArrowClockwise weight="bold" className="w-5 h-5" />
                        Try Again
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default PermissionError;
