const Request = require("../models/Request");
const Veterinaria = require("../models/Veterinaria");
const User = require("../models/User");

 //const { sendNotificationEmail } = require("../utils/emailService");
 

// Helper: genera 6 dígitos
function generate6Digit() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutos

// Resolve and validate target: accepts targetType+targetId, or veterinariaId
async function resolveTarget(body) {
    let { targetType, targetId, veterinariaId } = body;

    if (!targetType && veterinariaId) {
        targetType = "veterinaria";
        targetId = veterinariaId;
    }

    if (!targetType || !targetId) {
        throw new Error(
            "targetType y targetId (o veterinariaId) son requeridos"
        );
    }

    // validate existence
    if (targetType === "veterinaria") {
        const p = await Veterinaria.findById(targetId).lean();
        if (!p) throw new Error("Veterinaria no encontrada para el target");
        return { targetType, targetId: p._id, targetName: p.name };
    } else {
        // allow other types but do not validate
        return { targetType, targetId };
    }
}

// POST /api/requests
exports.createRequest = async (req, res, next) => {
    try {
        const {
            actionType,
            notes,
            token: clientToken,
            userSnapshot,
            metadata,
        } = req.body;

        // Resolve target (supports veterinariaId or targetType+targetId)
        let resolved;
        try {
            resolved = await resolveTarget(req.body);
        } catch (e) {
            return res.status(400).json({ success: false, message: e.message });
        }
        const { targetType, targetId } = resolved;

        if (!actionType) {
            return res
                .status(400)
                .json({ success: false, message: "actionType es requerido" });
        }

        // user detection
        const userId =
            (req.user &&
                (req.user._id ||
                    req.user.id ||
                    req.user.userId ||
                    req.user.uid)) ||
            null;
        let snapshot = userSnapshot ?? null;
        if (!snapshot && userId) {
            try {
                const u = await User.findById(userId).lean();
                if (u)
                    snapshot = {
                        name: u.name,
                        email: u.email,
                        telefono: u.telefono || "",
                    };
            } catch (uerr) {
                console.warn("No se pudo obtener snapshot del usuario:", uerr);
            }
        }

        const token = clientToken ?? generate6Digit();
        const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

        const doc = await Request.create({
            targetType,
            targetId,
            // keep veterinaria for backward compatibility if targetType=veterinaria
            veterinaria: targetType === "veterinaria" ? targetId : undefined,
            user: userId || null,
            userSnapshot: snapshot,
            actionType,
            notes: notes || "",
            token,
            expiresAt,
            status: "pending",
            metadata: metadata || {},
        });

        // populate minimal relational info for response
        let populated = await Request.findById(doc._id).lean();
        if (populated.user)
            populated.user = await User.findById(
                populated.user,
                "name email telefono"
            ).lean();
        if (populated.targetType === "veterinaria")
            populated.target = await Veterinaria.findById(
                populated.targetId,
                "name address"
            ).lean();

        return res
            .status(201)
            .json({
                success: true,
                message: "Solicitud creada",
                data: { request: populated },
            });
    } catch (error) {
        console.error("createRequest error:", error);
        next(error);
    }
};

// GET /api/requests/target (for partner listing) - optional helper
// But we keep /veterinaria endpoint for backwards compatibility; we'll adapt it below

// GET /api/requests/veterinaria -> now reads by targetType/targetId
exports.getRequestsForVeterinaria = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== "veterinaria")
            return res
                .status(403)
                .json({ success: false, message: "Acceso denegado" });

        const targetId = user.entityId;
        if (!targetId)
            return res
                .status(400)
                .json({
                    success: false,
                    message: "La veterinaria no está vinculada al usuario",
                });

        const requests = await Request.find({
            targetType: "veterinaria",
            targetId,
        })
            .sort({ createdAt: -1 })
            .populate("user", "name email telefono")
            .lean();
        return res.status(200).json({ success: true, data: { requests } });
    } catch (error) {
        next(error);
    }
};

