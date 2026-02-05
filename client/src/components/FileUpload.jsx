import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    Image,
    X,
    Upload,
    File
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';

const FileUpload = ({ onFileSelect, accept = "image/*", children, maxSize = 5 * 1024 * 1024 }) => {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const validateFile = (file) => {
        if (file.size > maxSize) {
            toast.error(`File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
            return false;
        }
        
        if (accept.includes('image') && !file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return false;
        }
        
        return true;
    };

    const handleFile = (file) => {
        if (!file || !validateFile(file)) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }

        onFileSelect(file);
    };

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        handleFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const clearPreview = (e) => {
        e.stopPropagation();
        setPreview(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleChange}
                className="hidden"
            />
            
            {children ? (
                <div onClick={handleClick} className="cursor-pointer">
                    {children}
                </div>
            ) : (
                <motion.div
                    onClick={handleClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                        relative p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                        ${isDragging 
                            ? 'bg-blue-500/10 border-blue-500' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }
                    `}
                >
                    <AnimatePresence mode="wait">
                        {preview ? (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative"
                            >
                                <img 
                                    src={preview} 
                                    alt="Preview" 
                                    className="max-h-48 rounded-xl object-cover"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={clearPreview}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                                >
                                    <X weight="bold" className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                                    ${isDragging ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/50'}
                                `}>
                                    {accept.includes('image') ? (
                                        <Image weight="fill" className="w-6 h-6" />
                                    ) : (
                                        <Upload weight="fill" className="w-6 h-6" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-white/60">
                                        Drop file here or click to browse
                                    </p>
                                    <p className="text-xs text-white/40 mt-1">
                                        Max {(maxSize / 1024 / 1024).toFixed(0)}MB
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </>
    );
};

export default FileUpload;
