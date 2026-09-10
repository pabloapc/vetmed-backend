const Insurer = require("../models/Insurer");
const Plan = require("../models/Plan");
const Prestation = require("../models/Prestation");
const PlanCoverage = require("../models/PlanCoverage");
const UserMembership = require("../models/UserMembership");

exports.listInsurers = async (_req, res) => {
    const data = await Insurer.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data });
};

exports.listPlansByInsurer = async (req, res) => {
    const { insurerId } = req.params;
    const data = await Plan.find({ insurerId, isActive: true }).sort({ name: 1 });
    res.json({ success: true, data });
};

exports.getInsurer = async (req, res, next) => {
  try {
    const data = await Insurer.findOne({ _id: req.params.id, isActive: true });
    if (!data) {
      return res.status(404).json({ success: false, message: "Insurer no encontrado" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getPlanPublic = async (req, res, next) => {
  try {
    const data = await Plan.findOne({ _id: req.params.id, isActive: true }).populate(
      "insurerId",
      "name"
    );

    if (!data) {
      return res.status(404).json({ success: false, message: "Plan no encontrado" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.listPrestations = async (_req, res) => {
    const data = await Prestation.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data });
};

exports.getCoverage = async (req, res) => {
    const { planId, prestationId } = req.query;
    if (!planId || !prestationId) {
        return res.status(400).json({ success: false, message: "planId y prestationId son requeridos" });
    }

    const coverage = await PlanCoverage.findOne({
        planId,
        prestationId,
        isActive: true,
    }).populate("planId insurerId prestationId");

    if (!coverage) {
        return res.status(404).json({ success: false, message: "Cobertura no encontrada" });
    }

    res.json({ success: true, data: coverage });
};

exports.getMyMembership = async (req, res) => {
    const membership = await UserMembership.findOne({ userId: req.user._id, isActive: true })
        .populate("insurerId")
        .populate("planId");

    if (!membership) {
        return res.status(404).json({ success: false, message: "Afiliación no encontrada" });
    }

    res.json({ success: true, data: membership });
};

exports.upsertMyMembership = async (req, res) => {
    const { insurerId, planId, affiliateNumber } = req.body;

    const data = await UserMembership.findOneAndUpdate(
        { userId: req.user._id },
        { userId: req.user._id, insurerId, planId, affiliateNumber, isActive: true },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data });
};

exports.upsertPlanCoverage = async (req, res) => {
    const { insurerId, planId, prestationId } = req.body;

    const payload = {
        insurerId,
        planId,
        prestationId,
        coverageMode: req.body.coverageMode,
        coveragePercent: req.body.coveragePercent,
        copayAmount: req.body.copayAmount,
        currency: req.body.currency,
        requiresAuthorization: req.body.requiresAuthorization,
        referralRequired: req.body.referralRequired,
        limitPeriod: req.body.limitPeriod,
        limitCount: req.body.limitCount,
        waitingPeriodDays: req.body.waitingPeriodDays,
        notes: req.body.notes,
        validFrom: req.body.validFrom,
        validTo: req.body.validTo,
        metadata: req.body.metadata,
        isActive: req.body.isActive ?? true,
    };

    const data = await PlanCoverage.findOneAndUpdate(
        { planId, prestationId },
        payload,
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data });
};

// Admin: create a coverage explicitly — unlike upsertPlanCoverage (used by the legacy
// PUT alias), this rejects a duplicate plan+prestation pair instead of silently
// overwriting the existing row, so the admin panel's "create" action can't clobber data.
exports.createPlanCoverage = async (req, res, next) => {
    try {
        const { insurerId, planId, prestationId } = req.body;
        if (!insurerId || !planId || !prestationId) {
            return res.status(400).json({
                success: false,
                message: "insurerId, planId y prestationId son requeridos",
            });
        }

        const existing = await PlanCoverage.findOne({ planId, prestationId });
        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "Ya existe una cobertura para este plan y esta prestación. Editá la existente en vez de crear una nueva.",
                data: existing,
            });
        }

        const data = await PlanCoverage.create({
            insurerId,
            planId,
            prestationId,
            coverageMode: req.body.coverageMode,
            coveragePercent: req.body.coveragePercent,
            copayAmount: req.body.copayAmount,
            currency: req.body.currency,
            requiresAuthorization: req.body.requiresAuthorization,
            referralRequired: req.body.referralRequired,
            limitPeriod: req.body.limitPeriod,
            limitCount: req.body.limitCount,
            waitingPeriodDays: req.body.waitingPeriodDays,
            notes: req.body.notes,
            validFrom: req.body.validFrom,
            validTo: req.body.validTo,
            metadata: req.body.metadata,
            isActive: req.body.isActive ?? true,
        });

        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.getPlanCoverageAdmin = async (req, res, next) => {
    try {
        const data = await PlanCoverage.findById(req.params.id)
            .populate("insurerId", "name")
            .populate("planId", "name")
            .populate("prestationId", "name code");
        if (!data)
            return res.status(404).json({ success: false, message: "Cobertura no encontrada" });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.updatePlanCoverageAdmin = async (req, res, next) => {
    try {
        const data = await PlanCoverage.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!data)
            return res.status(404).json({ success: false, message: "Cobertura no encontrada" });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.deletePlanCoverageAdmin = async (req, res, next) => {
    try {
        const data = await PlanCoverage.findByIdAndDelete(req.params.id);
        if (!data)
            return res.status(404).json({ success: false, message: "Cobertura no encontrada" });
        res.json({ success: true, message: "Cobertura eliminada" });
    } catch (error) {
        next(error);
    }
};

exports.upsertProviderPrestation = async (req, res) => {
    const { providerId, prestationId } = req.body;

    const data = await ServiceProviderPrestation.findOneAndUpdate(
        { providerId, prestationId },
        { ...req.body, isActive: req.body.isActive ?? true },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data });
};

exports.listProviderPrestations = async (req, res) => {
    const { providerId } = req.params;
    const data = await ServiceProviderPrestation.find({
        providerId,
        isActive: true,
    }).populate("prestationId");

    res.json({ success: true, data });
};



// Admin CRUD Insurer
exports.createInsurer = async (req, res, next) => {
  try {
    const data = await Insurer.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.listInsurersAdmin = async (_req, res, next) => {
  try {
    const data = await Insurer.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getInsurerAdmin = async (req, res, next) => {
  try {
    const data = await Insurer.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Insurer no encontrado" });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.updateInsurerAdmin = async (req, res, next) => {
  try {
    const data = await Insurer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: "Insurer no encontrado" });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.deleteInsurerAdmin = async (req, res, next) => {
  try {
    const data = await Insurer.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Insurer no encontrado" });
    res.json({ success: true, message: "Insurer eliminado" });
  } catch (error) {
    next(error);
  }
};
 

// Admin CRUD Plan
exports.createPlanAdmin = async (req, res, next) => {
  try {
    const data = await Plan.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.listPlansAdmin = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.insurerId) filter.insurerId = req.query.insurerId;
    const data = await Plan.find(filter).populate("insurerId").sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getPlanAdmin = async (req, res, next) => {
  try {
    const data = await Plan.findById(req.params.id).populate("insurerId");
    if (!data) return res.status(404).json({ success: false, message: "Plan no encontrado" });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.updatePlanAdmin = async (req, res, next) => {
  try {
    const data = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("insurerId");
    if (!data) return res.status(404).json({ success: false, message: "Plan no encontrado" });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.deletePlanAdmin = async (req, res, next) => {
  try {
    const data = await Plan.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Plan no encontrado" });
    res.json({ success: true, message: "Plan eliminado" });
  } catch (error) {
    next(error);
  }
};

// ...existing code...

exports.listPlanCoveragesAdmin = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      q = "",
      insurerId,
      planId,
      prestationId,
      isActive,
    } = req.query;

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
    const skip = (p - 1) * l;

    const filter = {};
    if (insurerId) filter.insurerId = insurerId;
    if (planId) filter.planId = planId;
    if (prestationId) filter.prestationId = prestationId;
    if (typeof isActive !== "undefined") filter.isActive = String(isActive) === "true";

    if (q && q.trim()) {
      const re = new RegExp(q.trim(), "i");
      filter.$or = [{ notes: re }, { coverageMode: re }];
    }

    const [items, total] = await Promise.all([
      PlanCoverage.find(filter)
        .populate("insurerId", "name")
        .populate("planId", "name")
        .populate("prestationId", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
      PlanCoverage.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: p,
        limit: l,
        pages: Math.ceil(total / l),
      },
    });
  } catch (error) {
    next(error);
  }
};


//publico

// ...existing code...
exports.listInsurers = async (req, res) => {
  const { page = 1, limit = 200, q = "" } = req.query;
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);
  const skip = (p - 1) * l;

  const filter = { isActive: true };
  if (q && q.trim()) {
    filter.name = new RegExp(q.trim(), "i");
  }

  const [items, total] = await Promise.all([
    Insurer.find(filter).sort({ name: 1 }).skip(skip).limit(l),
    Insurer.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l),
    },
  });
};
// ...existing code...
 // ...existing code...

exports.listPlansPublic = async (req, res) => {
    const { page = 1, limit = 200, q = "", insurerId } = req.query;

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);
    const skip = (p - 1) * l;

    const filter = { isActive: true };
    if (insurerId) filter.insurerId = insurerId;
    if (q && q.trim()) filter.name = new RegExp(q.trim(), "i");

    const [items, total] = await Promise.all([
        Plan.find(filter).populate("insurerId", "name").sort({ name: 1 }).skip(skip).limit(l),
        Plan.countDocuments(filter),
    ]);

    return res.json({
        success: true,
        data: items,
        pagination: {
            total,
            page: p,
            limit: l,
            pages: Math.ceil(total / l),
        },
    });
};

// ...existing code...

exports.listPlanCoveragesPublic = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 100,
      insurerId,
      planId,
      prestationId,
      q = "",
    } = req.query;

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
    const skip = (p - 1) * l;

    const filter = { isActive: true };
    if (insurerId) filter.insurerId = insurerId;
    if (planId) filter.planId = planId;
    if (prestationId) filter.prestationId = prestationId;

    if (q && q.trim()) {
      const re = new RegExp(q.trim(), "i");
      filter.$or = [{ notes: re }, { coverageMode: re }];
    }

    const [items, total] = await Promise.all([
      PlanCoverage.find(filter)
        .populate("insurerId", "name")
        .populate("planId", "name")
        .populate("prestationId", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
      PlanCoverage.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: p,
        limit: l,
        pages: Math.ceil(total / l),
      },
    });
  } catch (error) {
    next(error);
  }
};