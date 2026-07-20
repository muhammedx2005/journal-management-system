const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const submissionModel = require("../models/submissionModel");
const reviewAssignmentModel = require("../models/reviewAssignmentModel");
const mailService = require("../services/mailService");
const { cascadeDeleteSubmission } = require("../services/submissionCleanupService");
const { STATUS, STATUS_LABELS } = require("../constants/submissionStatus");
const { STATUS: APPROVAL_STATUS } = require("../constants/userApprovalStatus");
const { RECOMMENDATION_LABELS } = require("../constants/reviewRecommendation");
const { activeJournal } = require("../../config/journal.config");
const ROLES = require("../constants/roles");

// Editorun nihai karar olarak secebilecegi durumlar. "submitted" ve "under_review"
// akisin dogal asamalaridir, editor tarafindan elle secilmez; "published" ayri
// bir "Yayina Al" aksiyonuyla, sadece "accepted" makaleler icin yapilir.
const DECIDABLE_STATUSES = [STATUS.REVISION_REQUIRED, STATUS.ACCEPTED, STATUS.REJECTED];

function showLoginPage(req, res) {
  res.render("editor/login", { pageTitle: "Editör Girişi", errorMessage: null });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findByEmail(email);
  const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));

  if (!passwordMatches || !user.is_editor || user.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(401).render("editor/login", {
      pageTitle: "Editör Girişi",
      errorMessage: "E-posta veya şifre hatalı.",
    });
  }

  req.session.user = {
    id: user.id,
    name: `${user.name} ${user.surname}`,
    email: user.email,
    role: ROLES.EDITOR,
    roles: userModel.rolesForUser(user),
    isSuperadmin: Boolean(user.is_superadmin),
  };

  res.redirect("/editor/dashboard");
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/editor/login");
  });
}

async function showDashboard(req, res) {
  const [counts, submissions] = await Promise.all([
    submissionModel.countsByStatus(),
    submissionModel.findAllWithAuthor(),
  ]);
  const totalSubmissions = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const pendingSubmissions = submissions
    .filter((submission) => submission.status === STATUS.SUBMITTED || submission.status === STATUS.UNDER_REVIEW)
    .slice(0, 5)
    .map((submission) => ({
      ...submission,
      statusLabel: STATUS_LABELS[submission.status],
    }));

  res.render("editor/dashboard", {
    pageTitle: "Editör Paneli",
    counts,
    totalSubmissions,
    pendingSubmissions,
  });
}

async function showSubmissionsPage(req, res) {
  const [submissions, assignmentRows] = await Promise.all([
    submissionModel.findAllWithAuthor(),
    reviewAssignmentModel.findAllWithReviewerNames(),
  ]);

  const reviewersBySubmission = {};
  assignmentRows.forEach((row) => {
    if (!reviewersBySubmission[row.submission_id]) {
      reviewersBySubmission[row.submission_id] = [];
    }
    reviewersBySubmission[row.submission_id].push(row);
  });

  const submissionsWithDetails = submissions.map((submission) => ({
    ...submission,
    statusLabel: STATUS_LABELS[submission.status],
    assignedReviewers: reviewersBySubmission[submission.id] || [],
  }));

  res.render("editor/submissions", {
    pageTitle: "Makaleler",
    submissions: submissionsWithDetails,
    errorMessage: req.query.error === "delete-failed" ? "Makale silinirken bir hata oluştu." : null,
  });
}

