// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const uploadDir = path.join(__dirname, "../../uploads/vademecum");
// fs.mkdirSync(uploadDir, { recursive: true });

// const storage = multer.diskStorage({
//     destination: (_req, _file, cb) => cb(null, uploadDir),
//     filename: (_req, file, cb) => {
//         const ext = path.extname(file.originalname || "");
//         const base = path.basename(file.originalname || "file", ext).replace(/\s+/g, "_");
//         cb(null, `${Date.now()}-${base}${ext}`);
//     },
// });

// const allowedMimeTypes = new Set([
//     "application/pdf",
//     "text/csv",
//     "application/vnd.ms-excel",
//     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
// ]);

// const fileFilter = (_req, file, cb) => {
//     if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);
//     return cb(new Error("Tipo de archivo no permitido. Use PDF/CSV/XLS/XLSX"));
// };

// const upload = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
// });

// module.exports = upload;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/vademecum");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path.basename(file.originalname || "file", ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const uploadVademecum = multer({ storage });

module.exports = uploadVademecum;