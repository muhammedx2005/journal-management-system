// Author/Reviewer/Editor modullerinin her birinin kendi /login sayfasi var.
// Oturumsuz bir istek korumali bir rotaya carptiginda, istegin path'ine bakarak
// dogru login sayfasina yonlendirir (authMiddleware ve roleMiddleware ortak kullanir).
function loginPathFor(req) {
  if (req.originalUrl.startsWith("/reviewer")) {
    return "/reviewer/login";
  }
  if (req.originalUrl.startsWith("/editor")) {
    return "/editor/login";
  }
  if (req.originalUrl.startsWith("/superadmin")) {
    // Superadmin'in kendi login sayfasi yoktur; bu yetki mevcut bir hesabin
    // (su an icin editor) uzerine bayrak olarak eklenir, bkz. roleMiddleware.requireSuperadmin.
    return "/editor/login";
  }
  return "/author/login";
}

module.exports = loginPathFor;
