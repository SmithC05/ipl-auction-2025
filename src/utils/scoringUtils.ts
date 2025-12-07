import type { Player, Team } from '../types';
import { STADIUMS } from '../data/stadiums';

interface PlayerPerformance {
    player: Player;
    baseScore: number;
    stadiumScores: Record<string, number>;
    efficiencyScore: number;
}

interface TeamAnalysis {
    teamId: string;
    teamName: string;
    players: PlayerPerformance[];
    totalStadiumScore: number;
    efficiencyBonus: number;
    compositionBonus: number;
    chemistryBonus: number;
    totalScore: number;
}

// 1. Player Base Score
export const calculatePlayerBaseScore = (player: Player): number => {
    let score = 0;

    // Normalize basic stats
    const avg = player.avg || 0;
    const sr = player.sr || 0;
    const wickets = player.wickets || 0;
    const econ = player.econ || 10; // default bad econ
    const matches = player.matches || 0;
    const runs = player.runs || 0;

    if (player.role === 'BAT') {
        score = (avg * 0.4) + (sr * 0.3) + (runs / 200);
    } else if (player.role === 'WK') {
        score = ((avg * 0.4) + (sr * 0.3) + (runs / 200)) * 1.1; // Bonus for WK
    } else if (player.role === 'BOWL') {
        const econPoints = Math.max(0, (10 - econ) * 5);
        score = (wickets * 1.5) + econPoints + (matches * 0.1);
    } else if (player.role === 'AR') {
        const batScore = (avg * 0.4) + (sr * 0.3);
        const bowlScore = (wickets * 1.5) + Math.max(0, (10 - econ) * 5);
        score = (batScore * 0.6) + (bowlScore * 0.6);
    }

    // Cap at 100
    return Math.min(100, Math.max(0, score));
};

// 2. Stadium Impact
export const calculateStadiumImpact = (baseScore: number, player: Player, stadiumId: string): number => {
    const stadium = STADIUMS.find(s => s.id === stadiumId);
    if (!stadium) return baseScore;

    let multiplier = 1.0;
    const isSpinner = player.bowlingStyle && player.bowlingStyle.toLowerCase().includes('spin');
    const isPacer = player.bowlingStyle && (player.bowlingStyle.toLowerCase().includes('fast') || player.bowlingStyle.toLowerCase().includes('medium'));

    if (player.role === 'BAT' || player.role === 'WK') {
        multiplier = stadium.multipliers.BAT;
    } else if (player.role === 'BOWL') {
        if (isSpinner) multiplier = stadium.multipliers.SPIN;
        else if (isPacer) multiplier = stadium.multipliers.PACE;
        else multiplier = 1.0;
    } else if (player.role === 'AR') {
        // Average the impact for AR
        const batM = stadium.multipliers.BAT;
        let bowlM = 1.0;
        if (isSpinner) bowlM = stadium.multipliers.SPIN;
        else if (isPacer) bowlM = stadium.multipliers.PACE;
        multiplier = (batM + bowlM) / 2;
    }

    return baseScore * multiplier;
};

// 3. Efficiency
export const calculateEfficiency = (baseScore: number, price: number): number => {
    if (price === 0) return 0;
    // Heuristic: BaseScore(50) for 50L is 1.0 efficiency. 
    // BaseScore(80) for 10Cr is low efficiency.
    // Price in Lakhs roughly? No, price is in raw number.
    // Let's normalize: Score per 10 Lakhs spent.
    // 50 Score / 50,00,000 = very small.
    // Let's use user formula: baseScore / basePrice (normalized)

    // Better metric: (BaseScore / SoldPrice)
    // 80 score / 10,00,00,000 = 8e-8. Too small.
    // Let's multiply by 100,000
    // 80 * 100,000 / 10,00,00,000 = 8,000,000 / 100,000,000 = 0.08

    // 40 score / 20,00,000 = 4,000,000 / 2,000,000 = 2.0

    return (baseScore * 100000) / Math.max(1, price);
};

