import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useHaptic = () => {
    const trigger = useCallback((type: HapticType = 'medium') => {
        if (!navigator.vibrate) return;

        switch (type) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(40);
                break;
            case 'heavy':
                navigator.vibrate(100);
                break;
            case 'success':
                navigator.vibrate([50, 30, 50]);
                break;
            case 'warning':
                navigator.vibrate([30, 50, 30]);
                break;
            case 'error':
                navigator.vibrate([50, 100, 50, 100]);
                break;
            default:
                navigator.vibrate(40);
        }
    }, []);

    return { trigger };
};
