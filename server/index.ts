import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import express, { Request, Response, NextFunction } from 'express';
// import EventEmitter from 'node:events';
import cors from 'cors';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import nodeCron from 'node-cron';
import { JsonDB, Config } from 'node-json-db';
import { v4 } from 'uuid';
import { convertDateTimeToCronExpression } from './utils/utils.js';

dayjs.extend(localizedFormat);

const db = new JsonDB(new Config('reminders', true));

const app = express();
const server = createServer(app);
const ws = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(
  cors({
    origin: '*',
  }),
);

let botSocketId: string;

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

const REMINDER_DATA_PATH = '/reminders[]';
const REMINDER_DATA_FETCH_PATH = '/reminders';

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Initialize an empty array if the path doesn't exist
if (!db.exists(REMINDER_DATA_PATH)) {
  db.push(REMINDER_DATA_PATH, [], true);
}

app.post(
  '/reminders',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { description, dateTime } = req.body;

      if (!description || !dateTime) {
        throw new Error('All argument is required');
      }

      // Generate  a unique id for reminders
      const id = v4();
      console.log(id);

      // Add logic to store in database
      // await db.push(
      //   REMINDER_DATA_PATH,
      //   {
      //     id,
      //     description,
      //     notified: 'no',
      //     scheduledAt: new Date(dateTime),
      //   },
      //   true,
      // );

      //   // const data = await db.getData(REMINDER_DATA_FETCH_PATH);

      //   // Construct cron expression
      //   const cronExpression = convertDateTimeToCronExpression(dateTime);
      //   console.log(cronExpression);

      //   // Schedule reminder
      //   // scheduleReminder(
      //   //   {
      //   //     cronExpression,
      //   //     message: `Reminder set successfully`,
      //   //     id,
      //   //   },
      //   //   async (reminderId: string) => {
      //   //     ws.to(botSocketId).emit('REMINDER:ACTIVE');
      //   //     console.log('Reminder fired');

      //   //     // Logic to update database notified = yes
      //   //     // const indx = await db.getIndex(REMINDER_DATA_FETCH_PATH, reminderId);

      //   //     // if (indx) {
      //   //     //   await db.push(
      //   //     //     `${REMINDER_DATA_FETCH_PATH}[${indx}]`,
      //   //     //     { notified: 'yes' },
      //   //     //     true,
      //   //     //   );
      //   //     // } else {
      //   //     //   throw new Error('Reminder not found');
      //   //     // }
      //   //   },
      //   // );

      //   // Notify bot to update UI
      //   if (botSocketId) {
      //     ws.to(botSocketId).emit('REMINDER:SET', 'Reminder set');
      //   }

      //   // Return 200 for acknowledgemnt
      res.status(200).json({});
    } catch (error) {
      next(error);
    }
  },
);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
