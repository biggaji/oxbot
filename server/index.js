import { createServer } from 'node:http';
import { Server } from 'socket.io';
import express from 'express';
// import EventEmitter from 'node:events';
import cors from 'cors';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
dayjs.extend(localizedFormat);
const app = express();
const server = createServer(app);
const ws = new Server(server, {
    cors: {
        origin: 'http://localhost:5500',
    },
});
app.use(cors({
    origin: '*',
}));
let botSocketId;
ws.on('connection', (socket) => {
    const query = socket.handshake.query;
    if (query && query.isBot) {
        console.log('Alexabot', socket.id, 'connected');
        botSocketId = socket.id;
    }
    socket.on('disconnect', () => {
        console.log('Alexabot', socket.id, 'disconnected');
    });
    // socket.on('message', (message) => {
    //   console.log('Incoming message from bot:', message.value);
    // });
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.post('/users/', (req, res, next) => {
    try {
        const { username, email, password, firstname, lastname } = req.body;
        if (!username || !email || !password || !firstname || !lastname) {
            throw new Error('All fields are required');
        }
        const timeStamptz = Date.now();
        const createdAt = dayjs(timeStamptz).format('LT');
        if (botSocketId) {
            ws.to(botSocketId).emit('account:signup', {
                username: capitalizeFirstLetter(username),
                createdAt,
            });
        }
        res.status(201).json({ botId: botSocketId });
    }
    catch (error) {
        next(error);
    }
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
function capitalizeFirstLetter(word) {
    // Check if the word is not an empty string
    if (word.length > 0) {
        // Capitalize the first letter and concatenate with the rest of the word
        return word.charAt(0).toUpperCase() + word.slice(1);
    }
    else {
        // Return an empty string if the input word is empty
        return '';
    }
}
