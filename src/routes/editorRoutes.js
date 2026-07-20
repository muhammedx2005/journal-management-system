const express = require("express");
const editorController = require("../controllers/editorController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const ROLES = require("../constants/roles");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Editor hesabinin self-signup sayfasi yoktur, sadece scripts/create-editor.js ile olusturulur.
router.get("/login", editorController.showLoginPage);
router.post("/login", asyncHandler(editorController.login));
router.post("/logout", editorController.logout);

// Sadece giris yapmis + rolu "editor" olan kullanicilar
router.get(
  "/dashboard",
  requireAuth,
  requireRole(ROLES.EDITOR),
  asyncHandler(editorController.showDashboard)
);
router.get(
  "/submissions",
  requireAuth,
  requireRole(ROLES.EDITOR),
  asyncHandler(editorController.showSubmissionsPage)
);
router.get(
  "/submissions/:id",
  requireAuth,
  requireRole(ROLES.EDITOR),
  asyncHandler(editorController.showSubmissionDetail)
);
router.post(
  "/submissions/:id/assign",
  requireAuth,
  requireRole(ROLES.EDITOR),
  asyncHandler(editorController.assignReviewer)
);
router.post(
  "/submissions/:id/decision",
  requireAuth,
  requireRole(ROLES.EDITOR),
  asyncHandler(editorController.decideSubmission)
);
router.post(
  "/submissions/:id/publish",
  requireAuth,
  requireRole(ROLES.EDITOR),
  asyncHandler(editorController.publishSubmission)
);
router.post(
  "/submissions/:id/delete",
  requireAuth,
  requireRole(ROLES.EDITOR),
  asyncHandler(editorController.deleteSubmission)
);

module.exports = router;
