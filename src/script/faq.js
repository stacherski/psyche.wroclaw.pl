// Every FAQ question has its own anchor (#<service>-<question>). Opening such a link
// expands that question; Chromium does this natively, other browsers need the help.
(() => {
  const openFromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const item = id && document.getElementById(id);
    if (!item || !item.matches("details.faq-item")) return;
    item.open = true;
    item.scrollIntoView({ block: "start" });
  };
  addEventListener("hashchange", openFromHash);
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", openFromHash) : openFromHash();
})();
