import React, { useState, useMemo } from 'react';
import type { Team, AuctionConfig } from '../types';
import { getOverseasCount, getRoleCounts } from '../utils/gameLogic';
import { analyzeTeam } from '../utils/scoringUtils';

interface MyTeamStatsProps {
    team: Team;
    config: AuctionConfig;
    onSwitchTeam?: () => void;
}

const MyTeamStats: React.FC<MyTeamStatsProps> = ({ team, config, onSwitchTeam }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const overseasCount = getOverseasCount(team.squad);
    const roleCounts = getRoleCounts(team.squad);
    const budgetUsed = team.totalSpent;
    const budgetPercent = (budgetUsed / config.budget) * 100;
    const squadPercent = (team.squad.length / config.maxPlayersPerTeam) * 100;

    const analysis = useMemo(() => analyzeTeam(team), [team]);

    const formatMoney = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        return `₹${(amount / 100000).toFixed(2)} L`;
    };

    return (
        <div className="card mb-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: team.color }}></div>
                    <h3 className="font-bold text-lg">{team.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                    {onSwitchTeam && (
                        <button
                            onClick={onSwitchTeam}
                            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                            title="Switch Team"
                        >
                            ⇄ Switch
                        </button>
                    )}
                    <div className="text-right cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                        <div className="text-xs text-muted">Remaining Purse</div>
                        <div className="font-bold text-primary">{formatMoney(team.budget)}</div>
                    </div>
                </div>
            </div>

            {/* Progress Bars (Always Visible) */}
            <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">Squad</span>
                        <span className="font-bold">{team.squad.length} / {config.maxPlayersPerTeam}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, squadPercent)}%` }}
                        ></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">Overseas</span>
                        <span className={`font-bold ${overseasCount > config.maxOverseas ? 'text-red-500' : ''}`}>
                            {overseasCount} / {config.maxOverseas}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${overseasCount > config.maxOverseas ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, (overseasCount / config.maxOverseas) * 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs text-muted">BAT</div>
                            <div className="font-bold">{roleCounts.BAT}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs text-muted">BOWL</div>
                            <div className="font-bold">{roleCounts.BOWL}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs text-muted">AR</div>
                            <div className="font-bold">{roleCounts.AR}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs text-muted">WK</div>
                            <div className="font-bold">{roleCounts.WK}</div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-muted mb-2 uppercase">Power Analysis</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                                <span>Stadium:</span>
                                <span className="font-bold">{analysis.totalStadiumScore.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Efficiency:</span>
                                <span className="font-bold text-green-600">+{analysis.efficiencyBonus.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Balance:</span>
                                <span className="font-bold text-purple-600">+{analysis.compositionBonus}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Chemistry:</span>
                                <span className="font-bold text-blue-600">+{analysis.chemistryBonus}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
                            <span className="font-bold text-gray-700">Total Score</span>
                            <span className="font-bold text-xl text-primary">{analysis.totalScore.toFixed(1)}</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted">Budget Used</span>
                            <span className="font-bold">{budgetPercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, budgetPercent)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-muted">
                            <span>Spent: {formatMoney(budgetUsed)}</span>
                            <span>Total: {formatMoney(config.budget)}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center mt-2">
                <span className="text-xs text-muted cursor-pointer hover:text-primary" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'Show Less' : 'Show More Stats'}
                </span>
            </div>
        </div>
    );
};

export default MyTeamStats;
