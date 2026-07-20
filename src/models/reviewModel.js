// Hakem degerlendirme veri erisim katmani. Bir atama (assignment_id) icin en
// fazla bir review kaydi olusabilir (tablo semasindaki UNIQUE constraint).
const { db, withDates } = require("../../config/database");

function createReview({ assignmentId, recommendation, commentsForEditor, commentsForAuthor }) {
  const result = db
    .prepare(
      `
      INSERT INTO reviews (assignment_id, recommendation, comments_for_editor, comments_for_author)
      VALUES (@assignmentId, @recommendation, @commentsForEditor, @commentsForAuthor)
    `
    )
    .run({ assignmentId, recommendation, commentsForEditor, commentsForAuthor });
  return result.lastInsertRowid;
}

function findByAssignmentId(assignmentId) {
  return (
    withDates(db.prepare("SELECT * FROM reviews WHERE assignment_id = @assignmentId").get({ assignmentId })) || null
  );
}

// Superadmin cascade delete: bir makale silinmeden once, o makaleye ait
// atamalarin (review_assignments) uzerine yazilmis tum degerlendirmeler
// (reviews) silinmelidir - reviews.assignment_id FK'sinden dolayi bu silme
// islemi review_assignments silinmeden ONCE yapilmalidir.
function deleteBySubmissionId(submissionId) {
  db.prepare(
    `
      DELETE FROM reviews
      WHERE assignment_id IN (
        SELECT id FROM review_assignments WHERE submission_id = @submissionId
      )
    `
  ).run({ submissionId });
}

// Superadmin cascade delete: bir hakem silinmeden once, o hakemin girdigi
// tum degerlendirmeler silinmelidir.
function deleteByReviewerId(reviewerId) {
  db.prepare(
    `
      DELETE FROM reviews
      WHERE assignment_id IN (
        SELECT id FROM review_assignments WHERE reviewer_id = @reviewerId
      )
    `
  ).run({ reviewerId });
}

module.exports = { createReview, findByAssignmentId, deleteBySubmissionId, deleteByReviewerId };
