const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'An account with this email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    res.status(201).json({ token: signToken(user._id), user: user.toSafeObject() });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({ token: signToken(user._id), user: user.toSafeObject() });
  } catch (err) { next(err); }
};

exports.me = async (req, res) => res.json({ user: req.user.toSafeObject() });

exports.updatePreferences = async (req, res, next) => {
  try {
    const { emailReminders, reminderDays } = req.body;

    if (emailReminders !== undefined) req.user.emailReminders = !!emailReminders;

    if (reminderDays !== undefined) {
      const n = Number(reminderDays);
      if (Number.isNaN(n) || n < 1 || n > 90)
        return res.status(400).json({ message: 'Reminder days must be between 1 and 90' });
      req.user.reminderDays = n;
    }

    await req.user.save();
    res.json({ user: req.user.toSafeObject() });
  } catch (err) { next(err); }
};