// GET /api/requests/user
// GET /api/requests/user
exports.getRequestsForUser = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Autenticación requerida' });

    const userId = user._id || user.id || null;
    const email = user.email || null;

    // construimos la query para buscar requests del usuario (por user ObjectId o por snapshot email)
    const query = { $or: [{ user: userId }] };
    if (email) query.$or.push({ 'userSnapshot.email': email });

    // Traemos requests y poblamos user (info mínima)
    const requests = await Request.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email telefono')
      .lean();

    // Recolectar targetIds por tipo para hacer consultas en batch
    const veterinariaIds = new Set();

    requests.forEach((r) => {
      if (r.targetType === 'veterinaria' && r.targetId) veterinariaIds.add(String(r.targetId));
      // Si hay legacy field `veterinaria` y no hay targetType, también considerarlo
      if (!r.targetType && r.veterinaria) veterinariaIds.add(String(r.veterinaria));
    });

    // Buscar documentos targets en batch
    const veterinariasList = veterinariaIds.size
      ? await Veterinaria.find({ _id: { $in: Array.from(veterinariaIds) } }, 'name address').lean()
      : [];

    const veterinariasMap = {};

    veterinariasList.forEach((p) => { veterinariasMap[String(p._id)] = p; });

    // Adjuntar campo `target` a cada request con la info correspondiente
    const enriched = requests.map((r) => {
      const out = Object.assign({}, r);
      if (r.targetType === 'veterinaria' && r.targetId) {
        out.target = veterinariasMap[String(r.targetId)] || null;
      } else if (!r.targetType && r.veterinaria) {
        out.target = veterinariasMap[String(r.veterinaria)] || null;
      } else {
        out.target = null;
      }
      return out;
    });

    return res.status(200).json({ success: true, data: { requests: enriched } });
  } catch (error) {
    console.error('getRequestsForUser error:', error);
    next(error);
  }
};

// GET /api/requests/:id
exports.getRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const reqDoc = await Request.findById(id).lean();
        if (!reqDoc)
            return res
                .status(404)
                .json({ success: false, message: "Solicitud no encontrada" });

        const user = req.user;
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "Autenticación requerida" });

        const userId = user._id || user.id || null;

        if (user.role === "veterinaria") {
            if (
                String(user.entityId) !== String(reqDoc.targetId) ||
                reqDoc.targetType !== "veterinaria"
            ) {
                return res
                    .status(403)
                    .json({ success: false, message: "No autorizado" });
            }
        } else {
            const owns = reqDoc.user && String(reqDoc.user) === String(userId);
            const snapshotMatch =
                reqDoc.userSnapshot &&
                user.email &&
                reqDoc.userSnapshot.email === user.email;
            if (!owns && !snapshotMatch)
                return res
                    .status(403)
                    .json({ success: false, message: "No autorizado" });
        }

        // populate target and user for response
        if (reqDoc.user)
            reqDoc.user = await User.findById(
                reqDoc.user,
                "name email telefono"
            ).lean();
        if (reqDoc.targetType === "veterinaria")
            reqDoc.target = await Veterinaria.findById(
                reqDoc.targetId,
                "name address"
            ).lean();

        return res
            .status(200)
            .json({ success: true, data: { request: reqDoc } });
    } catch (error) {
        next(error);
    }
};

exports.getRequestsForEmergency = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== "emergency") {
            return res
                .status(403)
                .json({ success: false, message: "Acceso denegado" });
        }

        const targetId = user.entityId;
        if (!targetId) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "El emergency no está vinculado al usuario",
                });
        }

        // Buscamos solicitudes con targetType === 'emergency' y targetId === entityId
        const requests = await Request.find({ targetType: "emergency", targetId })
            .sort({ createdAt: -1 })
            .populate("user", "name email telefono")
            .lean();

        // Para compatibilidad si hay userSnapshot, preferir user info cuando exista
        // La respuesta mantiene la estructura { data: { requests } }
        return res.status(200).json({ success: true, data: { requests } });
    } catch (error) {
        console.error("getRequestsForEmergency error:", error);
        next(error);
    }
};

// otros requires según tu proyecto...

/**
 * PUT /requests/:id/status
 * Body: { status: 'accepted'|'fulfilled'|'cancelled', metadata?: { callUrl?: string, scheduledAt?: string } }
 * - Solo el owner del target (veterinaria) o admin puede cambiar estados relacionados a la entidad.
 * - scheduledAt debe ser ISO datetime o timestamp.
 */
