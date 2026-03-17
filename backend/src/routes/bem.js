const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getBEM, updateBEM } = require('../controllers/bem');

router.use(authenticate);
router.get('/',  getBEM);
router.post('/', updateBEM);

module.exports = router;