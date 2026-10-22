const router = require('express').Router();
const protect = require('../middleware/auth');
const { register, login, me, updatePreferences } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/preferences', protect, updatePreferences);

module.exports = router;