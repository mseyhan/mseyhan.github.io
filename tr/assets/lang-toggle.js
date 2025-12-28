(function () {
  function normalizePath(pathname) {
    // /index.html gibi durumları temizle
    return pathname.replace(/\/index\.html$/, "/");
  }

  function toTR(path) {
    if (path === "/") return "/tr/";
    if (path.startsWith("/tr/")) return path;
    return "/tr" + path;
  }

  function toEN(path) {
    if (path.startsWith("/tr/")) {
      const p = path.replace(/^\/tr/, "");
      return p === "" ? "/" : p;
    }
    return path;
  }

  async function urlExists(url) {
    // GH Pages bazen HEAD'de garip davranabiliyor; GET ile kontrol daha stabil
    try {
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function init() {
    const current = normalizePath(window.location.pathname);

    // Navbar'da "TR" veya "EN" yazan linki bul
    const links = Array.from(document.querySelectorAll("a"));
    const toggle = links.find(a => {
      const t = (a.textContent || "").trim().toUpperCase();
      return (t === "TR" || t === "EN") && (a.getAttribute("href") || "").trim() === "#";
    });

    if (!toggle) return;

    const label = (toggle.textContent || "").trim().toUpperCase();
    const target = (label === "TR") ? toTR(current) : toEN(current);

    // Eğer hedef sayfa yoksa, dilin ana sayfasına düş
    const ok = await urlExists(target);
    toggle.href = ok ? target : (label === "TR" ? "/tr/" : "/");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
