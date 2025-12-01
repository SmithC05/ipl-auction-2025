import React, { useState, useEffect } from 'react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('ipl_auction_help_hidden');
        if (saved === 'true') {
            // If parent controls open state, we might not need this check here, 
            // but it's good for self-containment if we move logic later.
            // For now, parent handles initial open.
        }
    }, []);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('ipl_auction_help_hidden', 'true');
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4 text-center border-b pb-2">Welcome to IPL Auction 2025</h2>

                    <div className="space-y-4 text-sm text-gray-700">
                        <section>
                            <h3 className="font-bold text-lg text-black">🎯 Objective</h3>
                            <p>Build the strongest team possible within your budget. Your team is rated based on batting, bowling, and balance.</p>
                        </section>

                        <section>
                            <h3 className="font-bold text-lg text-black">🔨 How to Bid</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Wait for the player to appear.</li>
                                <li>Click <span className="font-bold bg-blue-600 text-white px-1 rounded text-xs">BID</span> to place a bid.</li>
                                <li>Use <span className="font-bold bg-gray-200 px-1 rounded text-xs">+50L</span> or <span className="font-bold bg-gray-200 px-1 rounded text-xs">+1Cr</span> for big jumps.</li>
                                <li>If you are the highest bidder when the timer ends, you win the player!</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="font-bold text-lg text-black">⚙️ Rules</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Sets:</strong> Players come in sets (Marquee, Batters, Bowlers, etc.).</li>
                                <li><strong>Budget:</strong> You have a limited purse (e.g., ₹100 Cr). Spend wisely!</li>
                                <li><strong>Squad:</strong> You need a minimum of 12 players.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="font-bold text-lg text-black">🤖 Auto-Bid</h3>
                            <p>Enable "Auto-Bid" to let the system bid for you up to a specific limit. Useful for fast-paced action!</p>
                        </section>
                    </div>

                    <div className="mt-6 pt-4 border-t flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer justify-center text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={dontShowAgain}
                                onChange={(e) => setDontShowAgain(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            Don't show this again
                        </label>
                        <button
                            onClick={handleClose}
                            className="w-full bg-black text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors"
                        >
                            Start Auction
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