async function showSubmissionDetail(req, res) {
  const submissionId = Number(req.params.id);
  if (!Number.isInteger(submissionId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const submission = await submissionModel.findByIdWithAuthor(submissionId);
  if (!submission) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const [assignments, allReviewers] = await Promise.all([
    reviewAssignmentModel.findAssignmentsWithReviewsForSubmission(submissionId),
    userModel.findAllReviewers(),
  ]);

  const assignedReviewerIds = new Set(assignments.map((assignment) => assignment.reviewer_id));
  const availableReviewers = allReviewers.filter((reviewer) => !assignedReviewerIds.has(reviewer.id));

  res.render("editor/submission-detail", {
    pageTitle: submission.title,
    submission: { ...submission, statusLabel: STATUS_LABELS[submission.status] },
    assignments,
    availableReviewers,
    recommendationLabels: RECOMMENDATION_LABELS,
    decidableStatuses: DECIDABLE_STATUSES,
    statusLabels: STATUS_LABELS,
    reviewsComplete: reviewsAreComplete(assignments),
    errorMessage: null,
  });
}

// Akademik surecin dogru sirasi: yazar gonderir -> editor en az bir hakeme
// atar -> atanan TUM hakemler degerlendirmesini bildirir -> ancak o zaman
// editor nihai karari verebilir. Hic hakem atanmamissa (assignments bos) ya da
// atananlardan biri bile henuz degerlendirme girmemisse (review_id null),
// makale "editorun onune" dusmus sayilmaz.
function reviewsAreComplete(assignments) {
  return assignments.length > 0 && assignments.every((assignment) => Boolean(assignment.review_id));
}

async function assignReviewer(req, res) {
  const submissionId = Number(req.params.id);
  const reviewerId = Number(req.body.reviewerId);

  if (!Number.isInteger(submissionId) || !Number.isInteger(reviewerId)) {
    return res.redirect(`/editor/submissions/${req.params.id}`);
  }

  const alreadyAssigned = await reviewAssignmentModel.existsForSubmissionAndReviewer(submissionId, reviewerId);
  if (!alreadyAssigned) {
    await reviewAssignmentModel.assignReviewer({ submissionId, reviewerId });

    const submission = await submissionModel.findById(submissionId);
    if (submission && submission.status === STATUS.SUBMITTED) {
      await submissionModel.updateStatus(submissionId, STATUS.UNDER_REVIEW);
    }
  }

  res.redirect(`/editor/submissions/${submissionId}`);
}

async function decideSubmission(req, res) {
  const submissionId = Number(req.params.id);
  if (!Number.isInteger(submissionId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const submission = await submissionModel.findByIdWithAuthor(submissionId);
  if (!submission) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const { status, message } = req.body;
  const assignments = await reviewAssignmentModel.findAssignmentsWithReviewsForSubmission(submissionId);
  const reviewsComplete = reviewsAreComplete(assignments);

  // Sira kontrolu: hakem degerlendirmesi tamamlanmadan editor karar veremez -
  // bu kural sadece UI'da form gizlenerek degil, burada (route seviyesinde)
  // uygulanir, aksi halde /decision'a dogrudan POST atilarak atlanabilirdi.
  if (!reviewsComplete || !DECIDABLE_STATUSES.includes(status) || !message) {
    const allReviewers = await userModel.findAllReviewers();
    const assignedReviewerIds = new Set(assignments.map((assignment) => assignment.reviewer_id));

    let errorMessage = "Lütfen geçerli bir karar seçin ve yazara iletilecek notu yazın.";
    if (assignments.length === 0) {
      errorMessage = "Karar verebilmek için önce en az bir hakem atamalısınız.";
    } else if (!reviewsComplete) {
      errorMessage = "Tüm hakem değerlendirmeleri tamamlanmadan editöryal karar verilemez.";
    }

    return res.status(400).render("editor/submission-detail", {
      pageTitle: submission.title,
      submission: { ...submission, statusLabel: STATUS_LABELS[submission.status] },
      assignments,
      availableReviewers: allReviewers.filter((reviewer) => !assignedReviewerIds.has(reviewer.id)),
      recommendationLabels: RECOMMENDATION_LABELS,
      decidableStatuses: DECIDABLE_STATUSES,
      statusLabels: STATUS_LABELS,
      reviewsComplete,
      errorMessage,
    });
  }

  await submissionModel.updateStatus(submissionId, status);

  const reviewerComments = assignments
    .filter((assignment) => assignment.review_id)
    .map((assignment) => assignment.comments_for_author);

  // Mail gonderimi basarisiz olsa bile (orn. SMTP yapilandirilmamis dev ortami)
  // editorun verdigi karar veritabanina islenmis olmali - mail sadece bildirimdir.
  try {
    await mailService.sendDecisionMail(activeJournal, submission.author_email, {
      authorName: `${submission.author_name} ${submission.author_surname}`,
      paperCode: submission.paper_code,
      paperTitle: submission.title,
      statusLabel: STATUS_LABELS[status],
      message,
      reviewerComments,
    });
  } catch (err) {
    console.error("Karar maili gonderilemedi:", err.message);
  }

  res.redirect(`/editor/submissions/${submissionId}`);
}

async function publishSubmission(req, res) {
  const submissionId = Number(req.params.id);
  if (!Number.isInteger(submissionId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const submission = await submissionModel.findByIdWithAuthor(submissionId);
  if (!submission || submission.status !== STATUS.ACCEPTED) {
    return res.redirect(`/editor/submissions/${submissionId}`);
  }

  await submissionModel.updateStatus(submissionId, STATUS.PUBLISHED);

  try {
    await mailService.sendDecisionMail(activeJournal, submission.author_email, {
      authorName: `${submission.author_name} ${submission.author_surname}`,
      paperCode: submission.paper_code,
      paperTitle: submission.title,
      statusLabel: STATUS_LABELS[STATUS.PUBLISHED],
    });
  } catch (err) {
    console.error("Yayin bildirim maili gonderilemedi:", err.message);
  }

  res.redirect(`/editor/submissions/${submissionId}`);
}

// "Makaleyi Sil" - editor panelinden test/gereksiz kayitlarin temizlenmesi
// icin. Cascade silme superadminController ile ayni paylasilan servisi
// kullanir (reviews -> review_assignments -> submissions -> dosya). Beklenmedik
// bir DB hatasinda sureci cokertmemek icin try/catch ile sarilir - asyncHandler
// zaten bunu Express'in hata middleware'ine yonlendirirdi, ama burada kullaniciya
// makale listesine donup anlamli bir hata gostermek daha iyi bir deneyim.
async function deleteSubmission(req, res) {
  const submissionId = Number(req.params.id);
  if (!Number.isInteger(submissionId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const submission = await submissionModel.findById(submissionId);
  if (!submission) {
    return res.redirect("/editor/submissions");
  }

  try {
    await cascadeDeleteSubmission(submission);
  } catch (err) {
    console.error("Makale silinemedi:", err.message);
    return res.redirect("/editor/submissions?error=delete-failed");
  }

  res.redirect("/editor/submissions");
}

module.exports = {
  showLoginPage,
  login,
  logout,
  showDashboard,
  showSubmissionsPage,
  showSubmissionDetail,
  assignReviewer,
  decideSubmission,
  publishSubmission,
  deleteSubmission,
};