// 4. Role Composition
export const calculateCompositionBonus = (players: Player[]): number => {
    let bonus = 0;
    const wks = players.filter(p => p.role === 'WK').length;
    const ars = players.filter(p => p.role === 'AR').length;
    const bowls = players.filter(p => p.role === 'BOWL').length;

    if (wks >= 2) bonus += 10;
    if (ars >= 3) bonus += 15;
    if (bowls >= 5) bonus += 10;
    if (players.length >= 18) bonus += 5;

    return bonus;
};

// 5. Chemistry
export const calculateChemistryBonus = (players: Player[]): number => {
    let bonus = 0;

    // Same Original Team Bonus
    // Count occurrences of 'originalTeam'
    const teamCounts: Record<string, number> = {};
    players.forEach(p => {
        if (p.originalTeam) {
            teamCounts[p.originalTeam] = (teamCounts[p.originalTeam] || 0) + 1;
        }
    });

    Object.values(teamCounts).forEach(count => {
        if (count >= 3) bonus += 5; // 5 points for every cluster of 3+ players
    });

    // Indian vs Overseas Balance
    const overseas = players.filter(p => p.nationality !== 'India').length;
    // Penalty if too many overseas (though auction rules usually prevent this, this measures strictly the squad)
    if (overseas > 8) bonus -= 20;

    return bonus;
};

// MAIN FUNCTION
export const analyzeTeam = (team: Team): TeamAnalysis => {
    const playerPerformances: PlayerPerformance[] = team.squad.map(player => {
        const baseScore = calculatePlayerBaseScore(player);
        const stadiumScores: Record<string, number> = {};
        let sumStadiums = 0;

        STADIUMS.forEach(stadium => {
            const sScore = calculateStadiumImpact(baseScore, player, stadium.id);
            stadiumScores[stadium.id] = sScore;
            sumStadiums += sScore;
        });

        // Current price paid is deduced from (original budget - current budget)? 
        // No, we need individual sold price.
        // Assuming we can get it from somewhere?
        // Wait, the Player object in squad doesn't store 'soldPrice'.
        // BUT team.totalSpent is sum of sold prices.
        // For individual efficiency, we arguably need the sold price.
        // However, in 'Team' interface, squad is Player[].
        // We might need to look up 'soldPlayers' or add 'soldPrice' to Player in squad.
        // For now, let's use 'basePrice' as a proxy for efficiency if we can't find sold price, 
        // OR update the 'SELL_PLAYER' reducer to attach soldPrice to the player object in the squad.
        // Let's assume the reducer adds it or we use basePrice.

        const price = (player as any).soldPrice || player.basePrice;
        const efficiencyScore = calculateEfficiency(baseScore, price);

        return {
            player,
            baseScore,
            stadiumScores,
            efficiencyScore
        };
    });



    const rawStadiumSum = playerPerformances.reduce((sum, p) =>
        sum + Object.values(p.stadiumScores).reduce((a, b) => a + b, 0), 0);

    // Normalize to prevent 10000s
    // Let's take the AVERAGE stadium performance (representing "Performance in a generic season")
    const averageStadiumScore = rawStadiumSum / STADIUMS.length;


    const avgEfficiency = playerPerformances.reduce((sum, p) => sum + p.efficiencyScore, 0) / (playerPerformances.length || 1);
    const efficiencyBonus = avgEfficiency * 10; // Scale up

    const compositionBonus = calculateCompositionBonus(team.squad);
    const chemistryBonus = calculateChemistryBonus(team.squad);

    const totalScore = averageStadiumScore + efficiencyBonus + compositionBonus + chemistryBonus;

    return {
        teamId: team.id,
        teamName: team.name,
        players: playerPerformances,
        totalStadiumScore: averageStadiumScore,
        efficiencyBonus,
        compositionBonus,
        chemistryBonus,
        totalScore: parseFloat(totalScore.toFixed(2))
    };
};
