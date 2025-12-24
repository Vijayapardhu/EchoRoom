import { useState, useCallback } from 'react';

export const useRetry = (maxRetries = 3, initialDelay = 1000) => {
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const retry = useCallback(async (fn, onError) => {
        setIsRetrying(true);
        let lastError;

        for (let i = 0; i <= maxRetries; i++) {
            try {
                const result = await fn();
                setRetryCount(0);
                setIsRetrying(false);
                return result;
            } catch (error) {
                lastError = error;
                setRetryCount(i + 1);

                if (i < maxRetries) {
                    // Exponential backoff: 1s, 2s, 4s, 8s...
                    const delay = initialDelay * Math.pow(2, i);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    setIsRetrying(false);
                    if (onError) onError(error);
                    throw error;
                }
            }
        }

        throw lastError;
    }, [maxRetries, initialDelay]);

    const reset = useCallback(() => {
        setRetryCount(0);
        setIsRetrying(false);
    }, []);

    return { retry, retryCount, isRetrying, reset };
};
