import React from 'react';
import type { Team, AuctionConfig } from '../types';
import { getOverseasCount, getRoleCounts } from '../utils/gameLogic';

interface TeamDetailModalProps {
    team: Team;
    config: AuctionConfig;
    onClose: () => void;
}

const TeamDetailModal: React.FC<TeamDetailModalProps> = ({ team, config, onClose }) => {
    const overseasCount = getOverseasCount(team.squad);
    const roleCounts = getRoleCounts(team.squad);

    const formatMoney = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        return `₹${(amount / 100000).toFixed(2)} L`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: team.color }}></div>
                        <h2 className="text-xl font-bold text-gray-800">{team.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-blue-600 font-bold uppercase">Budget Left</div>
                            <div className="text-lg font-bold text-blue-900">{formatMoney(team.budget)}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-green-600 font-bold uppercase">Squad Size</div>
                            <div className="text-lg font-bold text-green-900">{team.squad.length} / {config.maxPlayersPerTeam}</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-orange-600 font-bold uppercase">Overseas</div>
                            <div className="text-lg font-bold text-orange-900">{overseasCount} / {config.maxOverseas}</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-purple-600 font-bold uppercase">Spent</div>
                            <div className="text-lg font-bold text-purple-900">{formatMoney(team.totalSpent)}</div>
                        </div>
                    </div>

                    {/* Role Breakdown */}
                    <div className="flex justify-around mb-6 bg-gray-50 p-3 rounded-lg">
                        <div className="text-center">
                            <div className="text-xs text-muted font-bold">BAT</div>
                            <div className="font-bold text-lg">{roleCounts.BAT}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-muted font-bold">BOWL</div>
                            <div className="font-bold text-lg">{roleCounts.BOWL}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-muted font-bold">AR</div>
                            <div className="font-bold text-lg">{roleCounts.AR}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-muted font-bold">WK</div>
                            <div className="font-bold text-lg">{roleCounts.WK}</div>
                        </div>
                    </div>

                    {/* Squad List */}
                    <h3 className="font-bold text-lg mb-3 text-gray-800 border-b pb-2">Squad List</h3>
                    {team.squad.length === 0 ? (
                        <p className="text-center text-muted py-4">No players bought yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {team.squad.map((player) => (
                                <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${player.role === 'BAT' ? 'bg-blue-100 text-blue-700' :
                                            player.role === 'BOWL' ? 'bg-green-100 text-green-700' :
                                                player.role === 'AR' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>{player.role}</span>
                                        <span className="font-medium text-gray-800">{player.name}</span>
                                        {player.nationality !== 'India' && (
                                            <span className="text-xs bg-gray-200 text-gray-600 px-1 rounded">✈️</span>
                                        )}
                                    </div>
                                    <div className="font-bold text-gray-700 text-sm">
                                        {formatMoney(player.basePrice)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamDetailModal;
