import React, { useState, useEffect } from 'react';
import { AuctionProvider, useAuction } from './context/AuctionContext';
import AuctionPanel from './components/AuctionPanel';
import TeamPanel from './components/TeamPanel';
import LiveLeaderboard from './components/LiveLeaderboard';
import HelpModal from './components/HelpModal';
import { parseCSV, compressPlayers, saveToStorage } from './utils/dataUtils';
import { TEAMS_CONFIG } from './types';
import { shuffleTeams } from './utils/gameLogic';

const SetupView: React.FC = () => {
  const { dispatch, socket } = useAuction();
  const [isLoading, setIsLoading] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [username, setUsername] = useState('');

  // Helper to start auction after loading data
  const handleStart = (players: any[], roomConfig?: { roomId: string; isHost: boolean }) => {
    // In multiplayer, teams are shuffled automatically.
    // We pass empty userTeamId as manual selection is removed.
    const teams = shuffleTeams(TEAMS_CONFIG, 4, '');
    dispatch({
      type: 'INIT_AUCTION',
      payload: {
        players,
        teams,
        userTeamId: '',
        username,
        roomId: roomConfig?.roomId,
        isHost: roomConfig?.isHost
      }
    });
    saveToStorage('ipl_players_compressed', compressPlayers(players));
  };

  const loadSampleData = async (roomConfig?: { roomId: string; isHost: boolean }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/sample_players.csv');
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
    socket.emit('create_room');
    socket.once('room_created', (roomId: string) => {
      // I am the host
      // Pass room config to handleStart to ensure it's set in INIT_AUCTION
      dispatch({ type: 'JOIN_ROOM', payload: { roomId, isHost: true, username } });
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
      // We don't INIT_AUCTION, we wait for state_update from host
    });
    socket.once('error', (msg: string) => {
      alert(msg);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-2">IPL Auction 2025</h1>
        <p className="text-gray-500 mb-8">Real-time Multiplayer Auction</p>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 text-left">
            <p className="font-bold mb-1">How it works:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Host</strong> creates a room and starts the auction.</li>
              <li><strong>Friends</strong> join using the Room ID.</li>
              <li>Everyone bids in real-time!</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-bold mb-2">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full border rounded p-3"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
              />
            </div>

            <button
              className="primary w-full py-3 font-bold text-lg rounded shadow-sm hover:shadow-md transition-all"
              onClick={handleCreateRoom}
              disabled={isLoading || !username.trim()}
            >
              Create New Room (Host)
            </button>

            <div className="flex items-center gap-2 my-2">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-gray-400 text-xs font-bold">OR JOIN EXISTING</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ROOM ID"
                className="flex-1 border rounded p-3 text-center uppercase font-mono tracking-widest font-bold"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              />
              <button
                className="bg-black text-white px-6 rounded font-bold hover:bg-gray-800 transition-colors"
                onClick={handleJoinRoom}
                disabled={!joinRoomId || !username.trim()}
              >
                JOIN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainView: React.FC = () => {
  const { state } = useAuction();
  const [activeTab, setActiveTab] = useState<'auction' | 'teams' | 'leaderboard'>('auction');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem('ipl_auction_help_hidden');
    if (hidden !== 'true') {
      setIsHelpOpen(true);
    }
  }, []);

  // If no players loaded, show setup
  if (state.players.length === 0) {
    return <SetupView />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <header className="bg-black text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="container flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="font-bold text-lg">IPL Auction 2025</h1>
            {state.roomId && (
              <span className="text-xs bg-blue-600 px-2 py-1 rounded inline-block mt-1 font-mono">
                ROOM: {state.roomId}
              </span>
            )}
          </div>
          <div className="text-xs bg-gray-800 px-2 py-1 rounded">
            {state.soldPlayers.length} Sold / {state.unsoldPlayers.length} Unsold
          </div>
        </div>
      </header>

      <main className="container py-4">
        {activeTab === 'auction' && <AuctionPanel />}

        {activeTab === 'teams' && (
          <div className="space-y-4">
            {state.teams.map((team: any) => (
              <TeamPanel key={team.id} team={team} />
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && <LiveLeaderboard teams={state.teams} />}
      </main>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-40">
        <button
          className={`flex-1 text-xs py-2 ${activeTab === 'auction' ? 'text-black font-bold' : 'text-gray-400 border-transparent'}`}
          onClick={() => setActiveTab('auction')}
        >
          Auction
        </button>
        <button
          className={`flex-1 text-xs py-2 ${activeTab === 'teams' ? 'text-black font-bold' : 'text-gray-400 border-transparent'}`}
          onClick={() => setActiveTab('teams')}
        >
          Teams
        </button>
        <button
          className={`flex-1 text-xs py-2 ${activeTab === 'leaderboard' ? 'text-black font-bold' : 'text-gray-400 border-transparent'}`}
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
