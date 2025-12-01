import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuctionState, Player, Team, Bid, AuctionSet } from '../types';
import { saveToStorage, loadFromStorage } from '../utils/dataUtils';

const INITIAL_SETS_ORDER: AuctionSet[] = [
    'Marquee',
    'Batters 1', 'All-Rounders 1', 'Wicketkeepers 1', 'Bowlers 1',
    'Batters 2', 'All-Rounders 2', 'Wicketkeepers 2', 'Bowlers 2',
    'Uncapped Batters', 'Uncapped AR', 'Uncapped WK', 'Uncapped Bowlers',
    'Batters 3', 'All-Rounders 3', 'Bowlers 3'
];

const INITIAL_STATE: AuctionState = {
    teams: [],
    players: [],
    unsoldPlayers: [],
    soldPlayers: [],
    currentPlayer: null,
    currentBid: 0,
    currentBidder: null,
    bidHistory: [],
    isTimerRunning: false,
    timerSeconds: 0,
    auctionStatus: 'IDLE',
    currentSet: 'Marquee',
    setsOrder: INITIAL_SETS_ORDER,
};

type Action =
    | { type: 'INIT_AUCTION'; payload: { players: Player[]; teams: Team[] } }
    | { type: 'START_TIMER'; payload: number }
    | { type: 'TICK_TIMER' }
    | { type: 'STOP_TIMER' }
    | { type: 'PLACE_BID'; payload: { teamId: string; amount: number } }
    | { type: 'SELL_PLAYER'; payload: { player: Player; teamId: string; amount: number } }
    | { type: 'UNSOLD_PLAYER'; payload: Player }
    | { type: 'NEXT_PLAYER' }
    | { type: 'LOAD_STATE'; payload: AuctionState }
    | { type: 'CHANGE_SET'; payload: AuctionSet };

const auctionReducer = (state: AuctionState, action: Action): AuctionState => {
    switch (action.type) {
        case 'INIT_AUCTION':
            return {
                ...state,
                teams: action.payload.teams,
                players: action.payload.players,
                unsoldPlayers: [],
                soldPlayers: [],
                auctionStatus: 'IDLE',
                currentSet: 'Marquee',
            };
        case 'START_TIMER':
            return { ...state, isTimerRunning: true, timerSeconds: action.payload };
        case 'TICK_TIMER':
            return { ...state, timerSeconds: Math.max(0, state.timerSeconds - 1) };
        case 'STOP_TIMER':
            return { ...state, isTimerRunning: false };
        case 'PLACE_BID':
            const newHistory: Bid = {
                teamId: action.payload.teamId,
                amount: action.payload.amount,
                timestamp: Date.now(),
            };
            return {
                ...state,
                currentBid: action.payload.amount,
                currentBidder: action.payload.teamId,
                bidHistory: [newHistory, ...state.bidHistory].slice(0, 10),
                timerSeconds: 10, // Reset timer on bid
            };
        case 'SELL_PLAYER':
            const soldPlayer = { ...action.payload.player };
            const updatedTeams = state.teams.map(team => {
                if (team.id === action.payload.teamId) {
                    return {
                        ...team,
                        budget: team.budget - action.payload.amount,
                        squad: [...team.squad, soldPlayer],
                        totalSpent: team.totalSpent + action.payload.amount,
                    };
                }
                return team;
            });
            return {
                ...state,
                teams: updatedTeams,
                soldPlayers: [...state.soldPlayers, soldPlayer],
                currentPlayer: null,
                currentBid: 0,
                currentBidder: null,
                isTimerRunning: false,
                auctionStatus: 'ACTIVE',
            };
        case 'UNSOLD_PLAYER':
            return {
                ...state,
                unsoldPlayers: [...state.unsoldPlayers, action.payload],
                currentPlayer: null,
                currentBid: 0,
                currentBidder: null,
                isTimerRunning: false,
            };
        case 'NEXT_PLAYER':
            // Filter players by current set
            let availablePlayersInSet = state.players.filter(p =>
                p.set === state.currentSet &&
                !state.soldPlayers.find(sp => sp.id === p.id) &&
                !state.unsoldPlayers.find(up => up.id === p.id) &&
                (state.currentPlayer ? p.id !== state.currentPlayer.id : true)
            );

            // If no players left in current set, move to next set
            if (availablePlayersInSet.length === 0) {
                const currentSetIndex = state.setsOrder.indexOf(state.currentSet);
                if (currentSetIndex < state.setsOrder.length - 1) {
                    const nextSet = state.setsOrder[currentSetIndex + 1];
                    // Recursive call effectively, but we can just return state update to change set
                    // And user has to click "Next Player" again, or we auto-advance.
                    // Let's auto-advance logic here:
                    return {
                        ...state,
                        currentSet: nextSet,
                        currentPlayer: null, // UI will show "Set Changed to X"
                        auctionStatus: 'ACTIVE'
                    };
                } else {
                    return { ...state, auctionStatus: 'COMPLETED', currentPlayer: null };
                }
            }

            const nextPlayer = availablePlayersInSet[0];
            return {
                ...state,
                currentPlayer: nextPlayer,
                currentBid: nextPlayer.basePrice,
                currentBidder: null,
                timerSeconds: 30,
                isTimerRunning: false,
                auctionStatus: 'ACTIVE',
            };
        case 'CHANGE_SET':
            return { ...state, currentSet: action.payload };
        case 'LOAD_STATE':
            return action.payload;
        default:
            return state;
    }
};

const AuctionContext = createContext<{
    state: AuctionState;
    dispatch: React.Dispatch<Action>;
} | null>(null);

export const AuctionProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(auctionReducer, INITIAL_STATE);

    useEffect(() => {
        const savedState = loadFromStorage<AuctionState>('ipl_auction_state');
        if (savedState) {
            dispatch({ type: 'LOAD_STATE', payload: savedState });
        }
    }, []);

    useEffect(() => {
        saveToStorage('ipl_auction_state', state);
    }, [state]);

    useEffect(() => {
        let interval: any;
        if (state.isTimerRunning && state.timerSeconds > 0) {
            interval = setInterval(() => {
                dispatch({ type: 'TICK_TIMER' });
            }, 1000);
        } else if (state.timerSeconds === 0 && state.isTimerRunning) {
            dispatch({ type: 'STOP_TIMER' });
        }
        return () => clearInterval(interval);
    }, [state.isTimerRunning, state.timerSeconds]);

    return (
        <AuctionContext.Provider value={{ state, dispatch }}>
            {children}
        </AuctionContext.Provider>
    );
};

export const useAuction = () => {
    const context = useContext(AuctionContext);
    if (!context) {
        throw new Error('useAuction must be used within an AuctionProvider');
    }
    return context;
};
