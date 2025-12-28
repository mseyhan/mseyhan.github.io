(function () {
  function normalizePath(pathname) {
    // /index.html gibi durumları temizle
    const cleaned = pathname.replace(/\/index\.html$/, "/");
    return cleaned === "" ? "/" : cleaned;
  }

  function getBasePath() {
    // Quarto meta offset ile kök path'i yakala (ör: ../../ -> /blog/)
    const offset = (document.querySelector('meta[name="quarto:offset"]')?.getAttribute("content") || "./").trim() || "./";
    const baseUrl = new URL(offset, window.location.href);
    const basePath = baseUrl.pathname;
    return basePath.endsWith("/") ? basePath : `${basePath}/`;
  }

  function stripLeadingSlash(value) {
    return value.replace(/^\/+/, "");
  }

  function buildPath(basePath, relative, keepSlash) {
    const cleanedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
    const cleanedRelative = stripLeadingSlash(relative);
    const url = new URL(cleanedRelative || ".", window.location.origin + cleanedBase);
    let out = url.pathname;
    if (keepSlash && !out.endsWith("/")) out += "/";
    if (!keepSlash && out !== "/" && out.endsWith("/")) out = out.replace(/\/$/, "");
    return out || "/";
  }

  function toTR(pathname) {
    const basePath = getBasePath();
    const enBase = basePath.endsWith("/tr/") ? basePath.replace(/\/tr\/$/, "/") : basePath;
    const current = normalizePath(pathname);
    const trailingSlash = current.endsWith("/");
    const relative = stripLeadingSlash(current.startsWith(enBase) ? current.slice(enBase.length) : current);
    if (relative.startsWith("tr/")) return current;
    return buildPath(enBase, `tr/${relative}`, true);
  }

  function toEN(pathname) {
    const basePath = getBasePath();
    const enBase = basePath.endsWith("/tr/") ? basePath.replace(/\/tr\/$/, "/") : basePath;
    const current = normalizePath(pathname);
    const trailingSlash = current.endsWith("/");
    const relative = stripLeadingSlash(current.startsWith(enBase) ? current.slice(enBase.length) : current);
    if (!relative.startsWith("tr/")) return current;
    const newRelative = relative.replace(/^tr\/?/, "");
    return buildPath(enBase, newRelative, trailingSlash || newRelative === "");
  }

  function init() {
    // Navbar'da "TR" veya "EN" yazan linki bul
    const links = Array.from(document.querySelectorAll("a"));
    const toggle = links.find(a => {
      const t = (a.textContent || "").trim().toUpperCase();
      return (t === "TR" || t === "EN") && (a.getAttribute("href") || "").trim() === "#";
    });

    if (!toggle) return;

    const label = (toggle.textContent || "").trim().toUpperCase();
    const current = normalizePath(window.location.pathname);
    const target = label === "TR" ? toTR(current) : toEN(current);
    toggle.href = target;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
