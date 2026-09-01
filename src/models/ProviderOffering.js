const mongoose = require("mongoose");

const offeringSchema = new mongoose.Schema(
    {
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            required: true,
        },
        prestationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prestacion",
            required: true,
        },
        price: { type: Number, default: null },
        currency: { type: String, default: "ARS" },
        durationMinutes: { type: Number, default: null },
        active: { type: Boolean, default: true },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. condiciones, turnos, cobertura seguros
    },
    { timestamps: true }
);

// index para búsquedas rápidas por provider o prestation
offeringSchema.index({ providerId: 1, prestationId: 1 }, { unique: true });

module.exports = mongoose.model("ProviderOffering", offeringSchema);
