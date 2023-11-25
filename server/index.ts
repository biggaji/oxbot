import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import express, { Request, Response, NextFunction } from 'express';
// import EventEmitter from 'node:events';
import cors from 'cors';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import nodeCron from 'node-cron';

dayjs.extend(localizedFormat);

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

  // socket.on('message', (message) => {
  //   console.log('Incoming message from bot:', message.value);
  // });
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post('/users/', (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
});

app.post(
  '/reminders',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { description, dateTime } = req.body;

      if (!description || !dateTime) {
        throw new Error('All argument is required');
      }

      // Add logic to store in database

      // Construct cron expression
      const cronExpression = convertDateTimeToCronExpression(dateTime);

      // // Schedule reminder
      scheduleReminder(
        {
          cronExpression,
          message: `Reminder set successfully`,
        },
        async () => {
          ws.to(botSocketId).emit('REMINDER:ACTIVE');

          // Logic to update database notified = yes
        },
      );

      // Notify bot to update UI
      ws.to(botSocketId).emit('REMINDER:SET', 'Reminder set');

      // Return 200 for acknowledgemnt
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

function capitalizeFirstLetter(word: string) {
  // Check if the word is not an empty string
  if (word.length > 0) {
    // Capitalize the first letter and concatenate with the rest of the word
    return word.charAt(0).toUpperCase() + word.slice(1);
  } else {
    // Return an empty string if the input word is empty
    return '';
  }
}

/**
 * Converts a dateTime string from a date input to a cron expression.
 * @param dateTime - The input dateTime string in a recognized format.
 * @returns {string} - A cron expression representing the given dateTime.
 * @throws {TypeError} If the argument 'dateTime' is not of type 'string.'
 * @throws {Error} If an error occurs during the conversion, providing specific details.
 */
function convertDateTimeToCronExpression(dateTime: string): string {
  try {
    if (typeof dateTime !== 'string') {
      throw new TypeError("Expecting argument 'dateTime' to be a string");
    }

    const dateInstance = new Date(dateTime);
    const minute = dateInstance.getMinutes();
    const hour = dateInstance.getHours();
    const date = dateInstance.getDate();
    const month = dateInstance.getMonth() + 1; // Months are zero-based
    const week = dateInstance.getDay();

    // Construct and return the cron expression
    return `${minute} ${hour} ${date} ${month} ${week}`;
  } catch (error: any) {
    throw new Error(
      `Error converting date to cron expression: ${error.message}`,
    );
  }
}

type ScheduleReminderPayload = {
  cronExpression: string;
  message: string;
};

function scheduleReminder(
  payload: ScheduleReminderPayload,
  callback: any,
): void {
  try {
    const { cronExpression, message } = payload;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (typeof callback !== 'function') {
      throw new TypeError("Expecting argument'callback' to be a function");
    }

    // Add logic as you wish

    nodeCron.schedule(cronExpression, callback, {
      timezone: timeZone,
    });
  } catch (error: any) {
    throw new Error(`Error scheduling reminde: ${error.message}`);
  }
}
