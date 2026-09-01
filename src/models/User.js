const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Por favor ingrese su nombre"],
            trim: true,
        },
        dni: {
            type: String,
            required: [false, "Por favor ingrese su DNI"],
        },
        email: {
            type: String,
            required: [true, "Por favor ingrese su correo electrónico"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Por favor ingrese un correo electrónico válido",
            ],
        },
        password: {
            type: String,
            required: [true, "Por favor ingrese una contraseña"],
            minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
            select: false,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
            select: false,
        },
        verificationTokenExpire: {
            type: Date,
            select: false,
        },

        // New profile fields
        telefono: {
            type: String,
            trim: true,
            default: "",
        },
        direccion: {
            type: String,
            trim: true,
            default: "",
        },
        ciudad: {
            type: String,
            trim: true,
            default: "",
        },
        provincia: {
            type: String,
            trim: true,
            default: "",
        },
        codigoPostal: {
            type: String,
            trim: true,
            default: "",
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
        },

        // New: role and optional reference to entity (pharmacy/doctor)
        role: {
            type: String,
            enum: ["user", "pharmacy", "doctor", "emergency", "admin"], // <-- añadí 'admin' aquí
            default: null, // keep null for older users if you prefer; or "user"
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", default: null },

    },
    {
        timestamps: true,
    }
);

// Index for geospatial queries
userSchema.index({ location: "2dsphere" });

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
