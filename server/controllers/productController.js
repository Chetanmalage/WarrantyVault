const Product = require('../models/Product');
const ServiceRecord = require('../models/ServiceRecord');
const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const PHOTO_DIR = path.join(UPLOAD_DIR, 'photos');

const deleteFile = (dir, name) => {
  if (!name) return;
  const p = path.join(dir, name);
  if (fs.existsSync(p)) fs.unlinkSync(p);
};

const FIELDS = ['name', 'brand', 'category', 'purchaseDate', 'purchasePrice', 'invoiceNumber',
  'store', 'serialNumber', 'warrantyStart', 'warrantyEnd', 'warrantyProvider', 'coverageDetails'];
const DATE_FIELDS = new Set(['purchaseDate', 'warrantyStart', 'warrantyEnd']);

const pick = (body = {}) => FIELDS.reduce((acc, field) => {
  if (body[field] !== undefined) {
    const value = body[field];
    if (field === 'purchasePrice' && (value === '' || value === null)) acc[field] = 0;
    else if (DATE_FIELDS.has(field) && value === '') acc[field] = null;
    else acc[field] = value;
  }
  return acc;
}, {});
const REGEX_META = new Set(['\\', '^', '$', '.', '|', '?', '*', '+', '(', ')', '[', ']', '{', '}']);
const escapeRegex = (value) => Array.from(value, (char) => REGEX_META.has(char) ? `\\${char}` : char).join('');
const dayNumber = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};
const dateError = ({ purchaseDate, warrantyStart, warrantyEnd }) => {
  const purchase = dayNumber(purchaseDate);
  const start = dayNumber(warrantyStart);
  const end = dayNumber(warrantyEnd);
  if (purchaseDate && purchase === null) return 'Purchase date is invalid';
  if (warrantyStart && start === null) return 'Warranty start date is invalid';
  if (warrantyEnd && end === null) return 'Warranty end date is invalid';
  if (start !== null && end !== null && start > end) return 'Warranty start date must be on or before the expiry date';
  if (purchase !== null && end !== null && purchase > end) return 'Warranty expiry cannot be before the purchase date';
  return '';
};

exports.getProducts = async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 100);
    const { category = '', status = '' } = req.query;
    const query = { user: req.user._id };

    if (search) {
      const literal = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { name: literal },
        { brand: literal },
        { serialNumber: literal },
      ];
    }
    if (category) query.category = category;

    let products = await Product.find(query).sort({ createdAt: -1 });
    if (status) products = products.filter((p) => p.warrantyStatus === status);

    res.json(products);
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const [services, documents] = await Promise.all([
      ServiceRecord.find({ product: product._id, user: req.user._id }).sort({ serviceDate: -1 }),
      Document.find({ product: product._id, user: req.user._id }).sort({ createdAt: -1 }),
    ]);

    res.json({ product, services, documents });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const data = pick(req.body);
    if (!data.name) return res.status(400).json({ message: 'Product name is required' });
    if (!data.purchaseDate) return res.status(400).json({ message: 'Purchase date is required' });
    if (!data.warrantyEnd) return res.status(400).json({ message: 'Warranty end date is required' });
    if (!data.warrantyStart) data.warrantyStart = data.purchaseDate;
    const invalidDates = dateError(data);
    if (invalidDates) return res.status(400).json({ message: invalidDates });

    const product = await Product.create({ ...data, user: req.user._id });
    res.status(201).json(product);
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const updates = pick(req.body);
    const invalidDates = dateError({
      purchaseDate: updates.purchaseDate ?? product.purchaseDate,
      warrantyStart: updates.warrantyStart ?? product.warrantyStart,
      warrantyEnd: updates.warrantyEnd ?? product.warrantyEnd,
    });
    if (invalidDates) return res.status(400).json({ message: invalidDates });
    Object.assign(product, updates);
    await product.save();
    res.json(product);
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const docs = await Document.find({ product: product._id, user: req.user._id });
    docs.forEach((d) => deleteFile(UPLOAD_DIR, d.storedName));
    deleteFile(PHOTO_DIR, product.photo);

    await Promise.all([
      Document.deleteMany({ product: product._id, user: req.user._id }),
      ServiceRecord.deleteMany({ product: product._id, user: req.user._id }),
      product.deleteOne(),
    ]);

    res.json({ message: 'Product and related records deleted' });
  } catch (err) { next(err); }
};

exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Product not found' });
    }

    deleteFile(PHOTO_DIR, product.photo);
    product.photo = req.file.filename;
    await product.save();

    res.json(product);
  } catch (err) { next(err); }
};

exports.deletePhoto = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    deleteFile(PHOTO_DIR, product.photo);
    product.photo = '';
    await product.save();

    res.json(product);
  } catch (err) { next(err); }
};

exports.getPhoto = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product || !product.photo) return res.status(404).json({ message: 'No photo' });

    const filePath = path.join(PHOTO_DIR, product.photo);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing' });

    res.setHeader('Cache-Control', 'private, max-age=300');
    res.sendFile(filePath);
  } catch (err) { next(err); }
};
