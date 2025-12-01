import React from 'react';
import type { Team } from '../types';
import { calculateTeamStrength } from '../utils/gameLogic';

interface LiveLeaderboardProps {
    teams: Team[];
}

const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ teams }) => {
    const sortedTeams = [...teams].sort((a, b) => calculateTeamStrength(b) - calculateTeamStrength(a));

    return (
        <div className="card">
            <h3 className="font-bold text-lg mb-3">Live Leaderboard</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-2 py-2">Rank</th>
                            <th className="px-2 py-2">Team</th>
                            <th className="px-2 py-2 text-right">Score</th>
                            <th className="px-2 py-2 text-right">Spent</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTeams.map((team, index) => (
                            <tr key={team.id} className="border-b border-gray-100 last:border-0">
                                <td className="px-2 py-2 font-bold text-gray-500">#{index + 1}</td>
                                <td className="px-2 py-2 font-medium">
                                    <span style={{ color: team.color }}>{team.shortName}</span>
                                </td>
                                <td className="px-2 py-2 text-right font-bold">
                                    {calculateTeamStrength(team).toFixed(1)}
                                </td>
                                <td className="px-2 py-2 text-right text-gray-500">
                                    {((team.totalSpent / 10000000).toFixed(1))} Cr
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LiveLeaderboard;
