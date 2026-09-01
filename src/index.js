require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const veterinariaRoutes = require("./routes/veterinariaRoutes");
const doctorsRoutes = require("./routes/doctorsRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const requestRoutes = require("./routes/requestRoutes");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const adminRoutes = require("./routes/adminRoutes");


//front homepage routes
const contactRoutes = require("./routes/contactRoutes");
const searchRoutes = require("./routes/searchRoutes");

// NEW: public providers routes
const providersRoutes = require("./routes/providers");
const providerOfferingsRoutes = require("./routes/adminProviderOfferings");
const providerRoutes = require("./routes/adminProviders");

const prestationRoutes = require("./routes/adminPrestation");
const prestationsRoutes = require("./routes/prestations");

// NEW: Auditoría médica
const auditRoutes = require("./routes/auditRoutes");
const adminAuditRoutes = require("./routes/adminAuditRoutes");
const insuranceRoutes = require("./routes/insuranceRoutes");


const coverageRoutes = require("./routes/coverageRoutes");
const adminCoverageRoutes = require("./routes/adminRoutes"); // <-- reutilizamos adminRoutes para endpoints de cobertura, aunque podríamos crear uno específico si queremos mantenerlo separado



const path = require("path");

const app = express();

// Connect to database
connectDB();


const port = process.env.PORT || 3000;

// 1. Normalized origin list (prioritize localhost variants first)
const dominiosPermitidos = [
    // Development local
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost",           // Capacitor Android (http scheme)
    "https://localhost",          // Future-proofing
    
    // Mobile/Emulator
    "capacitor://localhost",      // iOS/Android Capacitor
    "http://10.0.2.2:3000",       // Android emulator (legacy)
    "http://10.0.2.2",            // Android emulator without port
    
    // Production
    // TODO: reemplazar por los dominios reales de vetmed cuando existan
    // "https://vetmed-backend.onrender.com",
    // "https://vetmed.vercel.app",
    // "https://vetmed.com.ar",
    // "https://www.vetmed.com.ar",
];

// 2. Helper: normalize origin (remove default ports for cleaner comparison)
const normalizeOrigin = (origin) => {
    if (!origin) return null;
    try {
        const url = new URL(origin);
        // Remove default ports: 80 for http, 443 for https
        if ((url.protocol === 'http:' && url.port === '80') ||
            (url.protocol === 'https:' && url.port === '443')) {
            url.port = '';
        }
        return url.origin;
    } catch {
        return origin;
    }
};

// 3. Enhanced CORS config
const corsOptions = {
    origin: function (origin, callback) {
        // Allow if no origin (Postman, same-origin, native apps without origin header)
        if (!origin) {
            callback(null, true);
            return;
        }
        
        // First: exact match (fast path)
        if (dominiosPermitidos.includes(origin)) {
            callback(null, true);
            return;
        }
        
        // Second: normalized match (handles port variations)
        const normalizedOrigin = normalizeOrigin(origin);
        const isAllowed = dominiosPermitidos.some(dominio => 
            normalizeOrigin(dominio) === normalizedOrigin
        );
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Rejected: ${origin} (normalized: ${normalizedOrigin})`);
            callback(new Error(`CORS - origen "${origin}" no permitido`));
        }
    },
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200,
};

// Aplicar la configuración de CORS
app.use(cors(corsOptions));



// Middleware
// Remove the duplicate cors middleware usage
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use("/api/", apiLimiter);

// Routes
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Bienvenido a Gimed API",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            pharmacies: "/api/pharmacies",
        },
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/veterinarias", veterinariaRoutes);
app.use("/api/doctors", doctorsRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/requests", requestRoutes);

// Public providers
app.use("/api/providers", providersRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/provider-offerings", providerOfferingsRoutes);
app.use("/api/admin/providers", providerRoutes);


app.use("/api/prestations", prestationsRoutes);
app.use("/api/admin", prestationRoutes);

//front homepage routes
app.use("/api/contacts", contactRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/insurance", insuranceRoutes);

// rutas de auditoría médica
app.use("/api/audits", auditRoutes);
app.use("/api/admin/audits", adminAuditRoutes);


app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use("/api/coverage", coverageRoutes);
app.use("/api/admin/coverage", adminCoverageRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Server running in ${
            process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
    );
});

module.exports = app;
