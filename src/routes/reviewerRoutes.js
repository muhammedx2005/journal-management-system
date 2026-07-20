const express = require("express");
const reviewerController = require("../controllers/reviewerController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const ROLES = require("../constants/roles");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Herkese acik sayfalar
router.get("/login", reviewerController.showLoginPage);
router.post("/login", asyncHandler(reviewerController.login));
router.post("/logout", reviewerController.logout);
router.get("/signup", reviewerController.showSignupPage);
router.post("/signup", asyncHandler(reviewerController.signup));

// Sadece giris yapmis + rolu "reviewer" olan kullanicilar
router.get(
  "/dashboard",
  requireAuth,
  requireRole(ROLES.REVIEWER),
  asyncHandler(reviewerController.showDashboard)
);
router.get(
  "/assignments",
  requireAuth,
  requireRole(ROLES.REVIEWER),
  asyncHandler(reviewerController.showAssignments)
);
router.get(
  "/assignments/:id",
  requireAuth,
  requireRole(ROLES.REVIEWER),
  asyncHandler(reviewerController.showAssignmentDetail)
);
router.post(
  "/assignments/:id/review",
  requireAuth,
  requireRole(ROLES.REVIEWER),
  asyncHandler(reviewerController.submitReview)
);

module.exports = router;
