import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Massive list of real players
const REAL_PLAYERS_DB = [
    // MARQUEE / TOP PLAYERS
    { name: "Virat Kohli", role: "BAT", nationality: "India", basePrice: 20000000, set: "Marquee" },
    { name: "Rohit Sharma", role: "BAT", nationality: "India", basePrice: 20000000, set: "Marquee" },
    { name: "Jasprit Bumrah", role: "BOWL", nationality: "India", basePrice: 20000000, set: "Marquee" },
    { name: "Ravindra Jadeja", role: "AR", nationality: "India", basePrice: 20000000, set: "Marquee" },
    { name: "Hardik Pandya", role: "AR", nationality: "India", basePrice: 20000000, set: "Marquee" },
    { name: "Suryakumar Yadav", role: "BAT", nationality: "India", basePrice: 20000000, set: "Marquee" },
    { name: "Rishabh Pant", role: "WK", nationality: "India", basePrice: 20000000, set: "Marquee" },
    { name: "Shreyas Iyer", role: "BAT", nationality: "India", basePrice: 20000000, set: "Marquee" },
    { name: "KL Rahul", role: "WK", nationality: "India", basePrice: 20000000, set: "Marquee" },
    { name: "Mohammed Shami", role: "BOWL", nationality: "India", basePrice: 20000000, set: "Marquee" },
    { name: "Pat Cummins", role: "AR", nationality: "Australia", basePrice: 20000000, set: "Marquee" },
    { name: "Mitchell Starc", role: "BOWL", nationality: "Australia", basePrice: 20000000, set: "Marquee" },
    { name: "Travis Head", role: "BAT", nationality: "Australia", basePrice: 20000000, set: "Marquee" },
    { name: "Ben Stokes", role: "AR", nationality: "England", basePrice: 20000000, set: "Marquee" },
    { name: "Jos Buttler", role: "WK", nationality: "England", basePrice: 20000000, set: "Marquee" },
    { name: "Rashid Khan", role: "BOWL", nationality: "Afghanistan", basePrice: 20000000, set: "Marquee" },
    { name: "Andre Russell", role: "AR", nationality: "West Indies", basePrice: 20000000, set: "Marquee" },
    { name: "Sunil Narine", role: "AR", nationality: "West Indies", basePrice: 20000000, set: "Marquee" },
    { name: "Glenn Maxwell", role: "AR", nationality: "Australia", basePrice: 20000000, set: "Marquee" },
    { name: "David Warner", role: "BAT", nationality: "Australia", basePrice: 20000000, set: "Marquee" },

    // BATTERS 1
    { name: "Shubman Gill", role: "BAT", nationality: "India", basePrice: 20000000, set: "Batters 1" },
    { name: "Yashasvi Jaiswal", role: "BAT", nationality: "India", basePrice: 20000000, set: "Batters 1" },
    { name: "Ruturaj Gaikwad", role: "BAT", nationality: "India", basePrice: 15000000, set: "Batters 1" },
    { name: "Faf du Plessis", role: "BAT", nationality: "South Africa", basePrice: 20000000, set: "Batters 1" },
    { name: "Kane Williamson", role: "BAT", nationality: "New Zealand", basePrice: 20000000, set: "Batters 1" },
    { name: "Steve Smith", role: "BAT", nationality: "Australia", basePrice: 20000000, set: "Batters 1" },
    { name: "Rinku Singh", role: "BAT", nationality: "India", basePrice: 10000000, set: "Batters 1" },
    { name: "Shimron Hetmyer", role: "BAT", nationality: "West Indies", basePrice: 15000000, set: "Batters 1" },
    { name: "David Miller", role: "BAT", nationality: "South Africa", basePrice: 15000000, set: "Batters 1" },
    { name: "Tilak Varma", role: "BAT", nationality: "India", basePrice: 10000000, set: "Batters 1" },

    // ALL-ROUNDERS 1
    { name: "Cameron Green", role: "AR", nationality: "Australia", basePrice: 20000000, set: "All-Rounders 1" },
    { name: "Sam Curran", role: "AR", nationality: "England", basePrice: 20000000, set: "All-Rounders 1" },
    { name: "Liam Livingstone", role: "AR", nationality: "England", basePrice: 15000000, set: "All-Rounders 1" },
    { name: "Axar Patel", role: "AR", nationality: "India", basePrice: 15000000, set: "All-Rounders 1" },
    { name: "Marcus Stoinis", role: "AR", nationality: "Australia", basePrice: 15000000, set: "All-Rounders 1" },
    { name: "Moeen Ali", role: "AR", nationality: "England", basePrice: 15000000, set: "All-Rounders 1" },
    { name: "Mitchell Marsh", role: "AR", nationality: "Australia", basePrice: 15000000, set: "All-Rounders 1" },
    { name: "Shivam Dube", role: "AR", nationality: "India", basePrice: 10000000, set: "All-Rounders 1" },
    { name: "Washington Sundar", role: "AR", nationality: "India", basePrice: 10000000, set: "All-Rounders 1" },
    { name: "Rachin Ravindra", role: "AR", nationality: "New Zealand", basePrice: 10000000, set: "All-Rounders 1" },

    // WICKETKEEPERS 1
    { name: "Sanju Samson", role: "WK", nationality: "India", basePrice: 15000000, set: "Wicketkeepers 1" },
    { name: "MS Dhoni", role: "WK", nationality: "India", basePrice: 20000000, set: "Wicketkeepers 1" },
    { name: "Ishan Kishan", role: "WK", nationality: "India", basePrice: 15000000, set: "Wicketkeepers 1" },
    { name: "Quinton de Kock", role: "WK", nationality: "South Africa", basePrice: 20000000, set: "Wicketkeepers 1" },
    { name: "Nicholas Pooran", role: "WK", nationality: "West Indies", basePrice: 20000000, set: "Wicketkeepers 1" },
    { name: "Jonny Bairstow", role: "WK", nationality: "England", basePrice: 15000000, set: "Wicketkeepers 1" },
    { name: "Heinrich Klaasen", role: "WK", nationality: "South Africa", basePrice: 20000000, set: "Wicketkeepers 1" },
    { name: "Phil Salt", role: "WK", nationality: "England", basePrice: 15000000, set: "Wicketkeepers 1" },
    { name: "Jitesh Sharma", role: "WK", nationality: "India", basePrice: 5000000, set: "Wicketkeepers 1" },
    { name: "Rahmanullah Gurbaz", role: "WK", nationality: "Afghanistan", basePrice: 5000000, set: "Wicketkeepers 1" },
    { name: "Devon Conway", role: "WK", nationality: "New Zealand", basePrice: 15000000, set: "Wicketkeepers 1" },

    // BOWLERS 1
    { name: "Mohammed Siraj", role: "BOWL", nationality: "India", basePrice: 15000000, set: "Bowlers 1" },
    { name: "Trent Boult", role: "BOWL", nationality: "New Zealand", basePrice: 15000000, set: "Bowlers 1" },
    { name: "Kagiso Rabada", role: "BOWL", nationality: "South Africa", basePrice: 15000000, set: "Bowlers 1" },
    { name: "Arshdeep Singh", role: "BOWL", nationality: "India", basePrice: 10000000, set: "Bowlers 1" },
    { name: "Kuldeep Yadav", role: "BOWL", nationality: "India", basePrice: 15000000, set: "Bowlers 1" },
    { name: "Yuzvendra Chahal", role: "BOWL", nationality: "India", basePrice: 15000000, set: "Bowlers 1" },
    { name: "Anrich Nortje", role: "BOWL", nationality: "South Africa", basePrice: 15000000, set: "Bowlers 1" },
    { name: "Jofra Archer", role: "BOWL", nationality: "England", basePrice: 15000000, set: "Bowlers 1" },
    { name: "Josh Hazlewood", role: "BOWL", nationality: "Australia", basePrice: 15000000, set: "Bowlers 1" },
    { name: "Ravi Bishnoi", role: "BOWL", nationality: "India", basePrice: 10000000, set: "Bowlers 1" },

    // BATTERS 2
    { name: "Rahul Tripathi", role: "BAT", nationality: "India", basePrice: 5000000, set: "Batters 2" },
    { name: "Mayank Agarwal", role: "BAT", nationality: "India", basePrice: 5000000, set: "Batters 2" },
    { name: "Manish Pandey", role: "BAT", nationality: "India", basePrice: 5000000, set: "Batters 2" },
    { name: "Ajinkya Rahane", role: "BAT", nationality: "India", basePrice: 5000000, set: "Batters 2" },
    { name: "Harry Brook", role: "BAT", nationality: "England", basePrice: 15000000, set: "Batters 2" },
    { name: "Aiden Markram", role: "BAT", nationality: "South Africa", basePrice: 15000000, set: "Batters 2" },
    { name: "Rilee Rossouw", role: "BAT", nationality: "South Africa", basePrice: 10000000, set: "Batters 2" },
    { name: "Daryl Mitchell", role: "BAT", nationality: "New Zealand", basePrice: 10000000, set: "Batters 2" },
    { name: "Glenn Phillips", role: "BAT", nationality: "New Zealand", basePrice: 10000000, set: "Batters 2" },
    { name: "Will Jacks", role: "BAT", nationality: "England", basePrice: 10000000, set: "Batters 2" },

    // ALL-ROUNDERS 2
    { name: "Shardul Thakur", role: "AR", nationality: "India", basePrice: 10000000, set: "All-Rounders 2" },
    { name: "Deepak Chahar", role: "AR", nationality: "India", basePrice: 10000000, set: "All-Rounders 2" },
    { name: "Krunal Pandya", role: "AR", nationality: "India", basePrice: 5000000, set: "All-Rounders 2" },
    { name: "Ravichandran Ashwin", role: "AR", nationality: "India", basePrice: 5000000, set: "All-Rounders 2" },
    { name: "Wanindu Hasaranga", role: "AR", nationality: "Sri Lanka", basePrice: 15000000, set: "All-Rounders 2" },
    { name: "Jason Holder", role: "AR", nationality: "West Indies", basePrice: 10000000, set: "All-Rounders 2" },
    { name: "Marco Jansen", role: "AR", nationality: "South Africa", basePrice: 10000000, set: "All-Rounders 2" },
    { name: "Romario Shepherd", role: "AR", nationality: "West Indies", basePrice: 5000000, set: "All-Rounders 2" },
    { name: "Daniel Sams", role: "AR", nationality: "Australia", basePrice: 5000000, set: "All-Rounders 2" },
    { name: "Azmatullah Omarzai", role: "AR", nationality: "Afghanistan", basePrice: 5000000, set: "All-Rounders 2" },

    // BOWLERS 2
    { name: "Bhuvneshwar Kumar", role: "BOWL", nationality: "India", basePrice: 5000000, set: "Bowlers 2" },
    { name: "T Natarajan", role: "BOWL", nationality: "India", basePrice: 5000000, set: "Bowlers 2" },
    { name: "Mohit Sharma", role: "BOWL", nationality: "India", basePrice: 5000000, set: "Bowlers 2" },
    { name: "Ishant Sharma", role: "BOWL", nationality: "India", basePrice: 5000000, set: "Bowlers 2" },
    { name: "Umesh Yadav", role: "BOWL", nationality: "India", basePrice: 5000000, set: "Bowlers 2" },
    { name: "Lockie Ferguson", role: "BOWL", nationality: "New Zealand", basePrice: 10000000, set: "Bowlers 2" },
    { name: "Alzarri Joseph", role: "BOWL", nationality: "West Indies", basePrice: 10000000, set: "Bowlers 2" },
    { name: "Mustafizur Rahman", role: "BOWL", nationality: "Bangladesh", basePrice: 2000000, set: "Bowlers 2" },
    { name: "Naveen-ul-Haq", role: "BOWL", nationality: "Afghanistan", basePrice: 5000000, set: "Bowlers 2" },
    { name: "Maheesh Theekshana", role: "BOWL", nationality: "Sri Lanka", basePrice: 5000000, set: "Bowlers 2" },

    // UNCAPPED
    { name: "Sameer Rizvi", role: "BAT", nationality: "India", basePrice: 2000000, set: "Uncapped Batters" },
    { name: "Abhinav Manohar", role: "BAT", nationality: "India", basePrice: 2000000, set: "Uncapped Batters" },
    { name: "Nehal Wadhera", role: "BAT", nationality: "India", basePrice: 2000000, set: "Uncapped Batters" },
    { name: "Angkrish Raghuvanshi", role: "BAT", nationality: "India", basePrice: 2000000, set: "Uncapped Batters" },
    { name: "Ashutosh Sharma", role: "BAT", nationality: "India", basePrice: 2000000, set: "Uncapped Batters" },
    { name: "Shashank Singh", role: "BAT", nationality: "India", basePrice: 2000000, set: "Uncapped Batters" },

    { name: "Harshit Rana", role: "BOWL", nationality: "India", basePrice: 2000000, set: "Uncapped Bowlers" },
    { name: "Mayank Yadav", role: "BOWL", nationality: "India", basePrice: 2000000, set: "Uncapped Bowlers" },
    { name: "Vaibhav Arora", role: "BOWL", nationality: "India", basePrice: 2000000, set: "Uncapped Bowlers" },
    { name: "Yash Dayal", role: "BOWL", nationality: "India", basePrice: 2000000, set: "Uncapped Bowlers" },
    { name: "Mohsin Khan", role: "BOWL", nationality: "India", basePrice: 2000000, set: "Uncapped Bowlers" },
    { name: "Akash Madhwal", role: "BOWL", nationality: "India", basePrice: 2000000, set: "Uncapped Bowlers" },

    { name: "Nitish Kumar Reddy", role: "AR", nationality: "India", basePrice: 2000000, set: "Uncapped AR" },
    { name: "Shahrukh Khan", role: "AR", nationality: "India", basePrice: 2000000, set: "Uncapped AR" },
    { name: "Rahul Tewatia", role: "AR", nationality: "India", basePrice: 2000000, set: "Uncapped AR" },
    { name: "Ramandeep Singh", role: "AR", nationality: "India", basePrice: 2000000, set: "Uncapped AR" },

    { name: "Dhruv Jurel", role: "WK", nationality: "India", basePrice: 2000000, set: "Uncapped WK" },
    { name: "Abishek Porel", role: "WK", nationality: "India", basePrice: 2000000, set: "Uncapped WK" },
    { name: "Anuj Rawat", role: "WK", nationality: "India", basePrice: 2000000, set: "Uncapped WK" },
    { name: "Prabhsimran Singh", role: "WK", nationality: "India", basePrice: 2000000, set: "Uncapped WK" },

    // BATTERS 3
    { name: "Prithvi Shaw", role: "BAT", nationality: "India", basePrice: 5000000, set: "Batters 3" },
    { name: "Devdutt Padikkal", role: "BAT", nationality: "India", basePrice: 5000000, set: "Batters 3" },
    { name: "Venkatesh Iyer", role: "BAT", nationality: "India", basePrice: 5000000, set: "Batters 3" },
    { name: "Dewald Brevis", role: "BAT", nationality: "South Africa", basePrice: 2000000, set: "Batters 3" },
    { name: "Tristan Stubbs", role: "BAT", nationality: "South Africa", basePrice: 5000000, set: "Batters 3" },
    { name: "Tim David", role: "BAT", nationality: "Australia", basePrice: 10000000, set: "Batters 3" },
    { name: "Abhishek Sharma", role: "BAT", nationality: "India", basePrice: 5000000, set: "Batters 3" },

    // ALL-ROUNDERS 3
    { name: "Krunal Pandya", role: "AR", nationality: "India", basePrice: 5000000, set: "All-Rounders 3" },
    { name: "Deepak Hooda", role: "AR", nationality: "India", basePrice: 5000000, set: "All-Rounders 3" },
    { name: "Vijay Shankar", role: "AR", nationality: "India", basePrice: 5000000, set: "All-Rounders 3" },
    { name: "Riyan Parag", role: "AR", nationality: "India", basePrice: 5000000, set: "All-Rounders 3" },
    { name: "Shahbaz Ahmed", role: "AR", nationality: "India", basePrice: 5000000, set: "All-Rounders 3" },
    { name: "Mitchell Santner", role: "AR", nationality: "New Zealand", basePrice: 5000000, set: "All-Rounders 3" },
    { name: "Mohammad Nabi", role: "AR", nationality: "Afghanistan", basePrice: 5000000, set: "All-Rounders 3" },

    // BOWLERS 3
    { name: "Harshal Patel", role: "BOWL", nationality: "India", basePrice: 5000000, set: "Bowlers 3" },
    { name: "Avesh Khan", role: "BOWL", nationality: "India", basePrice: 5000000, set: "Bowlers 3" },
    { name: "Khaleel Ahmed", role: "BOWL", nationality: "India", basePrice: 5000000, set: "Bowlers 3" },
    { name: "Chetan Sakariya", role: "BOWL", nationality: "India", basePrice: 5000000, set: "Bowlers 3" },
    { name: "Sandeep Sharma", role: "BOWL", nationality: "India", basePrice: 5000000, set: "Bowlers 3" },
    { name: "Adam Zampa", role: "BOWL", nationality: "Australia", basePrice: 10000000, set: "Bowlers 3" },
    { name: "Lungi Ngidi", role: "BOWL", nationality: "South Africa", basePrice: 5000000, set: "Bowlers 3" },
    { name: "Jason Behrendorff", role: "BOWL", nationality: "Australia", basePrice: 5000000, set: "Bowlers 3" },
];

