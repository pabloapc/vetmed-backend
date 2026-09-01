const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        company: { type: String },
        role: { type: String }, // company | institution | other
        message: { type: String },
        source: { type: String }, // opcional: 'home_form' u otra referencia
        ip: { type: String },
        userAgent: { type: String },
        // Nuevo: referencia opcional al usuario registrado que originó el lead
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Nuevo: snapshot opcional de datos del usuario (se guarda para auditoría)
        userSnapshot: {
            name: { type: String },
            email: { type: String },
            telefono: { type: String },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
        handled: { type: Boolean, default: false },
        handledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
