import React, { useState } from 'react';
import { X, Flag, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const ReportModal = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('Harassment');
    const [details, setDetails] = useState('');

    const handleSubmit = () => {
        onSubmit({ reason, details });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="glass-panel w-full max-w-md rounded-3xl p-6 relative z-10 border border-white/10 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-xl text-red-500">
                                    <Flag className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Report User</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Reason</label>
                                <div className="relative">
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-white focus:ring-2 focus:ring-red-500/50 outline-none appearance-none cursor-pointer"
                                    >
                                        <option>Harassment</option>
                                        <option>Inappropriate Content</option>
                                        <option>Spam / Bot</option>
                                        <option>Underage</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Details (Optional)</label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-white focus:ring-2 focus:ring-red-500/50 outline-none h-32 resize-none placeholder-slate-500"
                                    placeholder="Please describe what happened..."
                                />
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-yellow-200/80">
                                    False reports may lead to a decrease in your own trust score.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl font-semibold text-white shadow-lg shadow-red-500/25 transition-all"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReportModal;
