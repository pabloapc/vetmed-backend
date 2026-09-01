const express = require("express");
const router = express.Router();
const controller = require("../controllers/coverageController");
const { protect } = require("../middleware/auth");

router.get("/insurers", controller.listInsurers);
router.get("/insurers/:id", controller.getInsurer);
router.get("/insurers/:insurerId/plans", controller.listPlansByInsurer);
router.get("/plans", controller.listPlansPublic);
router.get("/plans/:id", controller.getPlanPublic);
router.get("/plan-coverages", controller.listPlanCoveragesPublic);
router.get("/prestations", controller.listPrestations);
router.get("/plan-coverage", controller.getCoverage);

router.get("/me/membership", protect, controller.getMyMembership);
router.put("/me/membership", protect, controller.upsertMyMembership);

router.get("/providers/:providerId/prestations", controller.listProviderPrestations);

module.exports = router;
