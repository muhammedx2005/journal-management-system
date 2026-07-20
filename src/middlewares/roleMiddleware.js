// Rol bazli yetkilendirme. web1/user/function.php icindeki yetki_kontrol($role_number, $page)
// fonksiyonunun modern karsiligi: orada DB'deki "menus" tablosundan rol->sayfa eslesmesine
// bakiliyordu, burada Express middleware zinciri ile ayni is rota bazinda yapilir.
//
// Kullanim: router.get("/dashboard", requireAuth, requireRole(ROLES.AUTHOR), controller)
const loginPathFor = require("../utils/loginPath");

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    const currentUser = req.session && req.session.user;

    if (!currentUser) {
      return res.redirect(loginPathFor(req));
    }

    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).render("errors/403", {
        pageTitle: "Erişim Reddedildi",
      });
    }

    next();
  };
}

// Superadmin, roleMiddleware'in kontrol ettigi "role" alanindan BAGIMSIZ bir
// yetki bayragidir (session.user.isSuperadmin) - boylece bir hesap ayni anda
// hem kendi rolunun (orn. editor) hem Superadmin panelinin sayfalarina girebilir.
function requireSuperadmin() {
  return function (req, res, next) {
    const currentUser = req.session && req.session.user;

    if (!currentUser) {
      return res.redirect(loginPathFor(req));
    }

    if (!currentUser.isSuperadmin) {
      return res.status(403).render("errors/403", {
        pageTitle: "Erişim Reddedildi",
      });
    }

    next();
  };
}

module.exports = { requireRole, requireSuperadmin };
