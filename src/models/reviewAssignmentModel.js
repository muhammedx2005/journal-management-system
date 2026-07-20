// Hakem atama veri erisim katmani. review_assignments tablosu bir makale ile
// bir hakemi eslestirir (submission_id, reviewer_id) - editor tarafindan olusturulur,
// hakem tarafindan okunur.
const { queryOne, queryAll, execute, withDates, withDatesAll } = require("../../config/database");

async function assignReviewer({ submissionId, reviewerId }) {
  const result = await execute(
    `
      INSERT INTO review_assignments (submission_id, reviewer_id)
      VALUES (@submissionId, @reviewerId)
      RETURNING id
    `,
    { submissionId, reviewerId }
  );
  return result.rows[0].id;
}

async function existsForSubmissionAndReviewer(submissionId, reviewerId) {
  const row = await queryOne(
    "SELECT id FROM review_assignments WHERE submission_id = @submissionId AND reviewer_id = @reviewerId",
    { submissionId, reviewerId }
  );
  return Boolean(row);
}

// Bir hakemin panelinde gorecegi tum atamalar; her atamaya ait degerlendirme
// varsa (review_id) LEFT JOIN ile birlikte doner, yoksa null gelir.
async function findByReviewerId(reviewerId) {
  return withDatesAll(
    await queryAll(
      `
      SELECT
        ra.id AS assignment_id,
        ra.assigned_at,
        s.id AS submission_id,
        s.paper_code,
        s.title,
        s.status,
        r.id AS review_id,
        r.recommendation
      FROM review_assignments ra
      INNER JOIN submissions s ON s.id = ra.submission_id
      LEFT JOIN reviews r ON r.assignment_id = ra.id
      WHERE ra.reviewer_id = @reviewerId
      ORDER BY ra.assigned_at DESC
    `,
      { reviewerId }
    )
  );
}

// Hakemin sadece kendisine atanmis bir makaleyi goruntuleyebilmesini garantiler
// (reviewer_id filtresi olmadan baska bir hakemin atamasina URL ile erisilebilirdi).
async function findByIdForReviewer(assignmentId, reviewerId) {
  return (
    withDates(
      await queryOne(
        `
      SELECT
        ra.id AS assignment_id,
        ra.assigned_at,
        s.id AS submission_id,
        s.paper_code,
        s.title,
        s.abstract,
        s.keywords,
        s.file_path,
        s.status
      FROM review_assignments ra
      INNER JOIN submissions s ON s.id = ra.submission_id
      WHERE ra.id = @assignmentId AND ra.reviewer_id = @reviewerId
    `,
        { assignmentId, reviewerId }
      )
    ) || null
  );
}

// Editor'un atama sayfasinda her makalenin altinda "kim atandi, tamamladi mi"
// bilgisini gostermek icin. Controller tarafinda submission_id'ye gore gruplanir.
async function findAllWithReviewerNames() {
  return queryAll(`
    SELECT
      ra.submission_id,
      ra.reviewer_id,
      u.name,
      u.surname,
      r.id AS review_id
    FROM review_assignments ra
    INNER JOIN users u ON u.id = ra.reviewer_id
    LEFT JOIN reviews r ON r.assignment_id = ra.id
  `);
}

// Editor'un makale detay sayfasinda gorecegi tum atamalar + varsa degerlendirme
// icerigi (karar, editore/yazara yorum). Henuz degerlendirilmemis atamalarda
// review alanlari null gelir.
async function findAssignmentsWithReviewsForSubmission(submissionId) {
  return withDatesAll(
    await queryAll(
      `
      SELECT
        ra.id AS assignment_id,
        ra.reviewer_id,
        ra.assigned_at,
        u.name AS reviewer_name,
        u.surname AS reviewer_surname,
        r.id AS review_id,
        r.recommendation,
        r.comments_for_editor,
        r.comments_for_author,
        r.submitted_at
      FROM review_assignments ra
      INNER JOIN users u ON u.id = ra.reviewer_id
      LEFT JOIN reviews r ON r.assignment_id = ra.id
      WHERE ra.submission_id = @submissionId
      ORDER BY ra.assigned_at
    `,
      { submissionId }
    )
  );
}

// Superadmin cascade delete: bir makale silinmeden ONCE o makaleye ait tum
// atamalar silinmelidir (reviews tablosundaki assignment_id FK'si de bu
// atamalara bagli oldugu icin reviewModel.deleteBySubmissionId ONCE cagrilmalidir).
async function deleteBySubmissionId(submissionId) {
  await execute("DELETE FROM review_assignments WHERE submission_id = @submissionId", { submissionId });
}

// Superadmin cascade delete: bir hakem silinmeden ONCE ona ait tum atamalar
// silinmelidir (ayni sekilde reviewModel.deleteByReviewerId ONCE cagrilmalidir).
async function deleteByReviewerId(reviewerId) {
  await execute("DELETE FROM review_assignments WHERE reviewer_id = @reviewerId", { reviewerId });
}

module.exports = {
  assignReviewer,
  existsForSubmissionAndReviewer,
  findByReviewerId,
  findByIdForReviewer,
  findAllWithReviewerNames,
  findAssignmentsWithReviewsForSubmission,
  deleteBySubmissionId,
  deleteByReviewerId,
};
