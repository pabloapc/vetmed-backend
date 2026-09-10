const User = require("../models/User");
const Veterinaria = require("../models/Veterinaria");
const Emergency = require("../models/Emergency");
const mongoose = require("mongoose");

/**
 * Utilitarios: parse pagination / search params
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

/* ---------------- USERS ---------------- */

/**
 * GET /api/admin/users
 * Query: page, limit, q (search by name/email)
 */
exports.listUsers = async (req, res, next) => {
    try {
        const { limit, skip, q, page } = parseListQuery(req);
        const filter = {};
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
            ];
        }

        const [items, total] = await Promise.all([
            User.find(filter)
                .skip(skip)
                .limit(limit)
                .select("-password")
                .lean(),
            User.countDocuments(filter),
        ]);

        return res.json({
            success: true,
            data: { users: items, meta: { total, page, limit } },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/users/:id
 */
exports.getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const user = await User.findById(id).select("-password").lean();
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Usuario no encontrado" });
        return res.json({ success: true, data: { user } });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/admin/users/:id
 * Body: allowed updates (name, email, role, entityId, telefono, direccion, ciudad, provincia, isVerified, etc.)
 */
// Reemplaza SOLO la función updateUser en src/controllers/adminController.js
// Asegurate que arriba del archivo están estos requires:
// const User = require('../models/User');
// const Veterinaria = require('../models/Veterinaria');
// const mongoose = require('mongoose');

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    // campos permitidos para que admin actualice
    const allowed = [
      'name', 'email', 'role', 'entityId', 'planId', 'telefono', 'direccion',
      'ciudad', 'provincia', 'codigoPostal', 'isVerified', 'isActive'
    ];
    const updates = {};
    allowed.forEach((k) => { if (typeof req.body[k] !== 'undefined') updates[k] = req.body[k]; });

    // entityData (opcional): si el admin envía datos completos para crear/actualizar entidad
    const entityData = req.body.entityData;

    // obtener user actual (no lean para usar en owner info si hace falta)
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    let createdEntity = null;
    let createdEntityType = null;

    // Determinar role objetivo (puede venir en updates o quedarse igual)
    const targetRole = updates.role || user.role || null;

    // Si admin pasó entityId explícito, validarlo contra el tipo/role
    if (updates.entityId) {
      if (!mongoose.Types.ObjectId.isValid(updates.entityId)) {
        return res.status(400).json({ success: false, message: 'entityId inválido' });
      }
      if (targetRole === 'veterinaria') {
        const exist = await Veterinaria.findById(updates.entityId).lean();
        if (!exist) return res.status(400).json({ success: false, message: 'Veterinaria (entityId) no encontrada' });
      } else {
        // Si role no es veterinaria pero se provee entityId, permitimos la asignación pero no validamos colección
      }
    }

    // Si se envió entityData:
    if (entityData) {
      // entityData solo tiene sentido cuando role objetivo es veterinaria
      if (targetRole !== 'veterinaria') {
        return res.status(400).json({ success: false, message: 'entityData sólo es válido para role "veterinaria"' });
      }

      // Si user ya tiene entityId -> actualizar esa entidad con entityData
      if (user.entityId) {
        try {
          await Veterinaria.findByIdAndUpdate(user.entityId, buildEntityPayload('veterinaria', entityData), { new: true, runValidators: true });
        } catch (updateEntityErr) {
          console.error('Error actualizando entidad existente en updateUser:', updateEntityErr);
          return res.status(400).json({ success: false, message: 'No se pudo actualizar la entidad existente', detail: updateEntityErr.message });
        }
      } else {
        // user no tiene entityId -> crear nueva entidad con entityData y asignar updates.entityId
        try {
          const payload = buildEntityPayload('veterinaria', entityData);
          payload.owner = user._id;
          createdEntity = await Veterinaria.create(payload);
          createdEntityType = 'veterinaria';
          updates.entityId = createdEntity._id;
        } catch (createErr) {
          console.error('Error creando entidad desde entityData en updateUser:', createErr);
          return res.status(400).json({ success: false, message: 'No se pudo crear la entidad con los datos entregados', detail: createErr.message });
        }
      }
    } else {
      // Si no hay entityData y role cambia a veterinaria y no hay entityId ni user.entityId -> crear entidad mínima (comportamiento previo)
      if (updates.role === 'veterinaria' && !updates.entityId && !user.entityId) {
        const publicName = (user.name && String(user.name).trim()) || (user.email ? `Entidad de ${user.email}` : 'Entidad');
        try {
          const veterinariaData = {
            name: publicName,
            address: user.direccion || '',
            phone: user.telefono || '',
            owner: user._id,
            location: user.location || undefined,
          };
          createdEntity = await Veterinaria.create(veterinariaData);
          createdEntityType = 'veterinaria';
          updates.entityId = createdEntity._id;
        } catch (createErr) {
          console.error('Error creando entidad mínima en updateUser:', createErr);
          return res.status(400).json({ success: false, message: 'No se pudo crear la entidad asociada', detail: createErr.message });
        }
      }
    }

    // Finalmente actualizar usuario
    let updated;
    try {
      updated = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password').lean();
      if (!updated) {
        // rollback si algo raro pasa
        if (createdEntity) {
          try {
            if (createdEntityType === 'veterinaria') await Veterinaria.findByIdAndDelete(createdEntity._id);
          } catch (rbErr) {
            console.error('Error durante rollback (eliminar entidad creada):', rbErr);
          }
        }
        return res.status(404).json({ success: false, message: 'Usuario no encontrado al intentar actualizar' });
      }
    } catch (updateErr) {
      // rollback si update falla
      if (createdEntity) {
        try {
          if (createdEntityType === 'veterinaria') await Veterinaria.findByIdAndDelete(createdEntity._id);
        } catch (rbErr) {
          console.error('Error durante rollback (eliminar entidad creada):', rbErr);
        }
      }
      return next(updateErr);
    }

    return res.json({ success: true, data: { user: updated } });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper para construir payload específico según tipo de entidad (veterinaria)
 * entityData es el objeto que viene desde el cliente (puede incluir name,address,phone,latitude,longitude,benefits,discount,openingHours,...)
 */
function buildEntityPayload(type, entityData) {
  const payload = {};

  if (typeof entityData.name !== 'undefined') payload.name = entityData.name;
  if (typeof entityData.address !== 'undefined') payload.address = entityData.address;
  if (typeof entityData.phone !== 'undefined') payload.phone = entityData.phone;
  if (typeof entityData.isActive !== 'undefined') payload.isActive = !!entityData.isActive;

  // location support via latitude/longitude
  if (typeof entityData.latitude !== 'undefined' && typeof entityData.longitude !== 'undefined') {
    const lat = parseFloat(entityData.latitude);
    const lng = parseFloat(entityData.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      payload.location = { type: 'Point', coordinates: [lng, lat] };
    }
  }

  if (type === 'veterinaria') {
    if (typeof entityData.benefits !== 'undefined') payload.benefits = entityData.benefits;
    if (typeof entityData.discount !== 'undefined') payload.discount = entityData.discount;
    if (typeof entityData.openingHours !== 'undefined') payload.openingHours = entityData.openingHours;
  }

  return payload;
}
/**
 * DELETE /api/admin/users/:id
 * Hard delete (consider soft delete instead)
 */
exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });

        // Here you may want to prevent deleting the last admin, etc.
        const deleted = await User.findByIdAndDelete(id).lean();
        if (!deleted)
            return res
                .status(404)
                .json({ success: false, message: "Usuario no encontrado" });
        return res.json({ success: true, message: "Usuario eliminado" });
    } catch (err) {
        next(err);
    }
};


