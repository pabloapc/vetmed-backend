const express = require('express');
const { 
  getDoctors, 
  getDoctor, 
  getNearbyDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorsController');
const { protect } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All veterinaria routes require authentication and rate limiting
router.use(protect);
router.use(generalLimiter);

// GET routes
router.get('/', getDoctors);
router.get('/nearby', getNearbyDoctors);
router.get('/:id', getDoctor);

// POST route - Create doctor
router.post('/', createDoctor);

// PUT route - Update doctor
router.put('/:id', updateDoctor);

// DELETE route - Delete doctor
router.delete('/:id', deleteDoctor);

module.exports = router;
