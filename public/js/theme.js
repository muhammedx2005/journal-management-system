(function () {
  var STORAGE_KEY = "jms-theme";
  var root = document.documentElement;
  var toggleBtn = document.getElementById("themeToggle");

  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", function () {
    var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      /* localStorage erisilemiyorsa tema sadece bu oturumda degisir */
    }
  });
})();
