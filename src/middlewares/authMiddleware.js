// Oturum kontrolu. Giris yapmamis kullanici korumali bir sayfaya erismeye
// calisirsa login sayfasina yonlendirilir (web1'deki session_start() + $_SESSION["user"] kontrolunun karsiligi).
const loginPathFor = require("../utils/loginPath");

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect(loginPathFor(req));
  }
  next();
}

module.exports = { requireAuth };
