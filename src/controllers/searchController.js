const Pharmacy = require("../models/Pharmacy");
const Doctor = require("../models/Doctor");

/**
 * GET /api/search
 * Query:
 *   - q: string (required for suggestions/search)
 *   - type: 'pharmacy'|'doctor'|'both' (default both)
 *   - limit: number (default 8) -> for suggestions
 *   - full: boolean (if true, return full matching docs instead of compact suggestions)
 *
 * Responses:
 *  - suggestions: [{ type, id, name, address, snippet }]
 *  - when full=true: { doctors: [...], pharmacies: [...] }
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

        const type = req.query.type || "both";
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
            if (type === "pharmacy" || type === "both") {
                const pharmacies = await Pharmacy.find({
                    $or: [
                        { name: regex },
                        { address: regex },
                        { direccion: regex },
                    ],
                })
                    .limit(100)
                    .lean();
                out.pharmacies = pharmacies;
            }
            if (type === "doctor" || type === "both") {
                const doctors = await Doctor.find({
                    $or: [
                        { name: regex },
                        { specialty: regex },
                        { address: regex },
                    ],
                })
                    .limit(100)
                    .lean();
                out.doctors = doctors;
            }
            return res.json({ success: true, data: out });
        }

        // suggestions mode: return compact list from both collections
        const suggestions = [];

        if (type === "pharmacy" || type === "both") {
            const phs = await Pharmacy.find({
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
                    type: "pharmacy",
                    id: p._id,
                    name: p.name,
                    address: p.address || p.direccion || snippetFrom(p),
                });
            });
        }

        if (
            (type === "doctor" || type === "both") &&
            suggestions.length < limit
        ) {
            // ask for (limit - current) doctors
            const remaining = Math.max(1, limit - suggestions.length);
            const docs = await Doctor.find({
                $or: [
                    { name: regex },
                    { specialty: regex },
                    { address: regex },
                ],
            })
                .limit(remaining)
                .lean();
            docs.forEach((d) => {
                suggestions.push({
                    type: "doctor",
                    id: d._id,
                    name: d.name,
                    address: d.address || snippetFrom(d),
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
