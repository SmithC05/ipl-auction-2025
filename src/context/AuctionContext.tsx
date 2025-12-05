import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuctionState, Player, Team, Bid, AuctionSet, AuctionConfig } from '../types';
import { DEFAULT_CONFIG } from '../types';
import { saveToStorage } from '../utils/dataUtils';
import { io, Socket } from 'socket.io-client';

const INITIAL_SETS_ORDER: AuctionSet[] = [];

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
    currentSet: '',
    setsOrder: INITIAL_SETS_ORDER,
    userTeamId: null,
    roomId: null,
    isHost: false,
    config: DEFAULT_CONFIG,
    // New field for server sync
    auctionEndTime: null,
    serverTimeOffset: 0
};

type Action =
    | { type: 'INIT_AUCTION'; payload: { players: Player[]; teams: Team[]; userTeamId?: string; username?: string; roomId?: string; isHost?: boolean; config?: AuctionConfig } }
    | { type: 'START_TIMER'; payload: { duration: number; endTime?: number } }
    | { type: 'TICK_TIMER'; payload?: number }
    | { type: 'STOP_TIMER' }
    | { type: 'PLACE_BID'; payload: { teamId: string; amount: number; endTime?: number } }
    | { type: 'SELL_PLAYER'; payload: { player: Player; teamId: string; amount: number } }
    | { type: 'UNSOLD_PLAYER'; payload: Player }
    | { type: 'NEXT_PLAYER' }
    | { type: 'LOAD_STATE'; payload: AuctionState & { endTime?: number; serverTime?: number } }
    | { type: 'CHANGE_SET'; payload: AuctionSet }
    | { type: 'JOIN_ROOM'; payload: { roomId: string; isHost: boolean; username: string; userTeamId?: string } }
    | { type: 'SET_USER_TEAM'; payload: string }
    | { type: 'SET_OFFSET'; payload: number };

