import React from 'react';
import type { Player } from '../types';

interface PlayerFlipCardProps {
    player: Player | null;
}

const PlayerFlipCard: React.FC<PlayerFlipCardProps> = ({ player }) => {
    if (!player) return (
        <div className="h-64 w-full bg-gray-100 rounded-lg flex items-center justify-center text-muted">
            Waiting for next player...
        </div>
    );

    return (
        <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="flex flex-col">
                {/* Header / Image Area */}
                <div className="bg-gray-100 p-6 flex justify-center items-center">
                    <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-6xl shadow-inner">
                        {player.role === 'BAT' ? '🏏' : player.role === 'BOWL' ? '⚾' : player.role === 'WK' ? '🧤' : '⚔️'}
                    </div>
                </div>

                {/* Player Details */}
                <div className="p-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{player.name}</h2>

                    <div className="flex justify-center gap-3 mb-4">
                        <span className="badge bg-blue-100 text-blue-800 text-sm px-3 py-1">{player.role}</span>
                        <span className="badge bg-gray-100 text-gray-800 text-sm px-3 py-1">{player.nationality}</span>
                        <span className="badge bg-yellow-100 text-yellow-800 text-sm px-3 py-1">{player.age} yrs</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-3 rounded-lg">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted uppercase font-bold">Matches</span>
                            <span className="text-lg font-bold">{player.matches}</span>
                        </div>
                        {player.role === 'BOWL' || player.role === 'AR' ? (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted uppercase font-bold">Wickets</span>
                                    <span className="text-lg font-bold">{player.wickets}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted uppercase font-bold">Economy</span>
                                    <span className="text-lg font-bold">{player.econ}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted uppercase font-bold">Runs</span>
                                    <span className="text-lg font-bold">{player.runs}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted uppercase font-bold">Strike Rate</span>
                                    <span className="text-lg font-bold">{player.sr}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <div className="text-sm text-muted uppercase tracking-wide font-bold mb-1">Base Price</div>
                        <div className="text-3xl font-bold text-primary">₹{(player.basePrice / 10000000).toFixed(2)} Cr</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerFlipCard;
