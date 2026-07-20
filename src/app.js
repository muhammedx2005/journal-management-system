const path = require("path");
const express = require("express");
const session = require("express-session");
const { attachJournalToViews } = require("../config/journal.config");
const publicRoutes = require("./routes/publicRoutes");
const authorRoutes = require("./routes/authorRoutes");
const reviewerRoutes = require("./routes/reviewerRoutes");
const editorRoutes = require("./routes/editorRoutes");
const fileRoutes = require("./routes/fileRoutes");
const superadminRoutes = require("./routes/superadminRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

// Render (ve genel olarak PaaS saglayicilari) istekleri bir reverse proxy
// arkasindan iletir; bu ayar olmadan req.secure/req.ip yanlis okunur ve
// ileride secure cookie / rate-limit gibi ozellikler eklenirse hatali calisir.
app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Render free tier uyku modundan uyanirken (cold start) veya deploy sirasinda
// platformun "servis ayakta mi" kontrolu icin: DB/journal config gibi hicbir
// baglantiya ihtiyac duymadan hemen 200 doner. Route listesinin EN BASINDA
// olmasi onemli - session/journal middleware'lerinden once, hicbir sey onu
// yavaslatmasin ya da hataya dusurmesin diye.
app.get("/healthz", (req, res) => {
  res.status(200).type("text/plain").send("ok");
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// maxAge: statik dosyalar (css/js) tarayicida cache'lenir - cold start sonrasi
// tekrar ziyaretlerde "sayfa eksik/yaric yuklendi" hissini azaltir. etag acik
// kalir ki dosya degisince (yeni deploy) tarayici eski surumde takili kalmasin.
app.use(
  express.static(path.join(__dirname, "..", "public"), {
    maxAge: "1d",
    etag: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 4 }, // 4 saat
  })
);

// Aktif dergi bilgisini tum view'larda kullanilabilir yapar (journal.name, journal.editorInChief, ...)
app.use(attachJournalToViews);

// Oturum acilmissa kullanici bilgisini header/nav gibi partial'larda kullanilabilir yapar
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

app.use("/", publicRoutes);
app.use("/author", authorRoutes);
app.use("/reviewer", reviewerRoutes);
app.use("/editor", editorRoutes);
app.use("/files", fileRoutes);
app.use("/superadmin", superadminRoutes);
app.use("/profile", profileRoutes);

app.use((req, res) => {
  // res.render kendi icinde (orn. bozuk/eksik bir partial yuzunden) hata
  // atarsa, bu try/catch olmadan Express'in varsayilan HTML hata sayfasina
  // duserdik - kullaniciya "eksik yuklenen sayfa" olarak gorunen tam da budur.
  try {
    res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
  } catch (err) {
    console.error("404 sayfasi render edilemedi:", err);
    res.status(404).type("text/plain").send("404 - Sayfa bulunamadı.");
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  // Yanit zaten kismen gonderilmisse (orn. dosya indirme yarida kesildiyse)
  // tekrar header yazmaya calismak "Cannot set headers after they are sent"
  // ile sunucuyu cokertebilir - Express'in kendi varsayilan (baglantiyi
  // kapatan) hata isleyicisine devrediyoruz.
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send("Sunucu hatasi olustu.");
});

module.exports = app;
