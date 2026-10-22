const Document = require('../models/Document');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

exports.getDocuments = async (req, res, next) => {
  try {
    const query = { user: req.user._id };
    if (req.query.product) query.product = req.query.product;

    const docs = await Document.find(query)
      .populate('product', 'name brand category')
      .sort({ createdAt: -1 });

    res.json(docs);
  } catch (err) { next(err); }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const product = await Product.findOne({ _id: req.body.product, user: req.user._id });
    if (!product) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Product not found' });
    }

    const doc = await Document.create({
      user: req.user._id,
      product: product._id,
      title: req.body.title || req.file.originalname,
      docType: req.body.docType || 'Invoice',
      fileName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    res.status(201).json(await doc.populate('product', 'name brand category'));
  } catch (err) { next(err); }
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const filePath = path.join(__dirname, '..', 'uploads', doc.storedName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File missing on server' });

    res.download(filePath, doc.fileName);
  } catch (err) { next(err); }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const filePath = path.join(__dirname, '..', 'uploads', doc.storedName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Document deleted' });
  } catch (err) { next(err); }
};