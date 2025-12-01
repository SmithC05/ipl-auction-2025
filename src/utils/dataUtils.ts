import type { Player } from '../types';

export const parseCSV = (csvText: string): Player[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    // Expected headers: id,name,nationality,role,basePrice,matches,runs,wickets,avg,sr,econ,age,battingStyle,bowlingStyle,imageUrl,set

    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const player: any = {};

        headers.forEach((header, index) => {
            const value = values[index];

            switch (header) {
                case 'id':
                case 'basePrice':
                case 'matches':
                case 'runs':
                case 'wickets':
                case 'age':
                    player[header] = parseInt(value) || 0;
                    break;
                case 'avg':
                case 'sr':
                case 'econ':
                    player[header] = parseFloat(value) || 0.0;
                    break;
                default:
                    player[header] = value;
            }
        });

        // Default set if missing
        if (!player.set) player.set = 'Uncapped Batters';

        return player as Player;
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
