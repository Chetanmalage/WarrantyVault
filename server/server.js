require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');
const User = require('./models/User');
const { sendDueReminders } = require('./utils/reminders');

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ status: 'WarrantyVault API is running 🛡️' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Seed admin
(async () => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;
  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const exists = await User.findOne({ email });
  if (!exists) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await User.create({ name: 'Administrator', email, password: hash, role: 'admin' });
    console.log('👑 Admin user created:', email);
  }
})();

// Daily reminders at 09:00
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running warranty reminder job…');
  try {
    const r = await sendDueReminders();
    console.log('📧 Reminders:', r);
  } catch (e) {
    console.error('Reminder job failed:', e.message);
  }
});