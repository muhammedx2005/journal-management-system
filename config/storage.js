// Makale dosyalarinin diskte tutuldugu tek merkezi konum. Onceden
// uploadMiddleware.js / fileController.js / submissionCleanupService.js
// icinde ayri ayri hardcoded olan "storage/uploads" yolu buraya toplandi -
// ucu UPLOADS_DIR env degiskeniyle degistirilebilir olsun diye (orn. Render'da
// kalici bir Disk baglandiginda /var/data/uploads gibi bir yola tasimak icin
// kod degistirmeye gerek kalmaz).
const fs = require("fs");
const path = require("path");

const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, "..", "storage", "uploads");

// Render gibi platformlarda container her yeniden basladiginda (free tier'da
// uyku modundan uyanista dahil) diskin bos gelme ihtimaline karsi klasoru
// burada garanti ediyoruz - sadece git'teki .gitkeep'e guvenmiyoruz.
fs.mkdirSync(uploadsDir, { recursive: true });

module.exports = { uploadsDir };
