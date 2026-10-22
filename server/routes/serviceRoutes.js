const router = require('express').Router();
const protect = require('../middleware/auth');
const c = require('../controllers/serviceController');

router.use(protect);
router.route('/').get(c.getServices).post(c.createService);
router.route('/:id').put(c.updateService).delete(c.deleteService);

module.exports = router;