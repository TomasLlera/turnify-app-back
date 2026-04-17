const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  addCommission,
  getCommissions,
  addPayment,
  getPayments,
  getEmployeeSummary,
} = require('../controllers/employeesController');

// IMPORTANTE: rutas con segmentos fijos ANTES de rutas con parámetros dinámicos.
// Si /:businessId va primero, Express captura "summary", "commissions", "payments"
// como businessId y nunca llega a los handlers correctos.

router.post('/', auth, admin, createEmployee);

router.post('/commissions', auth, admin, addCommission);
router.post('/payments', auth, admin, addPayment);

// Estas tres deben ir ANTES de /:businessId
router.get('/summary/:employeeId', auth, admin, getEmployeeSummary);
router.get('/commissions/:employeeId', auth, admin, getCommissions);
router.get('/payments/:employeeId', auth, admin, getPayments);

// Dinámicas al final
router.get('/:businessId', auth, admin, getEmployees);
router.put('/:id', auth, admin, updateEmployee);
router.delete('/:id', auth, admin, deleteEmployee);

module.exports = router;