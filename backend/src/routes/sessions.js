const router     = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { startSession, endSession, listSessions, getSession } = require('../controllers/sessions');

router.use(authenticate);

router.post('/start', startSession);
router.post('/end',   endSession);
router.get('/',       listSessions);
router.get('/:id',    getSession);

module.exports = router;
