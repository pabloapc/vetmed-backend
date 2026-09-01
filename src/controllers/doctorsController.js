const Doctor = require('../models/Doctor');
const User = require("../models/User");

/**
 * @desc    Get all pharmacies (with optional location filter)
 * @route   GET /api/pharmacies
 * @access  Private
 * @note    Query parameters (latitude/longitude) are used for location-based filtering.
 *          These are geographical coordinates, not sensitive user data. They are validated
 *          and sanitized before use in database queries. GET is appropriate for this search operation.
 */
exports.getDoctors = async (req, res, next) => {
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
      const doctors = await Doctor.find({
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
        count: doctors.length,
        message: 'Doctores cercanos encontrados',
        data: {
          doctors: doctors.map(doctor => ({
            id: doctor._id,
            name: doctor.name,
            address: doctor.address,
            phone: doctor.phone,
            url: doctor.url,
            specialty: doctor.specialty,
            coordinates: {
              latitude: doctor.location.coordinates[1],
              longitude: doctor.location.coordinates[0]
            },
            benefits: doctor.benefits,
            discount: doctor.discount,
            openingHours: doctor.openingHours,
            distance: null // Could be calculated if needed
          }))
        }
      });
    }

    // If no coordinates, return all doctors
    const doctors = await Doctor.find(query);

    res.status(200).json({
      success: true,
      count: doctors.length,
      message: 'Doctores encontrados',
      data: {
        doctors: doctors.map(doctor => ({
          id: doctor._id,
          name: doctor.name,
          address: doctor.address,
          phone: doctor.phone,
            url: doctor.url,
            specialty: doctor.specialty,
          coordinates: {
            latitude: doctor.location.coordinates[1],
            longitude: doctor.location.coordinates[0]
          },
          benefits: doctor.benefits,
          discount: doctor.discount,
          openingHours: doctor.openingHours
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
exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        doctor: {
          id: doctor._id,
          name: doctor.name,
          address: doctor.address,
          phone: doctor.phone,
          url: doctor.url,
          specialty: doctor.specialty,
          coordinates: {
            latitude: doctor.location.coordinates[1],
            longitude: doctor.location.coordinates[0]
          },
          benefits: doctor.benefits,
          discount: doctor.discount,
          openingHours: doctor.openingHours,
          createdAt: doctor.createdAt
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
exports.getNearbyDoctors = async (req, res, next) => {
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

    const doctors = await Doctor.find({
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
      count: doctors.length,
      message: `Encontramos ${doctors.length} doctores cerca de ti`,
      data: {
        doctors: doctors.map(doctor => ({
          id: doctor._id,
          name: doctor.name,
          address: doctor.address,
          phone: doctor.phone,
            url: doctor.url,
            specialty: doctor.specialty,
          coordinates: {
            latitude: doctor.location.coordinates[1],
            longitude: doctor.location.coordinates[0]
          },
          benefits: doctor.benefits,
          discount: doctor.discount,
          openingHours: doctor.openingHours
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
exports.createDoctor = async (req, res, next) => {
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

    // Create doctor
    const doctor = await Doctor.create({
      name,
      address,
      phone,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      url: req.body.url,
      specialty: req.body.specialty,
      benefits: benefits || 'Descuentos especiales para usuarios registrados',
      discount: discount || 10,
      openingHours: openingHours || 'Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Doctor creado exitosamente',
      data: {
        doctor: {
          id: doctor._id,
          name: doctor.name,
          address: doctor.address,
          phone: doctor.phone,
            url: doctor.url,
            specialty: doctor.specialty,
          coordinates: {
            latitude: doctor.location.coordinates[1],
            longitude: doctor.location.coordinates[0]
          },
          benefits: doctor.benefits,
          discount: doctor.discount,
          openingHours: doctor.openingHours,
          isActive: doctor.isActive,
          createdAt: doctor.createdAt
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
exports.updateDoctor = async (req, res, next) => {
    try {
        const {
            name,
            specialty,
            address,
            phone,
            url,
            horario,
            latitude,
            longitude,
            isActive,
        } = req.body;

        // Find doctor
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res
                .status(404)
                .json({ success: false, message: "Doctor no encontrado" });
        }

        // Auth: only owner or admin
        const user = req.user;
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "No autenticado" });

        const isOwner =
            (user.entityId && String(user.entityId) === String(doctor._id)) ||
            (doctor.owner && String(doctor.owner) === String(user._id));
        if (!isOwner && user.role !== "admin") {
            return res
                .status(403)
                .json({ success: false, message: "No autorizado" });
        }

        // Update fields (only if provided)
        if (typeof name !== "undefined") doctor.name = name;
        if (typeof specialty !== "undefined") doctor.specialty = specialty;
        if (typeof address !== "undefined") doctor.address = address;
        if (typeof phone !== "undefined") doctor.phone = phone;
        if (typeof url !== "undefined") doctor.url = url;
        if (typeof horario !== "undefined") doctor.horario = horario;
        if (typeof isActive !== "undefined") doctor.isActive = isActive;

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

            doctor.location = {
                type: "Point",
                coordinates: [lng, lat],
            };
        }

        await doctor.save();

        res.status(200).json({
            success: true,
            message: "Doctor actualizado exitosamente",
            data: {
                doctor: {
                    id: doctor._id,
                    name: doctor.name,
                    specialty: doctor.specialty,
                    address: doctor.address,
                    phone: doctor.phone,
                    url: doctor.url,
                    horario: doctor.horario,
                    coordinates: {
                        latitude: doctor.location?.coordinates?.[1] ?? 0,
                        longitude: doctor.location?.coordinates?.[0] ?? 0,
                    },
                    isActive: doctor.isActive,
                    updatedAt: doctor.updatedAt,
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
exports.deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    await doctor.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Doctor eliminado exitosamente',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
