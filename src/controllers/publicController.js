// Herkese acik (oturumsuz) sayfalar: ana sayfa, yayinlanan makaleler arsivi ve
// makale detayi. Sadece status = 'published' olan makaleler burada gorunur.
const submissionModel = require("../models/submissionModel");

async function showHome(req, res) {
  const publishedArticles = await submissionModel.findPublished();

  res.render("public/home", {
    pageTitle: "Ana Sayfa",
    latestArticles: publishedArticles.slice(0, 5),
  });
}

async function showArchive(req, res) {
  const articles = await submissionModel.findPublished();

  res.render("public/archive", {
    pageTitle: "Yayınlanan Makaleler",
    articles,
  });
}

async function showArticleDetail(req, res) {
  const articleId = Number(req.params.id);
  if (!Number.isInteger(articleId)) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  const article = await submissionModel.findPublishedById(articleId);
  if (!article) {
    return res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  }

  res.render("public/article-detail", {
    pageTitle: article.title,
    article,
  });
}

function showAbout(req, res) {
  res.render("public/about", { pageTitle: "Hakkımızda" });
}

function showAuthorGuidelines(req, res) {
  res.render("public/author-guidelines", { pageTitle: "Yazarlara Rehber" });
}

function showIndexing(req, res) {
  res.render("public/indexing", { pageTitle: "İndeksler" });
}

function showContact(req, res) {
  res.render("public/contact", { pageTitle: "İletişim" });
}

module.exports = {
  showHome,
  showArchive,
  showArticleDetail,
  showAbout,
  showAuthorGuidelines,
  showIndexing,
  showContact,
};
