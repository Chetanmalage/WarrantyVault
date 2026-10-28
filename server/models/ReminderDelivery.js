const mongoose = require('mongoose');

const reminderDeliverySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    thresholdDays: { type: Number, required: true, min: 1, max: 90 },
    warrantyEnd: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'sent'], default: 'pending', required: true },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

reminderDeliverySchema.index(
  { user: 1, product: 1, thresholdDays: 1, warrantyEnd: 1 },
  { unique: true, name: 'one_delivery_per_product_window' }
);

module.exports = mongoose.model('ReminderDelivery', reminderDeliverySchema);
