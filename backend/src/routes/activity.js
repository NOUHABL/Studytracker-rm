const router     = require('express').Router();
const { authenticate }    = require('../middleware/auth');
const { activityRateLimit } = require('../middleware/rateLimit');
const { logActivity, getSessionActivity } = require('../controllers/activity');

router.use(authenticate);

router.post('/',                      activityRateLimit, logActivity);
router.get('/:session_id',            getSessionActivity);

module.exports = router;
