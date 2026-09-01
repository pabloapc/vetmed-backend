const mongoose = require("mongoose");
const Prestation = require("../models/Prestation");

/**
 * parse pagination/search params
 */
function parseListQuery(req) {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
        200,
        Math.max(1, parseInt(req.query.limit || "25", 10))
    );
    const skip = (page - 1) * limit;
    const q = (req.query.q || "").trim();
    return { page, limit, skip, q };
}

/**
 * Public: GET /api/prestations
 */
exports.listPrestationsPublic = async (req, res, next) => {
    try {
        const { page, limit, skip, q } = parseListQuery(req);
        const filter = {};
        if (q) {
            // use text search if available otherwise regex
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
                { category: { $regex: q, $options: "i" } },
            ];
        }
        const [items, total] = await Promise.all([
            Prestation.find(filter).skip(skip).limit(limit).lean(),
            Prestation.countDocuments(filter),
        ]);
        return res.json({
            success: true,
            data: { prestations: items, meta: { total, page, limit } },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Public: GET /api/prestations/:id
 */
exports.getPrestationPublic = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const doc = await Prestation.findById(id).lean();
        if (!doc)
            return res
                .status(404)
                .json({ success: false, message: "Prestación no encontrada" });
        return res.json({ success: true, data: { prestation: doc } });
    } catch (err) {
        next(err);
    }
};

/* ---------------- Admin handlers (mounted under /api/admin) ---------------- */

/**
 * Admin: GET /api/admin/prestations
 */
exports.adminListPrestations = async (req, res, next) => {
    try {
        const { page, limit, skip, q } = parseListQuery(req);
        const filter = {};
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
                { category: { $regex: q, $options: "i" } },
            ];
        }
        const [items, total] = await Promise.all([
            Prestation.find(filter).skip(skip).limit(limit).lean(),
            Prestation.countDocuments(filter),
        ]);
        return res.json({
            success: true,
            data: { prestations: items, meta: { total, page, limit } },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: POST /api/admin/prestations
 */
exports.adminCreatePrestation = async (req, res, next) => {
    try {
        const payload = {};
        const allowed = [
            "code",
            "name",
            "slug",
            "description",
            "category",
            "categories",
            "tags",
            "defaultDurationMinutes",
            "defaultPrice",
            "applicableTo",
            "isActive",
            "metadata",
        ];
        allowed.forEach((k) => {
            if (typeof req.body[k] !== "undefined") payload[k] = req.body[k];
        });

        // normalize defaultPrice if separate fields provided
        if (
            (typeof req.body.priceMin !== "undefined" ||
                typeof req.body.priceMax !== "undefined") &&
            !payload.defaultPrice
        ) {
            payload.defaultPrice = {
                min:
                    typeof req.body.priceMin !== "undefined"
                        ? Number(req.body.priceMin)
                        : undefined,
                max:
                    typeof req.body.priceMax !== "undefined"
                        ? Number(req.body.priceMax)
                        : undefined,
                currency: req.body.currency || "ARS",
            };
        }

        const created = await Prestation.create(payload);
        return res
            .status(201)
            .json({ success: true, data: { prestation: created } });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: GET /api/admin/prestations/:id
 */
exports.adminGetPrestation = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const doc = await Prestation.findById(id).lean();
        if (!doc)
            return res
                .status(404)
                .json({ success: false, message: "Prestación no encontrada" });
        return res.json({ success: true, data: { prestation: doc } });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: PUT /api/admin/prestations/:id
 */
exports.adminUpdatePrestation = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });

        const allowed = [
            "code",
            "name",
            "slug",
            "description",
            "category",
            "categories",
            "tags",
            "defaultDurationMinutes",
            "defaultPrice",
            "applicableTo",
            "isActive",
            "metadata",
        ];
        const updates = {};
        allowed.forEach((k) => {
            if (typeof req.body[k] !== "undefined") updates[k] = req.body[k];
        });

        // defaultPrice convenience
        if (
            typeof req.body.priceMin !== "undefined" ||
            typeof req.body.priceMax !== "undefined"
        ) {
            updates.defaultPrice = {
                min:
                    typeof req.body.priceMin !== "undefined"
                        ? Number(req.body.priceMin)
                        : undefined,
                max:
                    typeof req.body.priceMax !== "undefined"
                        ? Number(req.body.priceMax)
                        : undefined,
                currency: req.body.currency || "ARS",
            };
        }

        const updated = await Prestation.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).lean();
        if (!updated)
            return res
                .status(404)
                .json({ success: false, message: "Prestación no encontrada" });
        return res.json({ success: true, data: { prestation: updated } });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: DELETE /api/admin/prestations/:id
 */
exports.adminDeletePrestation = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const deleted = await Prestation.findByIdAndDelete(id).lean();
        if (!deleted)
            return res
                .status(404)
                .json({ success: false, message: "Prestación no encontrada" });
        return res.json({ success: true, message: "Prestación eliminada" });
    } catch (err) {
        next(err);
    }
};
