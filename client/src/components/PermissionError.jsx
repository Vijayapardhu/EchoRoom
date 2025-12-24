import React from 'react';
import { AlertCircle, Camera, Mic, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

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

    const Icon = type === 'camera' ? Camera : Mic;
    const instructions = getInstructions();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
        >
            <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-500/20 rounded-full">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Permission Required</h2>
                </div>

                <div className="flex items-center gap-3 mb-4 p-3 bg-red-500/10 rounded-xl">
                    <Icon className="w-5 h-5 text-red-400" />
                    <p className="text-red-200 text-sm">
                        EchoRoom needs access to your {type} to connect with others.
                    </p>
                </div>

                <div className="mb-6">
                    <p className="text-sm font-medium text-neutral-400 mb-3">How to enable:</p>
                    <ol className="space-y-2">
                        {instructions.map((instruction, index) => (
                            <li key={index} className="flex gap-3 text-sm text-neutral-300">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
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
                            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={onRetry}
                        className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 rounded-xl text-black font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default PermissionError;
