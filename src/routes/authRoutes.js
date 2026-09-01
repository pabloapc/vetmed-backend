const express = require("express");
const { body } = require("express-validator");
const {
    register,
    verifyEmail,
    resendVerification,
    login,
    getMe,
    updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { authLimiter, generalLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Validation middleware
const registerValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("El nombre es requerido")
        .isLength({ min: 2 })
        .withMessage("El nombre debe tener al menos 2 caracteres"),
    body("email")
        .trim()
        .notEmpty()
        .withMessage("El email es requerido")
        .isEmail()
        .withMessage("Debe ser un email válido")
        .normalizeEmail(),
    body("password")
        .trim()
        .notEmpty()
        .withMessage("La contraseña es requerida")
        .isLength({ min: 6 })
        .withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("planId")
        .optional({ values: "falsy" })
        .isMongoId()
        .withMessage("planId inválido"),
    body("latitude")
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage("Latitud inválida"),
    body("longitude")
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage("Longitud inválida"),
];

const loginValidation = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("El email es requerido")
        .isEmail()
        .withMessage("Debe ser un email válido"),
    body("password")
        .trim()
        .notEmpty()
        .withMessage("La contraseña es requerida"),
];

// Profile update validation (all optional)
const profileValidation = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage("El nombre debe tener al menos 2 caracteres"),
    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Debe ser un email válido")
        .normalizeEmail(),
    body("telefono")
        .optional()
        .trim()
        .isLength({ min: 4 })
        .withMessage("Teléfono inválido"),
    body("direccion")
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage("Dirección inválida"),
    body("ciudad").optional().trim(),
    body("provincia").optional().trim(),
    body("codigoPostal").optional().trim(),
    body("latitude")
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage("Latitud inválida"),
    body("longitude")
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage("Longitud inválida"),
];

router.post("/register", authLimiter, registerValidation, validate, register);
router.get("/verify-email/:token", generalLimiter, verifyEmail);
router.post("/resend-verification", generalLimiter, resendVerification);
router.post("/login", authLimiter, loginValidation, validate, login);
router.get("/profile", generalLimiter, protect, getMe);

// NEW: update profile (PUT /api/auth/profile)
router.put(
    "/profile",
    authLimiter,
    protect,
    profileValidation,
    validate,
    updateProfile
);

module.exports = router;
