const router = require('express').Router();
const protect = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');
const { register, login, me, updatePreferences } = require('../controllers/authController');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, me);
router.put('/preferences', protect, updatePreferences);

module.exports = router;