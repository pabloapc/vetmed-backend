const express = require("express");
const router = express.Router();
const auditController = require("../controllers/medicalAuditController");
const { protect } = require("../middleware/auth");
const { isAdmin } = require("../middleware/isAdmin");

router.use(protect, isAdmin);

router.get("/", auditController.getAllAudits);
router.patch("/:id/validate", auditController.validateAudit);
router.patch("/:id/close", auditController.closeAudit);

module.exports = router;