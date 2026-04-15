const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const { getBusiness, getBusinessById, createBusiness, updateBusiness } = require('../controllers/businessController');

router.get('/', auth, admin, getBusiness);
router.get('/:id', getBusinessById);
router.post('/', auth, admin, createBusiness);
router.put('/', auth, admin, updateBusiness);

module.exports = router;