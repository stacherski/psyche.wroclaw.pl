// Published articles, newest first (same date → higher id first): the pagination
// source for the Artykuły list and the article pages. Read fresh rather than
// require()d, so no other code sorting or reversing articles.json can affect it.
const fs = require("fs");
const path = require("path");

module.exports = () =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "articles.json"), "utf8"))
    .filter((article) => article.published)
    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
