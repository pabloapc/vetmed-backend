const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Por favor ingrese el nombre de la farmacia"],
            trim: true,
        },
        address: {
            type: String,
            required: [true, "Por favor ingrese la dirección"],
        },
        phone: {
            type: String,
            trim: true,
        },
        url: {
            type: String,
            trim: true,
        },
        specialty: {
            type: String,
            trim: true,
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                required: [true, "Por favor ingrese las coordenadas"],
            },
        },
        benefits: {
            type: String,
            required: [true, "Por favor ingrese los beneficios"],
            default: "Descuentos especiales para usuarios registrados",
        },
        discount: {
            type: Number,
            default: 10,
            min: 0,
            max: 100,
        },
        openingHours: {
            type: String,
            default: "Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for geospatial queries
doctorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Doctor', doctorSchema);