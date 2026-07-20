// Sistemdeki 4 rol. web1'deki sayisal rol kodlarinin (role_number) yerini
// okunabilir string sabitler alir.
const ROLES = {
  AUTHOR: "author",
  REVIEWER: "reviewer",
  EDITOR: "editor",
  SUPERADMIN: "superadmin",
};

// Coklu rol UI'lari (superadmin/dashboard, superadmin/users) icin Turkce
// etiketler - bkz. userModel.rolesForUser.
ROLES.LABELS = {
  author: "Yazar",
  reviewer: "Hakem",
  editor: "Editör",
};

module.exports = ROLES;
