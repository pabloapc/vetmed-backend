const Veterinaria = require("../models/Veterinaria");
const User = require("../models/User");

/**
 * @desc    Get all veterinarias (with optional location filter)
 * @route   GET /api/veterinarias
 * @access  Private
 * @note    Query parameters (latitude/longitude) are used for location-based filtering.
 *          These are geographical coordinates, not sensitive user data. They are validated
 *          and sanitized before use in database queries. GET is appropriate for this search operation.
 */
exports.getVeterinarias = async (req, res, next) => {
  try {
    // Note: latitude/longitude are geographical search parameters, validated below
    const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance in meters (default 10km)

    let query = { isActive: true };

    // If coordinates are provided, filter by proximity
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // Validate coordinates with strict range checking
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas inválidas'
        });
      }

      // Use MongoDB geospatial query
      const veterinarias = await Veterinaria.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: parseInt(maxDistance)
          }
        }
      });

      return res.status(200).json({
        success: true,
        count: veterinarias.length,
        message: 'Veterinarias cercanas encontradas',
        data: {
          veterinarias: veterinarias.map(veterinaria => ({
            id: veterinaria._id,
            name: veterinaria.name,
            address: veterinaria.address,
            phone: veterinaria.phone,
            coordinates: {
              latitude: veterinaria.location.coordinates[1],
              longitude: veterinaria.location.coordinates[0]
            },
            benefits: veterinaria.benefits,
            discount: veterinaria.discount,
            openingHours: veterinaria.openingHours,
            distance: null // Could be calculated if needed
          }))
        }
      });
    }

    // If no coordinates, return all veterinarias
    const veterinarias = await Veterinaria.find(query);

    res.status(200).json({
      success: true,
      count: veterinarias.length,
      message: 'Veterinarias encontradas',
      data: {
        veterinarias: veterinarias.map(veterinaria => ({
          id: veterinaria._id,
          name: veterinaria.name,
          address: veterinaria.address,
          phone: veterinaria.phone,
          coordinates: {
            latitude: veterinaria.location.coordinates[1],
            longitude: veterinaria.location.coordinates[0]
          },
          benefits: veterinaria.benefits,
          discount: veterinaria.discount,
          openingHours: veterinaria.openingHours
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single veterinaria
 * @route   GET /api/veterinarias/:id
 * @access  Private
 */
exports.getVeterinaria = async (req, res, next) => {
  try {
    const veterinaria = await Veterinaria.findById(req.params.id);

    if (!veterinaria) {
      return res.status(404).json({
        success: false,
        message: 'Veterinaria no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        veterinaria: {
          id: veterinaria._id,
          name: veterinaria.name,
          address: veterinaria.address,
          phone: veterinaria.phone,
          coordinates: {
            latitude: veterinaria.location.coordinates[1],
            longitude: veterinaria.location.coordinates[0]
          },
          benefits: veterinaria.benefits,
          discount: veterinaria.discount,
          openingHours: veterinaria.openingHours,
          createdAt: veterinaria.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get nearby veterinarias for current user
 * @route   GET /api/veterinarias/nearby
 * @access  Private
 */
exports.getNearbyVeterinarias = async (req, res, next) => {
  try {
    const user = req.user;
    const { maxDistance = 10000 } = req.query; // default 10km

    // Get user's coordinates
    const [longitude, latitude] = user.location.coordinates;

    if (latitude === 0 && longitude === 0) {
      return res.status(400).json({
        success: false,
        message: 'Por favor actualiza tu ubicación para ver veterinarias cercanas'
      });
    }

    const veterinarias = await Veterinaria.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).limit(20);

    res.status(200).json({
      success: true,
      count: veterinarias.length,
      message: `Encontramos ${veterinarias.length} veterinarias cerca de ti`,
      data: {
        veterinarias: veterinarias.map(veterinaria => ({
          id: veterinaria._id,
          name: veterinaria.name,
          address: veterinaria.address,
          phone: veterinaria.phone,
          coordinates: {
            latitude: veterinaria.location.coordinates[1],
            longitude: veterinaria.location.coordinates[0]
          },
          benefits: veterinaria.benefits,
          discount: veterinaria.discount,
          openingHours: veterinaria.openingHours
        })),
        userLocation: {
          latitude,
          longitude
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new veterinaria
 * @route   POST /api/veterinarias
 * @access  Private
 */
exports.createVeterinaria = async (req, res, next) => {
  try {
    const { name, address, phone, latitude, longitude, benefits, discount, openingHours } = req.body;

    // Validate required fields
    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona nombre, dirección y coordenadas'
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Coordenadas inválidas'
      });
    }

    // Create veterinaria
    const veterinaria = await Veterinaria.create({
      name,
      address,
      phone,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      benefits: benefits || 'Descuentos especiales para usuarios registrados',
      discount: discount || 10,
      openingHours: openingHours || 'Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Veterinaria creada exitosamente',
      data: {
        veterinaria: {
          id: veterinaria._id,
          name: veterinaria.name,
          address: veterinaria.address,
          phone: veterinaria.phone,
          coordinates: {
            latitude: veterinaria.location.coordinates[1],
            longitude: veterinaria.location.coordinates[0]
          },
          benefits: veterinaria.benefits,
          discount: veterinaria.discount,
          openingHours: veterinaria.openingHours,
          isActive: veterinaria.isActive,
          createdAt: veterinaria.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Update veterinaria (only owner or admin)
 * PUT /api/veterinarias/:id
 */
exports.updateVeterinaria = async (req, res, next) => {
    try {
        const {
            name,
            address,
            phone,
            latitude,
            longitude,
            benefits,
            discount,
            openingHours,
            isActive,
        } = req.body;

        // Find veterinaria
        const veterinaria = await Veterinaria.findById(req.params.id);
        if (!veterinaria) {
            return res
                .status(404)
                .json({ success: false, message: "Veterinaria no encontrada" });
        }

        // Auth: only owner or admin
        const user = req.user;
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "No autenticado" });

        const isOwner =
            (user.entityId && String(user.entityId) === String(veterinaria._id)) ||
            (veterinaria.owner && String(veterinaria.owner) === String(user._id));
        if (!isOwner && user.role !== "admin") {
            return res
                .status(403)
                .json({ success: false, message: "No autorizado" });
        }

        // Update fields (only if provided)
        if (typeof name !== "undefined") veterinaria.name = name;
        if (typeof address !== "undefined") veterinaria.address = address;
        if (typeof phone !== "undefined") veterinaria.phone = phone;
        if (typeof benefits !== "undefined") veterinaria.benefits = benefits;
        if (typeof discount !== "undefined") veterinaria.discount = discount;
        if (typeof openingHours !== "undefined")
            veterinaria.openingHours = openingHours;
        if (typeof isActive !== "undefined") veterinaria.isActive = isActive;

        // Update location if coordinates provided (both required)
        if (
            typeof latitude !== "undefined" &&
            typeof longitude !== "undefined" &&
            latitude !== "" &&
            longitude !== ""
        ) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            if (
                Number.isNaN(lat) ||
                Number.isNaN(lng) ||
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
            ) {
                return res
                    .status(400)
                    .json({ success: false, message: "Coordenadas inválidas" });
            }

            veterinaria.location = {
                type: "Point",
                coordinates: [lng, lat],
            };
        }

        await veterinaria.save();

        res.status(200).json({
            success: true,
            message: "Veterinaria actualizada exitosamente",
            data: {
                veterinaria: {
                    id: veterinaria._id,
                    name: veterinaria.name,
                    address: veterinaria.address,
                    phone: veterinaria.phone,
                    coordinates: {
                        latitude: veterinaria.location?.coordinates?.[1] ?? 0,
                        longitude: veterinaria.location?.coordinates?.[0] ?? 0,
                    },
                    benefits: veterinaria.benefits,
                    discount: veterinaria.discount,
                    openingHours: veterinaria.openingHours,
                    isActive: veterinaria.isActive,
                    updatedAt: veterinaria.updatedAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
/**
 * @desc    Delete veterinaria
 * @route   DELETE /api/veterinarias/:id
 * @access  Private
 */
exports.deleteVeterinaria = async (req, res, next) => {
  try {
    const veterinaria = await Veterinaria.findById(req.params.id);

    if (!veterinaria) {
      return res.status(404).json({
        success: false,
        message: 'Veterinaria no encontrada'
      });
    }

    await veterinaria.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Veterinaria eliminada exitosamente',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
