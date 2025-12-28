(function () {
  function toEN(path) {
    // "/tr" veya "/tr/" ile başlıyorsa kaldır
    return path.replace(/^\/tr(?=\/|$)/, "") || "/";
  }

  function toTR(path) {
    // zaten /tr altındaysa dokunma
    if (/^\/tr(\/|$)/.test(path)) return path;
    return ("/tr" + (path.startsWith("/") ? path : "/" + path)).replace(/\/{2,}/g, "/");
  }

  function init() {
    document.querySelectorAll("a").forEach(a => {
      const t = (a.textContent || "").trim().toUpperCase();
      if (t !== "TR" && t !== "EN") return;

      // href filtresini gevşet: "#", "/tr/#", "LANG_TOGGLE" vs. hepsini yakala
      const href = (a.getAttribute("href") || "").trim();
      const looksLikeLangToggle = (href === "#" || href.endsWith("/#") || href.includes("LANG_TOGGLE"));
      if (!looksLikeLangToggle) return;

      const path = window.location.pathname;
      a.href = (t === "EN") ? toEN(path) : toTR(path);

      // (opsiyonel) aynı sayfadaki anchor’ı korumak istersen:
      // a.href += window.location.hash;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