/* aca tenemos un buscador de veterinarias para admin */
async function collectReferencedEntityIdsFor(type) {
    // type: 'veterinaria'
    // Recopila ids desde distintos campos en Users (entityId, legacy fields)
    const ids = new Set();

    // entityId field (general)
    const byEntityId = await User.find({ entityId: { $ne: null } }).distinct(
        "entityId"
    );
    byEntityId.forEach((v) => ids.add(String(v)));

    // legacy/explicit fields
    if (type === "veterinaria") {
        const byVeterinaria = await User.find({
            veterinaria: { $ne: null },
        }).distinct("veterinaria");
        byVeterinaria.forEach((v) => ids.add(String(v)));
        // also consider users with role 'veterinaria' that might have entityId null (they shouldn't be referenced)
        // but the above covers entityId references.
    }

    // Also check users whose role equals the type and with non-null entityId (already covered, but keep)
    const byRoleEntity = await User.find({
        role: type,
        entityId: { $ne: null },
    }).distinct("entityId");
    byRoleEntity.forEach((v) => ids.add(String(v)));

    return Array.from(ids).filter(Boolean);
}


/* --------------- VETERINARIAS -------------- */

/**
 * GET /api/admin/veterinarias
 * Query: page, limit, q (search by name/address), unassigned=true (only entities without owner)
 */
