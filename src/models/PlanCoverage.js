const mongoose = require("mongoose");

const planCoverageSchema = new mongoose.Schema(
    {
        insurerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Insurer",
            required: true,
            index: true,
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            required: true,
            index: true,
        },
        prestationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prestation",
            required: true,
            index: true,
        },
        coverageMode: {
            type: String,
            required: true,
            default: "covered",
            enum: ["covered", "partial", "excluded"],
        },
        coveragePercent: { type: Number, default: 100 },
        copayAmount: { type: Number, default: 0 },
        currency: { type: String, default: "ARS" },
        requiresAuthorization: { type: Boolean, default: false },
        referralRequired: { type: Boolean, default: false },
        limitPeriod: {
            type: String,
            default: "none",
            enum: ["none", "day", "week", "month", "year"],
        },
        limitCount: { type: Number, default: 0 },
        waitingPeriodDays: { type: Number, default: 0 },
        notes: { type: String, default: "" },
        validFrom: { type: Date, default: null },
        validTo: { type: Date, default: null },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

planCoverageSchema.index(
    { planId: 1, prestationId: 1 },
    { unique: true }
);

module.exports = mongoose.model("PlanCoverage", planCoverageSchema);