import nodeCron from 'node-cron';
/**
 * Converts a dateTime string from a date input to a cron expression.
 * @param dateTime - The input dateTime string in a recognized format.
 * @returns {string} - A cron expression representing the given dateTime.
 * @throws {TypeError} If the argument 'dateTime' is not of type 'string.'
 * @throws {Error} If an error occurs during the conversion, providing specific details.
 */
function convertDateTimeToCronExpression(dateTime) {
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
    }
    catch (error) {
        throw new Error(`Error converting date to cron expression: ${error.message}`);
    }
}
/**
 * Schedule a reminder using a cron expression.
 *
 * @param payload - Input arguments required to schedule a cron expression.
 * @param callback - A callback function to execute when the cron is fired.
 * @throws {TypeError} Throws a TypeError when the callback type is not a function.
 * @throws {Error} Throws an Error when there's an issue scheduling the reminder.
 */
function scheduleReminder(payload, callback) {
    try {
        const { cronExpression } = payload;
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (typeof callback !== 'function') {
            throw new TypeError("Expecting argument 'callback' to be a function");
        }
        nodeCron.schedule(cronExpression, callback, {
            timezone: timeZone,
        });
    }
    catch (error) {
        throw new Error(`Error scheduling reminder: ${error.message}`);
    }
}
export { scheduleReminder, convertDateTimeToCronExpression };
