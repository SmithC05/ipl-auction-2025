import React from 'react';
import type { Team } from '../types';
import { MAX_SQUAD_SIZE } from '../types';

interface TeamPanelProps {
    team: Team;
    isOwner?: boolean;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ team, isOwner = false }) => {
    const formatMoney = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        return `₹${(amount / 100000).toFixed(2)} L`;
    };

    const remainingBudget = team.budget;
    const slotsFilled = team.squad.length;
    const slotsLeft = MAX_SQUAD_SIZE - slotsFilled;

    return (
        <div className="card" style={{ borderLeft: `4px solid ${team.color}` }}>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg" style={{ color: team.color }}>{team.shortName}</h3>
                {isOwner && <span className="badge bg-black text-white">YOU</span>}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <div className="text-sm text-gray-500">Budget Left</div>
                    <div className="font-bold text-xl">{formatMoney(remainingBudget)}</div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Slots Left</div>
                    <div className="font-bold text-xl">{slotsLeft} / {MAX_SQUAD_SIZE}</div>
                </div>
            </div>

            <div className="space-y-1">
                <div className="text-xs font-bold text-gray-400 uppercase">Squad ({slotsFilled})</div>
                <div className="max-h-32 overflow-y-auto text-sm">
                    {team.squad.length === 0 ? (
                        <div className="text-gray-400 italic">No players yet</div>
                    ) : (
                        team.squad.map(p => (
                            <div key={p.id} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                                <span>{p.name}</span>
                                <span className="text-gray-500 text-xs">{p.role}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamPanel;
