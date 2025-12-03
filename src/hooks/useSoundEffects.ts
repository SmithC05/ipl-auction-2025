import { useEffect, useRef } from 'react';
import type { AuctionState } from '../types';
import { playBidSound, playSoldSound, playTickSound, playUnsoldSound } from '../utils/soundUtils';

export const useSoundEffects = (state: AuctionState) => {
    const prevBidCount = useRef(state.bidHistory.length);
    const prevSoldCount = useRef(state.soldPlayers.length);
    const prevUnsoldCount = useRef(state.unsoldPlayers.length);
    const prevTimer = useRef(state.timerSeconds);

    useEffect(() => {
        // Bid Sound
        if (state.bidHistory.length > prevBidCount.current) {
            playBidSound();
        }
        prevBidCount.current = state.bidHistory.length;

        // Sold Sound
        if (state.soldPlayers.length > prevSoldCount.current) {
            playSoldSound();
        }
        prevSoldCount.current = state.soldPlayers.length;

        // Unsold Sound
        if (state.unsoldPlayers.length > prevUnsoldCount.current) {
            playUnsoldSound();
        }
        prevUnsoldCount.current = state.unsoldPlayers.length;

        // Timer Tick (Last 5 seconds)
        if (state.isTimerRunning && state.timerSeconds <= 5 && state.timerSeconds > 0 && state.timerSeconds !== prevTimer.current) {
            playTickSound();
        }
        prevTimer.current = state.timerSeconds;

    }, [state.bidHistory, state.soldPlayers, state.unsoldPlayers, state.timerSeconds, state.isTimerRunning]);
};
