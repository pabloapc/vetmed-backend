const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth"); // tu middleware de auth existente
const adminOnly = require("../middleware/adminOnly");
const offeringController = require("../controllers/providerOfferingController");
 

 


// Admin CRUD for provider offerings
router.get("/", protect, adminOnly, offeringController.adminListOfferings);
router.post("/", protect, adminOnly, offeringController.adminCreateOffering);
router.put("/:id", protect, adminOnly, offeringController.adminUpdateOffering);
router.delete("/:id", protect, adminOnly, offeringController.adminDeleteOffering);

module.exports = router;
