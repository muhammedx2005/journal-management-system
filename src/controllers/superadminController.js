// Superadmin paneli: sistemdeki tum kullanicilari ve makaleleri listeler,
// kalici silme (cascade delete) yapar. Bu yetki ayri bir "role" degil,
// mevcut hesabin uzerine eklenen bir bayraktir (bkz. roleMiddleware.requireSuperadmin).
const userModel = require("../models/userModel");
const submissionModel = require("../models/submissionModel");
const reviewAssignmentModel = require("../models/reviewAssignmentModel");
const reviewModel = require("../models/reviewModel");
const { cascadeDeleteSubmission } = require("../services/submissionCleanupService");
const { STATUS_LABELS } = require("../constants/submissionStatus");
const { STATUS_LABELS: USER_STATUS_LABELS } = require("../constants/userApprovalStatus");
const ROLES = require("../constants/roles");

async function showDashboard(req, res) {
  const [users, rawSubmissions, pendingUsers] = await Promise.all([
    userModel.findAll(),
    submissionModel.findAllWithAuthor(),
    userModel.findAllPending(),
  ]);

  const submissions = rawSubmissions.map((submission) => ({
    ...submission,
    statusLabel: STATUS_LABELS[submission.status],
  }));

  // Coklu rol: "Onay Bekleyenler"/"Kullanıcılar" tablolarindaki tekil role
  // kolonu artik hesabin TUM yetkilerini yansitmiyor - bkz. userModel.rolesForUser.
  const usersWithRoleBadges = users.map((u) => ({
    ...u,
    roleBadges: userModel.rolesForUser(u),
  }));
  const pendingUsersWithRoleBadges = pendingUsers.map((u) => ({
    ...u,
    roleBadges: userModel.rolesForUser(u),
  }));

  res.render("superadmin/dashboard", {
    pageTitle: "Süper Admin Paneli",
    users: usersWithRoleBadges,
    submissions,
    pendingUsers: pendingUsersWithRoleBadges,
    userStatusLabels: USER_STATUS_LABELS,
    roleLabels: ROLES.LABELS,
    errorMessage: req.query.error === "self-delete" ? "Kendi hesabınızı silemezsiniz." : null,
  });
}

// Superadmin paneli - "Kullanıcı Yönetimi" sekmesi: her kullanicinin
// Yazar/Hakem/Editor rollerini checkbox ile acip kapatabilecegi sayfa.
async function showUserManagement(req, res) {
  const users = await userModel.findAll();

  res.render("superadmin/users", {
    pageTitle: "Kullanıcı Yönetimi",
    users,
    roleLabels: ROLES.LABELS,
  });
}

async function updateUserRoles(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  // Isaretlenmemis checkbox'lar formda hic gonderilmez, bu yuzden yokluk = false.
  await userModel.setUserRoles({
    id: userId,
    isAuthor: Boolean(req.body.isAuthor),
    isReviewer: Boolean(req.body.isReviewer),
    isEditor: Boolean(req.body.isEditor),
  });

  res.redirect("/superadmin/users");
}

async function approveUser(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  await userModel.approveUser(userId);

  res.redirect("/superadmin/dashboard");
}

async function rejectUser(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  // Henuz onaylanmamis bir hesabin makalesi/hakem atamasi olamaz, bu yuzden
  // deleteUser'daki gibi cascade delete'e gerek yoktur.
  await userModel.deleteById(userId);

  res.redirect("/superadmin/dashboard");
}

async function deleteSubmission(req, res) {
  const submissionId = Number(req.params.id);
  if (!Number.isInteger(submissionId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const submission = await submissionModel.findById(submissionId);
  if (submission) {
    await cascadeDeleteSubmission(submission);
  }

  res.redirect("/superadmin/dashboard");
}

async function deleteUser(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  // Kendi hesabini silip sistem disinda kalmayi (lockout) engelle.
  if (req.session.user && req.session.user.id === userId) {
    return res.redirect("/superadmin/dashboard?error=self-delete");
  }

  const targetUser = await userModel.findById(userId);
  if (targetUser) {
    // Coklu rol: bir hesap ayni anda hem yazar HEM hakem olabilir, bu yuzden
    // ikisi de BAGIMSIZ kontrol edilir (eskiden tekil role kolonuyle sadece
    // biri calisirdi - digeri atlanirsa FK hatasi alinirdi).
    if (targetUser.is_author) {
      // Yazarin tum makaleleri de (ve onlara bagli hakem atamalari/degerlendirmeleri)
      // cascade olarak silinir - aksi halde submissions.author_id FK hatasi alinir.
      const authoredSubmissions = await submissionModel.findByAuthorId(userId);
      for (const submission of authoredSubmissions) {
        await cascadeDeleteSubmission(submission);
      }
    }

    if (targetUser.is_reviewer) {
      await reviewModel.deleteByReviewerId(userId);
      await reviewAssignmentModel.deleteByReviewerId(userId);
    }

    await userModel.deleteById(userId);
  }

  res.redirect("/superadmin/dashboard");
}

module.exports = {
  showDashboard,
  deleteSubmission,
  deleteUser,
  approveUser,
  rejectUser,
  showUserManagement,
  updateUserRoles,
};
