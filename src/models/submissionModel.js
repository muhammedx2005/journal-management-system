const { queryOne, queryAll, execute, withDates, withDatesAll } = require("../../config/database");
const { STATUS } = require("../constants/submissionStatus");

async function createSubmission({ paperCode, authorId, title, abstract, keywords, filePath }) {
  const result = await execute(
    `
      INSERT INTO submissions (paper_code, author_id, title, abstract, keywords, file_path, status)
      VALUES (@paperCode, @authorId, @title, @abstract, @keywords, @filePath, @status)
      RETURNING id
    `,
    { paperCode, authorId, title, abstract, keywords: keywords || null, filePath, status: STATUS.SUBMITTED }
  );

  return findById(result.rows[0].id);
}

async function findById(id) {
  return withDates(await queryOne("SELECT * FROM submissions WHERE id = @id", { id })) || null;
}

async function findByAuthorId(authorId) {
  return withDatesAll(
    await queryAll("SELECT * FROM submissions WHERE author_id = @authorId ORDER BY created_at DESC", { authorId })
  );
}

async function countByAuthorId(authorId) {
  const row = await queryOne("SELECT COUNT(*) AS total FROM submissions WHERE author_id = @authorId", { authorId });
  return Number(row.total);
}

// Editor'un hakem atama sayfasi icin: tum makaleler + yazar adi/soyadi.
async function findAllWithAuthor() {
  return withDatesAll(
    await queryAll(`
      SELECT s.*, u.name AS author_name, u.surname AS author_surname
      FROM submissions s
      INNER JOIN users u ON u.id = s.author_id
      ORDER BY s.created_at DESC
    `)
  );
}

async function updateStatus(id, status) {
  await execute("UPDATE submissions SET status = @status WHERE id = @id", { id, status });
}

// Editor'un makale detay/karar sayfasi icin: yazarin e-postasi da lazim (karar maili gonderilecek).
async function findByIdWithAuthor(id) {
  return (
    withDates(
      await queryOne(
        `
      SELECT s.*, u.name AS author_name, u.surname AS author_surname, u.email AS author_email
      FROM submissions s
      INNER JOIN users u ON u.id = s.author_id
      WHERE s.id = @id
    `,
        { id }
      )
    ) || null
  );
}

// Editor dashboard'unda durum bazli sayilari gostermek icin.
async function countsByStatus() {
  const rows = await queryAll("SELECT status, COUNT(*) AS total FROM submissions GROUP BY status");

  const counts = {};
  rows.forEach((row) => {
    counts[row.status] = Number(row.total);
  });
  return counts;
}

// Herkese acik ana sayfa/arsiv icin: sadece "published" durumundaki makaleler,
// yazar adi/soyadi ile birlikte.
async function findPublished() {
  return withDatesAll(
    await queryAll(
      `
      SELECT s.*, u.name AS author_name, u.surname AS author_surname
      FROM submissions s
      INNER JOIN users u ON u.id = s.author_id
      WHERE s.status = @status
      ORDER BY s.updated_at DESC
    `,
      { status: STATUS.PUBLISHED }
    )
  );
}

// Herkese acik makale detay sayfasi icin. Makale "published" degilse null
// doner (henuz yayinlanmamis bir makale dogrudan id ile ziyaret edilemez).
async function findPublishedById(id) {
  return (
    withDates(
      await queryOne(
        `
      SELECT s.*, u.name AS author_name, u.surname AS author_surname, u.institution AS author_institution
      FROM submissions s
      INNER JOIN users u ON u.id = s.author_id
      WHERE s.id = @id AND s.status = @status
    `,
        { id, status: STATUS.PUBLISHED }
      )
    ) || null
  );
}

// Superadmin panelinde makale/kullanici silinirken cagrilir. Bagimli
// review_assignments/reviews kayitlarinin ONCE silinmis olmasi gerekir
// (foreign key hatasi almamak icin) - bu yuzden controller katmaninda
// dogru sirayla cagrilir, model burada sadece kendi satirini siler.
async function deleteById(id) {
  await execute("DELETE FROM submissions WHERE id = @id", { id });
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
