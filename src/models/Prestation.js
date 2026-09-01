const mongoose = require("mongoose");

const prestationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, trim: true, index: true },
        code: { type: String, trim: true, index: true },
        category: { type: String, default: "" },
        categories: { type: [String], default: [] },
        description: { type: String, default: "" },
        defaultDurationMinutes: { type: Number, default: 0 },
        requiresAuthorization: { type: Boolean, default: false },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

prestationSchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Prestation", prestationSchema);