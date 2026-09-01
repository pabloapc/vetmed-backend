const Pharmacy = require("../models/Pharmacy");
const User = require("../models/User");

/**
 * @desc    Get all pharmacies (with optional location filter)
 * @route   GET /api/pharmacies
 * @access  Private
 * @note    Query parameters (latitude/longitude) are used for location-based filtering.
 *          These are geographical coordinates, not sensitive user data. They are validated
 *          and sanitized before use in database queries. GET is appropriate for this search operation.
 */
exports.getPharmacies = async (req, res, next) => {
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
      const pharmacies = await Pharmacy.find({
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
        count: pharmacies.length,
        message: 'Farmacias cercanas encontradas',
        data: {
          pharmacies: pharmacies.map(pharmacy => ({
            id: pharmacy._id,
            name: pharmacy.name,
            address: pharmacy.address,
            phone: pharmacy.phone,
            coordinates: {
              latitude: pharmacy.location.coordinates[1],
              longitude: pharmacy.location.coordinates[0]
            },
            benefits: pharmacy.benefits,
            discount: pharmacy.discount,
            openingHours: pharmacy.openingHours,
            distance: null // Could be calculated if needed
          }))
        }
      });
    }

    // If no coordinates, return all pharmacies
    const pharmacies = await Pharmacy.find(query);

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      message: 'Farmacias encontradas',
      data: {
        pharmacies: pharmacies.map(pharmacy => ({
          id: pharmacy._id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          coordinates: {
            latitude: pharmacy.location.coordinates[1],
            longitude: pharmacy.location.coordinates[0]
          },
          benefits: pharmacy.benefits,
          discount: pharmacy.discount,
          openingHours: pharmacy.openingHours
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single pharmacy
 * @route   GET /api/pharmacies/:id
 * @access  Private
 */
exports.getPharmacy = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Farmacia no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        pharmacy: {
          id: pharmacy._id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          coordinates: {
            latitude: pharmacy.location.coordinates[1],
            longitude: pharmacy.location.coordinates[0]
          },
          benefits: pharmacy.benefits,
          discount: pharmacy.discount,
          openingHours: pharmacy.openingHours,
          createdAt: pharmacy.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get nearby pharmacies for current user
 * @route   GET /api/pharmacies/nearby
 * @access  Private
 */
exports.getNearbyPharmacies = async (req, res, next) => {
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

    const pharmacies = await Pharmacy.find({
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
      count: pharmacies.length,
      message: `Encontramos ${pharmacies.length} farmacias cerca de ti`,
      data: {
        pharmacies: pharmacies.map(pharmacy => ({
          id: pharmacy._id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          coordinates: {
            latitude: pharmacy.location.coordinates[1],
            longitude: pharmacy.location.coordinates[0]
          },
          benefits: pharmacy.benefits,
          discount: pharmacy.discount,
          openingHours: pharmacy.openingHours
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
 * @desc    Create new pharmacy
 * @route   POST /api/pharmacies
 * @access  Private
 */
exports.createPharmacy = async (req, res, next) => {
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

    // Create pharmacy
    const pharmacy = await Pharmacy.create({
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
      message: 'Farmacia creada exitosamente',
      data: {
        pharmacy: {
          id: pharmacy._id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          coordinates: {
            latitude: pharmacy.location.coordinates[1],
            longitude: pharmacy.location.coordinates[0]
          },
          benefits: pharmacy.benefits,
          discount: pharmacy.discount,
          openingHours: pharmacy.openingHours,
          isActive: pharmacy.isActive,
          createdAt: pharmacy.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Update pharmacy (only owner or admin)
 * PUT /api/pharmacies/:id
 */
exports.updatePharmacy = async (req, res, next) => {
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

        // Find pharmacy
        const pharmacy = await Pharmacy.findById(req.params.id);
        if (!pharmacy) {
            return res
                .status(404)
                .json({ success: false, message: "Farmacia no encontrada" });
        }

        // Auth: only owner or admin
        const user = req.user;
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "No autenticado" });

        const isOwner =
            (user.entityId && String(user.entityId) === String(pharmacy._id)) ||
            (pharmacy.owner && String(pharmacy.owner) === String(user._id));
        if (!isOwner && user.role !== "admin") {
            return res
                .status(403)
                .json({ success: false, message: "No autorizado" });
        }

        // Update fields (only if provided)
        if (typeof name !== "undefined") pharmacy.name = name;
        if (typeof address !== "undefined") pharmacy.address = address;
        if (typeof phone !== "undefined") pharmacy.phone = phone;
        if (typeof benefits !== "undefined") pharmacy.benefits = benefits;
        if (typeof discount !== "undefined") pharmacy.discount = discount;
        if (typeof openingHours !== "undefined")
            pharmacy.openingHours = openingHours;
        if (typeof isActive !== "undefined") pharmacy.isActive = isActive;

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

            pharmacy.location = {
                type: "Point",
                coordinates: [lng, lat],
            };
        }

        await pharmacy.save();

        res.status(200).json({
            success: true,
            message: "Farmacia actualizada exitosamente",
            data: {
                pharmacy: {
                    id: pharmacy._id,
                    name: pharmacy.name,
                    address: pharmacy.address,
                    phone: pharmacy.phone,
                    coordinates: {
                        latitude: pharmacy.location?.coordinates?.[1] ?? 0,
                        longitude: pharmacy.location?.coordinates?.[0] ?? 0,
                    },
                    benefits: pharmacy.benefits,
                    discount: pharmacy.discount,
                    openingHours: pharmacy.openingHours,
                    isActive: pharmacy.isActive,
                    updatedAt: pharmacy.updatedAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
/**
 * @desc    Delete pharmacy
 * @route   DELETE /api/pharmacies/:id
 * @access  Private
 */
exports.deletePharmacy = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Farmacia no encontrada'
      });
    }

    await pharmacy.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Farmacia eliminada exitosamente',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
