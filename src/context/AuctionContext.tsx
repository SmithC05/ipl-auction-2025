import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuctionState, Player, Team, Bid, AuctionSet } from '../types';
import { saveToStorage } from '../utils/dataUtils';
import { io, Socket } from 'socket.io-client';

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
    userTeamId: null,
    roomId: null,
    isHost: false,
};

type Action =
    | { type: 'INIT_AUCTION'; payload: { players: Player[]; teams: Team[]; userTeamId?: string; username?: string } }
    | { type: 'START_TIMER'; payload: number }
    | { type: 'TICK_TIMER' }
    | { type: 'STOP_TIMER' }
    | { type: 'PLACE_BID'; payload: { teamId: string; amount: number } }
    | { type: 'SELL_PLAYER'; payload: { player: Player; teamId: string; amount: number } }
    | { type: 'UNSOLD_PLAYER'; payload: Player }
    | { type: 'NEXT_PLAYER' }
    | { type: 'LOAD_STATE'; payload: AuctionState }
    | { type: 'CHANGE_SET'; payload: AuctionSet }
    | { type: 'JOIN_ROOM'; payload: { roomId: string; isHost: boolean; username: string } };

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
                userTeamId: action.payload.userTeamId || null,
                username: action.payload.username || null,
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
                    return {
                        ...state,
                        currentSet: nextSet,
                        currentPlayer: null,
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
            return { ...action.payload, roomId: state.roomId, isHost: state.isHost, userTeamId: state.userTeamId, username: state.username }; // Keep local connection state
        case 'JOIN_ROOM':
            return { ...state, roomId: action.payload.roomId, isHost: action.payload.isHost, username: action.payload.username };
        default:
            return state;
    }
};

const AuctionContext = createContext<{
    state: AuctionState;
    dispatch: React.Dispatch<Action>;
    socket: Socket | null;
} | null>(null);

export const AuctionProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(auctionReducer, INITIAL_STATE);
    const [socket, setSocket] = useState<Socket | null>(null);

    // Initialize Socket
    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
        });

        return () => {
            newSocket.close();
        };
    }, []);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('state_update', (newState: AuctionState) => {
            // Only update if we are NOT the host (Host is the source of truth)
            if (!state.isHost) {
                dispatch({ type: 'LOAD_STATE', payload: newState });
            }
        });

        socket.on('new_bid', (bid: { teamId: string; amount: number }) => {
            // If we are host, we receive bid and update state.
            // If we are client, we also update state to show immediate feedback?
            // Actually, if we are client, we wait for state_update from host for consistency?
            // But for responsiveness, let's update.
            // However, if Host processes it differently, we might desync.
            // For now, let's trust the bid event.
            if (state.currentBid < bid.amount) {
                dispatch({ type: 'PLACE_BID', payload: bid });
            }
        });

        return () => {
            socket.off('state_update');
            socket.off('new_bid');
        };
    }, [socket, state.isHost, state.currentBid]);

    // Host: Broadcast State Changes
    useEffect(() => {
        if (state.isHost && state.roomId && socket) {
            // Debounce or throttle could be good, but for now direct emit
            socket.emit('send_state_update', { roomId: state.roomId, state });
        }
    }, [state, socket]); // This triggers on every state change

    // Local Storage Persistence (only if not in multiplayer or if host?)
    useEffect(() => {
        if (!state.roomId || state.isHost) {
            saveToStorage('ipl_auction_state', state);
        }
    }, [state]);

    // Timer Logic (Only Host runs the timer)
    useEffect(() => {
        let interval: any;
        if (state.isHost && state.isTimerRunning && state.timerSeconds > 0) {
            interval = setInterval(() => {
                dispatch({ type: 'TICK_TIMER' });
            }, 1000);
        } else if (state.isHost && state.timerSeconds === 0 && state.isTimerRunning) {
            dispatch({ type: 'STOP_TIMER' });
        }
        return () => clearInterval(interval);
    }, [state.isTimerRunning, state.timerSeconds, state.isHost]);

    return (
        <AuctionContext.Provider value={{ state, dispatch, socket }}>
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
