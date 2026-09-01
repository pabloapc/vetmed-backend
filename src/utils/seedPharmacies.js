require('dotenv').config();
const mongoose = require('mongoose');
const Pharmacy = require('../models/Pharmacy');
const connectDB = require('../config/database');

const pharmacies = [
  {
    name: 'Farmacia San José',
    address: 'Av. Principal #123, Centro',
    phone: '+1234567890',
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128] // Example: New York coordinates
    },
    benefits: 'Descuento del 15% en medicamentos genéricos para usuarios registrados',
    discount: 15,
    openingHours: 'Lun-Vie: 8:00-20:00, Sáb: 9:00-18:00, Dom: 10:00-14:00',
    isActive: true
  },
  {
    name: 'Farmacia Central',
    address: 'Calle 5 #456, Zona Norte',
    phone: '+1234567891',
    location: {
      type: 'Point',
      coordinates: [-74.0080, 40.7148]
    },
    benefits: 'Descuento del 20% en productos de cuidado personal',
    discount: 20,
    openingHours: 'Lun-Vie: 7:00-22:00, Sáb-Dom: 8:00-20:00',
    isActive: true
  },
  {
    name: 'Farmacia La Salud',
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
    name: 'Farmacia El Bienestar',
    address: 'Calle 10 #321, Centro Comercial Plaza',
    phone: '+1234567893',
    location: {
      type: 'Point',
      coordinates: [-74.0100, 40.7168]
    },
    benefits: 'Descuento del 12% en vitaminas y suplementos',
    discount: 12,
    openingHours: 'Lun-Sáb: 9:00-21:00, Dom: 10:00-18:00',
    isActive: true
  },
  {
    name: 'Farmacia Popular',
    address: 'Av. Sur #555, Barrio Los Pinos',
    phone: '+1234567894',
    location: {
      type: 'Point',
      coordinates: [-74.0020, 40.7088]
    },
    benefits: 'Descuento del 18% en medicamentos de marca + tarjeta de fidelidad',
    discount: 18,
    openingHours: 'Lun-Vie: 8:00-19:00, Sáb: 9:00-16:00',
    isActive: true
  }
];

const seedPharmacies = async () => {
  try {
    await connectDB();

    // Clear existing pharmacies
    await Pharmacy.deleteMany();
    console.log('Farmacias existentes eliminadas');

    // Insert new pharmacies
    await Pharmacy.insertMany(pharmacies);
    console.log(`${pharmacies.length} farmacias agregadas exitosamente`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding pharmacies:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedPharmacies();
}

module.exports = seedPharmacies;
