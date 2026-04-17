const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const {
  getSchedules, createSchedule, updateSchedule, deleteSchedule,
  getExceptions, createException, deleteException,
} = require('../controllers/schedulesController');

// IMPORTANTE: rutas fijas ANTES de las dinámicas (:businessId, :id)
// Si /:businessId va primero, Express captura "exceptions" como businessId

router.get('/exceptions/:businessId', auth, admin, getExceptions);
router.post('/exceptions', auth, admin, createException);
router.delete('/exceptions/:id', auth, admin, deleteException);

router.get('/:businessId', getSchedules);
router.post('/', auth, admin, createSchedule);
router.put('/:id', auth, admin, updateSchedule);
router.delete('/:id', auth, admin, deleteSchedule);

module.exports = router;