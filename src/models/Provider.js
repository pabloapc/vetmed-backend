const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, trim: true, index: true },
        code: { type: String, trim: true, index: true },
        category: { type: String, default: "" }, // e.g. 'veterinaria', 'odontologia', 'laboratorio', 'kinesiologia'
        categories: { type: [String], default: [] }, // tags categorización
        description: { type: String, default: "" },
        address: { type: String, default: "" },
        phone: { type: String, default: "" },
        url: { type: String, default: "" },
        horario: { type: String, default: "" },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        }, // si el prestador tiene un user asociado
        location: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
        },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

providerSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Provider", providerSchema);
