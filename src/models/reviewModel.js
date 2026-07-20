// Hakem degerlendirme veri erisim katmani. Bir atama (assignment_id) icin en
// fazla bir review kaydi olusabilir (tablo semasindaki UNIQUE constraint).
const { queryOne, execute, withDates } = require("../../config/database");

async function createReview({ assignmentId, recommendation, commentsForEditor, commentsForAuthor }) {
  const result = await execute(
    `
      INSERT INTO reviews (assignment_id, recommendation, comments_for_editor, comments_for_author)
      VALUES (@assignmentId, @recommendation, @commentsForEditor, @commentsForAuthor)
      RETURNING id
    `,
    { assignmentId, recommendation, commentsForEditor, commentsForAuthor }
  );
  return result.rows[0].id;
}

async function findByAssignmentId(assignmentId) {
  return withDates(await queryOne("SELECT * FROM reviews WHERE assignment_id = @assignmentId", { assignmentId })) || null;
}

// Superadmin cascade delete: bir makale silinmeden once, o makaleye ait
// atamalarin (review_assignments) uzerine yazilmis tum degerlendirmeler
// (reviews) silinmelidir - reviews.assignment_id FK'sinden dolayi bu silme
// islemi review_assignments silinmeden ONCE yapilmalidir.
async function deleteBySubmissionId(submissionId) {
  await execute(
    `
      DELETE FROM reviews
      WHERE assignment_id IN (
        SELECT id FROM review_assignments WHERE submission_id = @submissionId
      )
    `,
    { submissionId }
  );
}

// Superadmin cascade delete: bir hakem silinmeden once, o hakemin girdigi
// tum degerlendirmeler silinmelidir.
async function deleteByReviewerId(reviewerId) {
  await execute(
    `
      DELETE FROM reviews
      WHERE assignment_id IN (
        SELECT id FROM review_assignments WHERE reviewer_id = @reviewerId
      )
    `,
    { reviewerId }
  );
}

module.exports = { createReview, findByAssignmentId, deleteBySubmissionId, deleteByReviewerId };
