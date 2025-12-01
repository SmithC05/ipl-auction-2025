const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"]
    }
});

// Store room states
// roomID -> { players: [], teams: [], auctionState: ... }
const rooms = {};

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('create_room', (data) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms[roomId] = {
            players: [], // Connected users
            gameState: null // Auction state
        };
        socket.join(roomId);
        socket.emit('room_created', roomId);
        console.log(`Room Created: ${roomId}`);
    });

    socket.on('join_room', (roomId) => {
        if (rooms[roomId]) {
            socket.join(roomId);
            socket.emit('room_joined', roomId);

            // Send current state if exists
            if (rooms[roomId].gameState) {
                socket.emit('state_update', rooms[roomId].gameState);
            }
            console.log(`User joined room: ${roomId}`);
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

server.listen(3001, () => {
    console.log('SERVER RUNNING ON PORT 3001');
});
