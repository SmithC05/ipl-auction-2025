import React, { useMemo } from 'react';
import type { Team } from '../types';
import { analyzeTeam } from '../utils/scoringUtils';

interface TeamAnalysisModalProps {
    team: Team;
    onClose: () => void;
}

const TeamAnalysisModal: React.FC<TeamAnalysisModalProps> = ({ team, onClose }) => {
    const analysis = useMemo(() => analyzeTeam(team), [team]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-scale-in">
                <div className="p-6 border-b flex justify-between items-center bg-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold">{team.name}</h2>
                        <p className="text-muted text-sm">Squad Analysis</p>
                    </div>
                    <button onClick={onClose} className="text-3xl hover:text-red-500">&times;</button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <span className="font-semibold text-gray-700">Stadium Performance (Avg)</span>
                        <span className="font-bold text-xl text-blue-700">{analysis.totalStadiumScore.toFixed(1)}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <span className="font-semibold text-gray-700">Auction Efficiency</span>
                        <span className="font-bold text-xl text-green-700">+{analysis.efficiencyBonus.toFixed(1)}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                        <span className="font-semibold text-gray-700">Role Composition</span>
                        <span className="font-bold text-xl text-purple-700">+{analysis.compositionBonus}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-indigo-50 rounded">
                        <span className="font-semibold text-gray-700">Team Chemistry</span>
                        <span className="font-bold text-xl text-indigo-700">+{analysis.chemistryBonus}</span>
                    </div>

                    <hr />

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
