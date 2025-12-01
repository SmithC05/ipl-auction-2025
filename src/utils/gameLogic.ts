import type { Player, Team } from '../types';
import { DEFAULT_BUDGET } from '../types';

// Heuristic to calculate a single rating number for a player
export const calculatePlayerRating = (player: Player): number => {
    let rating = 0;

    // Normalize stats to a 0-100 scale roughly
    if (player.role === 'BAT' || player.role === 'WK') {
        // Batting focus: Avg (0-60), SR (100-180)
        rating = (player.avg * 0.8) + (player.sr * 0.4);
    } else if (player.role === 'BOWL') {
        // Bowling focus: Wickets, Econ (lower is better)
        // Econ 6.0 -> 40pts, 10.0 -> 0pts
        const econScore = Math.max(0, (10 - player.econ) * 10);
        const wicketScore = player.wickets * 1.5; // 20 wickets -> 30pts
        rating = econScore + wicketScore;
    } else if (player.role === 'AR') {
        // Balanced
        const batRating = (player.avg * 0.5) + (player.sr * 0.2);
        const bowlRating = Math.max(0, (10 - player.econ) * 5) + (player.wickets * 1);
        rating = batRating + bowlRating;
    }

    return Math.min(100, Math.max(0, rating));
};

export const calculateTeamStrength = (team: Team): number => {
    const players = team.squad;
    if (players.length === 0) return 0;

    // 1. Batting Score (Top 6 batters by rating)
    const batters = players.map(p => ({ ...p, rating: calculatePlayerRating(p) }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
    const battingScore = batters.reduce((sum, p) => sum + p.rating, 0);
    // Normalize: Max possible ~600. Scale to 0-100.
    const normBatting = (battingScore / 600) * 100;

    // 2. Bowling Score (Top 5 bowlers by rating)
    // Filter for those who can bowl (BOWL or AR)
    const bowlers = players.filter(p => p.role === 'BOWL' || p.role === 'AR')
        .map(p => ({ ...p, rating: calculatePlayerRating(p) }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
    const bowlingScore = bowlers.reduce((sum, p) => sum + p.rating, 0);
    // Normalize: Max possible ~500. Scale to 0-100.
    const normBowling = (bowlingScore / 500) * 100;

    // 3. All Rounder Bonus
    const allRounders = players.filter(p => p.role === 'AR');
    const arCount = allRounders.length;
    const arAvgRating = arCount > 0
        ? allRounders.reduce((sum, p) => sum + calculatePlayerRating(p), 0) / arCount
        : 0;
    // Bonus: Count * Avg. Cap at some reasonable value.
    // e.g. 3 ARs with avg 50 -> 150. Normalize to 0-100.
    const normAR = Math.min(100, (arCount * arAvgRating) / 2);

    // 4. Budget Efficiency
    // (TotalBaseValue / Budget)
    // If you got 150Cr worth of players for 100Cr, that's good.
    const totalBaseValue = players.reduce((sum, p) => sum + p.basePrice, 0);
    const efficiencyRatio = totalBaseValue / DEFAULT_BUDGET;
    // Normalize: 1.0 is baseline, 1.5 is great.
    const normEfficiency = Math.min(100, efficiencyRatio * 60); // 1.5 * 60 = 90

    // Final Formula
    // 0.45 * Batting + 0.35 * Bowling + 0.10 * AR + 0.10 * Efficiency
    const totalScore =
        (0.45 * normBatting) +
        (0.35 * normBowling) +
        (0.10 * normAR) +
        (0.10 * normEfficiency);

    return parseFloat(totalScore.toFixed(2));
};

export const shuffleTeams = (teamsConfig: typeof import('../types').TEAMS_CONFIG, count: number, userTeamId?: string): Team[] => {
    // Fisher-Yates shuffle
    const shuffled = [...teamsConfig];

    // If user selected a team, ensure it's in the pool
    if (userTeamId) {
        const userTeamIndex = shuffled.findIndex(t => t.id === userTeamId);
        if (userTeamIndex > -1) {
            // Move user team to the front to ensure it's picked
            [shuffled[0], shuffled[userTeamIndex]] = [shuffled[userTeamIndex], shuffled[0]];

            // Shuffle the rest (from index 1 onwards)
            for (let i = shuffled.length - 1; i > 1; i--) {
                const j = Math.floor(Math.random() * i) + 1; // Random index from 1 to i
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
        } else {
            // Fallback shuffle if not found (shouldn't happen)
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
        }
    } else {
        // Standard shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
    }

    return shuffled.slice(0, count).map(t => ({
        ...t,
        budget: DEFAULT_BUDGET,
        squad: [],
        totalSpent: 0
    }));
};

export const getOverseasCount = (players: Player[]): number => {
    return players.filter(p => p.nationality !== 'India').length;
};

export const getRoleCounts = (players: Player[]) => {
    return {
        BAT: players.filter(p => p.role === 'BAT').length,
        BOWL: players.filter(p => p.role === 'BOWL').length,
        AR: players.filter(p => p.role === 'AR').length,
        WK: players.filter(p => p.role === 'WK').length,
    };
};
