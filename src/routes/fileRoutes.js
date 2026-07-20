const express = require("express");
const fileController = require("../controllers/fileController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Yetki kontrolu route seviyesinde degil, controller icinde yapilir: makale
// "published" ise oturumsuz erisim de gecerlidir (bkz. fileController.js).
router.get("/:id", asyncHandler(fileController.downloadSubmissionFile));

module.exports = router;
