const Emergency = require('../models/Emergency');
const User = require("../models/User");

/**
 * @desc    Get all pharmacies (with optional location filter)
 * @route   GET /api/pharmacies
 * @access  Private
 * @note    Query parameters (latitude/longitude) are used for location-based filtering.
 *          These are geographical coordinates, not sensitive user data. They are validated
 *          and sanitized before use in database queries. GET is appropriate for this search operation.
 */
exports.getEmergencies = async (req, res, next) => {
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
      const emergencies = await Emergency.find({
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
        count: emergencies.length,
        message: 'Emergencias cercanas encontradas',
        data: {
          emergencies: emergencies.map(emergency => ({
            id: emergency._id,
            name: emergency.name,
            address: emergency.address,
            phone: emergency.phone,
            url: emergency.url,
            coordinates: {
              latitude: emergency.location.coordinates[1],
              longitude: emergency.location.coordinates[0]
            },
            distance: null // Could be calculated if needed
          }))
        }
      });
    }

    // If no coordinates, return all emergencies
    const emergencies = await Emergency.find(query);

    res.status(200).json({
      success: true,
      count: emergencies.length,
      message: 'Emergencias encontradas',
      data: {
        emergencies: emergencies.map(emergency => ({
          id: emergency._id,
          name: emergency.name,
          address: emergency.address,
          phone: emergency.phone,
            url: emergency.url,
          coordinates: {
            latitude: emergency.location.coordinates[1],
            longitude: emergency.location.coordinates[0]
          },

        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single veterinaria
 * @route   GET /api/pharmacies/:id
 * @access  Private
 */
exports.getEmergency = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergencia no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        emergency: {
          id: emergency._id,
          name: emergency.name,
          address: emergency.address,
          phone: emergency.phone,
          url: emergency.url,
          coordinates: {
            latitude: emergency.location.coordinates[1],
            longitude: emergency.location.coordinates[0]
          },

          createdAt: emergency.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get nearby doctors for current user
 * @route   GET /api/doctors/nearby
 * @access  Private
 */
exports.getNearbyEmergencies = async (req, res, next) => {
  try {
    const user = req.user;
    const { maxDistance = 10000 } = req.query; // default 10km

    // Get user's coordinates
    const [longitude, latitude] = user.location.coordinates;

    if (latitude === 0 && longitude === 0) {
      return res.status(400).json({
        success: false,
        message: 'Por favor actualiza tu ubicación para ver farmacias cercanas'
      });
    }

    const emergencies = await Emergency.find({
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
        count: emergencies.length,
        message: `Encontramos ${emergencies.length} emergencias cerca de ti`,
        data: {
            emergencies: emergencies.map((emergency) => ({
                id: emergency._id,
                name: emergency.name,
                address: emergency.address,
                phone: emergency.phone,
                url: emergency.url,

                coordinates: {
                    latitude: emergency.location.coordinates[1],
                    longitude: emergency.location.coordinates[0],
                },
            })),
            userLocation: {
                latitude,
                longitude,
            },
        },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new emergency
 * @route   POST /api/emergencies
 * @access  Private
 */
exports.createEmergency = async (req, res, next) => {
  try {
    const { name, address, phone, latitude, longitude, url } = req.body;

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

    // Create emergency
    const emergency = await Emergency.create({
      name,
      address,
      phone,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      url: req.body.url,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Emergencia creada exitosamente',
      data: {
        emergency: {
          id: emergency._id,
          name: emergency.name,
          address: emergency.address,
          phone: emergency.phone,
            url: emergency.url,
          coordinates: {
            latitude: emergency.location.coordinates[1],
            longitude: emergency.location.coordinates[0]
          },
 
          isActive: emergency.isActive,
          createdAt: emergency.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update doctor
 * @route   PUT /api/doctors/:id
 * @access  Private
 */


/**
 * Update doctor (only owner or admin)
 * PUT /api/doctors/:id
 */
exports.updateEmergency = async (req, res, next) => {
    try {
        const {
            name,
            address,
            phone,
            url,
            latitude,
            longitude,
            isActive,
        } = req.body;

        // Find doctor
        const emergency = await Emergency.findById(req.params.id);
        if (!emergency) {
            return res
                .status(404)
                .json({ success: false, message: "Emergencia no encontrada" });
        }

        // Auth: only owner or admin
        const user = req.user;
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "No autenticado" });

        const isOwner =
            (user.entityId && String(user.entityId) === String(emergency._id)) ||
            (emergency.owner && String(emergency.owner) === String(user._id));
        if (!isOwner && user.role !== "admin") {
            return res
                .status(403)
                .json({ success: false, message: "No autorizado" });
        }

        // Update fields (only if provided)
        if (typeof name !== "undefined") emergency.name = name;
        if (typeof address !== "undefined") emergency.address = address;
        if (typeof phone !== "undefined") emergency.phone = phone;
        if (typeof url !== "undefined") emergency.url = url;
        if (typeof isActive !== "undefined") emergency.isActive = isActive;

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

            emergency.location = {
                type: "Point",
                coordinates: [lng, lat],
            };
        }

        await emergency.save();

        res.status(200).json({
            success: true,
            message: "Emergencia actualizada exitosamente",
            data: {
                emergency: {
                    id: emergency._id,
                    name: emergency.name,
                    address: emergency.address,
                    phone: emergency.phone,
                    url: emergency.url,
                    coordinates: {
                        latitude: emergency.location?.coordinates?.[1] ?? 0,
                        longitude: emergency.location?.coordinates?.[0] ?? 0,
                    },
                    isActive: emergency.isActive,
                    updatedAt: emergency.updatedAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};



/**
 * @desc    Delete doctor
 * @route   DELETE /api/doctors/:id
 * @access  Private
 */
exports.deleteEmergency = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergencia no encontrada'
      });
    }

    await emergency.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Emergencia eliminada exitosamente',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
