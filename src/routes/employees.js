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

router.get('/:businessId', auth, admin, getEmployees);
router.post('/', auth, admin, createEmployee);
router.put('/:id', auth, admin, updateEmployee);
router.delete('/:id', auth, admin, deleteEmployee);

router.post('/commissions', auth, admin, addCommission);
router.get('/commissions/:employeeId', auth, admin, getCommissions);

router.post('/payments', auth, admin, addPayment);
router.get('/payments/:employeeId', auth, admin, getPayments);

router.get('/summary/:employeeId', auth, admin, getEmployeeSummary);

module.exports = router;