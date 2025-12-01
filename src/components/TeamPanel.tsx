import React from 'react';
import type { Team } from '../types';
import { calculateTeamStrength } from '../utils/gameLogic';

interface TeamPanelProps {
    team: Team;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ team }) => {
    const strengthScore = calculateTeamStrength(team);

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-bold text-lg">{team.name}</h3>
                    {team.playerName && (
                        <p className="text-xs text-gray-500">Player: {team.playerName}</p>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Budget</div>
                    <div className="font-bold text-lg">₹{(team.budget / 10000000).toFixed(1)} Cr</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                    <div className="text-gray-500">Squad Size</div>
                    <div className="font-bold">{team.squad.length}</div>
                </div>
                <div className="text-right">
                    <div className="text-gray-500">Strength</div>
                    <div className="font-bold">{strengthScore.toFixed(1)}</div>
                </div>
            </div>

            {team.squad.length > 0 && (
                <div className="space-y-1">
                    <div className="text-xs font-bold text-gray-400">SQUAD</div>
                    <div className="max-h-32 overflow-y-auto text-sm space-y-1">
                        {team.squad.map(player => (
                            <div key={player.id} className="flex justify-between items-center py-1 border-b border-gray-100">
                                <span>{player.name}</span>
                                <span className="text-xs text-gray-500">{player.role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPanel;
