(function () {
  const TR_PREFIX = "/tr";

  function isTrPath(p) {
    return p === TR_PREFIX || p.startsWith(TR_PREFIX + "/");
  }

  function toEnPath(p) {
    return p.replace(/^\/tr(?=\/|$)/, "") || "/";
  }

  function toTrPath(p) {
    const en = toEnPath(p);

    // "/" veya "/index.html" ise TR anasayfaya sabitle
    if (en === "/" || en === "/index.html") return "/tr/";

    // "/about.html" -> "/tr/about.html"
    return (TR_PREFIX + en).replace(/\/{2,}/g, "/");
  }

  async function exists(url) {
    try {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      return r.ok;
    } catch {
      return false;
    }
  }

  async function switchLang() {
    const p = window.location.pathname;
    const target = isTrPath(p) ? toEnPath(p) : toTrPath(p);

    if (await exists(target)) {
      window.location.href = target + window.location.search + window.location.hash;
    } else {
      // hedef sayfa yoksa fallback
      window.location.href = isTrPath(p) ? "/" : "/tr/";
    }
  }

  function hookLink() {
    // TR/EN linkini yakala (text "TR" veya href içinde LANG_TOGGLE olan)
    const links = Array.from(document.querySelectorAll("a"));
    const a = links.find(x => {
      const txt = (x.textContent || "").trim().toUpperCase();
      const href = (x.getAttribute("href") || "").trim();
      return txt === "TR" || txt === "EN" || href.includes("LANG_TOGGLE");
    });

    if (!a) return;

    // Görünen label'ı dinamik yap
    a.textContent = isTrPath(window.location.pathname) ? "EN" : "TR";
    a.setAttribute("href", "#");

    a.addEventListener("click", (e) => {
      e.preventDefault();
      switchLang();
    });
  }

  document.addEventListener("DOMContentLoaded", hookLink);
})();
