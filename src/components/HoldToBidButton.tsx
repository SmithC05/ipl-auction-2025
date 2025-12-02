import React, { useState, useRef, useEffect } from 'react';
import { useHaptic } from '../hooks/useHaptic';

interface HoldToBidButtonProps {
    amount: number;
    label: string;
    disabled: boolean;
    onBid: (amount: number) => void;
}

const HoldToBidButton: React.FC<HoldToBidButtonProps> = ({ amount, label, disabled, onBid }) => {
    const [isHolding, setIsHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startTimeRef = useRef<number>(0);
    const { trigger } = useHaptic();

    const HOLD_DURATION = 300; // 0.3s (Reduced for better UX)

    const startHold = (e: React.PointerEvent) => {
        if (disabled) return;
        e.preventDefault(); // Prevent context menu
        setIsHolding(true);
        startTimeRef.current = Date.now();
        trigger('light');
        console.log('Started holding bid button');

        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const p = Math.min((elapsed / HOLD_DURATION) * 100, 100);
            setProgress(p);

            if (elapsed >= HOLD_DURATION) {
                completeBid();
            }
        }, 16); // ~60fps
    };

    const endHold = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsHolding(false);
        setProgress(0);
    };

    const completeBid = () => {
        endHold();
        trigger('medium');
        console.log('Bid hold completed, triggering onBid');
        onBid(amount);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <button
            className={`relative overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : ''} primary`}
            style={{ padding: '16px', fontSize: '1.1rem', touchAction: 'none', userSelect: 'none' }}
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            disabled={disabled}
        >
            {/* Background Progress */}
            <div
                className="absolute inset-0 bg-black bg-opacity-20 transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
            />

            <span className="relative z-10">{label}</span>
            {isHolding && <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse" />}
        </button>
    );
};

export default HoldToBidButton;
