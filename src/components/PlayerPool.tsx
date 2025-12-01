import React, { useState } from 'react';
import type { Player, AuctionSet } from '../types';

interface PlayerPoolProps {
    players: Player[];
    soldPlayers: Player[];
    unsoldPlayers: Player[];
    setsOrder: AuctionSet[];
    currentSet: AuctionSet;
    onClose: () => void;
}

const PlayerPool: React.FC<PlayerPoolProps> = ({ players, soldPlayers, unsoldPlayers, setsOrder, currentSet, onClose }) => {
    const [activeSet, setActiveSet] = useState<AuctionSet>(currentSet);

    const getPlayerStatus = (playerId: number) => {
        if (soldPlayers.find(p => p.id === playerId)) return 'SOLD';
        if (unsoldPlayers.find(p => p.id === playerId)) return 'UNSOLD';
        return 'AVAILABLE';
    };

    const playersInActiveSet = players.filter(p => p.set === activeSet);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Player Pool</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Sets */}
                    <div className="w-1/3 md:w-1/4 bg-gray-50 border-r overflow-y-auto">
                        {setsOrder.map(set => (
                            <div
                                key={set}
                                className={`p-3 cursor-pointer text-sm font-medium border-b border-gray-100 hover:bg-gray-100 transition-colors ${activeSet === set ? 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveSet(set)}
                            >
                                {set}
                            </div>
                        ))}
                    </div>

                    {/* Main Content - Players */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <h3 className="text-lg font-bold mb-4 text-primary">{activeSet}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {playersInActiveSet.map(player => {
                                const status = getPlayerStatus(player.id);
                                return (
                                    <div key={player.id} className="p-3 border rounded flex justify-between items-center hover:shadow-sm transition-shadow">
                                        <div>
                                            <div className="font-bold text-gray-800">{player.name}</div>
                                            <div className="text-xs text-muted flex gap-2">
                                                <span className={`font-bold ${player.role === 'BAT' ? 'text-blue-600' :
                                                    player.role === 'BOWL' ? 'text-green-600' :
                                                        player.role === 'AR' ? 'text-purple-600' :
                                                            'text-yellow-600'
                                                    }`}>{player.role}</span>
                                                <span>•</span>
                                                <span>{player.nationality}</span>
                                            </div>
                                        </div>
                                        <div>
                                            {status === 'SOLD' && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">SOLD</span>}
                                            {status === 'UNSOLD' && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">UNSOLD</span>}
                                            {status === 'AVAILABLE' && <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">WAITING</span>}
                                        </div>
                                    </div>
                                );
                            })}
                            {playersInActiveSet.length === 0 && (
                                <p className="text-muted text-center col-span-2 py-8">No players in this set.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerPool;
