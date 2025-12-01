import React, { useState, useEffect } from 'react';
import { useAuction } from '../context/AuctionContext';
import PlayerCard from './PlayerCard';
import BidHistory from './BidHistory';
import MyTeamStats from './MyTeamStats';
import PlayerPool from './PlayerPool';

const AuctionPanel: React.FC = () => {
    const { state, dispatch, socket } = useAuction();
    const { currentPlayer, currentBid, currentBidder, isTimerRunning, timerSeconds, bidHistory, teams, config } = state;

    // Use userTeamId from state if available, otherwise fallback to first team (or handle error)
    const [myTeamId, setMyTeamId] = useState<string>('');
    const [autoBidLimit, setAutoBidLimit] = useState<number>(0);
    const [isAutoBidEnabled, setIsAutoBidEnabled] = useState(false);
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const [isPoolOpen, setIsPoolOpen] = useState(false);

    useEffect(() => {
        if (state.userTeamId) {
            setMyTeamId(state.userTeamId);
        } else if (teams.length > 0 && !myTeamId) {
            setMyTeamId(teams[0].id);
        }
    }, [teams, myTeamId, state.userTeamId]);

    const myTeam = teams.find((t: any) => t.id === myTeamId);

    const handleSwitchTeam = (teamId: string) => {
        dispatch({ type: 'SET_USER_TEAM', payload: teamId });
        setMyTeamId(teamId);
        setIsSwitchModalOpen(false);
    };

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
            <div className="flex-col gap-4">
                {myTeam && (
                    <MyTeamStats
                        team={myTeam}
                        config={config}
                        onSwitchTeam={() => setIsSwitchModalOpen(true)}
                    />
                )}

                <div className="card text-center" style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="badge mb-4" style={{ fontSize: 'var(--font-size-sm)' }}>
                        UP NEXT
                    </div>
                    <h2 className="text-2xl mb-2" style={{ color: 'var(--color-primary)' }}>{state.currentSet}</h2>
                    <p className="text-muted mb-4">
                        {state.players.filter(p => p.set === state.currentSet && !state.soldPlayers.find(sp => sp.id === p.id) && !state.unsoldPlayers.find(up => up.id === p.id)).length} players remaining in this set.
                    </p>
                    <div className="flex gap-4">
                        {(!state.roomId || state.isHost) && (
                            <button
                                className="primary"
                                onClick={() => dispatch({ type: 'NEXT_PLAYER' })}
                            >
                                Bring Next Player
                            </button>
                        )}
                        <button onClick={() => setIsPoolOpen(true)}>
                            View Player Pool
                        </button>
                    </div>
                    {state.roomId && !state.isHost && (
                        <p className="text-sm text-muted mt-2">Waiting for host to bring next player...</p>
                    )}
                </div>

                {/* Switch Team Modal */}
                {isSwitchModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-scale-in">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg">Select Your Team</h3>
                                <button onClick={() => setIsSwitchModalOpen(false)} className="text-2xl leading-none">&times;</button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[60vh]">
                                {teams.map(team => (
                                    <div
                                        key={team.id}
                                        className={`flex items-center gap-3 p-3 rounded cursor-pointer mb-2 border ${myTeamId === team.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                        onClick={() => handleSwitchTeam(team.id)}
                                    >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: team.color }}></div>
                                        <div className="flex-1">
                                            <div className="font-bold">{team.name}</div>
                                            <div className="text-xs text-muted">Purse: {formatMoney(team.budget)}</div>
                                        </div>
                                        {myTeamId === team.id && <span className="text-blue-600 font-bold">✓</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Player Pool Modal */}
                {isPoolOpen && (
                    <PlayerPool
                        players={state.players}
                        soldPlayers={state.soldPlayers}
                        unsoldPlayers={state.unsoldPlayers}
                        setsOrder={state.setsOrder}
                        currentSet={state.currentSet}
                        onClose={() => setIsPoolOpen(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex-col gap-4">
            {myTeam && (
                <MyTeamStats
                    team={myTeam}
                    config={config}
                    onSwitchTeam={() => setIsSwitchModalOpen(true)}
                />
            )}

            {/* Timer & Status */}
            <div className="timer-display">
                <div className="text-xl font-bold">
                    {isTimerRunning ? `00:${timerSeconds.toString().padStart(2, '0')}` : 'PAUSED'}
                </div>
                <div className="text-sm">
                    Current Bid: <span className="text-primary font-bold text-lg" style={{ marginLeft: '8px' }}>{formatMoney(currentBid)}</span>
                </div>
                <button
                    className="text-xs ml-auto px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                    onClick={() => setIsPoolOpen(true)}
                >
                    View Pool
                </button>
            </div>

            {/* Main Player Card */}
            <PlayerCard player={currentPlayer} />

            {/* Bidding Controls */}
            <div className="card">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                        className="primary"
                        style={{ padding: '20px', fontSize: '1.2rem' }}
                        onClick={() => handleBid(nextBidAmount)}
                        disabled={!canAfford || currentBidder === myTeamId}
                    >
                        BID {formatMoney(nextBidAmount)}
                    </button>
                    <div className="flex-col gap-2">
                        <button
                            onClick={() => handleBid(currentBid + 5000000)} // Jump +50L
                            disabled={!canAfford}
                        >
                            +50L Jump
                        </button>
                        <button
                            onClick={() => handleBid(currentBid + 10000000)} // Jump +1Cr
                            disabled={!canAfford}
                        >
                            +1Cr Jump
                        </button>
                    </div>
                </div>

                {/* Auto Bid Toggle */}
                <div className="flex items-center gap-2 mb-4 p-2" style={{ background: 'var(--color-bg)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)' }}>
                    <input
                        type="checkbox"
                        checked={isAutoBidEnabled}
                        onChange={(e) => setIsAutoBidEnabled(e.target.checked)}
                        id="auto-bid"
                        style={{ width: 'auto' }}
                    />
                    <label htmlFor="auto-bid" className="text-sm font-bold" style={{ flex: 1, cursor: 'pointer' }}>Auto-Bid</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            style={{ width: '80px', padding: '4px' }}
                            placeholder="Limit"
                            value={autoBidLimit ? autoBidLimit / 10000000 : ''}
                            onChange={(e) => setAutoBidLimit(parseFloat(e.target.value) * 10000000)}
                            disabled={!isAutoBidEnabled}
                        />
                        <span className="text-xs text-muted">Cr</span>
                    </div>
                </div>

                {/* Auctioneer Controls - Only Host in Multiplayer */}
                {(!state.roomId || state.isHost) && (
                    <div className="mt-2" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                        <div className="text-xs text-center text-muted mb-2 uppercase" style={{ letterSpacing: '1px' }}>Auctioneer Controls</div>
                        <div className="flex gap-2">
                            <button
                                style={{ flex: 1, borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                                onClick={handleUnsold}
                            >
                                UNSOLD
                            </button>
                            <button
                                style={{ flex: 1, borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
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

            {/* Switch Team Modal (Duplicate for when player is active) */}
            {isSwitchModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-scale-in">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">Select Your Team</h3>
                            <button onClick={() => setIsSwitchModalOpen(false)} className="text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {teams.map(team => (
                                <div
                                    key={team.id}
                                    className={`flex items-center gap-3 p-3 rounded cursor-pointer mb-2 border ${myTeamId === team.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                    onClick={() => handleSwitchTeam(team.id)}
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: team.color }}></div>
                                    <div className="flex-1">
                                        <div className="font-bold">{team.name}</div>
                                        <div className="text-xs text-muted">Purse: {formatMoney(team.budget)}</div>
                                    </div>
                                    {myTeamId === team.id && <span className="text-blue-600 font-bold">✓</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Player Pool Modal (Duplicate for when player is active) */}
            {isPoolOpen && (
                <PlayerPool
                    players={state.players}
                    soldPlayers={state.soldPlayers}
                    unsoldPlayers={state.unsoldPlayers}
                    setsOrder={state.setsOrder}
                    currentSet={state.currentSet}
                    onClose={() => setIsPoolOpen(false)}
                />
            )}
        </div>
    );
};

export default AuctionPanel;
