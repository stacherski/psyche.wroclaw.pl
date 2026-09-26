// Homepage service filter — mirrors the Zespół page (src/zespół/index.njk):
// the same .filters / .filter-btn markup, the same attribute tagging on each card
// (all kids youth adult online) and the same View Transitions animation.
//
// In the lab the markup and attributes are injected from design/audiences.json.
// In production the template renders both (see HANDOVER.md), and only the
// "behaviour" half of this file is needed.
(() => {
  const FILTERS = [
    ["all", "Wszystkie"],
    ["kids", "Dla dzieci"],
    ["youth", "Dla młodzieży"],
    ["adult", "Dla dorosłych"],
    ["online", "On-line"],
  ];
  const COUNT = (n) => `${n} ${n === 1 ? "usługa" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "usługi" : "usług"}`;

  // ---------- lab-only: inject what the template would render
  async function injectMarkup(list) {
    let audiences = {};
    try { audiences = await (await fetch("/design/audiences.json")).json(); } catch (e) { return false; }
    list.querySelectorAll("a.service").forEach((card) => {
      const slug = (card.getAttribute("href") || "").split("/").filter(Boolean).pop();
      card.setAttribute("all", "");
      (audiences[slug] || []).forEach((group) => card.setAttribute(group, ""));
    });
    if (!document.querySelector(".filters[data-for='services']")) {
      const bar = document.createElement("div");
      bar.className = "filters";
      bar.dataset.for = "services";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "Filtruj usługi");
      bar.innerHTML = FILTERS.map(([cat, label], i) =>
        `<button type="button" class="filter-btn${i ? "" : " active"}" data-category="${cat}" aria-pressed="${i ? "false" : "true"}">${label}</button>`
      ).join("");
      const status = document.createElement("p");
      status.className = "filter-status";
      status.setAttribute("aria-live", "polite");
      list.before(bar, status);
    }
    return true;
  }

  // ---------- behaviour (what production needs)
  function initFilter(list) {
    const bar = document.querySelector(".filters[data-for='services']");
    if (!bar) return;
    const cards = [...list.querySelectorAll("a.service")];
    const status = bar.nextElementSibling?.classList.contains("filter-status") ? bar.nextElementSibling : null;

    // One name per card so the browser can animate each card to its new place.
    cards.forEach((card, i) => { card.closest("li").style.viewTransitionName = `service-${i}`; });

    const apply = (btn) => {
      const cat = btn.dataset.category;
      bar.querySelectorAll(".filter-btn").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      let shown = 0;
      cards.forEach((card) => {
        const match = card.hasAttribute(cat);
        card.closest("li").hidden = !match;
        if (match) shown++;
      });
      if (status) status.textContent = cat === "all" ? "" : `Pokazano ${COUNT(shown)}`;
    };

    bar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn || btn.classList.contains("active")) return;
      // Fixes the Zespół script's fallback, which fell through to startViewTransition.
      if (!document.startViewTransition) return apply(btn);
      document.startViewTransition(() => apply(btn));
    });
  }

  const start = async () => {
    const list = document.querySelector("ul.services");
    if (!list) return;
    if (!list.querySelector("a.service[all]")) await injectMarkup(list);
    initFilter(list);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();
