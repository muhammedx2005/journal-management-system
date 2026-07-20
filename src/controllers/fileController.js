// Makale dosyalarina TEK erisim noktasi. storage/uploads public/ disinda oldugu
// icin dogrudan URL ile erisilemez; her indirme burada asagidaki kurala gore
// yetkilendirilir:
//   - Makale "published" ise herkes indirebilir (Faz 4'teki herkese acik arsiv icin).
//   - Aksi halde sadece: makalenin yazari, o makaleye atanmis bir hakem, veya
//     herhangi bir editor indirebilir. Digerlerine 403 doner.
const path = require("path");
const submissionModel = require("../models/submissionModel");
const reviewAssignmentModel = require("../models/reviewAssignmentModel");
const { STATUS } = require("../constants/submissionStatus");
const ROLES = require("../constants/roles");
const { uploadsDir } = require("../../config/storage");

async function canAccessSubmissionFile(sessionUser, submission) {
  if (submission.status === STATUS.PUBLISHED) {
    return true;
  }

  if (!sessionUser) {
    return false;
  }

  if (sessionUser.role === ROLES.EDITOR) {
    return true;
  }

  if (sessionUser.role === ROLES.AUTHOR) {
    return submission.author_id === sessionUser.id;
  }

  if (sessionUser.role === ROLES.REVIEWER) {
    return reviewAssignmentModel.existsForSubmissionAndReviewer(submission.id, sessionUser.id);
  }

  return false;
}

async function downloadSubmissionFile(req, res) {
  const submissionId = Number(req.params.id);
  if (!Number.isInteger(submissionId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const submission = await submissionModel.findById(submissionId);
  if (!submission) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const hasAccess = await canAccessSubmissionFile(req.session.user, submission);
  if (!hasAccess) {
    return res.status(403).render("errors/403", { pageTitle: "Erişim Reddedildi" });
  }

  // path.basename ile sadece dosya adi alinir - hem eski "/uploads/xxx" formatli
  // hem yeni sadece-dosya-adi formatli kayitlarla calisir, ayrica gelen deger her
  // ihtimalde dizin gezintisine (path traversal) izin vermeyecek sekilde temizlenir.
  const filename = path.basename(submission.file_path);
  const absolutePath = path.join(uploadsDir, filename);

  res.download(absolutePath, filename, (err) => {
    if (err && !res.headersSent) {
      res.status(404).render("errors/404", { pageTitle: "Dosya Bulunamadı" });
    }
  });
}

module.exports = { downloadSubmissionFile };
