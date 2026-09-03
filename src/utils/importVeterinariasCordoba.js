require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");
const Veterinaria = require("../models/Veterinaria");
const connectDB = require("../config/database");

const DATA_FILE = path.join(__dirname, "../data/veterinariasCordobaCapital.json");

const importVeterinariasCordoba = async () => {
    const records = require(DATA_FILE);

    await connectDB();

    let inserted = 0;
    let skipped = 0;

    for (const r of records) {
        const exists = await Veterinaria.findOne({
            name: r.name,
            address: r.address,
        }).lean();

        if (exists) {
            skipped += 1;
            continue;
        }

        await Veterinaria.create({
            name: r.name,
            address: r.address,
            city: "Córdoba",
            province: "Córdoba",
            phone: r.phone || undefined,
            location: r.location,
        });
        inserted += 1;
    }

    console.log(
        `Importación completa: ${inserted} veterinarias nuevas, ${skipped} ya existentes (omitidas).`
    );
};

if (require.main === module) {
    importVeterinariasCordoba()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("Error importando veterinarias de Córdoba:", err);
            process.exit(1);
        });
}

module.exports = importVeterinariasCordoba;