// Helper to generate random stats
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const BATTING_STYLES = ['Right-hand bat', 'Left-hand bat'];
const BOWLING_STYLES = ['Right-arm fast', 'Right-arm medium', 'Right-arm offbreak', 'Right-arm legbreak', 'Left-arm fast', 'Left-arm medium', 'Slow left-arm orthodox', 'Left-arm chinaman', 'None'];

const generateStats = (role) => {
    let matches = getRandomInt(10, 200);
    let runs = 0, wickets = 0, avg = 0, sr = 0, econ = 0;

    if (role === 'BAT' || role === 'WK') {
        runs = getRandomInt(500, 6000);
        avg = getRandomFloat(20, 50);
        sr = getRandomFloat(120, 160);
        wickets = getRandomInt(0, 5);
        econ = wickets > 0 ? getRandomFloat(7, 11) : 0;
    } else if (role === 'BOWL') {
        runs = getRandomInt(10, 500);
        avg = getRandomFloat(5, 15);
        sr = getRandomFloat(80, 120);
        wickets = getRandomInt(50, 200);
        econ = getRandomFloat(6.5, 9.5);
    } else { // AR
        runs = getRandomInt(500, 3000);
        avg = getRandomFloat(20, 35);
        sr = getRandomFloat(130, 150);
        wickets = getRandomInt(30, 100);
        econ = getRandomFloat(7.5, 9.5);
    }

    const age = getRandomInt(19, 38);
    const batStyle = BATTING_STYLES[Math.floor(Math.random() * BATTING_STYLES.length)];
    const bowlStyle = role === 'WK' || (role === 'BAT' && Math.random() > 0.3) ? 'None' : BOWLING_STYLES[Math.floor(Math.random() * BOWLING_STYLES.length)];

    return { matches, runs, wickets, avg, sr, econ, age, batStyle, bowlStyle };
};

