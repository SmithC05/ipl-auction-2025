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
        <div className="card" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-bold text-muted uppercase mb-2">Recent Bids</h3>
            <div className="flex-col gap-2">
                {history.length === 0 ? (
                    <div className="text-sm text-muted italic">No bids yet</div>
                ) : (
                    history.map((bid, index) => (
                        <div key={index} className="flex justify-between text-sm" style={{ padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span className="font-bold">{getTeamName(bid.teamId)}</span>
                            <span className="font-mono text-primary">{formatMoney(bid.amount)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BidHistory;
