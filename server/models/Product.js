const mongoose = require('mongoose');

const CATEGORIES = ['Mobile', 'Laptop', 'TV', 'Home Appliance', 'Camera', 'Other'];

const productSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    brand: { type: String, trim: true, default: '' },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    purchaseDate: { type: Date, required: [true, 'Purchase date is required'] },
    purchasePrice: { type: Number, default: 0, min: 0 },
    invoiceNumber: { type: String, trim: true, default: '' },
    store: { type: String, trim: true, default: '' },
    serialNumber: { type: String, trim: true, default: '' },
    warrantyStart: { type: Date },
    warrantyEnd: { type: Date, required: [true, 'Warranty end date is required'] },
    warrantyProvider: { type: String, trim: true, default: '' },
    coverageDetails: { type: String, trim: true, default: '' },
    photo: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('daysRemaining').get(function () {
  if (!this.warrantyEnd) return null;
  const end = new Date(this.warrantyEnd);
  const expiryDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const today = new Date();
  const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((expiryDay - currentDay) / 86400000);
});

productSchema.virtual('warrantyStatus').get(function () {
  const d = this.daysRemaining;
  if (d === null) return 'unknown';
  if (d < 0) return 'expired';
  if (d <= 30) return 'expiring';
  return 'active';
});

productSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Product', productSchema);
