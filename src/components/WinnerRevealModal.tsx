import React, { useMemo } from 'react';
import type { Team } from '../types';
import { analyzeTeam } from '../utils/scoringUtils';
import Confetti from 'react-confetti'; // Assuming react-confetti is available or standard overlay

interface WinnerRevealModalProps {
    teams: Team[];
    revealStep: number;
    isHost: boolean;
    onNextReveal: () => void;
    onClose: () => void;
}

const WinnerRevealModal: React.FC<WinnerRevealModalProps> = ({ teams, revealStep, isHost, onNextReveal, onClose }) => {

    // Sort teams by score descending (1st is index 0)
    const rankedTeams = useMemo(() => {
        return teams.map(analyzeTeam).sort((a, b) => b.totalScore - a.totalScore);
    }, [teams]);

    const winner = rankedTeams[0];
    const runnerUp = rankedTeams[1];
    const thirdPlace = rankedTeams[2];

    const getRevealContent = () => {
        if (revealStep === 1) {
            // Show 3rd Place
            if (!thirdPlace) return <div className="text-2xl animate-pulse">Calculating...</div>;
            return (
                <div className="flex flex-col items-center animate-bounce-in">
                    <div className="text-4xl mb-4">🥉</div>
                    <div className="text-2xl font-bold text-orange-700">3rd PLACE</div>
                    <div className="text-4xl font-black mt-2">{thirdPlace.teamName}</div>
                    <div className="text-xl text-muted mt-2">Score: {thirdPlace.totalScore.toFixed(2)}</div>
                </div>
            );
        }
        if (revealStep === 2) {
            // Show 2nd Place
            if (!runnerUp) return null;
            return (
                <div className="flex flex-col items-center animate-slide-up">
                    <div className="text-5xl mb-4">🥈</div>
                    <div className="text-3xl font-bold text-gray-500">RUNNER UP</div>
                    <div className="text-5xl font-black mt-2">{runnerUp.teamName}</div>
                    <div className="text-2xl text-muted mt-2">Score: {runnerUp.totalScore.toFixed(2)}</div>
                    {revealStep >= 2 && thirdPlace && (
                        <div className="mt-8 opacity-50 text-sm">3rd: {thirdPlace.teamName}</div>
                    )}
                </div>
            );
        }
        if (revealStep >= 3) {
            // Show Winner
            return (
                <div className="flex flex-col items-center animate-scale-in">
                    <Confetti numberOfPieces={200} recycle={true} />
                    <div className="text-6xl mb-6">🏆</div>
                    <div className="text-4xl font-bold text-yellow-600">CHAMPION</div>
                    <div className="text-6xl font-black mt-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-700">
                        {winner.teamName}
                    </div>
                    <div className="text-3xl text-gray-700 mt-4 font-mono">Score: {winner.totalScore.toFixed(2)}</div>

                    <div className="flex gap-8 mt-12 opacity-70">
                        <div className="text-center">
                            <div className="text-2xl">🥈</div>
                            <div>{runnerUp?.teamName}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl">🥉</div>
                            <div>{thirdPlace?.teamName}</div>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="text-2xl text-center p-8 animate-pulse">
                The Auction is Complete!<br />
                <span className="text-sm text-muted">Waiting for results...</span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-95 text-white">
            <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-[60vh]">
                {getRevealContent()}

                {isHost && (
                    <div className="mt-12 flex gap-4 z-50">
                        {revealStep < 3 ? (
                            <button
                                onClick={onNextReveal}
                                className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-white/20"
                            >
                                {revealStep === 0 ? 'Reveal 3rd Place' : revealStep === 1 ? 'Reveal Runner Up' : 'Reveal CHAMPION'}
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="bg-transparent border border-white/30 text-white hover:bg-white/10 px-6 py-2 rounded"
                            >
                                Show Full Standings
                            </button>
                        )}
                    </div>
                )}

                {!isHost && revealStep >= 3 && (
                    <button
                        onClick={onClose}
                        className="mt-12 bg-transparent border border-white/30 text-white hover:bg-white/10 px-6 py-2 rounded"
                    >
                        View Full Standings
                    </button>
                )}
            </div>
        </div>
    );
};

export default WinnerRevealModal;
