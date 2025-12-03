import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'players_2025.csv');

// Helper to read CSV
const readCSV = (filename) => {
    const filePath = path.join(PUBLIC_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    return data;
};

// Main processing function
const processData = () => {
    console.log('Reading data files...');
    const soldPlayers = readCSV('IPL_PLAYERS.csv');
    const unsoldPlayers = readCSV('UNSOLD_PLAYERS.csv');
    const battingStats = readCSV('Most Runs All Seasons Combine.csv');
    const bowlingStats = readCSV('Most Wickets All Seasons Combine.csv');

    console.log(`Found ${soldPlayers.length} sold players and ${unsoldPlayers.length} unsold players.`);

    // Create a map of active players (Name -> Details)
    const activePlayers = new Map();

    // Process Sold Players
    soldPlayers.forEach(p => {
        const name = p.PLAYERS || p.Player; // Handle potential header variations
        if (!name) return;
        activePlayers.set(name.trim(), {
            name: name.trim(),
            nationality: p.NATIONALITY,
            role: p.TYPE,
            basePrice: parseInt(p['PRICE PAID'] || '2000000'), // Use price paid as base for sold? Or default
            team: p.TEAM,
            status: 'SOLD'
        });
    });

    // Process Unsold Players
    unsoldPlayers.forEach(p => {
        const name = p.PLAYER || p.Player;
        if (!name) return;
        // If already in map (e.g. sold then unsold? unlikely), skip or overwrite
        if (!activePlayers.has(name.trim())) {
            activePlayers.set(name.trim(), {
                name: name.trim(),
                nationality: p.NATIONALITY,
                role: p.TYPE,
                basePrice: parseInt(p['BASE PRICE'] || '2000000'),
                team: null,
                status: 'UNSOLD'
            });
        }
    });

    console.log(`Total active players: ${activePlayers.size}`);

    // Create Stats Maps
    const battingMap = new Map();
    battingStats.forEach(p => {
        if (p.Player) battingMap.set(p.Player.trim(), p);
    });

    const bowlingMap = new Map();
    bowlingStats.forEach(p => {
        if (p.Player) bowlingMap.set(p.Player.trim(), p);
    });

    // Merge and Format
    const finalPlayers = [];
    let idCounter = 1;

    for (const [name, basicInfo] of activePlayers) {
        const batStat = battingMap.get(name);
        const bowlStat = bowlingMap.get(name);

        // Determine Role for Set mapping
        let set = 'Uncapped Batters';
        const role = basicInfo.role ? basicInfo.role.toUpperCase() : 'BATTER';
        const price = basicInfo.basePrice || 2000000;
        const isOverseas = basicInfo.nationality === 'Overseas';

        // Simple Set Logic
        if (price >= 20000000) {
            set = 'Marquee';
        } else if (role.includes('BATTER')) {
            set = isOverseas ? 'Batters 1' : 'Batters 2';
        } else if (role.includes('BOWLER')) {
            set = isOverseas ? 'Bowlers 1' : 'Bowlers 2';
        } else if (role.includes('ALL-ROUNDER')) {
            set = isOverseas ? 'All-Rounders 1' : 'All-Rounders 2';
        } else if (role.includes('WICKET')) {
            set = isOverseas ? 'Wicketkeepers 1' : 'Wicketkeepers 2';
        }

        // Stats
        const matches = batStat ? parseInt(batStat.Mat) : (bowlStat ? parseInt(bowlStat.Mat) : 0);
        const runs = batStat ? parseInt(batStat.Runs) : 0;
        const wickets = bowlStat ? parseInt(bowlStat.Wkts) : 0;
        const avg = batStat ? parseFloat(batStat.Avg) : 0.0;
        const sr = batStat ? parseFloat(batStat.SR) : 0.0;
        const econ = bowlStat ? parseFloat(bowlStat.Econ) : 0.0;

        finalPlayers.push({
            id: idCounter++,
            name: name,
            nationality: basicInfo.nationality || 'Indian',
            role: role,
            basePrice: price,
            matches: matches,
            runs: runs,
            wickets: wickets,
            avg: avg,
            sr: sr,
            econ: econ,
            age: 25, // Default age as not in CSV
            battingStyle: 'Right-hand bat', // Default
            bowlingStyle: 'Right-arm medium', // Default
            imageUrl: '', // Placeholder
            set: set
        });
    }

    // Convert to CSV
    const csv = Papa.unparse(finalPlayers, {
        columns: ['id', 'name', 'nationality', 'role', 'basePrice', 'matches', 'runs', 'wickets', 'avg', 'sr', 'econ', 'age', 'battingStyle', 'bowlingStyle', 'imageUrl', 'set']
    });

    fs.writeFileSync(OUTPUT_FILE, csv);
    console.log(`Successfully wrote ${finalPlayers.length} players to ${OUTPUT_FILE}`);
};

processData();
