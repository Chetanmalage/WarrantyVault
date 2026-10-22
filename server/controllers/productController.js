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

const pick = (body) =>
  FIELDS.reduce((acc, f) => {
    if (body[f] !== undefined && body[f] !== '') acc[f] = body[f];
    return acc;
  }, {});

exports.getProducts = async (req, res, next) => {
  try {
    const { search = '', category = '', status = '' } = req.query;
    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
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

    const product = await Product.create({ ...data, user: req.user._id });
    res.status(201).json(product);
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    Object.assign(product, pick(req.body));
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