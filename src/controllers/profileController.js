const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

const SALT_ROUNDS = 10;

async function showProfile(req, res) {
  const user = await userModel.findById(req.session.user.id);

  res.render("profile/show", {
    pageTitle: "Profilim",
    profileUser: user,
    errorMessage: null,
    successMessage: null,
  });
}

async function updateProfile(req, res) {
  const { name, surname, institution, orcidNo } = req.body;

  if (!name || !surname) {
    const user = await userModel.findById(req.session.user.id);
    return res.status(400).render("profile/show", {
      pageTitle: "Profilim",
      profileUser: user,
      errorMessage: "Ad ve soyad zorunludur.",
      successMessage: null,
    });
  }

  const updatedUser = await userModel.updateProfile({
    id: req.session.user.id,
    name,
    surname,
    institution,
    orcidNo,
  });

  // Header'daki kullanici adinin yeniden giris yapmadan guncel gorunmesi icin.
  req.session.user.name = `${updatedUser.name} ${updatedUser.surname}`;

  res.render("profile/show", {
    pageTitle: "Profilim",
    profileUser: updatedUser,
    errorMessage: null,
    successMessage: "Bilgileriniz güncellendi.",
  });
}

async function updatePassword(req, res) {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;
  const user = await userModel.findById(req.session.user.id);

  const currentPasswordMatches = await bcrypt.compare(currentPassword || "", user.password_hash);

  if (!currentPasswordMatches) {
    return res.status(400).render("profile/show", {
      pageTitle: "Profilim",
      profileUser: user,
      errorMessage: "Mevcut şifreniz hatalı.",
      successMessage: null,
    });
  }

  if (!newPassword || newPassword.length < 8 || newPassword !== newPasswordConfirm) {
    return res.status(400).render("profile/show", {
      pageTitle: "Profilim",
      profileUser: user,
      errorMessage: "Yeni şifreler eşleşmiyor veya en az 8 karakter değil.",
      successMessage: null,
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userModel.updatePassword({ id: user.id, passwordHash });

  res.render("profile/show", {
    pageTitle: "Profilim",
    profileUser: user,
    errorMessage: null,
    successMessage: "Şifreniz güncellendi.",
  });
}

module.exports = {
  showProfile,
  updateProfile,
  updatePassword,
};
