const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const {
  getFinances,
  createFinance,
  deleteFinance,
  getFinanceSummary,
} = require('../controllers/financesController');

router.get('/summary/:businessId', auth, admin, getFinanceSummary);
router.get('/:businessId', auth, admin, getFinances);
router.post('/', auth, admin, createFinance);
router.delete('/:id', auth, admin, deleteFinance);

module.exports = router;