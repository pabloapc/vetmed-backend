const express = require("express");
const { getPublicSettings } = require("../controllers/settingsController");
const { generalLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", generalLimiter, getPublicSettings);

module.exports = router;
