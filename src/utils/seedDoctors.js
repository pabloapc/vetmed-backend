require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const connectDB = require('../config/database');

const doctors = [
  {
    name: 'Juan Pérez',
    address: 'Av. Sur #555, Barrio Los Pinos',
    phone: '+1234567894',
    url: 'http://farmaciapopular.example.com',
    specialty: 'Medicina General',
    location: {
      type: 'Point',
      coordinates: [-74.0020, 40.7088]
    },
    benefits: 'Descuentos especiales para usuarios registrados',
    discount: 18,
    openingHours: 'Lun-Vie: 8:00-19:00, Sáb: 9:00-16:00',
    isActive: true
  }
];

const seedDoctors = async () => {
  try {
    await connectDB();

    // Clear existing doctors
    await Doctor.deleteMany();
    console.log('Doctores existentes eliminados');

    // Insert new doctors
    await Doctor.insertMany(doctors);
    console.log(`${doctors.length} doctores agregados exitosamente`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedDoctors();
}

module.exports = seedDoctors;
