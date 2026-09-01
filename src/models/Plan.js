const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
    {
        insurerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Insurer",
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        slug: { type: String, trim: true },
        code: { type: String, trim: true, index: true },
        tier: { type: String, default: "" },
        description: { type: String, default: "" },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

planSchema.index({ insurerId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Plan", planSchema);