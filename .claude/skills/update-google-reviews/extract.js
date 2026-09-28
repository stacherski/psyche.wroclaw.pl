// Run in the Google reviews page of one profile:
//   https://www.google.com/local/business/<profile id>/customers/reviews
// after scrolling to the bottom (so every review is loaded).
//
// Step 1 – paste this whole file with javascript_exec. It expands the shortened
//          reviews ("Wyświetl całą opinię"), parses them and returns
//          [count, number of chunks].
// Step 2 – read the JSON back with  window.__chunk(0), window.__chunk(1), …
//          The browser tool truncates results at roughly 700–1000 characters and
//          blocks some (e.g. a bare "55555" looks like Base64), so keep chunks small
//          and never return star strings on their own.
(async () => {
  const expand = [...document.querySelectorAll("*")].filter(
    (e) => e.childElementCount === 0 && e.textContent.trim() === "Wyświetl całą opinię",
  );
  expand.forEach((e) => e.click());
  await new Promise((r) => setTimeout(r, 1200));

  const skip = /^(open_in_new|Odpowiedz|Edytuj|Usuń|Wyświetl całą opinię|Mniej)$/;
  window.__reviews = [...document.querySelectorAll("article")].map((article) => {
    // the owner's reply sits in the article's parent, not in the article
    const lines = article.parentElement.innerText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s && !skip.test(s));
    const starsLine = lines.findIndex((l) => /^(star|star_border|star_half)+\s/.test(l));
    // "5 na 5 gwiazdek" – the space is a non-breaking one, so match loosely
    const label = [...article.querySelectorAll("[aria-label]")]
      .map((x) => x.getAttribute("aria-label"))
      .find((l) => /gwiazd/.test(l)) || "";
    const owner = lines.indexOf("Właściciel");
    return {
      name: lines[0].replace(/open_in_new/g, "").trim(),
      stars: Number(label.trim()[0]),
      date: (lines[starsLine] || "").replace(/^(star_border|star_half|star)+/, "").trim(),
      hasReply: owner > -1,
      text: lines.slice(starsLine + 1, owner > -1 ? owner - 1 : undefined).join("\n"),
    };
  });
  window.__json = JSON.stringify(window.__reviews);
  window.__chunk = (i, size = 700) => window.__json.slice(i * size, (i + 1) * size);
  return [window.__reviews.length, Math.ceil(window.__json.length / 700)];
})();
