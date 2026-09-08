/* Applies the saved theme before first paint (CSP-safe external script). */
(function () {
  try {
    var stored = localStorage.getItem("family-portal.theme");
    var t = "warm",
      m = "light";
    if (stored) {
      var p = JSON.parse(stored);
      if (p.theme) t = p.theme;
      if (p.mode) m = p.mode;
    }
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.setAttribute("data-mode", m);
  } catch {
    /* corrupted storage — fall back to defaults */
  }
})();
