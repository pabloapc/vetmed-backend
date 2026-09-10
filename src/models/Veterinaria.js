const mongoose = require("mongoose");

const vademecumFileSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
    },
    originalName: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    size: {
      type: Number,
      min: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Si querés conservar una muestra/preview de registros parseados:
const vademecumItemSchema = new mongoose.Schema(
  {
    droga: { type: String, trim: true },
    marca: { type: String, trim: true },
    presentacion: { type: String, trim: true },
    laboratorio: { type: String, trim: true },
    cobertura: { type: String, trim: true },
    precio: { type: Number, min: 0 },
    comentarios: { type: String, trim: true },
  },
  { _id: false }
);

const veterinariaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Por favor ingrese el nombre de la veterinaria"],
      trim: true,
    },
    // SEO-friendly URL segment, e.g. "clinica-veterinaria-vottero". Generated once on
    // creation and kept stable afterwards so published links/indexed pages don't break.
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, "Por favor ingrese la dirección"],
    },
    city: {
      type: String,
      trim: true,
    },
    province: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    // SEO copy shown on the public detail page (also feeds the meta description
    // and JSON-LD) — without it pages have almost no unique text for Google to index.
    description: {
      type: String,
      trim: true,
      maxlength: 600,
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

    // NUEVO: metadata del archivo subido
    vademecumFile: {
      type: vademecumFileSchema,
      default: null,
    },

  
// vademecumFileName: {
//   type: String,
//   trim: true,
//   default: null
// },
// vademecumUploadedAt: {
//   type: Date,
//   default: null
// },

    // OPCIONAL: si luego parseás archivo y guardás una muestra
    vademecumPreview: {
      type: [vademecumItemSchema],
      default: [],
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
veterinariaSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Veterinaria", veterinariaSchema);
