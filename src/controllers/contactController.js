const Lead = require("../models/Lead");

/**
 * POST /api/contacts/enterprise
 * Body: { name, email, company, role, message, source? }
 */
exports.createEnterpriseLead = async (req, res, next) => {
    try {
        const { name, email, company, role, message, source } = req.body;

        if (!name || !email) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "name y email son obligatorios",
                });
        }

        const leadPayload = {
            name,
            email,
            company: company || "",
            role: role || "other",
            message: message || "",
            source: source || "home_form",
            ip:
                req.ip ||
                (req.headers["x-forwarded-for"] || "").split(",")[0] ||
                "",
            userAgent: req.headers["user-agent"] || "",
        };

        const created = await Lead.create(leadPayload);

        // Opcional: enviar notificación interna (email / webhook) aquí
        // notifyTeamNewLead(created);

        return res.status(201).json({ success: true, data: { lead: created } });
    } catch (err) {
        next(err);
    }
};


