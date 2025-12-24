import { useEffect } from 'react';

export const useKeyboardShortcuts = (handlers) => {
    useEffect(() => {
        const handleKeyPress = (event) => {
            // Don't trigger if user is typing in an input
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            const key = event.key.toLowerCase();

            switch (key) {
                case 'm':
                    handlers.onMute?.();
                    break;
                case 'v':
                    handlers.onVideo?.();
                    break;
                case 'n':
                    handlers.onNext?.();
                    break;
                case 'escape':
                    handlers.onEscape?.();
                    break;
                case 'f':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        handlers.onFullscreen?.();
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [handlers]);
};
