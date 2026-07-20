const express = require("express");
const profileController = require("../controllers/profileController");
const { requireAuth } = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Rol farketmeksizin giris yapmis her kullanici kendi profilini yonetebilir.
router.get("/", requireAuth, asyncHandler(profileController.showProfile));
router.post("/", requireAuth, asyncHandler(profileController.updateProfile));
router.post("/password", requireAuth, asyncHandler(profileController.updatePassword));

module.exports = router;
