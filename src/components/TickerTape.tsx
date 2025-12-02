import React from 'react';
import { motion } from 'framer-motion';
import type { Bid, Team } from '../types';

interface TickerTapeProps {
    bids: Bid[];
    teams: Team[];
}

const TickerTape: React.FC<TickerTapeProps> = ({ bids, teams }) => {
    if (bids.length === 0) return null;

    const recentActivity = bids.slice(0, 5).map(bid => {
        const team = teams.find(t => t.id === bid.teamId);
        return `${team?.name || 'Unknown'} bid ₹${(bid.amount / 10000000).toFixed(2)} Cr`;
    }).join('  •  ');

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-400 text-black py-1 z-30 overflow-hidden border-t border-yellow-500">
            <motion.div
                className="whitespace-nowrap text-xs font-mono uppercase tracking-widest"
                animate={{ x: [window.innerWidth, -1000] }}
                transition={{
                    repeat: Infinity,
                    duration: 20,
                    ease: "linear"
                }}
            >
                LATEST ACTIVITY: {recentActivity}  •  LATEST ACTIVITY: {recentActivity}
            </motion.div>
        </div>
    );
};

export default TickerTape;
