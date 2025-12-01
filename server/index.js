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
        origin: ["http://localhost:5173", "http://localhost:5174", process.env.VITE_API_URL], // Support local and production
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
        rooms[roomId] = {
            players: [], // { socketId, username, teamId }
            gameState: null // Auction state
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

    socket.on('place_bid', ({ roomId, bid }) => {
        // Broadcast bid to everyone in room including sender (to confirm)
        io.in(roomId).emit('new_bid', bid);
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
