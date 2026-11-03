require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ReminderDelivery = require('../models/ReminderDelivery');
const ReminderRun = require('../models/ReminderRun');
const { sendDueReminders } = require('../utils/reminders');

async function run() {
  try {
    await connectDB();
    await Promise.all([ReminderDelivery.createIndexes(), ReminderRun.createIndexes()]);
    console.log('Running one-shot warranty reminder job');

    const result = await sendDueReminders();
    console.log('Warranty reminder job finished:', JSON.stringify(result));

    if (result.failed > 0) process.exitCode = 1;
  } catch (error) {
    console.error('Warranty reminder job failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
