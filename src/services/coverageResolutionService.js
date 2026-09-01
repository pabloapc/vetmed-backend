const UserMembership = require("../models/UserMembership");

const DEFAULT_COVERAGE = Object.freeze({
    insurerId: null,
    insurerName: "Gimed",
    planId: null,
    planName: "Base Gimed",
    coverageType: "base",
});

const toNullableString = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    return String(value);
};

const resolveUserCoverage = async (userId) => {
    const membership = await UserMembership.findOne({
        userId,
        isActive: true,
    })
        .populate("insurerId", "name")
        .populate("planId", "name")
        .lean();

    if (!membership) {
        return { ...DEFAULT_COVERAGE };
    }

    return {
        insurerId: toNullableString(membership.insurerId?._id || membership.insurerId),
        insurerName: membership.insurerId?.name || DEFAULT_COVERAGE.insurerName,
        planId: toNullableString(membership.planId?._id || membership.planId),
        planName: membership.planId?.name || DEFAULT_COVERAGE.planName,
        coverageType: "institution",
    };
};

module.exports = {
    DEFAULT_COVERAGE,
    resolveUserCoverage,
};
