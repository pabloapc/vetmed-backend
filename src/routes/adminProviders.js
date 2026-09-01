const express = require("express");
const router = express.Router();
const providerController = require("../controllers/providerController");

const { protect } = require("../middleware/auth"); // tu middleware de auth existente
const adminOnly = require("../middleware/adminOnly");
// Admin CRUD for providers
router.get(
    "/",
   protect, adminOnly,
    providerController.adminListProviders || providerController.listProviders
); // admin list can reuse public list or a dedicated one
router.post("/", protect, adminOnly, providerController.adminCreateProvider);
router.get("/:id", protect, adminOnly, providerController.getProvider);
router.put("/:id", protect, adminOnly, providerController.adminUpdateProvider);
router.delete("/:id", protect, adminOnly, providerController.adminDeleteProvider);

module.exports = router;
