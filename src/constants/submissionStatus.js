// Makale durumlari. web1'de bunlar dagitik "accept_status == -3", "publish == 1"
// gibi sayisal karsilastirmalarla temsil ediliyordu; burada tek yerden okunabilir
// bir sozluk olarak tutulur.
const STATUS = {
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  REVISION_REQUIRED: "revision_required",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  PUBLISHED: "published",
};

const STATUS_LABELS = {
  [STATUS.SUBMITTED]: "Gönderildi / Editör İncelemesinde",
  [STATUS.UNDER_REVIEW]: "Hakem Değerlendirmesinde",
  [STATUS.REVISION_REQUIRED]: "Revizyon İstendi",
  [STATUS.ACCEPTED]: "Kabul Edildi",
  [STATUS.REJECTED]: "Reddedildi",
  [STATUS.PUBLISHED]: "Yayınlandı",
};

module.exports = { STATUS, STATUS_LABELS };
