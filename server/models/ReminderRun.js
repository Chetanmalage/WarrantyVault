const mongoose = require('mongoose');

const reminderRunSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    runDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'sent'], default: 'pending', required: true },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

reminderRunSchema.index({ user: 1, runDate: 1 }, { unique: true, name: 'one_daily_digest_per_user' });

module.exports = mongoose.model('ReminderRun', reminderRunSchema);
