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

    const getRoleBadgeStyle = (role: string) => {
        const baseStyle = { padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' };
        switch (role) {
            case 'BAT': return { ...baseStyle, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }; // Blue
            case 'BOWL': return { ...baseStyle, background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }; // Green
            case 'AR': return { ...baseStyle, background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }; // Purple
            case 'WK': return { ...baseStyle, background: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }; // Yellow
            default: return { ...baseStyle, background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' }; // Gray
        }
    };

    return (
        <div className="card" style={{ padding: compact ? 'var(--spacing-sm)' : 'var(--spacing-lg)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className={compact ? 'text-lg font-bold' : 'text-xl font-bold'} style={{ color: 'var(--color-text)' }}>{player.name}</h3>
                    <div className="flex gap-2 mt-2">
                        <span style={getRoleBadgeStyle(player.role)}>
                            {player.role}
                        </span>
                        {player.set && (
                            <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                                {player.set}
                            </span>
                        )}
                    </div>
                    <span className="text-sm text-muted" style={{ display: 'block', marginTop: '4px' }}>{player.nationality}</span>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{formatPrice(player.basePrice)}</div>
                    <div className="text-sm text-muted">Base Price</div>
                </div>
            </div>

            {!compact && player.imageUrl && (
                <div className="mb-4 flex justify-center">
                    <img
                        src={player.imageUrl}
                        alt={player.name}
                        style={{ height: '128px', width: '128px', objectFit: 'cover', borderRadius: '50%', border: '4px solid var(--color-surface-hover)' }}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/128x128?text=Player'; }}
                    />
                </div>
            )}

            {!compact && (
                <div className="grid grid-cols-3 gap-2 text-center text-sm mt-4">
                    <div style={{ background: 'var(--color-surface-hover)', padding: '8px', borderRadius: 'var(--border-radius)' }}>
                        <div className="font-bold">{player.matches}</div>
                        <div className="text-xs text-muted">Matches</div>
                    </div>
                    {player.role !== 'BOWL' && (
                        <>
                            <div style={{ background: 'var(--color-surface-hover)', padding: '8px', borderRadius: 'var(--border-radius)' }}>
                                <div className="font-bold">{player.runs}</div>
                                <div className="text-xs text-muted">Runs</div>
                            </div>
                            <div style={{ background: 'var(--color-surface-hover)', padding: '8px', borderRadius: 'var(--border-radius)' }}>
                                <div className="font-bold">{player.sr}</div>
                                <div className="text-xs text-muted">SR</div>
                            </div>
                        </>
                    )}
                    {(player.role === 'BOWL' || player.role === 'AR') && (
                        <>
                            <div style={{ background: 'var(--color-surface-hover)', padding: '8px', borderRadius: 'var(--border-radius)' }}>
                                <div className="font-bold">{player.wickets}</div>
                                <div className="text-xs text-muted">Wickets</div>
                            </div>
                            <div style={{ background: 'var(--color-surface-hover)', padding: '8px', borderRadius: 'var(--border-radius)' }}>
                                <div className="font-bold">{player.econ}</div>
                                <div className="text-xs text-muted">Econ</div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlayerCard;
