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
// roomID -> { players: [], gameState: ... }
const rooms = {};

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('create_room', (data) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        // data can be just a callback or an object with config
        const config = data && data.config ? data.config : null;

        rooms[roomId] = {
            players: [], // { socketId, username, teamId }
            gameState: null, // Auction state
            config: config
        };
        socket.join(roomId);
        socket.emit('room_created', roomId);
        console.log(`Room Created: ${roomId} with config:`, config);
    });

    socket.on('join_room', ({ roomId, username }) => {
        if (rooms[roomId]) {
            socket.join(roomId);
            rooms[roomId].players.push({ socketId: socket.id, username, teamId: null });
            socket.emit('room_joined', roomId);

            // Send current state if exists
            if (rooms[roomId].gameState) {
                socket.emit('state_update', rooms[roomId].gameState);
            }
            console.log(`${username} joined room: ${roomId}`);
        } else {
            socket.emit('error', 'Room not found');
        }
    });

    socket.on('send_state_update', ({ roomId, state }) => {
        if (rooms[roomId]) {
            rooms[roomId].gameState = state;
            // Broadcast to everyone else in the room
            socket.to(roomId).emit('state_update', state);
        }
    });

    socket.on('place_bid', (payload) => {
        // Payload: [roomId, teamId, amount]
        if (Array.isArray(payload)) {
            const [roomId, teamId, amount] = payload;
            // Broadcast bid to everyone in room including sender (to confirm)
            // Emit as array: [teamId, amount]
            io.in(roomId).emit('new_bid', [teamId, amount]);
        } else {
            // Fallback for old clients (if any)
            const { roomId, bid } = payload;
            io.in(roomId).emit('new_bid', bid);
        }
    });

    // Audio Signaling (WebRTC)
    socket.on('audio_signal', ({ roomId, type, payload }) => {
        // Relay to everyone else in the room
        socket.to(roomId).emit('audio_signal', { type, payload });
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
