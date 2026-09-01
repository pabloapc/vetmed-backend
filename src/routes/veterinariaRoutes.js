const express = require('express');
const { 
  getVeterinarias, 
  getVeterinaria, 
  getNearbyVeterinarias,
  createVeterinaria,
  updateVeterinaria,
  deleteVeterinaria
} = require('../controllers/veterinariaController');
const { protect } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All veterinaria routes require authentication and rate limiting
router.use(protect);
router.use(generalLimiter);

// GET routes
router.get('/', getVeterinarias);
router.get('/nearby', getNearbyVeterinarias);
router.get('/:id', getVeterinaria);

// POST route - Create veterinaria
router.post('/', createVeterinaria);

// PUT route - Update veterinaria
router.put('/:id', updateVeterinaria);

// DELETE route - Delete veterinaria
router.delete('/:id', deleteVeterinaria);

module.exports = router;
