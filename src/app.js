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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

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
  res.status(404).render("errors/404", { pageTitle: "Bulunamadı" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Sunucu hatasi olustu.");
});

module.exports = app;
