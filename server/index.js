import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve static files from the React app
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in this demo/hackathon context
        methods: ["GET", "POST"]
    }
});

// Store room states
// roomID -> { players: [], gameState: ..., auctionEndTime: number | null, timerInterval: Interval | null }
const rooms = {};

// Helper to broadcast state
const broadcastState = (roomId) => {
    if (rooms[roomId] && rooms[roomId].gameState) {
        // Include server time to help clients sync
        const payload = {
            ...rooms[roomId].gameState,
            serverTime: Date.now(),
            endTime: rooms[roomId].auctionEndTime
        };
        io.to(roomId).emit('state_update', payload);
    }
};

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('create_room', (data) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const config = data && data.config ? data.config : null;

        rooms[roomId] = {
            players: [],
            gameState: null,
            config: config,
            auctionEndTime: null,
            timerInterval: null
        };
        socket.join(roomId);
        socket.emit('room_created', roomId);
        console.log(`Room Created: ${roomId}`);
    });

    socket.on('join_room', ({ roomId, username }) => {
        if (rooms[roomId]) {
            socket.join(roomId);
            rooms[roomId].players.push({ socketId: socket.id, username, teamId: null });
            socket.emit('room_joined', roomId);

            // Send current state if exists
            if (rooms[roomId].gameState) {
                // Determine if timer is running
                const now = Date.now();
                const isRunning = rooms[roomId].auctionEndTime && rooms[roomId].auctionEndTime > now;

                const packet = {
                    ...rooms[roomId].gameState,
                    // If timer is valid, send the derived seconds used by client for display
                    // But ideally client calculates diff from endTime
                    isTimerRunning: !!isRunning,
                    timerSeconds: isRunning ? Math.round((rooms[roomId].auctionEndTime - now) / 1000) : 0
                };

                socket.emit('state_update', packet);
            }
            console.log(`${username} joined room: ${roomId}`);
        } else {
            socket.emit('error', 'Room not found');
        }
    });

    // Client (Host) initializes the auction data
    socket.on('send_state_update', ({ roomId, state }) => {
        if (rooms[roomId]) {
            // Only update structural data, preserve auction status if active
            const existing = rooms[roomId].gameState;
            rooms[roomId].gameState = state;

            // If this is an initialization, ensure clean slate
            if (!existing) {
                rooms[roomId].auctionEndTime = null;
            }

            // Broadcast to everyone
            broadcastState(roomId);
        }
    });

    // --- NEW: Server-Side Timer Logic ---

    socket.on('start_timer', ({ roomId, duration }) => {
        if (!rooms[roomId]) return;

        // Set absolute end time
        const now = Date.now();
        // duration is in seconds
        const endTime = now + (duration * 1000);

        rooms[roomId].auctionEndTime = endTime;
        if (rooms[roomId].gameState) {
            rooms[roomId].gameState.isTimerRunning = true;
            rooms[roomId].gameState.timerSeconds = duration;
        }

        // Clear existing interval if any
        if (rooms[roomId].timerInterval) {
            clearInterval(rooms[roomId].timerInterval);
        }

        // Broadcast start immediate
        io.to(roomId).emit('timer_started', { endTime, duration });
        broadcastState(roomId);

        // Start internal ticker to check for expiry
        rooms[roomId].timerInterval = setInterval(() => {
            const r = rooms[roomId];
            if (!r || !r.auctionEndTime) {
                clearInterval(r.timerInterval);
                return;
            }

            const timeLeft = r.auctionEndTime - Date.now();

            if (timeLeft <= 0) {
                // TIME UP -> Resolve Auction
                clearInterval(r.timerInterval);
                r.auctionEndTime = null;

                resolveAuction(roomId);
            }
            // We usually don't need to broadcast every second if clients have endTime,
            // but for safety/sync we can broadcast periodically or let clients handle the countdown.
            // Let's rely on clients for the countdown visuals.
        }, 1000);
    });

    socket.on('stop_timer', ({ roomId }) => {
        if (rooms[roomId]) {
            if (rooms[roomId].timerInterval) clearInterval(rooms[roomId].timerInterval);
            rooms[roomId].auctionEndTime = null;
            rooms[roomId].gameState.isTimerRunning = false;
            broadcastState(roomId);
        }
    });

    // --- Bid Handling ---
    socket.on('place_bid', (payload) => {
        // payload: [roomId, teamId, amount]
        let roomId, teamId, amount;

        if (Array.isArray(payload)) {
            [roomId, teamId, amount] = payload;
        } else {
            // Legacy/Fallback
            ({ roomId, teamId, amount } = payload); // Note: this destructuring might be wrong for legacy payload structure in previous file, 
            // but assuming standard usage. Adjusting to match explicit args.
            if (payload.bid) { // if using old {roomId, bid: {teamId, amount}}
                teamId = payload.bid.teamId;
                amount = payload.bid.amount;
            }
        }

        if (!rooms[roomId] || !rooms[roomId].gameState) return;

        const room = rooms[roomId];
        const state = room.gameState;

        // 1. Validation: Timed out?
        if (!room.auctionEndTime || Date.now() > room.auctionEndTime) {
            socket.emit('error', 'Bidding closed or timer not running.');
            return;
        }

        // 2. Validation: Higher bid?
        if (amount <= state.currentBid) {
            socket.emit('error', 'Bid must be higher than current bid.');
            return;
        }

        // 3. Validation: Budget?
        const team = state.teams.find(t => t.id === teamId);
        if (!team || team.budget < amount) {
            socket.emit('error', 'Insufficient funds.');
            return;
        }

        // 4. Update State
        state.currentBid = amount;
        state.currentBidder = teamId;

        // Add to history
        const newBid = { teamId, amount, timestamp: Date.now() };
        state.bidHistory = [newBid, ...(state.bidHistory || [])].slice(0, 10);

        // 5. Sniper Logic / Timer Extension
        // If time left < 10s, reset to 10s
        const timeLeft = room.auctionEndTime - Date.now();
        if (timeLeft < 10000) {
            room.auctionEndTime = Date.now() + 10000;
            // Notify extension
        }

        // 6. Broadcast
        io.to(roomId).emit('new_bid', [teamId, amount]);
        // Also send state update to ensure sync
        broadcastState(roomId);
    });

    function resolveAuction(roomId) {
        const room = rooms[roomId];
        const state = room.gameState;

        if (!state.currentPlayer) return;

        if (state.currentBidder) {
            // SOLD
            const soldPlayer = state.currentPlayer;
            const winningTeamId = state.currentBidder;
            const winningPrice = state.currentBid;

            // Update Team Logic
            const teamIndex = state.teams.findIndex(t => t.id === winningTeamId);
            if (teamIndex !== -1) {
                const team = state.teams[teamIndex];
                team.budget -= winningPrice;
                team.totalSpent += winningPrice;
                team.squad.push(soldPlayer);
                state.teams[teamIndex] = team;
            }

            state.soldPlayers.push(soldPlayer);

            // Reset round
            state.currentPlayer = null;
            state.currentBid = 0;
            state.currentBidder = null;
            state.isTimerRunning = false;
            state.auctionStatus = 'SOLD';

            io.to(roomId).emit('player_sold', {
                player: soldPlayer,
                teamId: winningTeamId,
                amount: winningPrice
            });
        } else {
            // UNSOLD
            const unsoldPlayer = state.currentPlayer;
            state.unsoldPlayers.push(unsoldPlayer);

            state.currentPlayer = null;
            state.currentBid = 0;
            state.currentBidder = null;
            state.isTimerRunning = false;
            state.auctionStatus = 'UNSOLD';

            io.to(roomId).emit('player_unsold', { player: unsoldPlayer });
        }

        broadcastState(roomId);
    }

    // Manual Skip/Sold/Unsold from Host (if needed to override)
    // We should allow host to force sell/unsold if needed, but the timer auto-resolves now.
    socket.on('force_sell', ({ roomId }) => {
        if (rooms[roomId]) resolveAuction(roomId);
    });

    socket.on('next_player', ({ roomId }) => {
        // Logic to pick next player should ideally be on server too or host sends "set_current_player"
        // For now, let's assume Host selects next player and sends state, OR we implement server-side picking.
        // Current architecture: Host picks next player via client logic -> 'send_state_update'.
        // We'll leave that as is for now to minimize refactor, only handling the "Time -> End" transition.
    });


    socket.on('select_team', ({ roomId, teamId, playerName }) => {
        if (rooms[roomId] && rooms[roomId].gameState) {
            const teams = rooms[roomId].gameState.teams.map(t => {
                if (t.id === teamId) {
                    return { ...t, playerName };
                }
                return t;
            });
            rooms[roomId].gameState.teams = teams;
            broadcastState(roomId);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// The "catchall" handler
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
    console.log(`SERVER RUNNING ON ${HOST}:${PORT}`);
});
