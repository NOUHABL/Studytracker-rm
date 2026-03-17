const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { todayStats, weekStats, subjectStats, taskStats, activeSession } = require('../controllers/stats');

router.use(authenticate);

router.get('/today',    todayStats);
router.get('/week',     weekStats);
router.get('/subjects', subjectStats);
router.get('/tasks',    taskStats);
router.get('/active',   activeSession);

module.exports = router;