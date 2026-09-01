const express = require("express");
const router = express.Router();
const prestationController = require("../controllers/prestationController");

const { protect } = require("../middleware/auth"); // tu middleware de auth existente
const adminOnly = require("../middleware/adminOnly");


router.get(
    "/prestations",
    protect,
    adminOnly,
    prestationController.adminListPrestations
);
router.get(
    "/prestations/:id",
    protect,
    adminOnly,
    prestationController.adminGetPrestation
);
router.post(
    "/prestations",
    protect,
    adminOnly,
    prestationController.adminCreatePrestation
);
router.put(
    "/prestations/:id",
    protect,
    adminOnly,
    prestationController.adminUpdatePrestation
);
router.delete(
    "/prestations/:id",
    protect,
    adminOnly,
    prestationController.adminDeletePrestation
);


module.exports = router;