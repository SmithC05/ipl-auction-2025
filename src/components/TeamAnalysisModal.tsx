import React, { useMemo } from 'react';
import type { Team, AuctionConfig, Player } from '../types';
import { analyzeTeam, calculatePlayerBaseScore } from '../utils/scoringUtils';

interface TeamAnalysisModalProps {
    team: Team;
    config: AuctionConfig;
    availablePlayers: Player[];
    onClose: () => void;
}

const TeamAnalysisModal: React.FC<TeamAnalysisModalProps> = ({ team, config, availablePlayers, onClose }) => {
    const analysis = useMemo(() => analyzeTeam(team), [team]);

    const strategy = useMemo(() => {
        const squadSize = team.squad.length;
        const overseasCount = team.squad.filter(p => p.nationality !== 'India').length;
        const remainingSlots = config.maxPlayersPerTeam - squadSize;
        const remainingOverseas = config.maxOverseas - overseasCount;
        const remainingBudget = team.budget;
        const budgetPerSlot = remainingSlots > 0 ? remainingBudget / remainingSlots : 0;

        // Role Needs
        const roles = team.squad.reduce((acc, p) => {
            acc[p.role] = (acc[p.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const needs = [];
        if ((roles['WK'] || 0) < 2) needs.push({ role: 'WK', count: 2 - (roles['WK'] || 0), priority: 'HIGH' });
        if ((roles['BOWL'] || 0) < 6) needs.push({ role: 'BOWL', count: 6 - (roles['BOWL'] || 0), priority: 'MED' });
        if ((roles['AR'] || 0) < 3) needs.push({ role: 'AR', count: 3 - (roles['AR'] || 0), priority: 'MED' });
        if ((roles['BAT'] || 0) < 5) needs.push({ role: 'BAT', count: 5 - (roles['BAT'] || 0), priority: 'LOW' });

        // Targets (Top 5 fit)
        const targets = availablePlayers
            .map(p => ({
                player: p,
                score: calculatePlayerBaseScore(p),
                isOverseas: p.nationality !== 'India'
            }))
            .filter(t => {
                // Filter out overseas if no slots
                if (remainingOverseas <= 0 && t.isOverseas) return false;
                // Filter if way over budget (heuristic: 2x budget per slot)
                if (t.player.basePrice > remainingBudget) return false;
                return true;
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        return {
            remainingSlots,
            remainingOverseas,
            remainingBudget,
            budgetPerSlot,
            needs,
            targets
        };
    }, [team, config, availablePlayers]);

    const formatMoney = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        return `₹${(amount / 100000).toFixed(2)} L`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-scale-in">
                <div className="p-6 border-b flex justify-between items-center bg-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold">{team.name}</h2>
                        <p className="text-muted text-sm">Squad Analysis</p>
                    </div>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                        Close
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
                    {/* Strategy Section */}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            <span>🧠</span> Strategic Blueprint
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white p-3 rounded shadow-sm">
                                <div className="text-muted text-xs">Budget Per Slot</div>
                                <div className="font-bold text-lg text-green-700">{formatMoney(strategy.budgetPerSlot)}</div>
                            </div>
                            <div className="bg-white p-3 rounded shadow-sm">
                                <div className="text-muted text-xs">Overseas Slots</div>
                                <div className="font-bold text-lg">{strategy.remainingOverseas} Left</div>
                            </div>
                        </div>

                        {strategy.needs.length > 0 && (
                            <div className="mt-3">
                                <div className="text-xs font-bold text-muted uppercase mb-1">Needs</div>
                                <div className="flex flex-wrap gap-2">
                                    {strategy.needs.map((need, idx) => (
                                        <span key={idx} className={`px-2 py-1 rounded text-xs font-bold border ${need.priority === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' :
                                            need.priority === 'MED' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}>
                                            {need.priority === 'HIGH' ? '🔥' : '•'} Need {need.count} {need.role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Target Recommendations */}
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <span>🎯</span> Recommended Targets
                        </h3>
                        <div className="space-y-2">
                            {strategy.targets.length > 0 ? (
                                strategy.targets.map(({ player, score, isOverseas }) => (
                                    <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${player.role === 'BAT' ? 'bg-blue-500' :
                                                player.role === 'BOWL' ? 'bg-green-500' :
                                                    player.role === 'AR' ? 'bg-purple-500' : 'bg-yellow-500'
                                                }`}>
                                                {player.role}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{player.name}</div>
                                                <div className="text-xs text-muted">
                                                    base: {formatMoney(player.basePrice)} {isOverseas ? '✈️' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-green-600">{score.toFixed(0)}</div>
                                            <div className="text-[10px] text-muted">PTS</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 italic p-2">No specific targets found.</div>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                            <span className="font-semibold text-gray-700">Stadium Performance (Avg)</span>
                            <span className="font-bold text-xl text-blue-700">{analysis.totalStadiumScore.toFixed(1)}</span>
                        </div>
                        {/* ... other existing stats ... */}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold">Total Power Score</span>
                        <span className="text-3xl font-bold text-primary gradient-text">{analysis.totalScore.toFixed(2)}</span>
                    </div>

                    <p className="text-xs text-center text-muted mt-4">
                        * This analysis is private to you until the auction ends.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TeamAnalysisModal;
