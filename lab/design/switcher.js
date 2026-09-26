// Local-only direction switcher. Not part of the site.
(() => {
  const DIRS = { current: "Current", refine: "A · Refine", blend: "C · Blend", fresh: "B · Fresh" };
  const link = document.getElementById("dir-css");
  const BUILD = Date.now().toString(36);
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
    .dir-switch .fill-toggle{border-left:1px solid #fff4;border-radius:0;opacity:.9}
    .dir-switch a{opacity:.8;border-left:1px solid #fff4;border-radius:0 999px 999px 0}
    @media (max-width:37.5rem){.dir-switch{bottom:104px;left:8px;font-size:12px}}`;
  document.head.append(style);

  const bar = document.createElement("div");
  bar.className = "dir-switch";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Design direction");

  const apply = (d) => {
    dir = d;
    // cache-bust: plain static servers let browsers reuse an old copy of the tokens file
    link.href = `/design/tokens.${d}.css?v=${BUILD}`;
    bar.querySelectorAll("button[data-dir]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.dir === d));
    fillBtn.hidden = d !== "blend";
    audBtn.hidden = d !== "blend";
    try { localStorage.setItem("psyche-dir", d); } catch (e) {}
    const u = new URL(location.href); u.searchParams.set("dir", d); history.replaceState(null, "", u);
  };

  Object.entries(DIRS).forEach(([k, label], i) => {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.dir = k; b.textContent = label; b.title = `Press ${i + 1}`;
    b.addEventListener("click", () => apply(k));
    bar.append(b);
  });
  // Card-fill preset toggle (only meaningful in C · Blend)
  let fill = "rise";
  try { fill = localStorage.getItem("psyche-fill") || "rise"; } catch (e) {}
  const fillBtn = document.createElement("button");
  fillBtn.type = "button"; fillBtn.className = "fill-toggle"; fillBtn.title = "Card hover fill (press F)";
  const applyFill = (f) => {
    fill = f;
    if (f === "sweep") document.documentElement.dataset.cardFill = "sweep";
    else delete document.documentElement.dataset.cardFill;
    fillBtn.textContent = f === "sweep" ? "Fill: ↖ Sweep" : "Fill: ↑ Rise";
    try { localStorage.setItem("psyche-fill", f); } catch (e) {}
  };
  fillBtn.addEventListener("click", () => applyFill(fill === "rise" ? "sweep" : "rise"));
  bar.append(fillBtn);

  // Audience tag style toggle (C only): pill → pill + bar → plain bar
  const AUD = ["pill", "pill-bar", "bar"], AUD_LABEL = { "pill": "Tags: Pill", "pill-bar": "Tags: Pill + bar", "bar": "Tags: Bar" };
  let aud = "pill";
  try { aud = AUD.includes(localStorage.getItem("psyche-aud")) ? localStorage.getItem("psyche-aud") : "pill"; } catch (e) {}
  const audBtn = document.createElement("button");
  audBtn.type = "button"; audBtn.className = "fill-toggle"; audBtn.title = "Service audience tags (press P)";
  const applyAud = (a) => {
    aud = a;
    if (a === "bar") delete document.documentElement.dataset.audStyle;
    else document.documentElement.dataset.audStyle = a;
    audBtn.textContent = AUD_LABEL[a];
    try { localStorage.setItem("psyche-aud", a); } catch (e) {}
  };
  const nextAud = () => applyAud(AUD[(AUD.indexOf(aud) + 1) % AUD.length]);
  audBtn.addEventListener("click", nextAud);
  bar.append(audBtn);

  const doc = document.createElement("a");
  doc.href = "/design/proposal.html"; doc.textContent = "Tokens ↗";
  bar.append(doc);

  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input,textarea")) return;
    if (e.key === "p" || e.key === "P") { nextAud(); return; }
    if (e.key === "f" || e.key === "F") { applyFill(fill === "rise" ? "sweep" : "rise"); return; }
    const k = Object.keys(DIRS)[Number(e.key) - 1];
    if (k) apply(k);
  });

  const mount = () => { document.body.append(bar); applyFill(fill); applyAud(aud); apply(dir); };
  document.body ? mount() : document.addEventListener("DOMContentLoaded", mount);
})();
