// Kullanici veri erisim katmani. Tum sorgular parametreli (@paramAdi) calisir;
// web1'deki "WHERE email='$user_name'" tarzi string birlestirme kullanilmaz.
const { db, withDates, withDatesAll } = require("../../config/database");
const { STATUS: APPROVAL_STATUS } = require("../constants/userApprovalStatus");

// Coklu rol destegi: hesabin yetkileri artik tekil "role" kolonu degil,
// is_author/is_reviewer/is_editor bayraklaridir (bkz. db/schema.sql). Bu
// helper bir users satirini ["author","reviewer",...] gibi bir diziye cevirir -
// superadmin paneli ve session.user.roles tarafindan kullanilir.
const ROLE_FLAG_COLUMNS = {
  author: "is_author",
  reviewer: "is_reviewer",
  editor: "is_editor",
};

function rolesForUser(user) {
  return Object.keys(ROLE_FLAG_COLUMNS).filter((role) => Boolean(user[ROLE_FLAG_COLUMNS[role]]));
}

function findByEmail(email) {
  return withDates(db.prepare("SELECT * FROM users WHERE email = @email").get({ email })) || null;
}

function findById(id) {
  return withDates(db.prepare("SELECT * FROM users WHERE id = @id").get({ id })) || null;
}

function createAuthor({ name, surname, email, passwordHash, institution, orcidNo, phone }) {
  const result = db
    .prepare(
      `
      INSERT INTO users (name, surname, email, password_hash, role, institution, orcid_no, phone, status, is_author)
      VALUES (@name, @surname, @email, @passwordHash, 'author', @institution, @orcidNo, @phone, @status, 1)
    `
    )
    .run({
      name,
      surname,
      email,
      passwordHash,
      institution: institution || null,
      orcidNo: orcidNo || null,
      phone: phone || null,
      status: APPROVAL_STATUS.PENDING,
    });

  return findById(result.lastInsertRowid);
}

function createReviewer({ name, surname, email, passwordHash, institution, orcidNo, phone }) {
  const result = db
    .prepare(
      `
      INSERT INTO users (name, surname, email, password_hash, role, institution, orcid_no, phone, status, is_reviewer)
      VALUES (@name, @surname, @email, @passwordHash, 'reviewer', @institution, @orcidNo, @phone, @status, 1)
    `
    )
    .run({
      name,
      surname,
      email,
      passwordHash,
      institution: institution || null,
      orcidNo: orcidNo || null,
      phone: phone || null,
      status: APPROVAL_STATUS.PENDING,
    });

  return findById(result.lastInsertRowid);
}

function findAllReviewers() {
  return db
    .prepare("SELECT id, name, surname, email FROM users WHERE is_reviewer = 1 ORDER BY name, surname")
    .all();
}

// Editor'un self-signup sayfasi yoktur (hakem atayan rol oldugu icin bilincli
// olarak disariya kapali) - sadece scripts/create-editor.js tarafindan kullanilir.
function createEditor({ name, surname, email, passwordHash }) {
  const result = db
    .prepare(
      `
      INSERT INTO users (name, surname, email, password_hash, role, status, is_editor)
      VALUES (@name, @surname, @email, @passwordHash, 'editor', @status, 1)
    `
    )
    .run({ name, surname, email, passwordHash, status: APPROVAL_STATUS.APPROVED });

  return findById(result.lastInsertRowid);
}

// Superadmin panelindeki "Kullanıcılar" tablosu icin: sifre hash'i disaridaki
// hicbir liste/goruntuye tasinmaz.
function findAll() {
  return withDatesAll(
    db
      .prepare(
        `
      SELECT id, name, surname, email, role, is_superadmin, is_author, is_reviewer, is_editor, institution, status, created_at
      FROM users
      ORDER BY created_at DESC
    `
      )
      .all()
  );
}

// Superadmin panelindeki "Onay Bekleyenler" tablosu icin.
function findAllPending() {
  return withDatesAll(
    db
      .prepare(
        `
      SELECT id, name, surname, email, role, is_author, is_reviewer, is_editor, institution, orcid_no, created_at
      FROM users
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `
      )
      .all()
  );
}

function approveUser(id) {
  db.prepare("UPDATE users SET status = 'approved' WHERE id = @id").run({ id });
}

function deleteById(id) {
  db.prepare("DELETE FROM users WHERE id = @id").run({ id });
}

// /profile sayfasindaki "Kisisel Bilgiler" formu icin.
function updateProfile({ id, name, surname, institution, orcidNo }) {
  db.prepare(
    `
      UPDATE users
      SET name = @name, surname = @surname, institution = @institution, orcid_no = @orcidNo
      WHERE id = @id
    `
  ).run({ id, name, surname, institution: institution || null, orcidNo: orcidNo || null });
  return findById(id);
}

// /profile sayfasindaki "Sifre Degistir" formu icin.
function updatePassword({ id, passwordHash }) {
  db.prepare("UPDATE users SET password_hash = @passwordHash WHERE id = @id").run({ id, passwordHash });
}

// scripts/setup-admin.js tarafindan kullanilir: mevcut bir hesabin e-postasini/
// sifresini gunceller ve Superadmin bayragini acar (role kolonu DEGISMEZ, boylece
// hesap hem kendi rolunu hem Superadmin yetkisini korur). Ayrica Superadmin
// "her yere girebilsin" diye tum portal bayraklarini da acar - bu manuel/
// bilincli bir admin script aksiyonudur, self-servis degildir.
function promoteToSuperadmin({ id, name, surname, email, passwordHash }) {
  db.prepare(
    `
      UPDATE users
      SET name = @name, surname = @surname, email = @email, password_hash = @passwordHash,
          is_superadmin = 1, is_author = 1, is_reviewer = 1, is_editor = 1
      WHERE id = @id
    `
  ).run({ id, name, surname, email, passwordHash });
  return findById(id);
}

// Signup formundan: e-posta zaten kayitli ama o role sahip degilse, yeni bir
// satir INSERT etmek yerine (email UNIQUE oldugu icin zaten mumkun degil)
// mevcut hesabin uzerine ilgili bayragi acar. Sifre dogrulamasi cagiran
// controller'da yapilir (bkz. authorController/reviewerController.signup).
function addRoleToUser({ id, role }) {
  const column = ROLE_FLAG_COLUMNS[role];
  db.prepare(`UPDATE users SET ${column} = 1 WHERE id = @id`).run({ id });
  return findById(id);
}

// Superadmin panelindeki "Kullanıcı Yönetimi" checkbox formu icin: bir
// hesabin Yazar/Hakem/Editor bayraklarini tek seferde gunceller.
// is_superadmin buradan DEGISTIRILEMEZ - kilitlenme riskini onlemek icin
// bilerek kapsam disi birakildi.
function setUserRoles({ id, isAuthor, isReviewer, isEditor }) {
  db.prepare(
    `
      UPDATE users
      SET is_author = @isAuthor, is_reviewer = @isReviewer, is_editor = @isEditor
      WHERE id = @id
    `
  ).run({ id, isAuthor: isAuthor ? 1 : 0, isReviewer: isReviewer ? 1 : 0, isEditor: isEditor ? 1 : 0 });
  return findById(id);
}

module.exports = {
  findByEmail,
  findById,
  createAuthor,
  createReviewer,
  findAllReviewers,
  createEditor,
  findAll,
  findAllPending,
  approveUser,
  deleteById,
  promoteToSuperadmin,
  updateProfile,
  updatePassword,
  rolesForUser,
  addRoleToUser,
  setUserRoles,
};
