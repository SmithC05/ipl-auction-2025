import React, { useState, useEffect } from 'react';
import { useAuction } from '../context/AuctionContext';
import PlayerCard from './PlayerCard';
import BidHistory from './BidHistory';

const AuctionPanel: React.FC = () => {
    const { state, dispatch, socket } = useAuction();
    const { currentPlayer, currentBid, currentBidder, isTimerRunning, timerSeconds, bidHistory, teams } = state;

    // Use userTeamId from state if available, otherwise fallback to first team (or handle error)
    const [myTeamId, setMyTeamId] = useState<string>('');
    const [autoBidLimit, setAutoBidLimit] = useState<number>(0);
    const [isAutoBidEnabled, setIsAutoBidEnabled] = useState(false);

    useEffect(() => {
        if (state.userTeamId) {
            setMyTeamId(state.userTeamId);
        } else if (teams.length > 0 && !myTeamId) {
            setMyTeamId(teams[0].id);
        }
    }, [teams, myTeamId, state.userTeamId]);

    const myTeam = teams.find((t: any) => t.id === myTeamId);

    const calculateNextBid = (current: number) => {
        // Increment logic:
        // < 1Cr: +5L, 1Cr-2Cr: +10L, 2Cr-5Cr: +20L, >5Cr: +25L
        if (current < 10000000) return current + 500000; // +5L
        if (current < 20000000) return current + 1000000; // +10L
        if (current < 50000000) return current + 2000000; // +20L
        return current + 2500000; // +25L
    };

    const nextBidAmount = calculateNextBid(currentBid);
    const canAfford = myTeam ? myTeam.budget >= nextBidAmount : false;

    const handleBid = (amount: number) => {
        if (myTeam && myTeam.budget >= amount) {
            // If in multiplayer mode, emit bid to socket
            if (state.roomId && socket) {
                socket.emit('place_bid', { roomId: state.roomId, bid: { teamId: myTeam.id, amount } });
            }
            dispatch({ type: 'PLACE_BID', payload: { teamId: myTeam.id, amount } });
        }
    };

    // Auto-bid logic
    useEffect(() => {
        if (isAutoBidEnabled && isTimerRunning && currentPlayer && myTeam) {
            // If current bid is not mine, and current bid < limit, place bid
            if (currentBidder !== myTeamId && currentBid < autoBidLimit && myTeam.budget >= currentBid + 200000) {
                // Add a small delay for realism
                const timeout = setTimeout(() => {
                    handleBid(calculateNextBid(currentBid));
                }, 1000);
                return () => clearTimeout(timeout);
            }
        }
    }, [currentBid, currentBidder, isTimerRunning, isAutoBidEnabled, autoBidLimit, currentPlayer, myTeam]);

    const handleSold = () => {
        if (currentBidder) {
            dispatch({ type: 'SELL_PLAYER', payload: { player: currentPlayer!, teamId: currentBidder, amount: currentBid } });
        }
    };

    const handleUnsold = () => {
        if (currentPlayer) {
            dispatch({ type: 'UNSOLD_PLAYER', payload: currentPlayer });
        }
    };

    const formatMoney = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        return `₹${(amount / 100000).toFixed(2)} L`;
    };

    if (!currentPlayer) {
        return (
            <div className="card text-center p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="bg-gray-100 rounded-full px-4 py-1 text-sm font-bold text-gray-600 mb-4">
                    UP NEXT
                </div>
                <h2 className="text-3xl font-black mb-2">{state.currentSet}</h2>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                    {state.players.filter(p => p.set === state.currentSet && !state.soldPlayers.find(sp => sp.id === p.id) && !state.unsoldPlayers.find(up => up.id === p.id)).length} players remaining in this set.
                </p>
                {(!state.roomId || state.isHost) && (
                    <button
                        className="primary text-lg px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                        onClick={() => dispatch({ type: 'NEXT_PLAYER' })}
                    >
                        Bring Next Player
                    </button>
                )}
                {state.roomId && !state.isHost && (
                    <p className="text-sm text-gray-400">Waiting for host to bring next player...</p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Timer & Status */}
            <div className="flex justify-between items-center bg-black text-white p-3 rounded-lg shadow-md">
                <div className="font-bold text-xl">
                    {isTimerRunning ? `00:${timerSeconds.toString().padStart(2, '0')}` : 'PAUSED'}
                </div>
                <div className="text-sm">
                    Current Bid: <span className="text-yellow-400 font-bold text-lg">{formatMoney(currentBid)}</span>
                </div>
            </div>

            {/* Main Player Card */}
            <PlayerCard player={currentPlayer} />

            {/* Bidding Controls */}
            <div className="card bg-gray-50 border border-gray-200">
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                        className="primary py-4 text-lg font-bold shadow-md active:scale-95 transition-transform"
                        onClick={() => handleBid(nextBidAmount)}
                        disabled={!canAfford || currentBidder === myTeamId}
                    >
                        BID {formatMoney(nextBidAmount)}
                    </button>
                    <div className="flex flex-col gap-2">
                        <button
                            className="bg-white text-xs font-bold border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100"
                            onClick={() => handleBid(currentBid + 5000000)} // Jump +50L
                            disabled={!canAfford}
                        >
                            +50L Jump
                        </button>
                        <button
                            className="bg-white text-xs font-bold border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100"
                            onClick={() => handleBid(currentBid + 10000000)} // Jump +1Cr
                            disabled={!canAfford}
                        >
                            +1Cr Jump
                        </button>
                    </div>
                </div>

                {/* Auto Bid Toggle */}
                <div className="flex items-center gap-2 mb-4 p-2 border border-gray-200 rounded bg-white shadow-sm">
                    <input
                        type="checkbox"
                        checked={isAutoBidEnabled}
                        onChange={(e) => setIsAutoBidEnabled(e.target.checked)}
                        id="auto-bid"
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="auto-bid" className="text-sm font-bold flex-1 cursor-pointer">Auto-Bid</label>
                    <input
                        type="number"
                        className="w-24 text-sm border border-gray-300 rounded px-2 py-1"
                        placeholder="Limit (Cr)"
                        value={autoBidLimit ? autoBidLimit / 10000000 : ''}
                        onChange={(e) => setAutoBidLimit(parseFloat(e.target.value) * 10000000)}
                        disabled={!isAutoBidEnabled}
                    />
                    <span className="text-xs text-gray-500">Cr</span>
                </div>

                {/* Auctioneer Controls - Only Host in Multiplayer */}
                {(!state.roomId || state.isHost) && (
                    <div className="border-t border-gray-200 pt-3 mt-2">
                        <div className="text-xs text-center text-gray-400 mb-2 uppercase tracking-wide">Auctioneer Controls</div>
                        <div className="flex gap-2">
                            <button
                                className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-bold py-2 rounded"
                                onClick={handleUnsold}
                            >
                                UNSOLD
                            </button>
                            <button
                                className="flex-1 bg-green-50 text-green-600 border-green-200 hover:bg-green-100 font-bold py-2 rounded"
                                onClick={handleSold}
                                disabled={!currentBidder}
                            >
                                SOLD
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <BidHistory history={bidHistory} />
        </div>
    );
};

export default AuctionPanel;
