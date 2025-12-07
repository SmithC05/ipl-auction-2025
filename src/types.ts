export type Role = 'BAT' | 'BOWL' | 'AR' | 'WK';

export interface Player {
  id: number;
  name: string;
  nationality: string;
  role: Role;
  basePrice: number;
  matches: number;
  runs: number;
  wickets: number;
  avg: number;
  sr: number;
  econ: number;
  age: number;
  battingStyle: string;
  bowlingStyle: string;
  imageUrl?: string;
  set: AuctionSet;
  originalTeam?: string; // For chemistry calculations
}

export type AuctionSet = string;

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  budget: number;
  squad: Player[];
  totalSpent: number;
  playerName?: string; // Username of the person controlling this team
}

export interface Bid {
  teamId: string;
  amount: number;
  timestamp: number;
}

export interface AuctionConfig {
  totalTeams: number;
  budget: number;
  maxPlayersPerTeam: number;
  maxOverseas: number;
  timerDuration: number; // in seconds
}

export interface AuctionState {
  teams: Team[];
  players: Player[];
  unsoldPlayers: Player[];
  soldPlayers: Player[];
  currentPlayer: Player | null;
  currentBid: number;
  currentBidder: string | null;
  bidHistory: Bid[];
  isTimerRunning: boolean;
  timerSeconds: number;
  auctionStatus: 'IDLE' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  currentSet: AuctionSet;
  setsOrder: AuctionSet[];
  userTeamId?: string | null;
  roomId?: string | null;
  isHost?: boolean;
  username?: string | null;
  config: AuctionConfig;
  auctionEndTime: number | null;
  serverTimeOffset: number;
  revealStep: number; // 0=None, 1=3rd, 2=2nd, 3=1st, 4=All
}

export const TEAMS_CONFIG = [
  { id: 'CSK', name: 'Chennai Super Kings', shortName: 'CSK', color: '#FFFF00' },
  { id: 'MI', name: 'Mumbai Indians', shortName: 'MI', color: '#004BA0' },
  { id: 'RCB', name: 'Royal Challengers Bangalore', shortName: 'RCB', color: '#EC1C24' },
  { id: 'KKR', name: 'Kolkata Knight Riders', shortName: 'KKR', color: '#3A225D' },
  { id: 'RR', name: 'Rajasthan Royals', shortName: 'RR', color: '#EA1A85' },
  { id: 'PBKS', name: 'Punjab Kings', shortName: 'PBKS', color: '#DD1F2D' },
  { id: 'SRH', name: 'Sunrisers Hyderabad', shortName: 'SRH', color: '#F7A721' },
  { id: 'LSG', name: 'Lucknow Super Giants', shortName: 'LSG', color: '#A0CEF8' },
  { id: 'GT', name: 'Gujarat Titans', shortName: 'GT', color: '#1B2133' },
  { id: 'DC', name: 'Delhi Capitals', shortName: 'DC', color: '#00008B' },
];

export const DEFAULT_BUDGET = 100000000; // 100 Cr
export const MIN_SQUAD_SIZE = 12;
export const MAX_SQUAD_SIZE = 25; // Updated default
export const DEFAULT_CONFIG: AuctionConfig = {
  totalTeams: 10,
  budget: DEFAULT_BUDGET,
  maxPlayersPerTeam: 25,
  maxOverseas: 8,
  timerDuration: 30,
};
