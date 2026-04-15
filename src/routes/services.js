const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const { getServices, createService, updateService, deleteService } = require('../controllers/servicesController');

router.get('/:businessId', getServices);
router.post('/', auth, admin, createService);
router.put('/:id', auth, admin, updateService);
router.delete('/:id', auth, admin, deleteService);

module.exports = router;