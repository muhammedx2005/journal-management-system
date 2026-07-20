const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const submissionModel = require("../models/submissionModel");
const mailService = require("../services/mailService");
const { STATUS_LABELS } = require("../constants/submissionStatus");
const { STATUS: APPROVAL_STATUS } = require("../constants/userApprovalStatus");
const { activeJournal } = require("../../config/journal.config");
const ROLES = require("../constants/roles");

const SALT_ROUNDS = 10;

function showLoginPage(req, res) {
  res.render("author/login", { pageTitle: "Giriş Yap", errorMessage: null });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findByEmail(email);
  const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));

  // Coklu rol: bu hesabin "author" bayragi acik olmali - role kolonu artik
  // bunun icin bakilmiyor (bkz. db/schema.sql, userModel.rolesForUser).
  if (!passwordMatches || !user.is_author) {
    return res.status(401).render("author/login", {
      pageTitle: "Giriş Yap",
      errorMessage: "E-posta veya şifre hatalı.",
    });
  }

  if (user.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(403).render("author/login", {
      pageTitle: "Giriş Yap",
      errorMessage: "Hesabınız Süper Admin onayı bekliyor.",
    });
  }

  // "role" burada DAIMA bu oturumun portalidir (author), hesabin DB'deki
  // orijinal kayit rolu DEGIL - coklu rollu bir hesap baska bir portaldan
  // (orn. reviewer) kayit olmus olabilir ama yine de author paneline girer.
  req.session.user = {
    id: user.id,
    name: `${user.name} ${user.surname}`,
    email: user.email,
    role: ROLES.AUTHOR,
    roles: userModel.rolesForUser(user),
    isSuperadmin: Boolean(user.is_superadmin),
  };

  res.redirect("/author/dashboard");
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/author/login");
  });
}

function showSignupPage(req, res) {
  res.render("author/signup", { pageTitle: "Kayıt Ol", errorMessage: null });
}

async function signup(req, res) {
  const { name, surname, email, password, institution, orcidNo, phone } = req.body;

  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    // Coklu rol: ayni e-posta + DOGRU sifre ile baska bir portaldan gelen
    // kayit, yeni bir hesap acmak yerine mevcut hesabin uzerine "author"
    // bayragini ekler. Sifre yanlissa (ya da hesap zaten author ise) ayni
    // jenerik hata donulur - boylece baskasinin hesabina, sifresini bilmeden,
    // sadece e-postasini bilerek rol eklenemez.
    const passwordMatches = await bcrypt.compare(password, existingUser.password_hash);
    if (!passwordMatches || existingUser.is_author) {
      return res.status(409).render("author/signup", {
        pageTitle: "Kayıt Ol",
        errorMessage: "Bu e-posta adresi zaten kayıtlı.",
      });
    }

    await userModel.addRoleToUser({ id: existingUser.id, role: "author" });
    return res.redirect("/author/login");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await userModel.createAuthor({ name, surname, email, passwordHash, institution, orcidNo, phone });

  res.redirect("/author/login");
}

async function showDashboard(req, res) {
  const [totalSubmissions, submissions] = await Promise.all([
    submissionModel.countByAuthorId(req.session.user.id),
    submissionModel.findByAuthorId(req.session.user.id),
  ]);

  const recentSubmissions = submissions.slice(0, 5).map((submission) => ({
    ...submission,
    statusLabel: STATUS_LABELS[submission.status],
  }));

  res.render("author/dashboard", {
    pageTitle: "Yazar Paneli",
    totalSubmissions,
    recentSubmissions,
  });
}

function showSubmitPaperPage(req, res) {
  res.render("author/submit-paper", { pageTitle: "Yeni Makale Yükle", errorMessage: null });
}

async function submitPaper(req, res) {
  if (!req.file) {
    return res.status(400).render("author/submit-paper", {
      pageTitle: "Yeni Makale Yükle",
      errorMessage: "Lütfen bir makale dosyası seçin.",
    });
  }

  const { title, abstract, keywords } = req.body;
  const paperCode = `${activeJournal.paperIdPrefix}-${Date.now()}`;
  // Dogrudan URL degil, storage/uploads icindeki dosya adi tutulur - indirme
  // /files/:id uzerinden yetki kontrolunden gecerek yapilir (fileController.js).
  const filePath = req.file.filename;

  const submission = await submissionModel.createSubmission({
    paperCode,
    authorId: req.session.user.id,
    title,
    abstract,
    keywords,
    filePath,
  });

  // Makale zaten veritabanina kaydedildi (yukarida) - mail gonderimi sadece
  // bir bildirimdir, basarisiz olsa bile (orn. .env'deki SMTP_HOST gercek bir
  // sunucu degilse ENOTFOUND/EDNS hatasi alinir) yazarin makalesi kaybolmamali
  // ve "Sunucu hatası oluştu" ekranina dusmemeli. Ayni desen icin bkz.
  // editorController.decideSubmission / publishSubmission.
  try {
    await mailService.sendSubmissionReceivedMail(activeJournal, req.session.user.email, {
      authorName: req.session.user.name,
      paperCode: submission.paper_code,
      paperTitle: submission.title,
    });
  } catch (err) {
    console.error("Makale alindi maili gonderilemedi:", err.message);
  }

  res.redirect("/author/papers");
}

async function showMyPapers(req, res) {
  const submissions = await submissionModel.findByAuthorId(req.session.user.id);

  const submissionsWithLabels = submissions.map((submission) => ({
    ...submission,
    statusLabel: STATUS_LABELS[submission.status],
  }));

  res.render("author/my-papers", {
    pageTitle: "Makalelerim",
    submissions: submissionsWithLabels,
  });
}

module.exports = {
  showLoginPage,
  login,
  logout,
  showSignupPage,
  signup,
  showDashboard,
  showSubmitPaperPage,
  submitPaper,
  showMyPapers,
};