const generateDataset = () => {
    const players = [];
    let idCounter = 1;

    // 1. Add Real Players
    REAL_PLAYERS_DB.forEach(p => {
        const stats = generateStats(p.role);
        // id,name,nationality,role,basePrice,matches,runs,wickets,avg,sr,econ,age,battingStyle,bowlingStyle,imageUrl,set
        const row = `${idCounter++},${p.name},${p.nationality},${p.role},${p.basePrice},${stats.matches},${stats.runs},${stats.wickets},${stats.avg},${stats.sr},${stats.econ},${stats.age},${stats.batStyle},${stats.bowlStyle},,${p.set}`;
        players.push(row);
    });

    // 2. Fill up to 300 with generic players if needed (but we have ~100 above)
    // Let's add more generic ones to reach 300
    const targetCount = 300;
    const sets = ['Batters 3', 'Bowlers 3', 'All-Rounders 3', 'Uncapped Batters', 'Uncapped Bowlers'];

    while (idCounter <= targetCount) {
        const set = sets[Math.floor(Math.random() * sets.length)];
        const role = set.includes('Batters') ? 'BAT' : set.includes('Bowlers') ? 'BOWL' : 'AR';
        const type = Math.random() > 0.7 ? "Overseas" : "Indian";
        const name = `${type} ${role} ${idCounter}`;
        const nationality = type === "Indian" ? "India" : "Australia"; // Simplified
        const basePrice = set.includes('Uncapped') ? 2000000 : 5000000;

        const stats = generateStats(role);
        const row = `${idCounter++},${name},${nationality},${role},${basePrice},${stats.matches},${stats.runs},${stats.wickets},${stats.avg},${stats.sr},${stats.econ},${stats.age},${stats.batStyle},${stats.bowlStyle},,${set}`;
        players.push(row);
    }

    const header = "id,name,nationality,role,basePrice,matches,runs,wickets,avg,sr,econ,age,battingStyle,bowlingStyle,imageUrl,set";
    const csvContent = [header, ...players].join('\n');

    const outputPath = path.join(__dirname, '../public/sample_players.csv');
    fs.writeFileSync(outputPath, csvContent);
    console.log(`Generated ${players.length} players at ${outputPath}`);
};

generateDataset();
