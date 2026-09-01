const express = require("express");
const router = express.Router();
const insuranceController = require("../controllers/insuranceController");

router.get("/products", insuranceController.listProducts);

module.exports = router;