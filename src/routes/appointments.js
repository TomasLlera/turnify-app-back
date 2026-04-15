const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const {
  getAvailableSlots,
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  getStats,
  getByDni,
  cancelByClient
} = require('../controllers/appointmentsController');

router.get('/slots', getAvailableSlots);
router.get('/client/:dni', getByDni);
router.get('/:businessId', auth, admin, getAppointments);
router.post('/', createAppointment);
router.put('/:id/status', auth, admin, updateAppointmentStatus);
router.put('/:id/cancel', cancelByClient);
router.get('/:businessId/stats', auth, admin, getStats);

module.exports = router;