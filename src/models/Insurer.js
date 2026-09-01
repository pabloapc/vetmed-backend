const mongoose = require("mongoose");

const insurerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, trim: true, index: true },
        code: { type: String, trim: true, index: true },
        kind: {
            type: String,
            default: "obra_social",
            enum: ["obra_social", "prepaga", "seguro", "otro"],
        },
        description: { type: String, default: "" },
        phone: { type: String, default: "" },
        email: { type: String, default: "", trim: true, lowercase: true },
        url: { type: String, default: "" },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

insurerSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Insurer", insurerSchema);