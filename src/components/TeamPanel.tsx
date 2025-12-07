import React from 'react';
import type { Team } from '../types';
import { motion } from 'framer-motion';

interface TeamPanelProps {
    team: Team;
}

const TeamPanel: React.FC<TeamPanelProps & { onClick?: () => void }> = ({ team, onClick }) => {
    // Calculate stats
    const totalSpent = team.budget < 100000000 ? 100000000 - team.budget : 0;
    const overseasCount = team.squad.filter(p => p.nationality !== 'Indian').length;

    const formatMoney = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        return `₹${(amount / 100000).toFixed(2)} L`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={onClick ? { scale: 0.98 } : {}}
            transition={{ duration: 0.3 }}
            className={`card ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
            onClick={onClick}
            style={{ borderLeft: `6px solid ${team.color || '#ccc'}` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: team.color || '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        {team.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl" style={{ margin: 0 }}>{team.name}</h3>
                        {team.playerName && (
                            <div className="text-xs text-muted">Manager: {team.playerName}</div>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-muted">Purse Remaining</div>
                    <div className="text-xl font-bold text-primary">{formatMoney(team.budget)}</div>
                </div>
            </div>

            {/* Squad Stats */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4 p-2 bg-gray-50 rounded">
                <div>
                    <div className="font-bold">{team.squad.length}</div>
                    <div className="text-muted">Plyrs</div>
                </div>
                <div>
                    <div className="font-bold">{overseasCount}</div>
                    <div className="text-muted">Overseas</div>
                </div>
                <div>
                    <div className="font-bold text-green-600">{formatMoney(totalSpent)}</div>
                    <div className="text-muted">Spent</div>
                </div>
                <div>
                    <div className="font-bold text-blue-600">--</div>
                    <div className="text-muted">Max Bid</div>
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
        </motion.div>
    );
};

export default TeamPanel;
