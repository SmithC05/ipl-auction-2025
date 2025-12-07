import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        return (
            <AnimatePresence mode="wait">
                {revealStep === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, scale: 0.5, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -100 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="flex flex-col items-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
                            className="text-6xl mb-4"
                        >
                            🥉
                        </motion.div>
                        <div className="text-2xl font-bold text-orange-700">3rd PLACE</div>
                        <div className="text-5xl font-black mt-4">{thirdPlace?.teamName}</div>
                        <div className="text-2xl text-muted mt-2">Score: {thirdPlace?.totalScore.toFixed(2)}</div>
                    </motion.div>
                )}

                {revealStep === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, scale: 0.5, x: -100 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="flex flex-col items-center"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2 }}
                            className="text-7xl mb-4"
                        >
                            🥈
                        </motion.div>
                        <div className="text-3xl font-bold text-gray-500">RUNNER UP</div>
                        <div className="text-6xl font-black mt-4">{runnerUp?.teamName}</div>
                        <div className="text-3xl text-muted mt-2">Score: {runnerUp?.totalScore.toFixed(2)}</div>
                        {thirdPlace && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.5 }}
                                className="mt-8 text-lg"
                            >
                                3rd: {thirdPlace.teamName}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {revealStep >= 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 2 }} // Start HUGE
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="flex flex-col items-center relative"
                    >
                        <Confetti numberOfPieces={300} recycle={true} gravity={0.2} />

                        {/* Radioactive Glow Effect */}
                        <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 rounded-full animate-pulse z-[-1]" />

                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="text-8xl mb-6 drop-shadow-2xl"
                        >
                            🏆
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-4xl font-bold text-yellow-600 tracking-widest uppercase mb-2"
                        >
                            CHAMPION
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8, type: "spring" }}
                            className="text-7xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 drop-shadow-sm pb-2"
                        >
                            {winner?.teamName}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                            className="text-4xl text-gray-700 mt-6 font-mono font-bold"
                        >
                            Score: {winner?.totalScore.toFixed(2)}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2, delayChildren: 2.2, staggerChildren: 0.2 }}
                            className="flex gap-12 mt-16 opacity-70"
                        >
                            <div className="text-center">
                                <div className="text-4xl">🥈</div>
                                <div className="font-bold mt-2">{runnerUp?.teamName}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl">🥉</div>
                                <div className="font-bold mt-2">{thirdPlace?.teamName}</div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {revealStep === 0 && (
                    <motion.div
                        key="waiting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-2xl text-center p-8 text-black"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="mb-4"
                        >
                            🤔
                        </motion.div>
                        The Auction is Complete!<br />
                        <span className="text-sm text-gray-600">Calculating Results...</span>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/95 text-black">
            <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-[60vh]">
                {getRevealContent()}

                {isHost && (
                    <div className="mt-12 flex gap-4 z-50">
                        {revealStep < 3 ? (
                            <button
                                onClick={onNextReveal}
                                className="bg-gray-100 text-black border-2 border-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-black/10"
                            >
                                {revealStep === 0 ? 'Reveal 3rd Place' : revealStep === 1 ? 'Reveal Runner Up' : 'Reveal CHAMPION'}
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="bg-transparent border border-black/30 text-black hover:bg-black/10 px-6 py-2 rounded"
                            >
                                Show Full Standings
                            </button>
                        )}
                    </div>
                )}

                {!isHost && revealStep >= 3 && (
                    <button
                        onClick={onClose}
                        className="mt-12 bg-transparent border border-black/30 text-black hover:bg-black/10 px-6 py-2 rounded"
                    >
                        View Full Standings
                    </button>
                )}
            </div>
        </div>
    );
};

export default WinnerRevealModal;
