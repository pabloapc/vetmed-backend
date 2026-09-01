const express = require("express");
const router = express.Router();
const prestationController = require("../controllers/prestationController");

// Public endpoints
router.get("/", prestationController.listPrestationsPublic);
router.get("/:id", prestationController.getPrestationPublic);

module.exports = router;
