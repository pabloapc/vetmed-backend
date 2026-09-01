// Asegurate de añadir esta ruta al router de requests (junto a las existentes)
const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");



const { protect } = require("../middleware/auth");

router.post("/", protect, requestController.createRequest);
router.get("/", protect, requestController.listRequests);
router.get("/pharmacy", protect, requestController.getRequestsForPharmacy);
router.get("/doctor", protect, requestController.getRequestsForDoctor); // <-- nueva ruta
router.get("/emergency", protect, requestController.getRequestsForEmergency); // <-- nueva ruta
router.get("/user", protect, requestController.getRequestsForUser);
router.get("/:id", protect, requestController.getRequestById);
router.put("/:id/status", protect, requestController.updateRequestStatus);

router.put("/:id/reply", protect, requestController.replyToRequest);




module.exports = router;
