const cron = require('node-cron');
const { sendDueReminders } = require('./reminders');

function startReminderScheduler() {
  const expression = process.env.REMINDER_CRON || '0 9 * * *';
  const timezone = process.env.REMINDER_TIMEZONE || 'UTC';
  if (!cron.validate(expression)) throw new Error(`Invalid REMINDER_CRON expression: ${expression}`);
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    throw new Error(`Invalid REMINDER_TIMEZONE: ${timezone}`);
  }

  const task = cron.schedule(expression, async () => {
    console.log('Running scheduled warranty email digest');
    try {
      const result = await sendDueReminders();
      console.log('Warranty reminder run finished:', result);
    } catch (error) {
      console.error('Warranty reminder run failed:', error.message);
    }
  }, { timezone });

  console.log(`Warranty reminder schedule active: ${expression} (${timezone})`);
  return task;
}

module.exports = { startReminderScheduler };
