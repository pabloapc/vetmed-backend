const mongoose = require("mongoose");

const userMembershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    insurerId: { type: mongoose.Schema.Types.ObjectId, ref: "Insurer", required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    affiliateNumber: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date },
    validTo: { type: Date },
  },
  { timestamps: true }
);

userMembershipSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("UserMembership", userMembershipSchema);