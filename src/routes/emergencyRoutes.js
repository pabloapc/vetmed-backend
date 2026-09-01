const express = require('express');
const { 
  getEmergencies, 
  getEmergency, 
  getNearbyEmergencies,
  createEmergency,
  updateEmergency,
  deleteEmergency
} = require('../controllers/emergencyController');
const { protect } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All veterinaria routes require authentication and rate limiting
router.use(protect);
router.use(generalLimiter);

// GET routes
router.get('/', getEmergencies);
router.get('/nearby', getNearbyEmergencies);
router.get('/:id', getEmergency);

// POST route - Create emergency
router.post('/', createEmergency);

// PUT route - Update emergency
router.put('/:id', updateEmergency);

// DELETE route - Delete emergency
router.delete('/:id', deleteEmergency);

module.exports = router;
