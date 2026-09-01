require('dotenv').config();
const mongoose = require('mongoose');
const Veterinaria = require('../models/Veterinaria');
const connectDB = require('../config/database');

const veterinarias = [
  {
    name: 'Veterinaria San José',
    address: 'Av. Principal #123, Centro',
    phone: '+1234567890',
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128] // Example: New York coordinates
    },
    benefits: 'Descuento del 15% en servicios veterinarios para usuarios registrados',
    discount: 15,
    openingHours: 'Lun-Vie: 8:00-20:00, Sáb: 9:00-18:00, Dom: 10:00-14:00',
    isActive: true
  },
  {
    name: 'Veterinaria Central',
    address: 'Calle 5 #456, Zona Norte',
    phone: '+1234567891',
    location: {
      type: 'Point',
      coordinates: [-74.0080, 40.7148]
    },
    benefits: 'Descuento del 20% en consultas y tratamientos',
    discount: 20,
    openingHours: 'Lun-Vie: 7:00-22:00, Sáb-Dom: 8:00-20:00',
    isActive: true
  },
  {
    name: 'Veterinaria La Salud',
    address: 'Av. Libertador #789, Zona Este',
    phone: '+1234567892',
    location: {
      type: 'Point',
      coordinates: [-74.0040, 40.7108]
    },
    benefits: 'Descuento del 10% en toda la tienda + envío gratis en compras mayores a $50',
    discount: 10,
    openingHours: 'Lun-Dom: 24 horas',
    isActive: true
  },
  {
    name: 'Veterinaria El Bienestar',
    address: 'Calle 10 #321, Centro Comercial Plaza',
    phone: '+1234567893',
    location: {
      type: 'Point',
      coordinates: [-74.0100, 40.7168]
    },
    benefits: 'Descuento del 12% en medicamentos y suplementos para mascotas',
    discount: 12,
    openingHours: 'Lun-Sáb: 9:00-21:00, Dom: 10:00-18:00',
    isActive: true
  },
  {
    name: 'Veterinaria Popular',
    address: 'Av. Sur #555, Barrio Los Pinos',
    phone: '+1234567894',
    location: {
      type: 'Point',
      coordinates: [-74.0020, 40.7088]
    },
    benefits: 'Descuento del 18% en servicios veterinarios + tarjeta de fidelidad',
    discount: 18,
    openingHours: 'Lun-Vie: 8:00-19:00, Sáb: 9:00-16:00',
    isActive: true
  }
];

const seedVeterinarias = async () => {
  try {
    await connectDB();

    // Clear existing veterinarias
    await Veterinaria.deleteMany();
    console.log('Veterinarias existentes eliminadas');

    // Insert new veterinarias
    await Veterinaria.insertMany(veterinarias);
    console.log(`${veterinarias.length} veterinarias agregadas exitosamente`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding veterinarias:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedVeterinarias();
}

module.exports = seedVeterinarias;
