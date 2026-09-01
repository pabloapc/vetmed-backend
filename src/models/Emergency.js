const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Por favor ingrese el nombre de la farmacia"],
            trim: true,
        },
        address: {
            type: String,
            required: [false, "Por favor ingrese la dirección"],
        },
        phone: {
            type: String,
            trim: true,
        },
        url: {
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
emergencySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Emergency', emergencySchema);