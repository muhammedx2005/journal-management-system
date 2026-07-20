const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const reviewAssignmentModel = require("../models/reviewAssignmentModel");
const reviewModel = require("../models/reviewModel");
const { STATUS_LABELS } = require("../constants/submissionStatus");
const { STATUS: APPROVAL_STATUS } = require("../constants/userApprovalStatus");
const { RECOMMENDATION, RECOMMENDATION_LABELS } = require("../constants/reviewRecommendation");
const ROLES = require("../constants/roles");

const SALT_ROUNDS = 10;

function showLoginPage(req, res) {
  res.render("reviewer/login", { pageTitle: "Hakem Girişi", errorMessage: null });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findByEmail(email);
  const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));

  if (!passwordMatches || !user.is_reviewer) {
    return res.status(401).render("reviewer/login", {
      pageTitle: "Hakem Girişi",
      errorMessage: "E-posta veya şifre hatalı.",
    });
  }

  if (user.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(403).render("reviewer/login", {
      pageTitle: "Hakem Girişi",
      errorMessage: "Hesabınız Süper Admin onayı bekliyor.",
    });
  }

  req.session.user = {
    id: user.id,
    name: `${user.name} ${user.surname}`,
    email: user.email,
    role: ROLES.REVIEWER,
    roles: userModel.rolesForUser(user),
    isSuperadmin: Boolean(user.is_superadmin),
  };

  res.redirect("/reviewer/dashboard");
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/reviewer/login");
  });
}

function showSignupPage(req, res) {
  res.render("reviewer/signup", { pageTitle: "Hakem Kaydı", errorMessage: null });
}

async function signup(req, res) {
  const { name, surname, email, password, institution, orcidNo, phone } = req.body;

  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    // Coklu rol: bkz. authorController.signup - ayni desen (sifre dogrulanir,
    // dogruysa yeni satir yerine mevcut hesaba "reviewer" bayragi eklenir).
    const passwordMatches = await bcrypt.compare(password, existingUser.password_hash);
    if (!passwordMatches || existingUser.is_reviewer) {
      return res.status(409).render("reviewer/signup", {
        pageTitle: "Hakem Kaydı",
        errorMessage: "Bu e-posta adresi zaten kayıtlı.",
      });
    }

    await userModel.addRoleToUser({ id: existingUser.id, role: "reviewer" });
    return res.redirect("/reviewer/login");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await userModel.createReviewer({ name, surname, email, passwordHash, institution, orcidNo, phone });

  res.redirect("/reviewer/login");
}

async function showDashboard(req, res) {
  const assignments = await reviewAssignmentModel.findByReviewerId(req.session.user.id);
  const totalAssigned = assignments.length;
  const totalCompleted = assignments.filter((assignment) => assignment.review_id).length;

  const pendingAssignments = assignments
    .filter((assignment) => !assignment.review_id)
    .slice(0, 5)
    .map((assignment) => ({
      ...assignment,
      statusLabel: STATUS_LABELS[assignment.status],
    }));

  res.render("reviewer/dashboard", {
    pageTitle: "Hakem Paneli",
    totalAssigned,
    totalCompleted,
    totalPending: totalAssigned - totalCompleted,
    pendingAssignments,
  });
}

async function showAssignments(req, res) {
  const assignments = await reviewAssignmentModel.findByReviewerId(req.session.user.id);

  const assignmentsWithLabels = assignments.map((assignment) => ({
    ...assignment,
    statusLabel: STATUS_LABELS[assignment.status],
    isCompleted: Boolean(assignment.review_id),
  }));

  res.render("reviewer/assignments", {
    pageTitle: "Bana Atanan Makaleler",
    assignments: assignmentsWithLabels,
  });
}

async function showAssignmentDetail(req, res) {
  const assignmentId = Number(req.params.id);
  if (!Number.isInteger(assignmentId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const assignment = await reviewAssignmentModel.findByIdForReviewer(assignmentId, req.session.user.id);
  if (!assignment) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const existingReview = await reviewModel.findByAssignmentId(assignmentId);

  res.render("reviewer/assignment-detail", {
    pageTitle: assignment.title,
    assignment,
    existingReview,
    recommendationLabels: RECOMMENDATION_LABELS,
    errorMessage: null,
  });
}

async function submitReview(req, res) {
  const assignmentId = Number(req.params.id);
  if (!Number.isInteger(assignmentId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const assignment = await reviewAssignmentModel.findByIdForReviewer(assignmentId, req.session.user.id);
  if (!assignment) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const existingReview = await reviewModel.findByAssignmentId(assignmentId);
  if (existingReview) {
    return res.redirect(`/reviewer/assignments/${assignmentId}`);
  }

  const { recommendation, commentsForEditor, commentsForAuthor } = req.body;
  const isValidRecommendation = Object.values(RECOMMENDATION).includes(recommendation);

  if (!isValidRecommendation || !commentsForEditor || !commentsForAuthor) {
    return res.status(400).render("reviewer/assignment-detail", {
      pageTitle: assignment.title,
      assignment,
      existingReview: null,
      recommendationLabels: RECOMMENDATION_LABELS,
      errorMessage: "Lütfen tüm alanları eksiksiz ve geçerli bir tavsiye kararıyla doldurun.",
    });
  }

  await reviewModel.createReview({
    assignmentId,
    recommendation,
    commentsForEditor,
    commentsForAuthor,
  });

  res.redirect(`/reviewer/assignments/${assignmentId}`);
}

module.exports = {
  showLoginPage,
  login,
  logout,
  showSignupPage,
  signup,
  showDashboard,
  showAssignments,
  showAssignmentDetail,
  submitReview,
};