const auctionReducer = (state: any, action: Action): AuctionState => {
    switch (action.type) {
        case 'INIT_AUCTION':
            const uniqueSets = Array.from(new Set(action.payload.players.map(p => p.set)));
            return {
                ...state,
                teams: action.payload.teams,
                players: action.payload.players,
                unsoldPlayers: [],
                soldPlayers: [],
                auctionStatus: 'IDLE',
                currentSet: uniqueSets[0] || '',
                setsOrder: uniqueSets,
                userTeamId: action.payload.userTeamId || null,
                username: action.payload.username || state.username || null,
                roomId: action.payload.roomId || state.roomId || null,
                isHost: action.payload.isHost !== undefined ? action.payload.isHost : (state.isHost || false),
                config: action.payload.config || state.config,
                auctionEndTime: null,
                serverTimeOffset: 0
            };
        case 'SET_USER_TEAM':
            return { ...state, userTeamId: action.payload };
        case 'START_TIMER':
            return {
                ...state,
                isTimerRunning: true,
                timerSeconds: action.payload.duration,
                auctionEndTime: action.payload.endTime || (Date.now() + action.payload.duration * 1000)
            };
        case 'TICK_TIMER':
            // Client-side visual tick only, using server offset
            const now = Date.now() + (state.serverTimeOffset || 0);
            const timeLeft = state.auctionEndTime ? Math.max(0, Math.ceil((state.auctionEndTime - now) / 1000)) : 0;
            return { ...state, timerSeconds: timeLeft };
        case 'STOP_TIMER':
            return { ...state, isTimerRunning: false, auctionEndTime: null };
        case 'PLACE_BID':
            // Validation: Ignore if bid is not higher than current
            if (action.payload.amount <= state.currentBid) {
                return state;
            }
            const newHistory: Bid = {
                teamId: action.payload.teamId,
                amount: action.payload.amount,
                timestamp: Date.now(),
            };

            // If server sent an updated endTime (timer extension), use it
            const newEndTime = action.payload.endTime || state.auctionEndTime;

            return {
                ...state,
                currentBid: action.payload.amount,
                currentBidder: action.payload.teamId,
                bidHistory: [newHistory, ...state.bidHistory].slice(0, 10),
                isTimerRunning: true,
                auctionEndTime: newEndTime,
            };
        case 'SELL_PLAYER':
            const soldPlayer = { ...action.payload.player };
            const updatedTeams = state.teams.map((team: any) => {
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
                auctionEndTime: null
            };
        case 'UNSOLD_PLAYER':
            return {
                ...state,
                unsoldPlayers: [...state.unsoldPlayers, action.payload],
                currentPlayer: null,
                currentBid: 0,
                currentBidder: null,
                isTimerRunning: false,
                auctionEndTime: null
            };
        case 'NEXT_PLAYER':
            // Filter players by current set
            let availablePlayersInSet = state.players.filter((p: any) =>
                p.set === state.currentSet &&
                !state.soldPlayers.find((sp: any) => sp.id === p.id) &&
                !state.unsoldPlayers.find((up: any) => up.id === p.id) &&
                (state.currentPlayer ? p.id !== state.currentPlayer.id : true)
            );

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

            const randomIndex = Math.floor(Math.random() * availablePlayersInSet.length);
            const nextPlayer = availablePlayersInSet[randomIndex];
            return {
                ...state,
                currentPlayer: nextPlayer,
                currentBid: nextPlayer.basePrice,
                currentBidder: null,
                timerSeconds: state.config.timerDuration,
                isTimerRunning: false,
                auctionStatus: 'ACTIVE',
                bidHistory: [],
                auctionEndTime: null
            };

        case 'CHANGE_SET':
            return { ...state, currentSet: action.payload };
        case 'LOAD_STATE':
            // Calculate offset if serverTime is provided
            let newOffset = state.serverTimeOffset;
            if (action.payload.serverTime) {
                // Offset = serverTime - clientTime
                newOffset = action.payload.serverTime - Date.now();
            }

            return {
                ...action.payload,
                // Ensure we preserve local session details if not in payload
                roomId: state.roomId,
                isHost: state.isHost,
                userTeamId: state.userTeamId,
                username: state.username,
                // Handle endTime from server
                auctionEndTime: action.payload.endTime || state.auctionEndTime,
                serverTimeOffset: newOffset
            };

        case 'JOIN_ROOM':
            return {
                ...state,
                roomId: action.payload.roomId,
                isHost: action.payload.isHost,
                username: action.payload.username,
                userTeamId: action.payload.userTeamId || state.userTeamId
            };
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
    const isRemoteUpdate = React.useRef(false);

    // Initialize Socket
    useEffect(() => {
        let socketUrl = window.location.origin;
        if (!import.meta.env.PROD) {
            socketUrl = 'http://localhost:3001';
        }

        console.log('Connecting to Socket URL:', socketUrl);
        const newSocket = io(socketUrl);
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

        socket.on('state_update', (newState: any) => {
            // Prevent echo loop: Mark this update as remote so we don't broadcast it back
            isRemoteUpdate.current = true;
            dispatch({ type: 'LOAD_STATE', payload: newState });
        });

        socket.on('new_bid', (payload: any) => {
            let teamId, amount;
            if (Array.isArray(payload)) {
                [teamId, amount] = payload;
            } else {
                teamId = payload.teamId;
                amount = payload.amount;
            }
            dispatch({ type: 'PLACE_BID', payload: { teamId, amount } });
        });

        socket.on('timer_started', ({ endTime, duration }) => {
            dispatch({ type: 'START_TIMER', payload: { duration, endTime } });
        });

        socket.on('player_sold', (payload) => {
            dispatch({ type: 'SELL_PLAYER', payload });
        });

        socket.on('player_unsold', (payload) => {
            dispatch({ type: 'UNSOLD_PLAYER', payload: payload.player });
        });

        socket.on('error', (msg) => {
            console.error("Socket Error:", msg);
            alert(`Action Failed: ${msg}`);
        });

        return () => {
            socket.off('state_update');
            socket.off('new_bid');
            socket.off('timer_started');
            socket.off('player_sold');
            socket.off('player_unsold');
            socket.off('error');
        };
    }, [socket]);

    // Host: Broadcast State Changes
    useEffect(() => {
        if (state.isHost && state.roomId && socket) {
            // If this change came from the server, don't echo it back
            if (isRemoteUpdate.current) {
                isRemoteUpdate.current = false;
                return;
            }
            socket.emit('send_state_update', { roomId: state.roomId, state });
        }
    }, [state.players, state.teams, state.currentPlayer, state.auctionStatus, state.currentSet, socket]);

    // Local Storage Persistence
    useEffect(() => {
        if (!state.roomId || state.isHost) {
            saveToStorage('ipl_auction_state', state);
        }
    }, [state]);

    // Timer Logic - Client Side Visual Only
    useEffect(() => {
        let interval: any;
        if (state.isTimerRunning && state.auctionEndTime) {
            interval = setInterval(() => {
                dispatch({ type: 'TICK_TIMER' });
            }, 500);
        }
        return () => clearInterval(interval);
    }, [state.isTimerRunning, state.auctionEndTime]);

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