exports.listVeterinarias = async (req, res, next) => {
    try {
        const { limit, skip, q, page } = parseListQuery(req);
        const filter = {};
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { address: { $regex: q, $options: "i" } },
            ];
        }

        const unassigned =
            req.query.unassigned === "true" || req.query.unassigned === true;
        if (unassigned) {
            // Obtiene todos los ids de veterinarias ya referenciadas por Users (entityId, veterinaria, role)
            const referencedIds = await collectReferencedEntityIdsFor(
                "veterinaria"
            );
            if (referencedIds.length > 0) {
                filter._id = { $nin: referencedIds };
            }
            // If referencedIds is empty, no exclusion needed (all pharmacies are unassigned).
        }

        const [items, total] = await Promise.all([
            Veterinaria.find(filter).skip(skip).limit(limit).lean(),
            Veterinaria.countDocuments(filter),
        ]);

        return res.json({
            success: true,
            data: { veterinarias: items, meta: { total, page, limit } },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/veterinarias/:id
 */
exports.getVeterinaria = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const doc = await Veterinaria.findById(id).lean();
        if (!doc)
            return res
                .status(404)
                .json({ success: false, message: "Veterinaria no encontrada" });
        return res.json({ success: true, data: { veterinaria: doc } });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/admin/veterinarias/:id
 * Admin editable fields: name,address,phone,description,benefits,discount,openingHours,isActive,location
 */
exports.updateVeterinariaAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });

        const allowed = [
            "name",
            "address",
            "phone",
            "description",
            "benefits",
            "discount",
            "openingHours",
            "isActive",
        ];
        const updates = {};
        allowed.forEach((k) => {
            if (typeof req.body[k] !== "undefined") updates[k] = req.body[k];
        });

        // location: accept latitude/longitude in body for convenience
        if (
            typeof req.body.latitude !== "undefined" &&
            typeof req.body.longitude !== "undefined"
        ) {
            const lat = parseFloat(req.body.latitude);
            const lng = parseFloat(req.body.longitude);
            if (!Number.isNaN(lat) && !Number.isNaN(lng))
                updates.location = { type: "Point", coordinates: [lng, lat] };
        }

        const updated = await Veterinaria.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).lean();
        if (!updated)
            return res
                .status(404)
                .json({ success: false, message: "Veterinaria no encontrada" });
        return res.json({ success: true, data: { veterinaria: updated } });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/admin/veterinarias/:id
 */
exports.deleteVeterinariaAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const deleted = await Veterinaria.findByIdAndDelete(id).lean();
        if (!deleted)
            return res
                .status(404)
                .json({ success: false, message: "Veterinaria no encontrada" });
        return res.json({ success: true, message: "Veterinaria eliminada" });
    } catch (err) {
        next(err);
    }
};


/* Emergency */

 
/**
 * GET /api/admin/emergencies
 
 */
exports.listEmergencies= async (req, res, next) => {
    try {
        const { limit, skip, q, page } = parseListQuery(req);
        const filter = {};
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
            ];
        }

        const unassigned =
            req.query.unassigned === "true" || req.query.unassigned === true;
        if (unassigned) {
            const referencedIds = await collectReferencedEntityIdsFor("emergency");
            if (referencedIds.length > 0) {
                filter._id = { $nin: referencedIds };
            }
        }

        const [items, total] = await Promise.all([
            Emergency.find(filter).skip(skip).limit(limit).lean(),
            Emergency.countDocuments(filter),
        ]);

        return res.json({
            success: true,
            data: { emergencies: items, meta: { total, page, limit } },
        });
    } catch (err) {
        next(err);
    }
};
/**
 * GET /api/admin/emergencies/:id
 */
exports.getEmergency = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const doc = await Emergency.findById(id).lean();
        if (!doc)
            return res
                .status(404)
                .json({ success: false, message: "Emergency no encontrado" });
        return res.json({ success: true, data: { emergency: doc } });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/admin/emergencies/:id
 */
exports.updateEmergencyAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });

        const allowed = [
            "name",
            "address",
            "phone",
            "url",
            "isActive",
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

        const updated = await Emergency.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).lean();
        if (!updated)
            return res
                .status(404)
                .json({ success: false, message: "Emergency no encontrado" });
        return res.json({ success: true, data: { emergency: updated } });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/admin/emergencies/:id
 */
