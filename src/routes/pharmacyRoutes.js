const express = require('express');
const { 
  getPharmacies, 
  getPharmacy, 
  getNearbyPharmacies,
  createPharmacy,
  updatePharmacy,
  deletePharmacy
} = require('../controllers/pharmacyController');
const { protect } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All pharmacy routes require authentication and rate limiting
router.use(protect);
router.use(generalLimiter);

// GET routes
router.get('/', getPharmacies);
router.get('/nearby', getNearbyPharmacies);
router.get('/:id', getPharmacy);

// POST route - Create pharmacy
router.post('/', createPharmacy);

// PUT route - Update pharmacy
router.put('/:id', updatePharmacy);

// DELETE route - Delete pharmacy
router.delete('/:id', deletePharmacy);

module.exports = router;
