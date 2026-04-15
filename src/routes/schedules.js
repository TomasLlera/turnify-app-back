const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const { getSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/schedulesController');

router.get('/:businessId', getSchedules);
router.post('/', auth, admin, createSchedule);
router.put('/:id', auth, admin, updateSchedule);
router.delete('/:id', auth, admin, deleteSchedule);

module.exports = router;