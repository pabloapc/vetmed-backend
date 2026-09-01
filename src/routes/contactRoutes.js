const express = require("express");
const { protect } = require("../middleware/auth");
const router = express.Router();
const contactController = require("../controllers/contactController");
const leadController = require("../controllers/leadController");


router.post("/enterprise", contactController.createEnterpriseLead);
router.post("/", protect, leadController.createLead);

 

module.exports = router;
