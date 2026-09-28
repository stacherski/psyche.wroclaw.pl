// Services still offered ("published": true in services.json): the source for the
// service pages. An unpublished service's page is no longer built; its address is
// redirected in redirects.json (or falls back to /oferta/ in _redirects).
const fs = require("fs");
const path = require("path");

module.exports = () =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "services.json"), "utf8"))
    .filter((service) => service.published);
