// Local-only direction switcher. Not part of the site.
(() => {
  const DIRS = { current: "Current", refine: "A · Refine", fresh: "B · Fresh" };
  const link = document.getElementById("dir-css");
  const fromQuery = new URLSearchParams(location.search).get("dir");
  let stored = null;
  try { stored = localStorage.getItem("psyche-dir"); } catch (e) {}
  let dir = DIRS[fromQuery] ? fromQuery : DIRS[stored] ? stored : "current";

  const style = document.createElement("style");
  style.textContent = `
    .dir-switch{position:fixed;left:12px;bottom:12px;z-index:99999;display:flex;gap:4px;align-items:center;
      padding:4px;border-radius:999px;background:#111c;backdrop-filter:blur(8px);font:500 13px/1 system-ui,sans-serif;
      box-shadow:0 6px 24px #0004}
    .dir-switch button,.dir-switch a{all:unset;cursor:pointer;color:#fff;padding:8px 12px;border-radius:999px;white-space:nowrap}
    .dir-switch button[aria-pressed=true]{background:#fff;color:#111}
    .dir-switch button:focus-visible,.dir-switch a:focus-visible{outline:2px solid #fff;outline-offset:2px}
    .dir-switch a{opacity:.8;border-left:1px solid #fff4;border-radius:0 999px 999px 0}
    @media (max-width:37.5rem){.dir-switch{bottom:84px;left:8px;font-size:12px}}`;
  document.head.append(style);

  const bar = document.createElement("div");
  bar.className = "dir-switch";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Design direction");

  const apply = (d) => {
    dir = d;
    link.href = `/design/tokens.${d}.css`;
    bar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.dir === d));
    try { localStorage.setItem("psyche-dir", d); } catch (e) {}
    const u = new URL(location.href); u.searchParams.set("dir", d); history.replaceState(null, "", u);
  };

  Object.entries(DIRS).forEach(([k, label], i) => {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.dir = k; b.textContent = label; b.title = `Press ${i + 1}`;
    b.addEventListener("click", () => apply(k));
    bar.append(b);
  });
  const doc = document.createElement("a");
  doc.href = "/design/proposal.html"; doc.textContent = "Tokens ↗";
  bar.append(doc);

  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input,textarea")) return;
    const k = Object.keys(DIRS)[Number(e.key) - 1];
    if (k) apply(k);
  });

  const mount = () => { document.body.append(bar); apply(dir); };
  document.body ? mount() : document.addEventListener("DOMContentLoaded", mount);
})();
