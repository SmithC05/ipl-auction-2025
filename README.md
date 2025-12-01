# IPL 2025 Auction Website

A mobile-first, performance-optimized IPL Auction simulation website.

## Features
- **Real Teams**: Manage up to 10 IPL teams.
- **Real Players**: Import stats from CSV/JSON.
- **Bidding System**: Fast-paced auction with auto-bid and timer.
- **Offline Capable**: Works on low bandwidth (1 kb/s) using compressed local data.
- **Winner Calculation**: Team Strength Score based on balanced squad metrics.

## Tech Stack
- Vite + React + TypeScript
- Vanilla CSS (Minimal Theme)
- LocalStorage for persistence

## Deployment
1. **Build**: `npm run build`
2. **Deploy**:
   - Drag and drop `dist` folder to Vercel/Netlify.
   - OR connect GitHub repo to Vercel.

## Low-Bandwidth Optimization
- **Compressed JSON**: Player data is stored in a minimized format.
- **Lazy Loading**: Images are loaded only when visible (with placeholders).
- **Local Caching**: App prioritizes local data over network requests.
