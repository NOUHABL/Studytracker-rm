const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { listTasks, createTask, updateTask, deleteTask, getProgress, getStreak } = require('../controllers/tasks');

router.use(authenticate);

router.get('/progress', getProgress);
router.get('/streak',   getStreak);
router.get('/',         listTasks);
router.post('/',        createTask);
router.patch('/:id',    updateTask);
router.delete('/:id',   deleteTask);

module.exports = router;