const router = require('express').Router();
const protect = require('../middleware/auth');
const upload = require('../middleware/upload');
const c = require('../controllers/documentController');

router.use(protect);
router.route('/').get(c.getDocuments).post(upload.single('file'), c.uploadDocument);
router.get('/:id/file', c.downloadDocument);
router.delete('/:id', c.deleteDocument);

module.exports = router;