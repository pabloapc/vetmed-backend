const User = require("../models/User");
const Veterinaria = require("../models/Veterinaria");
const Doctor = require("../models/Doctor");
const Emergency = require("../models/Emergency");
const {
    generateToken,
    generateVerificationToken,
    verifyToken,
} = require("../utils/jwtUtils");
const { resolveUserCoverage } = require("../services/coverageResolutionService");
//const { sendVerificationEmail } = require("../utils/emailService");

const buildAuthUserPayload = async (user, extraFields = {}) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    location: user.location,
    ciudad: user.ciudad,
    provincia: user.provincia,
    telefono: user.telefono,
    direccion: user.direccion,
    codigoPostal: user.codigoPostal,
    role: user.role,
    entityId: user.entityId,
    planId: user.planId || null,
    ...extraFields,
    coverage: await resolveUserCoverage(user._id),
});

/**
 * Register user and optional associated entity (veterinaria/doctor).
 */
// Nota: Asegurate de tener importado el modelo Emergency en la parte superior del archivo:
 

exports.register = async (req, res, next) => {
    try {
        const {
            name,
            personalName,
            entityName,
            email,
            password,
            latitude,
            longitude,
            role, // optional: "veterinaria" | "doctor" | "emergency" | "user"
            entityId,
            planId,

            // additional fields for veterinaria/doctor/emergency may come in body
            ...rest
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Este correo electrónico ya está registrado",
            });
        }

        // Build personal name: prefer personalName when present
        const personal =
            personalName && String(personalName).trim() !== ""
                ? String(personalName).trim()
                : name || "";

        // Create user (not yet saving entity link)
        const user = new User({
            name: personal,
            email,
            password,
            location: {
                type: "Point",
                coordinates: [
                    typeof longitude !== "undefined" ? Number(longitude) : 0,
                    typeof latitude !== "undefined" ? Number(latitude) : 0,
                ],
            },
            // DEFAULT ROLE: ensure 'user' when not explicit
            role: role && role !== null ? role : "user",
            entityId: role === "user" ? (entityId || null) : null,
            planId: role === "user" ? (planId || null) : null,

        });

        await user.save();

        // If registering a veterinaria, doctor or emergency, create the corresponding document.
        // If entity creation fails, try to rollback the created user to avoid orphan users.
        let createdEntity = null;
        try {
            if (role === "veterinaria") {
                const publicName =
                    (entityName || rest.entityName || "").trim() ||
                    user.name ||
                    "Veterinaria";
                const veterinariaData = {
                    name: publicName,
                    address: rest.address || rest.direccion || "",
                    phone: rest.phone || rest.telefono || "",
                    benefits: rest.benefits || rest.beneficios || undefined,
                    discount:
                        typeof rest.discount !== "undefined"
                            ? Number(rest.discount)
                            : typeof rest.descuento !== "undefined"
                            ? Number(rest.descuento)
                            : undefined,
                    openingHours:
                        rest.openingHours || rest.horario || undefined,
                    location: {
                        type: "Point",
                        coordinates: [
                            typeof longitude !== "undefined"
                                ? Number(longitude)
                                : 0,
                            typeof latitude !== "undefined"
                                ? Number(latitude)
                                : 0,
                        ],
                    },
                    owner: user._id,
                };
                createdEntity = await Veterinaria.create(veterinariaData);
                user.entityId = createdEntity._id;
            } else if (role === "doctor") {
                const publicName =
                    (entityName || rest.entityName || "").trim() ||
                    user.name ||
                    "Doctor";
                const doctorData = {
                    name: publicName,
                    specialty: rest.specialty || rest.especialidad || "",
                    address: rest.address || rest.direccion || "",
                    phone: rest.phone || rest.telefono || "",
                    url: rest.url || rest.instagram || "",
                    horario: rest.horario || rest.openingHours || "",
                    location: {
                        type: "Point",
                        coordinates: [
                            typeof longitude !== "undefined"
                                ? Number(longitude)
                                : 0,
                            typeof latitude !== "undefined"
                                ? Number(latitude)
                                : 0,
                        ],
                    },
                    owner: user._id,
                };
                createdEntity = await Doctor.create(doctorData);
                user.entityId = createdEntity._id;
            } else if (role === "emergency") {
                const publicName =
                    (entityName || rest.entityName || "").trim() ||
                    user.name ||
                    "Servicio de emergencia";
                const emergencyData = {
                    name: publicName,
                    serviceType: rest.serviceType || rest.tipoServicio || rest.type || "",
                    address: rest.address || rest.direccion || "",
                    phone: rest.phone || rest.telefono || "",
                    url: rest.url || "",
                    horario: rest.horario || rest.openingHours || "",
                    location: {
                        type: "Point",
                        coordinates: [
                            typeof longitude !== "undefined"
                                ? Number(longitude)
                                : 0,
                            typeof latitude !== "undefined"
                                ? Number(latitude)
                                : 0,
                        ],
                    },
                    owner: user._id,
                };
                // createdEntity assumes an Emergency model exists
                createdEntity = await Emergency.create(emergencyData);
                user.entityId = createdEntity._id;
            }
        } catch (entityErr) {
            // Log full validation error details for debugging
            console.error("Error creating entity for role:", role);
            if (entityErr && entityErr.name === "ValidationError") {
                console.error("Validation errors:", entityErr.errors);
            } else {
                console.error(entityErr);
            }

            // Rollback created user to avoid orphan user when entity creation fails
            try {
                await User.findByIdAndDelete(user._1d ?? user._id);
                console.error(
                    "Rolled back user creation due to entity creation error."
                );
            } catch (rollbackErr) {
                console.error(
                    "Error during rollback (user removal):",
                    rollbackErr
                );
            }

            return res.status(400).json({
                success: false,
                message:
                    "Error al crear la entidad asociada. Detalle: " +
                    (entityErr?.message || "ver logs del servidor"),
            });
        }

        // Generate verification token
        const verificationToken = generateVerificationToken(user._id);

        // Save verification token to user
        user.verificationToken = verificationToken;
        user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // Send verification email (best-effort)
        try {
            // await sendVerificationEmail(
            //     user.email,
            //     verificationToken,
            //     user.name
            // );
        } catch (emailError) {
            console.error("Email sending error:", emailError);
            // Continue even if email fails
        }

        const responseUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role,
            entityId: user.entityId,
            planId: user.planId || null,
        };

        const responseData = { user: responseUser };
        if (createdEntity) {
            responseData.entity = {
                id: createdEntity._id,
                name: createdEntity.name,
            };
        }

        res.status(201).json({
            success: true,
            message:
                "Usuario registrado exitosamente. Por favor verifica tu correo electrónico.",
            data: responseData,
        });
    } catch (error) {
        next(error);
    }
};
/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;

        // Verify token
        const decoded = verifyToken(token);

        if (decoded.purpose !== "verification") {
            return res.status(400).json({
                success: false,
                message: "Token de verificación inválido",
            });
        }

        // Find user
        const user = await User.findOne({
            _id: decoded.id,
            verificationToken: token,
            verificationTokenExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Token de verificación inválido o expirado",
            });
        }

        // Update user
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();

        // Generate auth token
        const authToken = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Correo electrónico verificado exitosamente",
            data: {
                token: authToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isVerified: user.isVerified,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 * Body: { email }
 */
exports.resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email)
            return res
                .status(400)
                .json({ success: false, message: "Email requerido" });

        const user = await User.findOne({ email });
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Usuario no encontrado" });
        if (user.isVerified)
            return res
                .status(400)
                .json({ success: false, message: "Usuario ya verificado" });

        // generate new token
        const verificationToken = generateVerificationToken(user._id);
        user.verificationToken = verificationToken;
        user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        //await sendVerificationEmail(user.email, verificationToken, user.name);

        return res.json({
            success: true,
            message: "Email de verificación reenviado",
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Por favor proporciona email y contraseña",
            });
        }

        // Check for user (include password field)
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas",
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas",
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message:
                    "Por favor verifica tu correo electrónico antes de iniciar sesión",
            });
        }

        // Generate token
        const token = generateToken(user._id);
        const userPayload = await buildAuthUserPayload(user);

        res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso",
            data: {
                token,
                user: userPayload,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
    try {
        const user = req.user;
        const userPayload = await buildAuthUserPayload(user, {
            createdAt: user.createdAt,
        });

        res.status(200).json({
            success: true,
            data: {
                user: userPayload,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update current logged in user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const currentUser = req.user; // provided by protect middleware
        if (!currentUser) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        const {
            name,
            email,
            telefono,
            direccion,
            ciudad,
            provincia,
            codigoPostal,
            latitude,
            longitude,
            location, // accept full location object optionally
        } = req.body;

        // If email is being changed, ensure it's not already registered
        if (email && email !== currentUser.email) {
            const exists = await User.findOne({ email });
            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: "El email ya está en uso por otro usuario",
                });
            }
        }

        // Update allowed fields
        if (typeof name !== "undefined") currentUser.name = name;
        if (typeof email !== "undefined") currentUser.email = email;
        if (typeof telefono !== "undefined") currentUser.telefono = telefono;
        if (typeof direccion !== "undefined") currentUser.direccion = direccion;
        if (typeof ciudad !== "undefined") currentUser.ciudad = ciudad;
        if (typeof provincia !== "undefined") currentUser.provincia = provincia;
        if (typeof codigoPostal !== "undefined")
            currentUser.codigoPostal = codigoPostal;

        // Location handling:
        if (
            location &&
            typeof location === "object" &&
            Array.isArray(location.coordinates)
        ) {
            currentUser.location = location;
        } else if (
            typeof latitude !== "undefined" &&
            typeof longitude !== "undefined"
        ) {
            const latNum = Number(latitude);
            const lngNum = Number(longitude);
            if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
                currentUser.location = {
                    type: "Point",
                    coordinates: [lngNum, latNum],
                };
            }
        }

        // Save user
        await currentUser.save();

        const userPayload = await buildAuthUserPayload(currentUser, {
            updatedAt: currentUser.updatedAt,
        });

        // Return updated user (include location)
        res.status(200).json({
            success: true,
            message: "Perfil actualizado correctamente",
            data: {
                user: userPayload,
            },
        });
    } catch (error) {
        next(error);
    }
};
