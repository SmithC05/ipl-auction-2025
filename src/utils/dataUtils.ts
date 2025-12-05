import type { Player } from '../types';

export const parseCSV = (csvText: string): Player[] => {
    const lines = csvText.trim().split('\n');
    // Skip header
    const dataLines = lines.slice(1);

    const parsePrice = (priceStr: string): number => {
        if (!priceStr) return 0;
        const cleanStr = priceStr.toUpperCase().replace(/,/g, '').trim();
        if (cleanStr.includes('CR')) {
            return parseFloat(cleanStr.replace('CR', '')) * 10000000;
        }
        if (cleanStr.includes('L')) {
            return parseFloat(cleanStr.replace('L', '')) * 100000;
        }
        return parseFloat(cleanStr) || 0;
    };

    const mapRole = (role: string): any => {
        const r = role.toUpperCase().trim();
        if (r.includes('WK') || r.includes('WICKETKEEPER')) return 'WK';
        if (r.includes('BAT') || r.includes('BATTER')) return 'BAT';
        if (r.includes('BOWL') || r.includes('BOWLER')) return 'BOWL';
        if (r.includes('AR') || r.includes('ALL-ROUNDER')) return 'AR';
        return 'AR'; // Default
    };

    return dataLines.map((line, index) => {
        // Split by comma, ignoring commas inside quotes
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));

        // CSV Columns:
        // 0: Set No, 1: 2025 Set, 2: Player Name, 3: Age, 4: Country, 5: Specialism, 
        // 6: Batting Style, 7: Bowling Style, 8: Capped?, 9: Previous Team, 
        // 10: Base Price, 11: Matches, 12: Runs, 13: Wickets, 14: Avg (Bat), 15: SR (Bat), 16: Econ, 17: Overseas

        const player: Player = {
            id: index + 1,
            name: values[2],
            age: parseInt(values[3]) || 0,
            nationality: values[4],
            role: mapRole(values[5]),
            battingStyle: values[6],
            bowlingStyle: values[7],
            basePrice: parsePrice(values[10]),
            matches: parseInt(values[11]) || 0,
            runs: parseInt(values[12]) || 0,
            wickets: parseInt(values[13]) || 0,
            avg: parseFloat(values[14]) || 0,
            sr: parseFloat(values[15]) || 0,
            econ: parseFloat(values[16]) || 0,
            set: values[1] || 'Uncapped',
            imageUrl: '', // No image URL in CSV
        };

        return player;
    });
};

export const compressPlayers = (players: Player[]): string => {
    if (players.length === 0) return '[]';
    const headers = Object.keys(players[0]);
    const rows = players.map(p => headers.map(h => (p as any)[h]));
    return JSON.stringify({ h: headers, d: rows });
};

export const decompressPlayers = (compressedString: string): Player[] => {
    try {
        const data = JSON.parse(compressedString);
        if (Array.isArray(data)) return data; // Backward compatibility for plain JSON

        const { h, d } = data;
        return d.map((row: any[]) => {
            const player: any = {};
            h.forEach((header: string, index: number) => {
                player[header] = row[index];
            });
            return player as Player;
        });
    } catch (e) {
        console.error("Failed to decompress players", e);
        return [];
    }
};

export const saveToStorage = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Storage full or unavailable", e);
    }
};

export const loadFromStorage = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};
