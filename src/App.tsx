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
  const { dispatch } = useAuction();
  const [isLoading, setIsLoading] = useState(false);
  const [teamCount, setTeamCount] = useState(4);

  const handleLoadSample = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/sample_players.csv');
      const text = await response.text();
      const players = parseCSV(text);

      // Initialize teams
      const teams = shuffleTeams(TEAMS_CONFIG, teamCount);

      dispatch({ type: 'INIT_AUCTION', payload: { players, teams } });

      // Save for offline
      saveToStorage('ipl_players_compressed', compressPlayers(players));
    } catch (e) {
      console.error(e);
      alert('Failed to load sample data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const players = parseCSV(text);
      const teams = shuffleTeams(TEAMS_CONFIG, teamCount);
      dispatch({ type: 'INIT_AUCTION', payload: { players, teams } });
    };
    reader.readAsText(file);
  };

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-8">IPL Auction 2025</h1>

      <div className="card w-full max-w-md space-y-6">
        <div>
          <label className="block text-sm font-bold mb-2">Number of Teams</label>
          <select
            value={teamCount}
            onChange={(e) => setTeamCount(parseInt(e.target.value))}
            className="w-full"
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <option key={n} value={n}>{n} Teams</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <button
            className="primary w-full py-3"
            onClick={handleLoadSample}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Start with Sample Data'}
          </button>

          <div className="text-center text-sm text-gray-500">- OR -</div>

          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer text-blue-600 font-bold">
              Upload CSV
            </label>
            <div className="text-xs text-gray-400 mt-1">Format: id,name,role,basePrice...</div>
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
          <h1 className="font-bold text-lg">IPL Auction 2025</h1>
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
