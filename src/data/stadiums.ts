
export interface Stadium {
    id: string;
    name: string;
    multipliers: {
        BAT: number;
        PACE: number;
        SPIN: number;
    };
}

export const STADIUMS: Stadium[] = [
    {
        id: 'CSK',
        name: 'M. A. Chidambaram Stadium (Chepauk)',
        multipliers: { BAT: 0.95, PACE: 0.95, SPIN: 1.15 } // Spin friendly
    },
    {
        id: 'MI',
        name: 'Wankhede Stadium',
        multipliers: { BAT: 1.10, PACE: 1.05, SPIN: 0.90 } // Batting paradise, some pace
    },
    {
        id: 'RCB',
        name: 'M. Chinnaswamy Stadium',
        multipliers: { BAT: 1.15, PACE: 0.90, SPIN: 0.90 } // Graveyard for bowlers
    },
    {
        id: 'KKR',
        name: 'Eden Gardens',
        multipliers: { BAT: 1.05, PACE: 1.0, SPIN: 1.10 } // Balanced, spin support
    },
    {
        id: 'GT',
        name: 'Narendra Modi Stadium',
        multipliers: { BAT: 1.05, PACE: 1.10, SPIN: 0.95 } // Big boundaries, pace bounce
    },
    {
        id: 'SRH',
        name: 'Rajiv Gandhi International Stadium',
        multipliers: { BAT: 1.08, PACE: 1.02, SPIN: 0.95 } // Good batting
    },
    {
        id: 'RR',
        name: 'Sawai Mansingh Stadium',
        multipliers: { BAT: 0.98, PACE: 1.0, SPIN: 1.12 } // Large, spin friendly
    },
    {
        id: 'DC',
        name: 'Arun Jaitley Stadium',
        multipliers: { BAT: 1.12, PACE: 0.95, SPIN: 0.95 } // Small boundaries
    },
    {
        id: 'PBKS',
        name: 'Maharaja Yadavindra Singh Stadium',
        multipliers: { BAT: 1.0, PACE: 1.12, SPIN: 0.92 } // Pace friendly (mohali/mullanpur)
    },
    {
        id: 'LSG',
        name: 'Ekana Sports City',
        multipliers: { BAT: 0.90, PACE: 1.05, SPIN: 1.15 } // Slow, low scoring
    }
];
