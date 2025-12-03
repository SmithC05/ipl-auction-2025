import React, { useState, useEffect } from 'react';
import { AuctionProvider, useAuction } from './context/AuctionContext';
import AuctionPanel from './components/AuctionPanel';
import TeamPanel from './components/TeamPanel';
import LiveLeaderboard from './components/LiveLeaderboard';
import { parseCSV, compressPlayers, saveToStorage } from './utils/dataUtils';
import { TEAMS_CONFIG, DEFAULT_CONFIG } from './types';
import { shuffleTeams } from './utils/gameLogic';
import { useSoundEffects } from './hooks/useSoundEffects';

const SetupView: React.FC = () => {
  const { dispatch, socket } = useAuction();
  const [isLoading, setIsLoading] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState<'INITIAL' | 'CONFIG'>('INITIAL');
  const [lastSession, setLastSession] = useState<{ roomId: string, username: string, isHost: boolean, userTeamId?: string } | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('ipl_auction_session');
    if (session) {
      setLastSession(JSON.parse(session));
    }
  }, []);

  const handleRejoin = () => {
    if (!socket || !lastSession) return;
    socket.emit('join_room', { roomId: lastSession.roomId, username: lastSession.username });
    socket.once('room_joined', (roomId: string) => {
      dispatch({
        type: 'JOIN_ROOM',
        payload: {
          roomId,
          isHost: lastSession.isHost,
          username: lastSession.username,
          userTeamId: lastSession.userTeamId
        }
      });
      if (lastSession.userTeamId) {
        dispatch({ type: 'SET_USER_TEAM', payload: lastSession.userTeamId });
      }
    });
    socket.once('error', (msg: string) => {
      alert(msg);
      localStorage.removeItem('ipl_auction_session');
      setLastSession(null);
    });
  };

  // Config State
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Helper to start auction after loading data
  const handleStart = (players: any[], roomConfig?: { roomId: string; isHost: boolean }) => {
    // In multiplayer, teams are shuffled automatically.
    // We pass empty userTeamId as manual selection is removed.
    const teams = shuffleTeams(TEAMS_CONFIG, config.totalTeams, '');

    // Apply budget from config
    teams.forEach(t => t.budget = config.budget);

    dispatch({
      type: 'INIT_AUCTION',
      payload: {
        players,
        teams,
        userTeamId: '',
        username,
        roomId: roomConfig?.roomId,
        isHost: roomConfig?.isHost,
        config: config
      }
    });
    saveToStorage('ipl_players_compressed', compressPlayers(players));
  };

  const loadSampleData = async (roomConfig?: { roomId: string; isHost: boolean }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/players_2025.csv');
      const text = await response.text();
      const players = parseCSV(text);

      handleStart(players, roomConfig);
    } catch (error) {
      console.error("Failed to load sample data", error);
      alert("Failed to load sample data. Please try uploading a CSV.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = () => {
    if (!socket || !username.trim()) {
      alert('Please enter your name');
      return;
    }
    // Go to config step
    setStep('CONFIG');
  };

  const confirmCreateRoom = () => {
    if (!socket) return;
    socket.emit('create_room', { config });
    socket.once('room_created', (roomId: string) => {
      // I am the host
      dispatch({ type: 'JOIN_ROOM', payload: { roomId, isHost: true, username } });
      localStorage.setItem('ipl_auction_session', JSON.stringify({ roomId, username, isHost: true, userTeamId: '' }));
      loadSampleData({ roomId, isHost: true });
    });
  };

  const handleJoinRoom = () => {
    if (!socket || !joinRoomId || !username.trim()) {
      alert('Please enter your name and room ID');
      return;
    }
    socket.emit('join_room', { roomId: joinRoomId, username });
    socket.once('room_joined', (roomId: string) => {
      dispatch({ type: 'JOIN_ROOM', payload: { roomId, isHost: false, username } });
      localStorage.setItem('ipl_auction_session', JSON.stringify({ roomId, username, isHost: false, userTeamId: '' }));
      // We don't INIT_AUCTION, we wait for state_update from host
    });
    socket.once('error', (msg: string) => {
      alert(msg);
    });
  };

  if (step === 'CONFIG') {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-md)' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Auction Configuration</h2>

          <div className="flex-col gap-4">
            <div>
              <label className="text-sm font-bold text-muted block mb-1">Total Teams</label>
              <select
                className="w-full p-2 border rounded"
                value={config.totalTeams}
                onChange={(e) => setConfig({ ...config, totalTeams: Number(e.target.value) })}
              >
                {[4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n} Teams</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-muted block mb-1">Team Budget (Cr)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={config.budget / 10000000}
                onChange={(e) => setConfig({ ...config, budget: Number(e.target.value) * 10000000 })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-muted block mb-1">Max Players</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={config.maxPlayersPerTeam}
                  onChange={(e) => setConfig({ ...config, maxPlayersPerTeam: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-muted block mb-1">Max Overseas</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={config.maxOverseas}
                  onChange={(e) => setConfig({ ...config, maxOverseas: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-muted block mb-1">Bid Timer (Seconds)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={config.timerDuration}
                onChange={(e) => setConfig({ ...config, timerDuration: Number(e.target.value) })}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="bg-gray-200 text-gray-800 flex-1"
                onClick={() => setStep('INITIAL')}
              >
                Back
              </button>
              <button
                className="primary flex-1"
                onClick={confirmCreateRoom}
              >
                Start Auction
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-md)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h1 className="text-2xl" style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-primary)' }}>IPL Auction 2025</h1>
        <p className="text-muted" style={{ marginBottom: 'var(--spacing-xl)' }}>Real-time Multiplayer Auction</p>

        {lastSession && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800 mb-2">Found active session:</p>
            <div className="font-bold text-lg mb-2">{lastSession.username} @ {lastSession.roomId}</div>
            <button
              className="w-full primary mb-2"
              onClick={handleRejoin}
            >
              Rejoin Previous Session
            </button>
            <button
              className="text-xs text-red-500 underline"
              onClick={() => {
                localStorage.removeItem('ipl_auction_session');
                setLastSession(null);
              }}
            >
              Clear Session
            </button>
          </div>
        )}

        <div className="flex-col gap-4">
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 'bold' }}>Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            className="primary w-full justify-center py-3 text-lg"
            onClick={handleCreateRoom}
            disabled={isLoading || !username.trim()}
          >
            Create New Room (Host)
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs font-bold text-muted">OR JOIN EXISTING</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ROOM ID"
              className="flex-1 text-center uppercase tracking-widest font-bold border rounded p-2"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
            />
            <button
              className="px-6 font-bold primary rounded"
              onClick={handleJoinRoom}
              disabled={!joinRoomId || !username.trim()}
            >
              JOIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainView: React.FC = () => {
  const { state, socket } = useAuction();
  useSoundEffects(state);
  const [activeTab, setActiveTab] = useState<'auction' | 'teams' | 'leaderboard'>('auction');

  // If no players loaded, show setup
  if (state.players.length === 0) {
    return <SetupView />;
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: 'var(--spacing-md) 0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container flex-row" style={{ justifyContent: 'space-between' }}>
          <div className="flex-col" style={{ gap: '4px' }}>
            <h1 className="text-lg" style={{ color: 'var(--color-primary)' }}>IPL Auction 2025</h1>
            {state.roomId && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="badge" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                  ROOM: {state.roomId}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <div className="badge" style={{ background: 'var(--color-surface-hover)' }}>
              {state.soldPlayers.length} Sold / {state.unsoldPlayers.length} Unsold
            </div>
            <button
              className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded border border-red-200"
              onClick={() => {
                if (confirm('Are you sure you want to exit?')) {
                  localStorage.removeItem('ipl_auction_session');
                  window.location.reload();
                }
              }}
            >
              EXIT
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
        {activeTab === 'auction' && <AuctionPanel />}

        {activeTab === 'teams' && (
          <div className="flex-col">
            {state.teams.map((team: any) => (
              <TeamPanel key={team.id} team={team} />
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && <LiveLeaderboard teams={state.teams} />}
      </main>

      {/* Mobile Bottom Nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-around', padding: 'var(--spacing-sm)', zIndex: 40
      }}>
        <button
          style={{
            flex: 1, border: 'none', background: 'transparent',
            color: activeTab === 'auction' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            flexDirection: 'column', gap: '4px', fontSize: 'var(--font-size-sm)'
          }}
          onClick={() => setActiveTab('auction')}
        >
          Auction
        </button>
        <button
          style={{
            flex: 1, border: 'none', background: 'transparent',
            color: activeTab === 'teams' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            flexDirection: 'column', gap: '4px', fontSize: 'var(--font-size-sm)'
          }}
          onClick={() => setActiveTab('teams')}
        >
          Teams
        </button>
        <button
          style={{
            flex: 1, border: 'none', background: 'transparent',
            color: activeTab === 'leaderboard' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            flexDirection: 'column', gap: '4px', fontSize: 'var(--font-size-sm)'
          }}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuctionProvider>
      <MainView />
    </AuctionProvider>
  );
};

export default App;