exports.deleteEmergencyAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res
                .status(400)
                .json({ success: false, message: "ID inválido" });
        const deleted = await Emergency.findByIdAndDelete(id).lean();
        if (!deleted)
            return res
                .status(404)
                .json({ success: false, message: "Emergency no encontrado" });
        return res.json({ success: true, message: "Emergency eliminado" });
    } catch (err) {
        next(err);
    }
};




/* --------------- Veamos -------------- */

// POST /api/admin/veterinarias
exports.createVeterinaria = async (req, res, next) => {
  try {
    const { name, address, phone, description, benefits, discount, openingHours, latitude, longitude, isActive } = req.body;
    const payload = {
      name: name || 'Farmacia',
      address: address || '',
      phone: phone || '',
      description,
      benefits,
      discount: typeof discount !== 'undefined' ? Number(discount) : undefined,
      openingHours,
      isActive: typeof isActive !== 'undefined' ? !!isActive : true,
    };
    if (typeof latitude !== 'undefined' && typeof longitude !== 'undefined') {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        payload.location = { type: 'Point', coordinates: [lng, lat] };
      }
    }
    const created = await Veterinaria.create(payload);
    return res.status(201).json({ success: true, data: { veterinaria: created } });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/users
// crea usuario; si viene entityData y role es veterinaria crea la entidad y la vincula
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, entityId, entityData, latitude, longitude } = req.body;
    // basic exists check
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email ya registrado' });

    const user = new User({
      name,
      email,
      password,
      role: role || 'user',
    });

    // optional location if provided
    if (typeof latitude !== 'undefined' && typeof longitude !== 'undefined') {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        user.location = { type: 'Point', coordinates: [lng, lat] };
      }
    }

    // If the request includes entityId explicitly, validate and set
    if (entityId) {
      if (!mongoose.Types.ObjectId.isValid(entityId)) return res.status(400).json({ success: false, message: 'entityId inválido' });
      // basic validation: if role veterinaria check veterinaria exists
      if (role === 'veterinaria') {
        const ph = await Veterinaria.findById(entityId).lean();
        if (!ph) return res.status(400).json({ success: false, message: 'Veterinaria entityId no encontrada' });
      }
      user.entityId = entityId;
    } else if (entityData && role === 'veterinaria') {
      // create entity with data and link
      const payload = {
        name: entityData.name || name,
        address: entityData.address || '',
        phone: entityData.phone || '',
      };
      if (typeof entityData.latitude !== 'undefined' && typeof entityData.longitude !== 'undefined') {
        const lat = parseFloat(entityData.latitude);
        const lng = parseFloat(entityData.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) payload.location = { type: 'Point', coordinates: [lng, lat] };
      }
      payload.owner = user._id;
      const created = await Veterinaria.create(payload);
      user.entityId = created._id;
    }

    await user.save();

    const retUser = user.toObject();
    delete retUser.password;
    return res.status(201).json({ success: true, data: { user: retUser } });
  } catch (err) {
    next(err);
  }
};


// POST /api/admin/emergencies
exports.createEmergency = async (req, res, next) => {
  try {
    const { name, address, phone, latitude, longitude, url, isActive } = req.body;
    const payload = {
      name: name || 'Emergency',
      address: address || '',
      phone: phone || '',
        url: url || '',
      isActive: typeof isActive !== 'undefined' ? !!isActive : true,
    };
    if (typeof latitude !== 'undefined' && typeof longitude !== 'undefined') {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        payload.location = { type: 'Point', coordinates: [lng, lat] };
      }
    }
    const created = await Emergency.create(payload);
    return res.status(201).json({ success: true, data: { emergency: created } });
  } catch (err) {
    next(err);
  }
};

