import React, { useState } from 'react';
import type { Team, AuctionConfig } from '../types';
import { calculateTeamStrength, getOverseasCount } from '../utils/gameLogic';
import TeamDetailModal from './TeamDetailModal';
import { useAuction } from '../context/AuctionContext';

interface LiveLeaderboardProps {
    teams: Team[];
}

const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ teams }) => {
    const { state } = useAuction();
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const sortedTeams = [...teams].sort((a, b) => calculateTeamStrength(b) - calculateTeamStrength(a));

    return (
        <>
            <div className="card">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Live Leaderboard</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                        <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                            <tr>
                                <th className="p-2">Rank</th>
                                <th className="p-2">Team</th>
                                <th className="p-2 text-center">Squad</th>
                                <th className="p-2 text-center">OS</th>
                                <th className="p-2 text-right">Score</th>
                                <th className="p-2 text-right">Spent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTeams.map((team, index) => (
                                <tr
                                    key={team.id}
                                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                                    onClick={() => setSelectedTeam(team)}
                                    className="hover:bg-gray-100 transition-colors"
                                >
                                    <td className="p-2 font-bold text-muted">#{index + 1}</td>
                                    <td className="p-2 font-bold">
                                        <span style={{ color: team.color }}>{team.shortName}</span>
                                    </td>
                                    <td className="p-2 text-center">{team.squad.length}</td>
                                    <td className="p-2 text-center">{getOverseasCount(team.squad)}</td>
                                    <td className="p-2 text-right font-bold">
                                        {calculateTeamStrength(team).toFixed(1)}
                                    </td>
                                    <td className="p-2 text-right text-muted">
                                        {((team.totalSpent / 10000000).toFixed(1))} Cr
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-center text-muted mt-2">Click on a team to view details</p>
            </div>

            {selectedTeam && (
                <TeamDetailModal
                    team={selectedTeam}
                    config={state.config}
                    onClose={() => setSelectedTeam(null)}
                />
            )}
        </>
    );
};

export default LiveLeaderboard;