exports.updateRequestStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { status, metadata } = req.body;
        const user = req.user;
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "No autenticado" });

        const request = await Request.findById(id);
        if (!request)
            return res
                .status(404)
                .json({ success: false, message: "Solicitud no encontrada" });

        // helper para extraer id si viene en distintos formatos
        const extractId = (val) => {
            if (val === null || typeof val === "undefined") return null;
            if (typeof val === "string") return val;
            if (typeof val === "object") {
                if (val._id) return String(val._id);
                if (val.id) return String(val.id);
                try {
                    return String(val);
                } catch (e) {
                    return null;
                }
            }
            return null;
        };

        // Recolectar candidate ids que puedan aparecer en el request
        const candidates = new Set();
        [
            "target",
            "targetId",
            "target_id",
            "pharmacy",
            "pharmacyId",
            "pharmacy_id",
            "recipient",
            "recipientId",
            "recipient_id",
            "assignedTo",
        ].forEach((key) => {
            if (request[key] !== undefined) {
                const v = extractId(request[key]);
                if (v) candidates.add(v);
            }
        });

        // También revisar campos que pueden ser objetos poblados
        ["target", "pharmacy", "recipient"].forEach((k) => {
            const val = request[k];
            if (val && typeof val === "object") {
                const id = extractId(val._id ?? val.id ?? val);
                if (id) candidates.add(id);
            }
        });

        const userEntityId = user.entityId ? String(user.entityId) : null;
        const userId = user._id ? String(user._id) : null;

        // Autorización: admin siempre
        let isOwner = false;
        if (user.role === "admin") {
            isOwner = true;
        } else {
            // 1) coincidencia directa con entityId o userId
            if (userEntityId && candidates.has(userEntityId)) isOwner = true;
            if (!isOwner && userId && candidates.has(userId)) isOwner = true;

            // 2) comprobar owner en Pharmacy si aún no autorizado
            if (!isOwner && candidates.size > 0) {
                for (const cid of candidates) {
                    // intentar pharmacy
                    try {
                        const ph = await Pharmacy.findById(cid)
                            .select("owner")
                            .lean();
                        if (ph && ph.owner && String(ph.owner) === userId) {
                            isOwner = true;
                            break;
                        }
                    } catch (e) {
                        // ignore lookup error for this id
                    }
                }
            }
        }

        if (!isOwner) {
            return res
                .status(403)
                .json({ success: false, message: "No autorizado" });
        }

        // Aplicar metadata si viene
        if (metadata && typeof metadata === "object") {
            request.metadata = request.metadata || {};
            if (typeof metadata.callUrl !== "undefined")
                request.metadata.callUrl = metadata.callUrl || "";
            if (typeof metadata.scheduledAt !== "undefined") {
                if (metadata.scheduledAt) {
                    const dt = new Date(metadata.scheduledAt);
                    if (isNaN(dt.getTime()))
                        return res
                            .status(400)
                            .json({
                                success: false,
                                message: "scheduledAt inválido",
                            });
                    request.metadata.scheduledAt = dt;
                } else {
                    request.metadata.scheduledAt = null;
                }
            }
        }

        // Actualizar estado si viene
        if (typeof status !== "undefined") {
            if (
                ![
                    "pending",
                    "accepted",
                    "fulfilled",
                    "cancelled",
                    "en_transito",
                    "llego_destino",
                ].includes(status)
            ) {
                return res
                    .status(400)
                    .json({ success: false, message: "Estado inválido" });
            }
            request.status = status;
        }

        await request.save();

        // Opcional: lanzar notificación aquí si status === 'accepted' y hay metadata (callUrl/scheduledAt)

        return res.json({ success: true, data: { request } });
    } catch (err) {
        next(err);
    }
};

//version que envia mail al owner de la veterinaria notificando la confirmacion del paciente