//dashboard stats, etc. podríamos agregar más funciones aquí en el futuro
exports.getDashboardMetrics = async (req, res, next) => {
    try {
        // Asegurar que tenemos un modelo Mongoose utilizable (RequestModel)
        let RequestModel = null;
        try {
            // si Request fue requerido correctamente y tiene .find, úsalo
            if (Request && typeof Request.find === "function") {
                RequestModel = Request;
            } else if (mongoose && mongoose.models && mongoose.models.Request) {
                // si ya está registrado en mongoose.models
                RequestModel = mongoose.models.Request;
            } else if (
                mongoose &&
                typeof mongoose.model === "function" &&
                mongoose.modelNames &&
                mongoose.modelNames().includes("Request")
            ) {
                RequestModel = mongoose.model("Request");
            } else {
                // intento adicional: require directo (ruta relativa)
                try {
                    const maybe = require("../models/Request");
                    if (maybe && typeof maybe.find === "function")
                        RequestModel = maybe;
                } catch (e) {
                    // ignore
                }
            }
        } catch (e) {
            console.error("Error determinando RequestModel:", e);
        }

        if (!RequestModel) {
            console.error(
                "getDashboardMetrics: no se encontró un modelo Request válido. Request (type):",
                typeof Request,
                "mongoose.models keys:",
                Object.keys(mongoose.models || {})
            );
            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Server misconfiguration: Request model not available",
                });
        }

        // Parámetros opcionales
        const days = Math.max(1, parseInt(req.query.days) || 7);
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        // Helper: safe count
        const safeCountDocuments = async (model, filter = {}) => {
            try {
                if (model && typeof model.countDocuments === "function")
                    return await model.countDocuments(filter);
                if (
                    model &&
                    model.collection &&
                    typeof model.collection.countDocuments === "function"
                )
                    return await model.collection.countDocuments(filter);
                if (
                    model &&
                    typeof model.estimatedDocumentCount === "function" &&
                    Object.keys(filter).length === 0
                )
                    return await model.estimatedDocumentCount();
                if (model && typeof model.find === "function") {
                    const docs = await model
                        .find(filter)
                        .select("_id")
                        .lean()
                        .limit(0);
                    return Array.isArray(docs) ? docs.length : 0;
                }
            } catch (e) {
                console.error("safeCountDocuments error", e);
            }
            return 0;
        };

        const totalRequestsPromise = safeCountDocuments(RequestModel, {});
        const requestsTodayPromise = safeCountDocuments(RequestModel, {
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        });

        // Agregados con aggregate si está disponible
        let statusAggPromise;
        if (typeof RequestModel.aggregate === "function") {
            statusAggPromise = RequestModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]);
        } else {
            statusAggPromise = (async () => {
                const statuses = [
                    "pending",
                    "accepted",
                    "fulfilled",
                    "cancelled",
                ];
                const out = [];
                for (const s of statuses) {
                    const c = await safeCountDocuments(RequestModel, {
                        status: s,
                    });
                    out.push({ _id: s, count: c });
                }
                return out;
            })();
        }

        let targetAggPromise;
        if (typeof RequestModel.aggregate === "function") {
            targetAggPromise = RequestModel.aggregate([
                { $group: { _id: "$targetType", count: { $sum: 1 } } },
            ]);
        } else {
            targetAggPromise = (async () => {
                const types = ["veterinaria", null];
                const out = [];
                for (const t of types) {
                    const filter =
                        t === null
                            ? { targetType: { $exists: false } }
                            : { targetType: t };
                    const c = await safeCountDocuments(RequestModel, filter);
                    out.push({ _id: t, count: c });
                }
                return out;
            })();
        }

        let dailyAggPromise;
        if (typeof RequestModel.aggregate === "function") {
            dailyAggPromise = RequestModel.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $project: {
                        day: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt",
                            },
                        },
                        targetType: { $ifNull: ["$targetType", "other"] },
                    },
                },
                {
                    $group: {
                        _id: { day: "$day", type: "$targetType" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { "_id.day": 1 } },
            ]);
        } else {
            dailyAggPromise = (async () => {
                const docs = await RequestModel.find({
                    createdAt: { $gte: startDate },
                })
                    .select("createdAt targetType")
                    .lean();
                const map = {};
                for (const d of docs) {
                    const day = new Date(d.createdAt)
                        .toISOString()
                        .slice(0, 10);
                    const type = d.targetType || "other";
                    const key = `${day}::${type}`;
                    map[key] = (map[key] || 0) + 1;
                }
                const out = Object.keys(map)
                    .map((k) => {
                        const [day, type] = k.split("::");
                        return { _id: { day, type }, count: map[k] };
                    })
                    .sort((a, b) => a._id.day.localeCompare(b._id.day));
                return out;
            })();
        }

        const recentRequestsPromise = (async () => {
            if (typeof RequestModel.find === "function") {
                return await RequestModel.find({})
                    .sort({ createdAt: -1 })
                    .limit(6)
                    .lean();
            }
            return [];
        })();

        const [
            totalRequests,
            requestsToday,
            statusAgg,
            targetAgg,
            dailyAgg,
            recentRequests,
        ] = await Promise.all([
            totalRequestsPromise,
            requestsTodayPromise,
            statusAggPromise,
            targetAggPromise,
            dailyAggPromise,
            recentRequestsPromise,
        ]);

        // Normalize results (igual que antes)...
        const statuses = ["pending", "accepted", "fulfilled", "cancelled", "en_transito", "llego_destino"];
        const statusCounts = {};
        statuses.forEach((s) => (statusCounts[s] = 0));
        (statusAgg || []).forEach((r) => {
            if (r && r._id) statusCounts[r._id] = r.count || 0;
            else
                statusCounts["unknown"] =
                    (statusCounts["unknown"] || 0) + (r.count || 0);
        });

        const targetCounts = {};
        (targetAgg || []).forEach((t) => {
            const key = t._id || "other";
            targetCounts[key] = t.count || 0;
        });

        const seriesMap = {};
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            seriesMap[key] = {
                day: key,
                veterinaria: 0,
                other: 0,
                total: 0,
            };
        }
        (dailyAgg || []).forEach((r) => {
            const day = r._id.day;
            const type = r._id.type || "other";
            const cnt = r.count || 0;
            if (!seriesMap[day])
                seriesMap[day] = {
                    day,
                    veterinaria: 0,
                    other: 0,
                    total: 0,
                };
            if (type === "veterinaria") seriesMap[day].veterinaria += cnt;
            else seriesMap[day].other += cnt;
            seriesMap[day].total += cnt;
        });
        const dailySeries = Object.values(seriesMap);

        return res.json({
            success: true,
            data: {
                totalRequests,
                requestsToday,
                statusCounts,
                targetCounts,
                dailySeries,
                recentRequests,
            },
        });
    } catch (err) {
        next(err);
    }
};


