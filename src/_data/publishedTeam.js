// Team members still working at Psyche ("published": "Yes" in team.json): the source
// for the team pages, lists and menus. A former member keeps their team.json entry
// with "published": "No"; their page is no longer built and _redirects sends its
// address to "redirectTo" (or to /zespół/ when it is not set).
const fs = require("fs");
const path = require("path");

module.exports = () =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "team.json"), "utf8"))
    .filter((member) => member.published?.toLowerCase() === "yes");
