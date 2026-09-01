const Lead = require("../models/Lead");
const mongoose = require("mongoose");
/**
 * POST /api/contacts/
 * Body: { name, email, company, role, message, source? }
 */
exports.createLead = async (req, res, next) => {
    try {
        const { name, email, company, role, message, telefono, source } =
            req.body;

        const payload = {
            name,
            email,
            company,
            role,
            message,
            telefono,
            source,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
        };

        // si hay usuario autenticado, vincular y guardar snapshot
        if (req.user && req.user._id) {
            payload.user = req.user._id;
            payload.userSnapshot = {
                name: req.user.name,
                email: req.user.email,
                telefono: req.user.telefono || "",
                userId: req.user._id,
            };
        } else if (req.body.userId) {
            // opcional: permitir que admin envíe userId (validar si lo permitís)
            payload.user = req.body.userId;
        }

        const created = await Lead.create(payload);
        return res.status(201).json({ success: true, data: { lead: created } });
    } catch (err) {
        next(err);
    }
};


// Admin: GET /api/admin/leads
exports.adminListLeads = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "25", 10)));
    const skip = (page - 1) * limit;
    const q = (req.query.q || "").trim();

    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
        { source: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Lead.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { leads: items, meta: { total, page, limit } } });
  } catch (err) {
    next(err);
  }
};

// Admin: GET /api/admin/leads/:id
exports.adminGetLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "ID inválido" });
    const doc = await Lead.findById(id).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Lead no encontrado" });
    return res.json({ success: true, data: { lead: doc } });
  } catch (err) {
    next(err);
  }
};

// Admin: PUT /api/admin/leads/:id  (para marcar handled / assign handledBy etc)
exports.adminUpdateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "ID inválido" });

    const allowed = ["handled", "handledBy", "handledNote"];
    const updates = {};
    allowed.forEach((k) => { if (typeof req.body[k] !== "undefined") updates[k] = req.body[k]; });

    const updated = await Lead.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Lead no encontrado" });
    return res.json({ success: true, data: { lead: updated } });
  } catch (err) {
    next(err);
  }
};

// Admin: DELETE /api/admin/leads/:id
exports.adminDeleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "ID inválido" });
    const deleted = await Lead.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ success: false, message: "Lead no encontrado" });
    return res.json({ success: true, message: "Lead eliminado" });
  } catch (err) {
    next(err);
  }
};
