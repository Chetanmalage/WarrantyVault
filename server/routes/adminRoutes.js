const router = require('express').Router();
const fs = require('fs');
const path = require('path');

const protect = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

const User = require('../models/User');
const Product = require('../models/Product');
const ServiceRecord = require('../models/ServiceRecord');
const Document = require('../models/Document');
const ReminderDelivery = require('../models/ReminderDelivery');
const ReminderRun = require('../models/ReminderRun');
const { sendDueReminders } = require('../utils/reminders');
const { getMailStatus } = require('../utils/mailer');

router.use(protect, requireAdmin);

router.get('/stats', async (req, res, next) => {
  try {
    const [users, products, services, documents] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      ServiceRecord.countDocuments(),
      Document.countDocuments(),
    ]);
    res.json({ users, products, services, documents, emailDelivery: getMailStatus() });
  } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(
      users.map(async (u) => ({
        ...u,
        productCount: await Product.countDocuments({ user: u._id }),
      }))
    );
    res.json(enriched);
  } catch (err) { next(err); }
});

router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { next(err); }
});

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role))
      return res.status(400).json({ message: 'Role must be "user" or "admin"' });

    if (String(req.params.id) === String(req.user._id) && role !== 'admin')
      return res.status(400).json({ message: 'You cannot demote yourself' });

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.toSafeObject());
  } catch (err) { next(err); }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id))
      return res.status(400).json({ message: 'You cannot delete yourself' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Cleanup: documents + photos
    const docs = await Document.find({ user: user._id });
    docs.forEach((d) => {
      const p = path.join(__dirname, '..', 'uploads', d.storedName);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    const products = await Product.find({ user: user._id });
    products.forEach((p) => {
      if (!p.photo) return;
      const fp = path.join(__dirname, '..', 'uploads', 'photos', p.photo);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    });

    await Promise.all([
      Document.deleteMany({ user: user._id }),
      ServiceRecord.deleteMany({ user: user._id }),
      Product.deleteMany({ user: user._id }),
      ReminderDelivery.deleteMany({ user: user._id }),
      ReminderRun.deleteMany({ user: user._id }),
      user.deleteOne(),
    ]);

    res.json({ message: 'User and all their data deleted' });
  } catch (err) { next(err); }
});

router.post('/send-reminders', async (req, res, next) => {
  try {
    const result = await sendDueReminders();
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
