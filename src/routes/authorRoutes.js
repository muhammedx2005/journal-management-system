const express = require("express");
const authorController = require("../controllers/authorController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const { uploadPaperFile } = require("../middlewares/uploadMiddleware");
const ROLES = require("../constants/roles");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Herkese acik sayfalar
router.get("/login", authorController.showLoginPage);
router.post("/login", asyncHandler(authorController.login));
router.post("/logout", authorController.logout);
router.get("/signup", authorController.showSignupPage);
router.post("/signup", asyncHandler(authorController.signup));

// Sadece giris yapmis + rolu "author" olan kullanicilar
router.get(
  "/dashboard",
  requireAuth,
  requireRole(ROLES.AUTHOR),
  asyncHandler(authorController.showDashboard)
);
router.get(
  "/papers/new",
  requireAuth,
  requireRole(ROLES.AUTHOR),
  authorController.showSubmitPaperPage
);
router.post(
  "/papers",
  requireAuth,
  requireRole(ROLES.AUTHOR),
  uploadPaperFile.single("paperFile"),
  asyncHandler(authorController.submitPaper)
);
router.get(
  "/papers",
  requireAuth,
  requireRole(ROLES.AUTHOR),
  asyncHandler(authorController.showMyPapers)
);

module.exports = router;
