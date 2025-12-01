import React from 'react';
import type { Player } from '../types';

interface PlayerCardProps {
    player: Player;
    compact?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, compact = false }) => {
    // Format currency (Indian format: Crores/Lakhs)
    const formatPrice = (price: number) => {
        if (price >= 10000000) {
            return `₹${(price / 10000000).toFixed(2)} Cr`;
        }
        return `₹${(price / 100000).toFixed(0)} L`;
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'BAT': return 'bg-blue-100 text-blue-800';
            case 'BOWL': return 'bg-green-100 text-green-800';
            case 'AR': return 'bg-purple-100 text-purple-800';
            case 'WK': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className={`card ${compact ? 'p-2' : 'p-4'} bg-white shadow-sm border border-gray-200 rounded-lg`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className={`font-bold ${compact ? 'text-base' : 'text-xl'}`}>{player.name}</h3>
                    <div className="flex gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(player.role)}`}>
                            {player.role}
                        </span>
                        {player.set && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                {player.set}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-500 block mt-1">{player.nationality}</span>
                </div>
                <div className="text-right">
                    <div className="font-bold text-lg">{formatPrice(player.basePrice)}</div>
                    <div className="text-xs text-gray-500">Base Price</div>
                </div>
            </div>

            {!compact && player.imageUrl && (
                <div className="mb-4 flex justify-center">
                    <img
                        src={player.imageUrl}
                        alt={player.name}
                        className="h-32 w-32 object-cover rounded-full border-2 border-gray-100"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/128x128?text=Player'; }}
                    />
                </div>
            )}

            {!compact && (
                <div className="grid grid-cols-3 gap-2 text-center text-sm mt-4">
                    <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold">{player.matches}</div>
                        <div className="text-xs text-gray-500">Matches</div>
                    </div>
                    {player.role !== 'BOWL' && (
                        <>
                            <div className="bg-gray-50 p-2 rounded">
                                <div className="font-bold">{player.runs}</div>
                                <div className="text-xs text-gray-500">Runs</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <div className="font-bold">{player.sr}</div>
                                <div className="text-xs text-gray-500">SR</div>
                            </div>
                        </>
                    )}
                    {(player.role === 'BOWL' || player.role === 'AR') && (
                        <>
                            <div className="bg-gray-50 p-2 rounded">
                                <div className="font-bold">{player.wickets}</div>
                                <div className="text-xs text-gray-500">Wickets</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <div className="font-bold">{player.econ}</div>
                                <div className="text-xs text-gray-500">Econ</div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlayerCard;
