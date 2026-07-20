const express = require("express");
const superadminController = require("../controllers/superadminController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireSuperadmin } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Superadmin'in kendi login sayfasi yoktur; bu yetki mevcut bir hesabin
// (su an icin editor) uzerine bayrak olarak eklenir - bkz. scripts/setup-admin.js.
router.get(
  "/dashboard",
  requireAuth,
  requireSuperadmin(),
  asyncHandler(superadminController.showDashboard)
);
router.post(
  "/users/:id/delete",
  requireAuth,
  requireSuperadmin(),
  asyncHandler(superadminController.deleteUser)
);
router.post(
  "/submissions/:id/delete",
  requireAuth,
  requireSuperadmin(),
  asyncHandler(superadminController.deleteSubmission)
);
router.post(
  "/users/:id/approve",
  requireAuth,
  requireSuperadmin(),
  asyncHandler(superadminController.approveUser)
);
router.post(
  "/users/:id/reject",
  requireAuth,
  requireSuperadmin(),
  asyncHandler(superadminController.rejectUser)
);
router.get(
  "/users",
  requireAuth,
  requireSuperadmin(),
  asyncHandler(superadminController.showUserManagement)
);
router.post(
  "/users/:id/roles",
  requireAuth,
  requireSuperadmin(),
  asyncHandler(superadminController.updateUserRoles)
);

module.exports = router;
