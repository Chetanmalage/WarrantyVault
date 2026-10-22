const router = require('express').Router();
const protect = require('../middleware/auth');
const uploadImage = require('../middleware/uploadImage');
const c = require('../controllers/productController');

router.use(protect);

router.route('/').get(c.getProducts).post(c.createProduct);
router.route('/:id').get(c.getProduct).put(c.updateProduct).delete(c.deleteProduct);

router.post('/:id/photo', uploadImage.single('photo'), c.uploadPhoto);
router.delete('/:id/photo', c.deletePhoto);
router.get('/:id/photo', c.getPhoto);

module.exports = router;