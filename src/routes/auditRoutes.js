const express = require("express");
const router = express.Router();
const auditController = require("../controllers/medicalAuditController");
const { protect } = require("../middleware/auth");
const { isAdmin } = require("../middleware/isAdmin");

// Rutas del empleado autenticado
router.post("/", protect, auditController.createAudit);
router.get("/my", protect, auditController.getMyAudits);
router.get("/:id", protect, auditController.getAuditById);
router.post("/:id/documents", protect, auditController.addDocument);
router.post("/:id/tracking", protect, auditController.addTrackingEvent);

// Contacto (solo admin)
router.post("/:id/contact", protect, isAdmin, auditController.addContactLog);

module.exports = router;