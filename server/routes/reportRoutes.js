const router = require('express').Router();
const protect = require('../middleware/auth');
const { productsReport, productReport } = require('../controllers/reportController');

router.use(protect);
router.get('/products.pdf', productsReport);
router.get('/products/:id.pdf', productReport);

module.exports = router;