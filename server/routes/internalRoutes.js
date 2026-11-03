const express = require('express');
const cronAuth = require('../middleware/cronAuth');
const { sendDueReminders } = require('../utils/reminders');

const router = express.Router();

router.post('/reminders', cronAuth, async (req, res) => {
  try {
    const result = await sendDueReminders();
    return res.json(result);
  } catch (error) {
    console.error('Scheduled reminder endpoint failed:', error.message);
    return res.status(500).json({ message: 'Scheduled reminder job failed.' });
  }
});

module.exports = router;
