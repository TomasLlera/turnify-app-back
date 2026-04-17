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

// IMPORTANTE: las rutas con segmentos fijos deben ir ANTES de las rutas con parámetros dinámicos
// Si /:businessId va primero, Express captura "slots", "client", etc. como businessId

router.get('/slots', getAvailableSlots);
router.get('/client/:dni', getByDni);

// stats debe ir ANTES de /:businessId
router.get('/:businessId/stats', auth, admin, getStats);
router.get('/:businessId', auth, admin, getAppointments);

router.post('/', createAppointment);
router.put('/:id/status', auth, admin, updateAppointmentStatus);
router.put('/:id/cancel', cancelByClient);

module.exports = router;