/**
 * GET /api/admin/leads
 * Devuelve últimos leads (paginación simple por query ?limit=50)
 */
exports.getEnterpriseLeads = async (req, res, next) => {
  try {
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
    const leads = await Lead.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ success: true, data: { leads } });
  } catch (err) {
    next(err);
  }
};



// ...existing code...

// exports.uploadPharmacyVademecum = async (req, res) => {
//     try {
//         const pharmacy = await Pharmacy.findById(req.params.id);

//         if (!pharmacy) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Farmacia no encontrada",
//             });
//         }

//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Debe enviarse un archivo en el campo vademecumFile",
//             });
//         }

//         pharmacy.vademecumFile = {
//             url: req.file.path || req.file.location || req.file.secure_url || "",
//             originalName: req.file.originalname || "",
//             mimeType: req.file.mimetype || "",
//             size: req.file.size || 0,
//             uploadedAt: new Date(),
//         };

//         if (req.body.vademecumPreview) {
//             try {
//                 pharmacy.vademecumPreview = Array.isArray(req.body.vademecumPreview)
//                     ? req.body.vademecumPreview
//                     : JSON.parse(req.body.vademecumPreview);
//             } catch (error) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "vademecumPreview debe ser un JSON válido",
//                 });
//             }
//         }

//         await pharmacy.save();

//         return res.json({
//             success: true,
//             message: "Vademecum cargado correctamente",
//             data: pharmacy,
//         });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };


 

// exports.uploadPharmacyVademecum = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const pharmacy = await Pharmacy.findById(id);
//     if (!pharmacy) {
//       return res.status(404).json({ success: false, message: "Farmacia no encontrada" });
//     }

//     if (!req.file) {
//       return res.status(400).json({ success: false, message: "Archivo requerido" });
//     }

//     pharmacy.vademecumFileName = req.file.filename;
//     pharmacy.vademecumUploadedAt = new Date();
//     await pharmacy.save();

//     return res.json({
//       success: true,
//       message: "Vademécum cargado correctamente",
//       data: {
//         vademecumFileName: pharmacy.vademecumFileName,
//         vademecumUploadedAt: pharmacy.vademecumUploadedAt,
//       },
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message || "Error al subir vademécum",
//     });
//   }
// };


// ...existing code...
exports.uploadVeterinariaVademecum = async (req, res) => {
  try {
    const veterinaria = await Veterinaria.findById(req.params.id);
    if (!veterinaria) {
      return res.status(404).json({ success: false, message: "Veterinaria no encontrada" });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Debe enviarse un archivo en el campo 'vademecumFile'",
      });
    }

    veterinaria.vademecumFile = {
      url: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    if (req.body.vademecumPreview) {
      veterinaria.vademecumPreview = Array.isArray(req.body.vademecumPreview)
        ? req.body.vademecumPreview
        : JSON.parse(req.body.vademecumPreview);
    }

    await veterinaria.save();

    return res.json({
      success: true,
      message: "Vademecum cargado correctamente",
      data: veterinaria,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ...existing code...


// ...existing code...