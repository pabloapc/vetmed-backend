const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        // New unified target fields
        targetType: {
            type: String,
            enum: ["veterinaria", "doctor", "emergency", "other"],
            required: false,
            default: undefined,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "targetType", // optional dynamic refs
            required: false,
            default: undefined,
        },

        // Backwards compatibility (existing docs may have veterinaria)
        veterinaria: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Veterinaria",
            required: false,
        },

        user: {
            // puede ser null si la solicitud la hizo un usuario anónimo
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        userSnapshot: {
            name: { type: String },
            email: { type: String },
            telefono: { type: String },
        },
        actionType: {
            type: String,
            enum: [
                "medicamento",
                "pedido_medico",
                "consulta_medica",
                "urgencia",
                "video_llamada",
                "otro",
            ],
            required: true,
        },
        notes: { type: String, trim: true, default: "" },
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "fulfilled",
                "cancelled",
                "en_transito",
                "llego_destino",
            ],
            default: "pending",
        },
        // Nuevo: confirmación por parte del paciente/usuario
        status_reply: { type: Boolean, default: false },
        // opcional: timestamp cuando la confirmación se hizo
        status_reply_at: { type: Date, default: null },
        status_reply_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        }, // quién confirmó
        // NEW: metadata para videollamada / scheduling
        metadata: {
            callUrl: { type: String, default: "" },
            scheduledAt: { type: Date, default: null },
            // cualquier otro dato futuro...
        },

        prestationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prestation",
            required: false,
            default: undefined,
        },
        // referencia genérica a Provider (nuevo esquema)
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            required: false,
            default: undefined,
        },
    },

    {
        timestamps: true,
    }
);

// Index for quick lookups by target
requestSchema.index({ targetType: 1, targetId: 1 });
requestSchema.index({ veterinaria: 1 });
module.exports = mongoose.model("Request", requestSchema);
