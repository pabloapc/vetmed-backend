const Veterinaria = require("../models/Veterinaria");

/**
 * GET /api/search
 * Query:
 *   - q: string (required for suggestions/search)
 *   - type: 'veterinaria' (default)
 *   - limit: number (default 8) -> for suggestions
 *   - full: boolean (if true, return full matching docs instead of compact suggestions)
 *
 * Responses:
 *  - suggestions: [{ type, id, name, address, snippet }]
 *  - when full=true: { veterinarias: [...] }
 */
exports.search = async (req, res, next) => {
    try {
        const q = (req.query.q || "").trim();
        if (!q) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "q query parameter required",
                });
        }

        const type = req.query.type || "veterinaria";
        const limit = Math.min(50, parseInt(req.query.limit, 10) || 8);
        const full = req.query.full === "true" || req.query.full === true;

        // build regex for case-insensitive partial match
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

        // helper to build snippet
        const snippetFrom = (doc) => {
            if (!doc) return "";
            if (doc.address) return doc.address;
            if (doc.direccion) return doc.direccion;
            return "";
        };

        // If full results requested, return full documents
        if (full) {
            const out = {};
            if (type === "veterinaria") {
                const veterinarias = await Veterinaria.find({
                    $or: [
                        { name: regex },
                        { address: regex },
                        { direccion: regex },
                    ],
                })
                    .limit(100)
                    .lean();
                out.veterinarias = veterinarias;
            }
            return res.json({ success: true, data: out });
        }

        // suggestions mode: return compact list
        const suggestions = [];

        if (type === "veterinaria") {
            const phs = await Veterinaria.find({
                $or: [
                    { name: regex },
                    { address: regex },
                    { direccion: regex },
                ],
            })
                .limit(limit)
                .lean();
            phs.forEach((p) => {
                suggestions.push({
                    type: "veterinaria",
                    id: p._id,
                    name: p.name,
                    address: p.address || p.direccion || snippetFrom(p),
                });
            });
        }

        return res.json({
            success: true,
            data: { suggestions: suggestions.slice(0, limit) },
        });
    } catch (err) {
        next(err);
    }
};
