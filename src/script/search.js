// Site-wide search (/szukaj/), built on the Pagefind UI.
// ?q=… starts a search, ?sekcja=… preselects a section filter (Artykuły page form).
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";
  const section = params.get("sekcja");

  const search = new PagefindUI({
    element: "#search",
    showSubResults: true,
    showImages: false,
    autofocus: !query,
    translations: { placeholder: "Czego szukasz?" },
  });

  if (section) search.triggerFilters({ Sekcja: [section] });
  if (query) search.triggerSearch(query);

  // keep the query in the address, so a search can be shared and survives going back
  const input = document.querySelector("#search .pagefind-ui__search-input");
  input?.addEventListener("input", () => {
    const url = new URL(window.location);
    input.value ? url.searchParams.set("q", input.value) : url.searchParams.delete("q");
    history.replaceState(null, "", url);
  });
});
