const express = require("express");
const router = express.Router();
const providerController = require("../controllers/providerController");

// Public providers listing / detail
router.get("/", providerController.listProviders);
router.get("/:id", providerController.getProvider);

// Provider offerings (public)
router.get("/:id/offerings", providerController.listProviderOfferings);

module.exports = router;
