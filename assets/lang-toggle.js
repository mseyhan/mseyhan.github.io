(function () {
  function isTurkishPath(pathname) {
    return pathname === "/tr" || pathname.startsWith("/tr/");
  }

  function targetFor(pathname) {
    if (pathname === "/tr") pathname = "/tr/";

    if (isTurkishPath(pathname)) {
      return pathname.replace(/^\\/tr/, "") || "/";
    } else {
      return pathname === "/" ? "/tr/" : "/tr" + pathname;
    }
  }

  async function go() {
    const current = window.location.pathname;
    const target = targetFor(current);

    try {
      const res = await fetch(target, { method: "HEAD" });
      if (res.ok) {
        window.location.href = target;
        return;
      }
    } catch (_) {
      // ignore network errors and fall back
    }

    window.location.href = isTurkishPath(current) ? "/" : "/tr/";
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('a[href="__LANG_TOGGLE__"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        go();
      });
    });
  });
})();
