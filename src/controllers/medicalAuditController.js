const MedicalAudit = require("../models/MedicalAudit");
const { runAutoValidation } = require("../services/auditValidationService");

exports.createAudit = async (req, res) => {
    try {
        const { diagnosis, documents, providerId } = req.body;
        const employeeId = req.user._id;

        const validation = runAutoValidation({ diagnosis, documents: documents || [] });

        const audit = new MedicalAudit({
            employee: employeeId,
            diagnosis,
            documents: documents || [],
            provider: providerId || null,
            auditStatus: validation.autoApproved ? "validated" : validation.suggestedStatus,
            auditValidation: {
                score: validation.score,
                flags: validation.flags,
                notes: validation.autoApproved
                    ? "Validado automáticamente por el sistema."
                    : "Pendiente de revisión manual.",
            },
        });

        await audit.save();

        res.status(201).json({
            success: true,
            message: "Auditoría creada exitosamente.",
            data: audit,
            autoValidation: validation,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMyAudits = async (req, res) => {
    try {
        const audits = await MedicalAudit.find({ employee: req.user._id })
            .populate("diagnosis.attendingDoctor", "name specialty")
            .populate("provider", "name")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: audits });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAuditById = async (req, res) => {
    try {
        const audit = await MedicalAudit.findById(req.params.id)
            .populate("employee", "name email")
            .populate("diagnosis.attendingDoctor", "name specialty")
            .populate("provider", "name")
            .populate("auditValidation.validatedBy", "name")
            .populate("tracking.recordedBy", "name")
            .populate("contactLog.contactedBy", "name");

        if (!audit) {
            return res.status(404).json({ success: false, message: "Auditoría no encontrada." });
        }

        const isOwner = audit.employee._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Acceso denegado." });
        }

        res.json({ success: true, data: audit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addDocument = async (req, res) => {
    try {
        const audit = await MedicalAudit.findById(req.params.id);

        if (!audit) {
            return res.status(404).json({ success: false, message: "Auditoría no encontrada." });
        }

        if (audit.employee.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Acceso denegado." });
        }

        if (audit.auditStatus === "validated") {
            return res.status(400).json({
                success: false,
                message: "No se pueden agregar documentos a una auditoría ya validada.",
            });
        }

        audit.documents.push(req.body);

        const validation = runAutoValidation({
            diagnosis: audit.diagnosis,
            documents: audit.documents,
        });

        audit.auditValidation.score = validation.score;
        audit.auditValidation.flags = validation.flags;

        if (validation.autoApproved) {
            audit.auditStatus = "validated";
            audit.auditValidation.notes = "Validado automáticamente tras nueva documentación.";
        }

        await audit.save();

        res.json({
            success: true,
            message: "Documento agregado.",
            data: audit,
            autoValidation: validation,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addTrackingEvent = async (req, res) => {
    try {
        const { longitude, latitude, address, event, notes } = req.body;
        const audit = await MedicalAudit.findById(req.params.id);

        if (!audit) {
            return res.status(404).json({ success: false, message: "Auditoría no encontrada." });
        }

        const isOwner = audit.employee.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Acceso denegado." });
        }

        audit.tracking.push({
            location: {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            address,
            event: event || "location_update",
            notes,
            recordedBy: req.user._id,
        });

        await audit.save();

        res.json({
            success: true,
            message: "Ubicación registrada.",
            data: audit.tracking.slice(-1)[0],
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addContactLog = async (req, res) => {
    try {
        const audit = await MedicalAudit.findById(req.params.id);

        if (!audit) {
            return res.status(404).json({ success: false, message: "Auditoría no encontrada." });
        }

        audit.contactLog.push({ ...req.body, contactedBy: req.user._id });
        await audit.save();

        res.json({
            success: true,
            message: "Contacto registrado.",
            data: audit.contactLog.slice(-1)[0],
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllAudits = async (req, res) => {
    try {
        const { status, auditStatus, employeeId, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (auditStatus) filter.auditStatus = auditStatus;
        if (employeeId) filter.employee = employeeId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [audits, total] = await Promise.all([
            MedicalAudit.find(filter)
                .populate("employee", "name email")
                .populate("provider", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            MedicalAudit.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: audits,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.validateAudit = async (req, res) => {
    try {
        const { auditStatus, notes, rejectionReason } = req.body;
        const validStatuses = ["validated", "rejected", "requires_more", "in_review"];

        if (!validStatuses.includes(auditStatus)) {
            return res.status(400).json({ success: false, message: "Estado de auditoría inválido." });
        }

        const audit = await MedicalAudit.findByIdAndUpdate(
            req.params.id,
            {
                auditStatus,
                "auditValidation.validatedBy": req.user._id,
                "auditValidation.validatedAt": new Date(),
                "auditValidation.notes": notes,
                "auditValidation.rejectionReason": rejectionReason || null,
            },
            { new: true }
        ).populate("employee", "name email");

        if (!audit) {
            return res.status(404).json({ success: false, message: "Auditoría no encontrada." });
        }

        res.json({ success: true, message: "Auditoría actualizada.", data: audit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.closeAudit = async (req, res) => {
    try {
        const audit = await MedicalAudit.findByIdAndUpdate(
            req.params.id,
            {
                status: "closed",
                closedAt: new Date(),
                closedBy: req.user._id,
                closingNotes: req.body.closingNotes || "",
            },
            { new: true }
        );

        if (!audit) {
            return res.status(404).json({ success: false, message: "Auditoría no encontrada." });
        }

        res.json({ success: true, message: "Caso cerrado.", data: audit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};