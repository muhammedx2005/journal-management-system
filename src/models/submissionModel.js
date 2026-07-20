const { db, withDates, withDatesAll } = require("../../config/database");
const { STATUS } = require("../constants/submissionStatus");

function createSubmission({ paperCode, authorId, title, abstract, keywords, filePath }) {
  const result = db
    .prepare(
      `
      INSERT INTO submissions (paper_code, author_id, title, abstract, keywords, file_path, status)
      VALUES (@paperCode, @authorId, @title, @abstract, @keywords, @filePath, @status)
    `
    )
    .run({ paperCode, authorId, title, abstract, keywords: keywords || null, filePath, status: STATUS.SUBMITTED });

  return findById(result.lastInsertRowid);
}

function findById(id) {
  return withDates(db.prepare("SELECT * FROM submissions WHERE id = @id").get({ id })) || null;
}

function findByAuthorId(authorId) {
  return withDatesAll(
    db.prepare("SELECT * FROM submissions WHERE author_id = @authorId ORDER BY created_at DESC").all({ authorId })
  );
}

function countByAuthorId(authorId) {
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM submissions WHERE author_id = @authorId")
    .get({ authorId });
  return row.total;
}

// Editor'un hakem atama sayfasi icin: tum makaleler + yazar adi/soyadi.
function findAllWithAuthor() {
  return withDatesAll(
    db
      .prepare(
        `
      SELECT s.*, u.name AS author_name, u.surname AS author_surname
      FROM submissions s
      INNER JOIN users u ON u.id = s.author_id
      ORDER BY s.created_at DESC
    `
      )
      .all()
  );
}

function updateStatus(id, status) {
  db.prepare("UPDATE submissions SET status = @status WHERE id = @id").run({ id, status });
}

// Editor'un makale detay/karar sayfasi icin: yazarin e-postasi da lazim (karar maili gonderilecek).
function findByIdWithAuthor(id) {
  return (
    withDates(
      db
        .prepare(
          `
      SELECT s.*, u.name AS author_name, u.surname AS author_surname, u.email AS author_email
      FROM submissions s
      INNER JOIN users u ON u.id = s.author_id
      WHERE s.id = @id
    `
        )
        .get({ id })
    ) || null
  );
}

// Editor dashboard'unda durum bazli sayilari gostermek icin.
function countsByStatus() {
  const rows = db.prepare("SELECT status, COUNT(*) AS total FROM submissions GROUP BY status").all();

  const counts = {};
  rows.forEach((row) => {
    counts[row.status] = row.total;
  });
  return counts;
}

// Herkese acik ana sayfa/arsiv icin: sadece "published" durumundaki makaleler,
// yazar adi/soyadi ile birlikte.
function findPublished() {
  return withDatesAll(
    db
      .prepare(
        `
      SELECT s.*, u.name AS author_name, u.surname AS author_surname
      FROM submissions s
      INNER JOIN users u ON u.id = s.author_id
      WHERE s.status = @status
      ORDER BY s.updated_at DESC
    `
      )
      .all({ status: STATUS.PUBLISHED })
  );
}

// Herkese acik makale detay sayfasi icin. Makale "published" degilse null
// doner (henuz yayinlanmamis bir makale dogrudan id ile ziyaret edilemez).
function findPublishedById(id) {
  return (
    withDates(
      db
        .prepare(
          `
      SELECT s.*, u.name AS author_name, u.surname AS author_surname, u.institution AS author_institution
      FROM submissions s
      INNER JOIN users u ON u.id = s.author_id
      WHERE s.id = @id AND s.status = @status
    `
        )
        .get({ id, status: STATUS.PUBLISHED })
    ) || null
  );
}

// Superadmin panelinde makale/kullanici silinirken cagrilir. Bagimli
// review_assignments/reviews kayitlarinin ONCE silinmis olmasi gerekir
// (foreign key hatasi almamak icin) - bu yuzden controller katmaninda
// dogru sirayla cagrilir, model burada sadece kendi satirini siler.
function deleteById(id) {
  db.prepare("DELETE FROM submissions WHERE id = @id").run({ id });
}

module.exports = {
  createSubmission,
  findById,
  findByAuthorId,
  countByAuthorId,
  findAllWithAuthor,
  updateStatus,
  findByIdWithAuthor,
  countsByStatus,
  findPublished,
  findPublishedById,
  deleteById,
};
