const mongoose = require("mongoose");

const medicalAuditSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        diagnosis: {
            description: { type: String, required: true },
            icd10Code: { type: String },
            restDays: { type: Number, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            attendingDoctor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Doctor",
            },
            doctorName: { type: String },
            institution: { type: String },
        },
        documents: [
            {
                type: {
                    type: String,
                    enum: ["recipe", "certificate", "study", "report", "other"],
                    required: true,
                },
                label: { type: String },
                url: { type: String, required: true },
                uploadedAt: { type: Date, default: Date.now },
                fileSize: { type: Number },
                mimeType: { type: String },
            },
        ],
        auditStatus: {
            type: String,
            enum: ["pending", "in_review", "validated", "rejected", "requires_more"],
            default: "pending",
        },
        auditValidation: {
            validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            validatedAt: { type: Date },
            notes: { type: String },
            rejectionReason: { type: String },
            score: { type: Number, min: 0, max: 100 },
            flags: [{ type: String }],
        },
        tracking: [
            {
                timestamp: { type: Date, default: Date.now },
                location: {
                    type: { type: String, enum: ["Point"], default: "Point" },
                    coordinates: { type: [Number], default: [0, 0] },
                },
                address: { type: String },
                event: {
                    type: String,
                    enum: [
                        "check_in",
                        "check_out",
                        "contact_attempt",
                        "contact_success",
                        "location_update",
                        "suspicious_activity",
                    ],
                },
                notes: { type: String },
                recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            },
        ],
        contactLog: [
            {
                contactedAt: { type: Date, default: Date.now },
                method: {
                    type: String,
                    enum: ["phone", "whatsapp", "email", "in_person", "video_call"],
                },
                contactedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                outcome: {
                    type: String,
                    enum: ["reached", "no_answer", "refused", "rescheduled"],
                },
                notes: { type: String },
                nextContactDate: { type: Date },
            },
        ],
        provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
        status: {
            type: String,
            enum: ["active", "closed", "appealed", "cancelled"],
            default: "active",
        },
        closedAt: { type: Date },
        closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        closingNotes: { type: String },
    },
    { timestamps: true }
);

medicalAuditSchema.index({ "tracking.location": "2dsphere" });
medicalAuditSchema.index({ employee: 1, status: 1 });
medicalAuditSchema.index({ auditStatus: 1 });

module.exports = mongoose.model("MedicalAudit", medicalAuditSchema);