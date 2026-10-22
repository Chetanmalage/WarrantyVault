const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    serviceDate: { type: Date, required: [true, 'Service date is required'] },
    serviceType: {
      type: String,
      enum: ['Repair', 'Maintenance', 'Replacement', 'Inspection', 'Other'],
      default: 'Repair',
    },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    serviceCenter: { type: String, trim: true, default: '' },
    cost: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceRecord', serviceSchema);