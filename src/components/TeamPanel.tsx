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
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{team.name}</h3>
                    {team.playerName && (
                        <p className="text-sm text-muted">Player: {team.playerName}</p>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-sm text-muted">Budget</div>
                    <div className="text-lg font-bold">₹{(team.budget / 10000000).toFixed(1)} Cr</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                    <div className="text-muted">Squad Size</div>
                    <div className="font-bold">{team.squad.length}</div>
                </div>
                <div className="text-right">
                    <div className="text-muted">Strength</div>
                    <div className="font-bold">{strengthScore.toFixed(1)}</div>
                </div>
            </div>

            {team.squad.length > 0 && (
                <div className="flex-col gap-2">
                    <div className="text-sm font-bold text-muted uppercase">SQUAD</div>
                    <div className="squad-list">
                        {team.squad.map(player => (
                            <div key={player.id} className="squad-item">
                                <span>{player.name}</span>
                                <span className="text-sm text-muted">{player.role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPanel;
