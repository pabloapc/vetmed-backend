const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect } = require("../middleware/auth"); // tu middleware de auth existente
const adminOnly = require("../middleware/adminOnly");
const leadController = require("../controllers/leadController");

//const upload = require("../middleware/upload");
const uploadVademecum = require("../middleware/upload");
const controller = require("../controllers/coverageController");

// Usuarios
router.get("/users", protect, adminOnly, adminController.listUsers);
router.get("/users/:id", protect, adminOnly, adminController.getUser);
router.put("/users/:id", protect, adminOnly, adminController.updateUser);
router.delete("/users/:id", protect, adminOnly, adminController.deleteUser);

// Pharmacies
router.get("/pharmacies", protect, adminOnly, adminController.listPharmacies);
router.get("/pharmacies/:id", protect, adminOnly, adminController.getPharmacy);
router.put(
    "/pharmacies/:id",
    protect,
    adminOnly,
    adminController.updatePharmacyAdmin
);
router.delete(
    "/pharmacies/:id",
    protect,
    adminOnly,
    adminController.deletePharmacyAdmin
);

// router.patch(
//     "/pharmacies/:id/vademecum",
//     protect,
//     adminOnly,
//     upload.single("vademecumFile"),
//     adminController.uploadPharmacyVademecum
// );

router.patch(
  "/pharmacies/:id/vademecum",
  protect,
  adminOnly,
  uploadVademecum.single("vademecumFile"),
  adminController.uploadPharmacyVademecum
);


// Doctors
router.get("/doctors", protect, adminOnly, adminController.listDoctors);
router.get("/doctors/:id", protect, adminOnly, adminController.getDoctor);
router.put(
    "/doctors/:id",
    protect,
    adminOnly,
    adminController.updateDoctorAdmin
);
router.delete(
    "/doctors/:id",
    protect,
    adminOnly,
    adminController.deleteDoctorAdmin
);

// Emergencies
router.get("/emergencies", protect, adminOnly, adminController.listEmergencies);
router.get("/emergencies/:id", protect, adminOnly, adminController.getEmergency);
router.put(
    "/emergencies/:id",
    protect,
    adminOnly,
    adminController.updateEmergencyAdmin
);
router.delete(
    "/emergencies/:id",
    protect,
    adminOnly,
    adminController.deleteEmergencyAdmin
);



// ... existentes requires ...
router.post('/users', protect, adminOnly, adminController.createUser);
router.post('/pharmacies', protect, adminOnly, adminController.createPharmacy);
router.post('/doctors', protect, adminOnly, adminController.createDoctor);
router.post('/emergencies', protect, adminOnly, adminController.createEmergency);

//dashboard metrics

router.get(
    "/dashboard/metrics",
    protect,
    adminOnly,
    adminController.getDashboardMetrics
);


router.get("/leads", protect, adminOnly, leadController.adminListLeads);
router.get("/leads/:id", protect, adminOnly, leadController.adminGetLead);
router.put("/leads/:id", protect, adminOnly, leadController.adminUpdateLead);
router.delete("/leads/:id", protect, adminOnly, leadController.adminDeleteLead);

// ...existing code...

// Insurers (nuevo)
router.post("/insurers", protect, adminOnly, controller.createInsurer);
router.get("/insurers", protect, adminOnly, controller.listInsurersAdmin);
router.get("/insurers/:id", protect, adminOnly, controller.getInsurerAdmin);
router.put("/insurers/:id", protect, adminOnly, controller.updateInsurerAdmin);
router.delete("/insurers/:id", protect, adminOnly, controller.deleteInsurerAdmin);


// ...existing code...

// Plans (nuevo)
router.post("/plans", protect, adminOnly, controller.createPlanAdmin);
router.get("/plans", protect, adminOnly, controller.listPlansAdmin);
router.get("/plans/:id", protect, adminOnly, controller.getPlanAdmin);
router.put("/plans/:id", protect, adminOnly, controller.updatePlanAdmin);
router.delete("/plans/:id", protect, adminOnly, controller.deletePlanAdmin);

router.get("/plan-coverages", protect, adminOnly, controller.listPlanCoveragesAdmin);
router.post("/plan-coverages", protect, adminOnly, controller.upsertPlanCoverage); // alias front
router.put("/plan-coverages", protect, adminOnly, controller.upsertPlanCoverage);  // alias
router.put("/plan-coverage", protect, adminOnly, controller.upsertPlanCoverage);   // legacy

router.put("/provider-prestations", controller.upsertProviderPrestation);

module.exports = router;

