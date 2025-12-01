import React from 'react';
import type { Bid } from '../types';
import { TEAMS_CONFIG } from '../types';

interface BidHistoryProps {
    history: Bid[];
}

const BidHistory: React.FC<BidHistoryProps> = ({ history }) => {
    const getTeamName = (teamId: string) => {
        return TEAMS_CONFIG.find(t => t.id === teamId)?.shortName || teamId;
    };

    const formatMoney = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        return `₹${(amount / 100000).toFixed(2)} L`;
    };

    return (
        <div className="card bg-gray-50">
            <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Recent Bids</h3>
            <div className="space-y-1">
                {history.length === 0 ? (
                    <div className="text-sm text-gray-400 italic">No bids yet</div>
                ) : (
                    history.map((bid, index) => (
                        <div key={index} className="flex justify-between text-sm animate-fade-in">
                            <span className="font-medium">{getTeamName(bid.teamId)}</span>
                            <span className="font-mono">{formatMoney(bid.amount)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BidHistory;
