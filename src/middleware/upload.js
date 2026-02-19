import multer from "multer";
import path from "path";

// 1️⃣ Storage config: where to save files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    // e.g., 1689765432100-CYFT Excel.xlsx
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// 2️⃣ Optional: allow only certain file types
const fileFilter = function (req, file, cb) {
  const allowed = [".jpg", ".jpeg", ".png", ".pdf", ".docx", ".xlsx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("File type not allowed"));
};

// 3️⃣ Export Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5 MB
});