const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getHistory, getProfile } = require('../controllers/profile');

router.use(authenticate);
router.get('/me',      getProfile);
router.get('/history', getHistory);

module.exports = router;