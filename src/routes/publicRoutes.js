const express = require("express");
const publicController = require("../controllers/publicController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Herkese acik, oturum gerektirmeyen sayfalar.
router.get("/", asyncHandler(publicController.showHome));
router.get("/about", asyncHandler(publicController.showAbout));
router.get("/articles", asyncHandler(publicController.showArchive));
router.get("/articles/:id", asyncHandler(publicController.showArticleDetail));
router.get("/author-guidelines", asyncHandler(publicController.showAuthorGuidelines));
router.get("/indexing", asyncHandler(publicController.showIndexing));
router.get("/contact", asyncHandler(publicController.showContact));

module.exports = router;
