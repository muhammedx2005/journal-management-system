// Bir makaleyi kalici olarak silerken izlenmesi gereken ortak adimlar -
// superadminController (Makaleler tablosu) ve editorController (Editor
// panelindeki "Makaleyi Sil" butonu) tarafindan paylasilir. Sira onemlidir:
// reviews -> review_assignments -> submissions (aksi halde foreign key
// hatasi alinir, bkz. CLAUDE.md "Cascade deletes").
const path = require("path");
const fs = require("fs");
const submissionModel = require("../models/submissionModel");
const reviewAssignmentModel = require("../models/reviewAssignmentModel");
const reviewModel = require("../models/reviewModel");

const UPLOADS_DIR = path.join(__dirname, "..", "..", "storage", "uploads");

function removeUploadedFile(filePath) {
  if (!filePath) return;
  // fileController.downloadSubmissionFile ile ayni kural: sadece dosya adi
  // kullanilir, path traversal'a izin verilmez.
  const absolutePath = path.join(UPLOADS_DIR, path.basename(filePath));
  fs.unlink(absolutePath, () => {
    // Dosya zaten yoksa (ya da silinemezse) sessizce gec: makale kaydinin
    // silinmesi, diskteki dosyanin varligina bagli olmamalidir.
  });
}

async function cascadeDeleteSubmission(submission) {
  await reviewModel.deleteBySubmissionId(submission.id);
  await reviewAssignmentModel.deleteBySubmissionId(submission.id);
  await submissionModel.deleteById(submission.id);
  removeUploadedFile(submission.file_path);
}

module.exports = { cascadeDeleteSubmission, removeUploadedFile };
