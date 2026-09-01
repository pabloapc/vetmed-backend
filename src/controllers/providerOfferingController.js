const mongoose = require("mongoose");
const ProviderOffering = require("../models/ProviderOffering");
const Provider = require("../models/Provider");
const Prestation = require("../models/Prestation");

/**
 * Admin: List provider offerings (optionally filter by providerId or prestationId)
 * GET /api/admin/provider-offerings?providerId=...&prestationId=...
 */
exports.adminListOfferings = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || "1", 10));
        const limit = Math.min(
            200,
            Math.max(1, parseInt(req.query.limit || "25", 10))
        );
        const skip = (page - 1) * limit;
        const filter = {};

        if (
            req.query.providerId &&
            mongoose.Types.ObjectId.isValid(req.query.providerId)
        )
            filter.providerId = req.query.providerId;
        if (
            req.query.prestationId &&
            mongoose.Types.ObjectId.isValid(req.query.prestationId)
        )
            filter.prestationId = req.query.prestationId;

        const [items, total] = await Promise.all([
            ProviderOffering.find(filter).skip(skip).limit(limit).lean(),
            ProviderOffering.countDocuments(filter),
        ]);

        return res.json({
            success: true,
            data: { offerings: items, meta: { total, page, limit } },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: Create offering
 * POST /api/admin/provider-offerings
 * body: { providerId, prestationId, price, currency, durationMinutes, active, metadata }
 */
exports.adminCreateOffering = async (req, res, next) => {
    try {
        const { providerId, prestationId } = req.body;
        if (!providerId || !mongoose.Types.ObjectId.isValid(providerId))
            return res
                .status(400)
                .json({ success: false, message: "providerId inválido" });
        if (!prestationId || !mongoose.Types.ObjectId.isValid(prestationId))
            return res
                .status(400)
                .json({ success: false, message: "prestationId inválido" });

        // validate provider and prestation exist
        const prov = await Provider.findById(providerId).lean();
        if (!prov)
            return res
                .status(400)
                .json({ success: false, message: "Proveedor no encontrado" });
        const pres = await Prestation.findById(prestationId).lean();
        if (!pres)
            return res
                .status(400)
                .json({ success: false, message: "Prestación no encontrada" });

        const payload = {
            providerId,
            prestationId,
            price:
                typeof req.body.price !== "undefined" ? req.body.price : null,
            currency: req.body.currency || "ARS",
            durationMinutes:
                typeof req.body.durationMinutes !== "undefined"
                    ? req.body.durationMinutes
                    : null,
            active:
                typeof req.body.active !== "undefined"
                    ? !!req.body.active
                    : true,
            metadata: req.body.metadata || {},
        };

        // ensure unique provider+prestation
        const existing = await ProviderOffering.findOne({
            providerId,
            prestationId,
        }).lean();
        if (existing)
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "La oferta para esa prestación y proveedor ya existe",
                });

        const created = await ProviderOffering.create(payload);
        return res
            .status(201)
            .json({ success: true, data: { offering: created } });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: Update offering
 * PUT /api/admin/provider-offerings/:id
 */
exports.adminUpdateOffering = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });

        const allowed = [
            "price",
            "currency",
            "durationMinutes",
            "active",
            "metadata",
        ];
        const updates = {};
        allowed.forEach((k) => {
            if (typeof req.body[k] !== "undefined") updates[k] = req.body[k];
        });

        const updated = await ProviderOffering.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).lean();
        if (!updated)
            return res
                .status(404)
                .json({ success: false, message: "Offering no encontrado" });
        return res.json({ success: true, data: { offering: updated } });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: DELETE /api/admin/provider-offerings/:id
 */
exports.adminDeleteOffering = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const deleted = await ProviderOffering.findByIdAndDelete(id).lean();
        if (!deleted)
            return res
                .status(404)
                .json({ success: false, message: "Offering no encontrado" });
        return res.json({ success: true, message: "Offering eliminado" });
    } catch (err) {
        next(err);
    }
};
