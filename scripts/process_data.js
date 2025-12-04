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
    const auctionData = readCSV('iplauction2023.csv');
    const battingStats = readCSV('Most Runs All Seasons Combine.csv');
    const bowlingStats = readCSV('Most Wickets All Seasons Combine.csv');

    console.log(`Found ${auctionData.length} players in auction data.`);

    // Create Stats Maps
    const battingMap = new Map();
    battingStats.forEach(p => {
        if (p.Player) battingMap.set(p.Player.trim().toLowerCase(), p);
    });

    const bowlingMap = new Map();
    bowlingStats.forEach(p => {
        if (p.Player) bowlingMap.set(p.Player.trim().toLowerCase(), p);
    });

    const finalPlayers = [];
    let idCounter = 1;

    auctionData.forEach(p => {
        const name = p.name ? p.name.trim() : '';
        if (!name) return;

        // Map Role
        let role = 'BAT';
        const style = p['player style'] ? p['player style'].toLowerCase() : '';
        if (style.includes('batter')) role = 'BAT';
        else if (style.includes('bowler')) role = 'BOWL';
        else if (style.includes('allrounder')) role = 'AR';
        else if (style.includes('wicket')) role = 'WK';

        // Map Price (Lacs to actual value)
        // 20.0 Lacs = 2,000,000
        let basePrice = parseFloat(p['base price (in lacs)'] || '20');
        if (isNaN(basePrice)) basePrice = 20;
        basePrice = basePrice * 100000;

        // Nationality
        const nationality = p.nationality === 'India' ? 'Indian' : 'Overseas';

        // Stats
        const batStat = battingMap.get(name.toLowerCase());
        const bowlStat = bowlingMap.get(name.toLowerCase());

        const matches = batStat ? parseInt(batStat.Mat) : (bowlStat ? parseInt(bowlStat.Mat) : 0);
        const runs = batStat ? parseInt(batStat.Runs) : 0;
        const wickets = bowlStat ? parseInt(bowlStat.Wkts) : 0;
        const avg = batStat ? parseFloat(batStat.Avg) : 0.0;
        const sr = batStat ? parseFloat(batStat.SR) : 0.0;
        const econ = bowlStat ? parseFloat(bowlStat.Econ) : 0.0;

        // Set Logic
        let set = 'Uncapped Batters';

        // High value or high stats = Marquee / Set 1
        const isStar = basePrice >= 10000000 || matches > 50;

        if (basePrice >= 200000000) { // 2 Cr+
            set = 'Marquee';
        } else {
            if (role === 'BAT') {
                if (isStar) set = nationality === 'Overseas' ? 'Batters 1' : 'Batters 2';
                else set = 'Uncapped Batters';
            } else if (role === 'BOWL') {
                if (isStar) set = nationality === 'Overseas' ? 'Bowlers 1' : 'Bowlers 2';
                else set = 'Uncapped Bowlers';
            } else if (role === 'AR') {
                if (isStar) set = nationality === 'Overseas' ? 'All-Rounders 1' : 'All-Rounders 2';
                else set = 'Uncapped AR';
            } else if (role === 'WK') {
                if (isStar) set = nationality === 'Overseas' ? 'Wicketkeepers 1' : 'Wicketkeepers 2';
                else set = 'Uncapped WK';
            }
        }

        // Override for very experienced players to ensure they aren't "Uncapped"
        if (matches > 0 && set.includes('Uncapped')) {
            if (role === 'BAT') set = 'Batters 3';
            else if (role === 'BOWL') set = 'Bowlers 3';
            else if (role === 'AR') set = 'All-Rounders 3';
            else if (role === 'WK') set = 'Wicketkeepers 2';
        }

        finalPlayers.push({
            id: idCounter++,
            name: name,
            nationality: nationality,
            role: role,
            basePrice: basePrice,
            matches: matches,
            runs: runs,
            wickets: wickets,
            avg: avg,
            sr: sr,
            econ: econ,
            age: 25, // Default
            battingStyle: 'Right-hand bat',
            bowlingStyle: 'Right-arm medium',
            imageUrl: '',
            set: set
        });
    });

    // Convert to CSV
    const csv = Papa.unparse(finalPlayers, {
        columns: ['id', 'name', 'nationality', 'role', 'basePrice', 'matches', 'runs', 'wickets', 'avg', 'sr', 'econ', 'age', 'battingStyle', 'bowlingStyle', 'imageUrl', 'set']
    });

    fs.writeFileSync(OUTPUT_FILE, csv);
    console.log(`Successfully wrote ${finalPlayers.length} players to ${OUTPUT_FILE}`);
};

processData();
