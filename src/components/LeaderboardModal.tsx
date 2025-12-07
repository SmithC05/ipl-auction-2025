import React, { useMemo } from 'react';
import type { Team } from '../types';
import { analyzeTeam } from '../utils/scoringUtils';

interface LeaderboardModalProps {
    teams: Team[];
    onClose: () => void;
    isGameOver?: boolean;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ teams, onClose, isGameOver }) => {
    const analysis = useMemo(() => {
        return teams.map(analyzeTeam).sort((a, b) => b.totalScore - a.totalScore);
    }, [teams]);

    const wrapperClass = isGameOver
        ? "relative w-full h-full bg-white flex flex-col" // Full screen mode
        : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-md"; // Modal mode

    const containerClass = isGameOver
        ? "w-full h-full flex flex-col"
        : "bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in";

    return (
        <div className={wrapperClass}>
            <div className={containerClass}>
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-700 text-white">
                    <div>
                        <h2 className="text-3xl font-bold">Tournament Leaderboard</h2>
                        <p className="text-blue-100 opacity-80">Based on Stadium Impact, Efficiency & Chemistry</p>
                    </div>
                    {!isGameOver && (
                        <button onClick={onClose} className="text-3xl hover:text-red-200 transition-colors">&times;</button>
                    )}
                </div>

                <div className="p-0 overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 font-bold text-gray-600 border-b">Rank</th>
                                <th className="p-4 font-bold text-gray-600 border-b">Team</th>
                                <th className="p-4 font-bold text-gray-600 border-b text-right">Stadium Score</th>
                                <th className="p-4 font-bold text-gray-600 border-b text-right">Efficiency</th>
                                <th className="p-4 font-bold text-gray-600 border-b text-right">Balance</th>
                                <th className="p-4 font-bold text-gray-600 border-b text-right">Chemistry</th>
                                <th className="p-4 font-bold text-gray-600 border-b text-right text-lg">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysis.map((team, index) => (
                                <tr key={team.teamId} className={`border-b hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-yellow-50' : ''}`}>
                                    <td className="p-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-400 text-yellow-900 shadow-md' : index === 1 ? 'bg-gray-300 text-gray-800' : index === 2 ? 'bg-orange-200 text-orange-800' : 'text-gray-500'}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-lg">{team.teamName}</td>
                                    <td className="p-4 text-right font-mono text-gray-600">{team.totalStadiumScore.toFixed(1)}</td>
                                    <td className="p-4 text-right font-mono text-green-600">+{team.efficiencyBonus.toFixed(1)}</td>
                                    <td className="p-4 text-right font-mono text-purple-600">+{team.compositionBonus}</td>
                                    <td className="p-4 text-right font-mono text-blue-600">+{team.chemistryBonus}</td>
                                    <td className="p-4 text-right font-bold text-xl">{team.totalScore.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardModal;