exports.replyToRequest = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = req.user;
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "No autenticado" });

        const request = await Request.findById(id);
        if (!request)
            return res
                .status(404)
                .json({ success: false, message: "Solicitud no encontrada" });

        // ownership: allow the user who created the request OR admin
        const isOwner =
            (request.user && String(request.user) === String(user._id)) ||
            user.role === "admin";

    console.log("isOwner ---->:", isOwner, "request.user:", request.user, "user._id:", user._id);

        if (!isOwner) {
            return res
                .status(403)
                .json({ success: false, message: "No autorizado" });
        }

        // Only allow patient confirmation when the veterinaria already marked as fulfilled
        if (request.status !== "fulfilled") {
            return res.status(400).json({
                success: false,
                message:
                    'Solo se puede confirmar cuando la solicitud está en estado "Cumplida".',
            });
        }

        if (request.status_reply) {
            // already confirmed: return populated request
            await request
                .populate("status_reply_by", "name email")
                .execPopulate?.();
            // execPopulate for older mongoose; fallback to populate then exec
            return res.json({
                success: true,
                message: "Solicitud ya confirmada por el paciente",
                data: { request },
            });
        }

        // mark confirmation
        request.status_reply = true;
        request.status_reply_at = new Date();
        request.status_reply_by = user._id;

        await request.save();

        // populate the confirmer user for response
        await request
            .populate("status_reply_by", "name email")
            .execPopulate?.();

        // Notify target owner if we can find them
        try {
            // Determine target owner/veterinaria user email
            let ownerUser = null;
            if (String(request.targetType) === "veterinaria") {
                // target might be populated or an id
                const vetId = request.target || request.targetId;
                const vet = await Veterinaria.findById(vetId).lean();
                if (vet) {
                    if (vet.owner) {
                        ownerUser = await User.findById(vet.owner).lean();
                    } else if (vet.email) {
                        ownerUser = { email: vet.email, name: vet.name };
                    }
                }
            } else if (String(request.targetType) === "pharmacy") {
                const phId = request.target;
                const ph = await Pharmacy.findById(phId).lean();
                if (ph) {
                    if (ph.owner) {
                        ownerUser = await User.findById(ph.owner).lean();
                    } else if (ph.email) {
                        ownerUser = { email: ph.email, name: ph.name };
                    }
                }
            }
            //enviar email si tenemos email del owner 
            if (ownerUser && ownerUser.email) {
                const patientName = user.name || user.email || "Paciente";
                const subject = `La solicitud ${request.token} fue confirmada por el paciente`;
                const frontendUrl = (
                    process.env.FRONTEND_URL || "http://localhost:3000"
                ).replace(/\/$/, "");
                const requestUrl = `${frontendUrl}/admin/requests/${request._id}`; // admin/requests detail (if exists)
                const html = `
          <div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial;">
            <p>Hola ${
                ownerUser.name ? escapeHtml(ownerUser.name) : "Veterinario"
            },</p>
            <p>La solicitud <strong>${escapeHtml(
                request.token || String(request._id)
            )}</strong> ha sido confirmada por el paciente <strong>${escapeHtml(
                    patientName
                )}</strong> en ${new Date(
                    request.status_reply_at
                ).toLocaleString()}.</p>
            <p>Detalle: ${escapeHtml(request.actionType || "")}</p>
            <p><a href="${requestUrl}" style="color:#2563eb">Ver la solicitud</a></p>
          </div>
        `;
                const text = `La solicitud ${request.token} fue confirmada por ${patientName}. Ver: ${requestUrl}`;

                // send email (best-effort)
                // await sendNotificationEmail(
                //     ownerUser.email,
                //     subject,
                //     html,
                //     text
                // );
            }
        } catch (notifyErr) {
            console.error(
                "Error notificando al owner tras confirmación:",
                notifyErr
            );
            // don't block user flow on notification failure
        }

        return res.json({
            success: true,
            message: "Confirmación registrada",
            data: { request },
        });
    } catch (err) {
        next(err);
    }
};


 

exports.listRequests = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    const {
      page = 1,
      limit = 20,
      q,
      targetType,
      status,
    } = req.query;

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter = {};

    // Filtros opcionales del front
    if (targetType) filter.targetType = targetType;
    if (status) filter.status = status;

    // Restricción por rol
    if (user.role === "admin") {
      // sin restricción extra
    } else if (user.role === "pharmacy") {
      filter.targetType = "pharmacy";
      filter.targetId = user.entityId;
    } else if (user.role === "emergency") {
      filter.targetType = "emergency";
      filter.targetId = user.entityId;
    } else {
      const userId = user._id || user.id || null;
      const email = user.email || null;
      filter.$or = [{ user: userId }];
      if (email) filter.$or.push({ "userSnapshot.email": email });
    }

    // Búsqueda simple por token/actionType/notes
    if (q && String(q).trim()) {
      const re = new RegExp(String(q).trim(), "i");
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ token: re }, { actionType: re }, { notes: re }],
      });
    }

    const skip = (p - 1) * l;

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .populate("user", "name email telefono")
        .lean(),
      Request.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: { requests },
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

 

// small helper used in the notification html
function escapeHtml(str = "") {
    return String(str).replace(/[&<>"']/g, function (m) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        }[m];
    });
}


