// Service filter on the homepage and the Oferta index. Works like the Zespół page:
// the same .filters / .filter-btn markup, the same attribute tagging on each card
// (all kids youth adult online) and the same View Transitions animation.
// Markup and attributes are rendered by partials/services.njk.
(() => {
  const COUNT = (n) => `${n} ${n === 1 ? "usługa" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "usługi" : "usług"}`;

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
      if (!document.startViewTransition) return apply(btn);
      document.startViewTransition(() => apply(btn));
    });
  }

  const start = () => {
    const list = document.querySelector("ul.services");
    if (list) initFilter(list);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();
