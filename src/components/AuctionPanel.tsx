import React, { useState, useEffect } from 'react';
import { useAuction } from '../context/AuctionContext';
import PlayerFlipCard from './PlayerFlipCard';
import TickerTape from './TickerTape';
import BidHistory from './BidHistory';
import MyTeamStats from './MyTeamStats';
import PlayerPool from './PlayerPool';
import HoldToBidButton from './HoldToBidButton';
import { useAudioStream } from '../hooks/useAudioStream';

const AuctionPanel: React.FC = () => {
    const { state, dispatch, socket } = useAuction();
    const { currentPlayer, currentBid, currentBidder, isTimerRunning, timerSeconds, bidHistory, teams, config } = state;

    const { isListening, isBroadcasting, startBroadcast, stopBroadcast, startListening, stopListening } = useAudioStream({
        socket,
        roomId: state.roomId || null,
        isHost: state.isHost || false
    });


    // Use userTeamId from state if available, otherwise fallback to first team (or handle error)
    const [myTeamId, setMyTeamId] = useState<string>('');
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const [isPoolOpen, setIsPoolOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);

    useEffect(() => {
        if (state.userTeamId) {
            setMyTeamId(state.userTeamId);
        } else if (!myTeamId && teams.length > 0) {
            // Force selection if not set
            setIsSwitchModalOpen(true);
        }
    }, [teams, myTeamId, state.userTeamId]);

    const myTeam = teams.find((t: any) => t.id === myTeamId);

    // Dynamic Theming
    useEffect(() => {
        if (myTeam) {
            document.documentElement.style.setProperty('--team-primary', myTeam.color || '#1e3c72');
            // document.documentElement.style.setProperty('--team-secondary', myTeam.secondaryColor || '#ff5722');
        }
    }, [myTeam]);

    const handleSwitchTeam = (teamId: string) => {
        dispatch({ type: 'SET_USER_TEAM', payload: teamId });
        setMyTeamId(teamId);
        setIsSwitchModalOpen(false);

        // Update local session
        const session = localStorage.getItem('ipl_auction_session');
        if (session) {
            const parsed = JSON.parse(session);
            parsed.userTeamId = teamId;
            localStorage.setItem('ipl_auction_session', JSON.stringify(parsed));
        }

        // Sync with server
        if (state.roomId && socket) {
            socket.emit('select_team', { roomId: state.roomId, teamId, playerName: state.username });
        }
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
        console.log('handleBid called with amount:', amount);
        if (myTeam && myTeam.budget >= amount) {
            // If in multiplayer mode, emit bid to socket
            if (state.roomId && socket) {
                console.log('Emitting place_bid to socket:', state.roomId, myTeam.id, amount);
                // Optimized Payload: [roomId, teamId, amount]
                socket.emit('place_bid', [state.roomId, myTeam.id, amount]);
            } else {
                console.warn('Cannot bid: No roomId or socket connection');
            }
            dispatch({ type: 'PLACE_BID', payload: { teamId: myTeam.id, amount } });
        } else {
            const errorMsg = !myTeam
                ? 'Error: You have not selected a team yet!'
                : `Error: Insufficient budget! (Budget: ${formatMoney(myTeam.budget)}, Bid: ${formatMoney(amount)})`;

            console.warn(errorMsg);
            alert(errorMsg);
        }
    };

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
                                {teams.filter(team => !team.playerName || team.id === myTeamId || team.playerName === state.username).map(team => (
                                    <div
                                        key={team.id}
                                        className={`flex items-center gap-3 p-3 rounded cursor-pointer mb-2 border ${myTeamId === team.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
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
        <div className="flex-col gap-4 relative">
            {/* Mobile Sticky Header */}
            <div className="sticky top-0 z-20 bg-white shadow-md p-2 -mx-4 px-4 mb-2 flex flex-col gap-2">
                {/* Ticker Tape */}
                <TickerTape bids={bidHistory} teams={teams} />

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="text-xl font-bold">
                            ⏱ {isTimerRunning ? timerSeconds.toString().padStart(2, '0') : '00'}s
                        </div>

                        {/* Audio Controls */}
                        {state.roomId && (
                            <div className="flex gap-1">
                                <button
                                    onClick={isBroadcasting ? stopBroadcast : startBroadcast}
                                    className={`px-2 py-1 text-xs rounded ${isBroadcasting ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                                >
                                    {isBroadcasting ? '🎙 ON AIR' : '🎙 OFF'}
                                </button>
                                <button
                                    onClick={isListening ? stopListening : startListening}
                                    className={`px-2 py-1 text-xs rounded ${isListening ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                                >
                                    {isListening ? '🔊 ON' : '🔇 OFF'}
                                </button>
                            </div>
                        )}

                    </div>
                    <div className="text-right">
                        <div className="text-xs text-muted">Current Bid</div>
                        <div className="text-xl font-bold text-primary">{formatMoney(currentBid)}</div>
                    </div>
                </div>

                {/* Current Bidder Banner */}
                {currentBidder ? (
                    <div className={`p-2 rounded text-center font-bold text-white ${currentBidder === myTeamId ? 'bg-green-600' : 'bg-blue-600'}`}>
                        {currentBidder === myTeamId ? 'YOU ARE WINNING' : `${teams.find(t => t.id === currentBidder)?.name || 'Unknown'} is winning`}
                    </div>
                ) : (
                    <div className="p-2 rounded text-center font-bold bg-gray-200 text-gray-500">
                        Waiting for bid...
                    </div>
                )}
            </div>

            {/* Collapsible Stats */}
            {myTeam && (
                <div className="border rounded p-2 bg-gray-50">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsStatsOpen(!isStatsOpen)}>
                        <span className="font-bold text-sm">My Purse: {formatMoney(myTeam.budget)}</span>
                        <span className="text-xs text-blue-600">{isStatsOpen ? 'Hide Stats' : 'Show Stats'}</span>
                    </div>
                    {isStatsOpen && (
                        <div className="mt-2 pt-2 border-t">
                            <MyTeamStats
                                team={myTeam}
                                config={config}
                                onSwitchTeam={() => setIsSwitchModalOpen(true)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Main Player Card (3D Flip) */}
            <PlayerFlipCard player={currentPlayer} />

            {/* Recent Bids (Mobile Friendly) */}
            <div className="bg-gray-50 p-2 rounded text-xs text-center text-muted">
                Last Bid: {bidHistory.length > 0 ? `${formatMoney(bidHistory[0].amount)} by ${teams.find(t => t.id === bidHistory[0].teamId)?.name}` : 'None'}
            </div>

            {/* Bidding Controls */}
            <div className="card sticky bottom-0 z-20 shadow-lg border-t-2 border-blue-100 mb-0">
                <div className="grid grid-cols-2 gap-4">
                    <HoldToBidButton
                        amount={nextBidAmount}
                        label={`BID ${formatMoney(nextBidAmount)}`}
                        disabled={!canAfford || currentBidder === myTeamId}
                        onBid={handleBid}
                    />
                    <div className="flex-col gap-2">
                        <button
                            onClick={() => handleBid(currentBid + 5000000)} // Jump +50L
                            disabled={!canAfford || currentBidder === myTeamId}
                        >
                            +50L Jump
                        </button>
                        <button
                            onClick={() => handleBid(currentBid + 10000000)} // Jump +1Cr
                            disabled={!canAfford || currentBidder === myTeamId}
                        >
                            +1Cr Jump
                        </button>
                    </div>
                </div>

                {/* Auctioneer Controls - Only Host in Multiplayer */}
                {(!state.roomId || state.isHost) && (
                    <div className="mt-2" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
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

            {/* Full History below controls */}
            <div className="mt-4 pb-12">
                <h3 className="text-sm font-bold text-muted mb-2">Bid History</h3>
                <BidHistory history={bidHistory} />
            </div>



        </div>
    );
};

export default AuctionPanel;
