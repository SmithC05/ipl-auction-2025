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
  const [teamCount, setTeamCount] = useState(4);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [username, setUsername] = useState('');

  const handleStart = (players: any[]) => {
    const teams = shuffleTeams(TEAMS_CONFIG, teamCount, selectedTeamId);
    dispatch({ type: 'INIT_AUCTION', payload: { players, teams, userTeamId: selectedTeamId, username } });
    saveToStorage('ipl_players_compressed', compressPlayers(players));
  };

  const handleCreateRoom = () => {
    if (!socket || !username.trim()) {
      alert('Please enter your name');
      return;
    }
    socket.emit('create_room');
    socket.once('room_created', (roomId: string) => {
      // I am the host
      dispatch({ type: 'JOIN_ROOM', payload: { roomId, isHost: true, username } });
      // Proceed to load data as usual, INIT_AUCTION will set userTeamId
      loadSampleData();
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const players = parseCSV(text);
        handleStart(players);
      };
      reader.readAsText(file);
    }
  };

  const loadSampleData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/sample_players.csv');
      const text = await response.text();
      const players = parseCSV(text);

      handleStart(players);
    } catch (error) {
      console.error("Failed to load sample data", error);
      alert("Failed to load sample data. Please try uploading a CSV.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="card max-w-md w-full p-8 text-center">
        <h1 className="text-3xl font-black mb-2">IPL AUCTION 2025</h1>
        <p className="text-gray-500 mb-8">Manager Mode</p>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-6 bg-gray-200 p-1 rounded-lg">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-bold ${!isMultiplayer ? 'bg-white shadow' : 'text-gray-500'}`}
            onClick={() => setIsMultiplayer(false)}
          >
            Single Player
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-bold ${isMultiplayer ? 'bg-white shadow' : 'text-gray-500'}`}
            onClick={() => setIsMultiplayer(true)}
          >
            Multiplayer
          </button>
        </div>

        {!isMultiplayer ? (
          <>
            <div className="mb-6 text-left">
              <label className="block text-sm font-bold mb-2">Number of Teams</label>
              <select
                className="w-full p-2 border rounded"
                value={teamCount}
                onChange={(e) => setTeamCount(parseInt(e.target.value))}
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n} Teams</option>
                ))}
              </select>
            </div>

            <div className="mb-8 text-left">
              <label className="block text-sm font-bold mb-2">Select Your Team</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                {TEAMS_CONFIG.map(team => (
                  <button
                    key={team.id}
                    className={`p-2 text-sm rounded border ${selectedTeamId === team.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setSelectedTeamId(team.id)}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Select the team you want to manage.</p>
            </div>

            <div className="space-y-3">
              <button
                className="primary w-full py-3 font-bold text-lg"
                onClick={loadSampleData}
                disabled={!selectedTeamId || isLoading}
              >
                {isLoading ? 'Loading...' : 'Start with Sample Data'}
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={!selectedTeamId}
                />
                <button
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded font-bold hover:bg-gray-50 disabled:opacity-50"
                  disabled={!selectedTeamId}
                >
                  Upload Custom CSV
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-1">Format: id,name,role,basePrice...</div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
              <p className="font-bold mb-1">How it works:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Host</strong> creates a room and starts the auction.</li>
                <li><strong>Friends</strong> join using the Room ID.</li>
                <li>Everyone bids in real-time!</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2 text-left">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full border rounded p-2"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                />
              </div>

              <button
                className="primary w-full py-3 font-bold text-lg"
                onClick={handleCreateRoom}
                disabled={isLoading || !username.trim()}
              >
                Create New Room (Host)
              </button>

              <div className="flex items-center gap-2">
                <div className="h-px bg-gray-300 flex-1"></div>
                <span className="text-gray-400 text-xs font-bold">OR</span>
                <div className="h-px bg-gray-300 flex-1"></div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  className="flex-1 border rounded p-2 text-center uppercase font-mono tracking-widest"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                />
                <button
                  className="bg-black text-white px-6 rounded font-bold"
                  onClick={handleJoinRoom}
                  disabled={!joinRoomId || !username.trim()}
                >
                  JOIN
                </button>
              </div>
            </div>
          </div>
        )}
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
          <h1 className="font-bold text-lg">IPL Auction 2025 {state.roomId && <span className="text-xs bg-blue-600 px-2 py-1 rounded ml-2">ROOM: {state.roomId}</span>}</h1>
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
