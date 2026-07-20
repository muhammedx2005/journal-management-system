// Kullanici hesap onay durumlari. Yeni self-signup (author/reviewer) hesaplar
// 'pending' olarak baslar ve Superadmin onaylayana kadar giris yapamaz
// (bkz. authorController.login, reviewerController.login).
const STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const STATUS_LABELS = {
  [STATUS.PENDING]: "Onay Bekliyor",
  [STATUS.APPROVED]: "Onaylandı",
  [STATUS.REJECTED]: "Reddedildi",
};

module.exports = { STATUS, STATUS_LABELS };
