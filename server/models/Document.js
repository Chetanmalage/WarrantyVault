const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    title: { type: String, required: true, trim: true },
    docType: { type: String, enum: ['Invoice', 'Warranty Card', 'Receipt', 'Other'], default: 'Invoice' },
    fileName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);