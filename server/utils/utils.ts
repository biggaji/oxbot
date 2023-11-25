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

// type ScheduleReminderPayload = {
//   cronExpression: string;
//   message: string;
//   id: string;
// };

// function scheduleReminder(
//   payload: ScheduleReminderPayload,
//   callback: any,
// ): void {
//   try {
//     const { cronExpression, message, id } = payload;
//     const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

//     // console.log(typeof callback);
//     // if (typeof callback !== 'function') {
//     //   throw new TypeError("Expecting argument'callback' to be a function");
//     // }

//     // Add logic as you wish
//     // const scheduledCallback = callback.bind(null, id);

//     // nodeCron.schedule(
//     //   cronExpression,
//     //   () => {
//     //     console.log('Hello');
//     //   },
//     //   {
//     //     timezone: timeZone,
//     //   },
//     // );
//     console.log('Reminder set');
//   } catch (error: any) {
//     console.log(error);
//     throw new Error(`Error scheduling reminder: ${error}`);
//   }
// }

export { convertDateTimeToCronExpression };
