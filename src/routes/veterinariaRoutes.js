const express = require('express');
const {
  getVeterinarias,
  getVeterinaria,
  getVeterinariaBySlug,
  getNearbyVeterinarias,
  createVeterinaria,
  updateVeterinaria,
  deleteVeterinaria
} = require('../controllers/veterinariaController');
const { protect } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(generalLimiter);

// GET routes are public — the veterinarias listing must be visible without login
router.get('/', getVeterinarias);
router.get('/nearby', getNearbyVeterinarias);
router.get('/slug/:slug', getVeterinariaBySlug);
router.get('/:id', getVeterinaria);

// Write routes still require authentication
router.post('/', protect, createVeterinaria);
router.put('/:id', protect, updateVeterinaria);
router.delete('/:id', protect, deleteVeterinaria);

module.exports = router;
