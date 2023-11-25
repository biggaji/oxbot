import { createServer } from 'node:http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import { convertDateTimeToCronExpression, scheduleReminder, } from './helpers.js';
import mongoose from 'mongoose';
import { ReminderModel } from './reminder.model.js';
import { config } from 'dotenv';
// Init dotenv
config();
await mongoose
    .connect(process.env.MONGO_URL, {})
    .then(() => {
    console.log('Database connected');
})
    .catch((err) => {
    console.log('Error connecting to mongo cluster', err.message);
});
dayjs.extend(localizedFormat);
const app = express();
const server = createServer(app);
const ws = new Server(server, {
    cors: {
        origin: '*',
    },
    connectionStateRecovery: {},
});
app.use(cors({
    origin: '*',
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
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
});
app.post('/reminders', async (req, res, next) => {
    try {
        const { description, dateTime } = req.body;
        if (!description || !dateTime) {
            throw new Error('All argument is required');
        }
        const scheduledFor = new Date(dateTime);
        const date = dayjs(scheduledFor).format('LL');
        const time = dayjs(scheduledFor).format('LT');
        // Add logic to store reminder in database
        const reminder = new ReminderModel({
            description,
            scheduledFor,
        });
        await reminder.save();
        // Construct cron expression
        const cronExpression = convertDateTimeToCronExpression(dateTime);
        // Schedule reminder
        scheduleReminder({
            cronExpression,
        }, async () => {
            try {
                // Notify bot to update UI
                const botReminderFiredResponse = {
                    date,
                    time,
                    message: `Reminder: ${description}.`,
                    status: 'notified',
                };
                ws.to(botSocketId).emit('REMINDER:ACTIVE', botReminderFiredResponse);
                // Logic to update reminder field notified to "yes"
                const updateReminder = await ReminderModel.updateOne({ _id: reminder._id }, { notified: 'yes' });
                if (updateReminder.acknowledged) {
                    return;
                }
            }
            catch (error) {
                next(error);
            }
        });
        // Notify bot to update UI
        const botReminderSetResponse = {
            date,
            time,
            message: 'Reminder set.',
            status: 'pending',
        };
        if (botSocketId) {
            ws.to(botSocketId).emit('REMINDER:SET', botReminderSetResponse);
        }
        // Return 200 for acknowledgemnt
        res.status(200).json({});
    }
    catch (error) {
        next(error);
    }
});
app.get('/reminders', async (req, res, next) => {
    try {
        const { filterBy } = req.query;
        // filterBy: "today" \ "tomorrow"
        let filterByDate;
        const todayDate = new Date();
        const tomorrowDate = new Date(todayDate);
        tomorrowDate.setDate(todayDate.getDate() + 1);
        if (filterBy === 'today') {
            const remindersForToday = await ReminderModel.find({
                scheduledFor: {
                    $gte: todayDate,
                    $lt: tomorrowDate,
                },
            });
            res.status(200).json(remindersForToday);
            return;
        }
        else {
            // tomorrow then
            const remindersForTomorrow = await ReminderModel.find({
                scheduledFor: {
                    $gte: tomorrowDate,
                    $lt: new Date(tomorrowDate.getTime() + 24 * 60 * 60 * 1000),
                },
            });
            res.status(200).json(remindersForTomorrow);
            return;
        }
    }
    catch (error) {
        next(error);
    }
});
// Update a reminder in the future
app.patch('/reminders/:id', async (req, res, next) => { });
// Delete one reminder
app.delete('/reminders/:id', async (req, res, next) => { });
// Delete all reminder
app.delete('/reminders', async (req, res, next) => { });
// Central error middleware
app.use((err, req, res, next) => {
    const message = err.message ? err.message : 'Internal server error';
    const statusCode = err.code ? err.code : 500;
    res.status(statusCode).json({
        message,
        statusCode,
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
