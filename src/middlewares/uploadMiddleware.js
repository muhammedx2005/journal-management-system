// Makale dosyasi yukleme ayarlari (web1'deki uploader/ klasorune yazan
// upload_file.php'nin karsiligi). Sadece PDF/DOC/DOCX kabul edilir, 20MB sinir.
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { uploadsDir } = require("../../config/storage");

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

// Yuklenen makale dosyalari BILINCLI olarak public/ disindaki storage/uploads
// klasorune yaziliyor - boylece express.static ile dogrudan/yetkisiz erisim
// mumkun degil. Dosyalara sadece src/controllers/fileController.js uzerinden,
// yazar/atanan hakem/editor/yayinlanmis makale kontrolunden gecerek ulasilabilir.
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `paper-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error("Sadece PDF, DOC veya DOCX dosyalari yuklenebilir."));
  }
  cb(null, true);
}

const uploadPaperFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

module.exports = { uploadPaperFile };
