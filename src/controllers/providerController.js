const mongoose = require("mongoose");
const Provider = require("../models/Provider");
const ProviderOffering = require("../models/ProviderOffering");

/**
 * small util to parse pagination/search params (kept local here)
 */
function parseListQuery(req) {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit || "25", 10))
    );
    const skip = (page - 1) * limit;
    const q = (req.query.q || "").trim();
    return { page, limit, skip, q };
}

/**
 * Public: GET /api/providers
 * Query params:
 *  - q (name/address)
 *  - category
 *  - prestationId (to filter providers that offer a given prestation)
 *  - lat, lng, maxDistance (meters) for geo search
 */
exports.listProviders = async (req, res, next) => {
    try {
        const { limit, skip, q, page } = parseListQuery(req);
        const filter = { isActive: true };

        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { address: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
            ];
        }

        if (req.query.category) {
            filter.category = req.query.category;
        }

        // geolocation filter
        if (req.query.lat && req.query.lng) {
            const lat = parseFloat(req.query.lat);
            const lng = parseFloat(req.query.lng);
            const maxDistance = parseInt(req.query.maxDistance || "5000", 10); // meters
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                filter.location = {
                    $near: {
                        $geometry: { type: "Point", coordinates: [lng, lat] },
                        $maxDistance: Number.isFinite(maxDistance)
                            ? maxDistance
                            : 5000,
                    },
                };
            }
        }

        // If prestationId provided, first collect providerIds from ProviderOffering
        let providerIdsFilter = null;
        const prestationId = req.query.prestationId;
        if (prestationId && mongoose.Types.ObjectId.isValid(prestationId)) {
            const offerings = await ProviderOffering.find({
                prestationId,
                active: true,
            })
                .select("providerId")
                .lean();
            const ids = offerings
                .map((o) => String(o.providerId))
                .filter(Boolean);
            if (ids.length === 0) {
                // no providers offer it; return empty
                return res.json({
                    success: true,
                    data: { providers: [], meta: { total: 0, page, limit } },
                });
            }
            providerIdsFilter = ids;
            filter._id = { $in: ids };
        }

        const [items, total] = await Promise.all([
            Provider.find(filter).skip(skip).limit(limit).lean(),
            Provider.countDocuments(filter),
        ]);

        return res.json({
            success: true,
            data: { providers: items, meta: { total, page, limit } },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Public: GET /api/providers/:id
 */
exports.getProvider = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const doc = await Provider.findById(id).lean();
        if (!doc)
            return res
                .status(404)
                .json({ success: false, message: "Proveedor no encontrado" });
        return res.json({ success: true, data: { provider: doc } });
    } catch (err) {
        next(err);
    }
};

/**
 * Public: GET /api/providers/:id/offerings
 * Lists ProviderOffering for a provider (optionally populate prestation)
 */
exports.listProviderOfferings = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });

        const filter = { providerId: id };
        const items = await ProviderOffering.find(filter).lean();
        return res.json({ success: true, data: { offerings: items } });
    } catch (err) {
        next(err);
    }
};

/* Admin handlers (can be used in admin routes, but kept here for convenience) */

/**
 * Admin: POST /api/admin/providers
 */
exports.adminCreateProvider = async (req, res, next) => {
    try {
        const payload = {};
        const allowed = [
            "name",
            "slug",
            "code",
            "category",
            "categories",
            "description",
            "address",
            "phone",
            "url",
            "horario",
            "owner",
            "isActive",
            "metadata",
            "location",
        ];
        allowed.forEach((k) => {
            if (typeof req.body[k] !== "undefined") payload[k] = req.body[k];
        });

        // Accept latitude/longitude convenience
        if (
            typeof req.body.latitude !== "undefined" &&
            typeof req.body.longitude !== "undefined"
        ) {
            const lat = parseFloat(req.body.latitude);
            const lng = parseFloat(req.body.longitude);
            if (!Number.isNaN(lat) && !Number.isNaN(lng))
                payload.location = { type: "Point", coordinates: [lng, lat] };
        }

        const created = await Provider.create(payload);
        return res
            .status(201)
            .json({ success: true, data: { provider: created } });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: PUT /api/admin/providers/:id
 */
exports.adminUpdateProvider = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });

        const allowed = [
            "name",
            "slug",
            "code",
            "category",
            "categories",
            "description",
            "address",
            "phone",
            "url",
            "horario",
            "owner",
            "isActive",
            "metadata",
        ];
        const updates = {};
        allowed.forEach((k) => {
            if (typeof req.body[k] !== "undefined") updates[k] = req.body[k];
        });

        if (
            typeof req.body.latitude !== "undefined" &&
            typeof req.body.longitude !== "undefined"
        ) {
            const lat = parseFloat(req.body.latitude);
            const lng = parseFloat(req.body.longitude);
            if (!Number.isNaN(lat) && !Number.isNaN(lng))
                updates.location = { type: "Point", coordinates: [lng, lat] };
        }

        const updated = await Provider.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).lean();
        if (!updated)
            return res
                .status(404)
                .json({ success: false, message: "Proveedor no encontrado" });
        return res.json({ success: true, data: { provider: updated } });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: DELETE /api/admin/providers/:id
 */
exports.adminDeleteProvider = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const deleted = await Provider.findByIdAndDelete(id).lean();
        if (!deleted)
            return res
                .status(404)
                .json({ success: false, message: "Proveedor no encontrado" });
        return res.json({ success: true, message: "Proveedor eliminado" });
    } catch (err) {
        next(err);
    }
};
