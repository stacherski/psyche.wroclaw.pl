const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
const fs = require("fs");
// const path = require('path')
// const esbuild = require('esbuild')

module.exports = function (eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    // output image formats
    formats: ["avif", "webp", "jpeg"],

    // output image widths
    widths: ["auto"],

    // optional, attributes assigned on <img> nodes override these values
    htmlOptions: {
      imgAttributes: {
        loading: "lazy",
        decoding: "async",
      },
      pictureAttributes: {},
    },
  });

  // Pass through static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/media");
  eleventyConfig.addPassthroughCopy("src/script");

  // ─── FILTERS ──────────────────────────────────────────────────────────────

  // limit reversed array to 15 records only
  eleventyConfig.addFilter("firstBatch", (collection) => {
    return collection.reverse().slice(0, 15);
  });

  // filter used with partials/team.njk for when it is being used
  // on services page details to display only those team members offering current service
  eleventyConfig.addFilter("byMember", (collection, members) => {
    const displayMembers = members
      .split(";")
      .map((s) => s.trim().toLowerCase());

    return collection.filter((item) =>
      displayMembers.includes(item.fullName.toLowerCase()),
    );
  });

  // filer used with partials/service.njk when services are displayed on team member detail page
  eleventyConfig.addFilter("byTeamMember", (collection, fullName) => {
    if (!fullName) return collection;

    const normalizedName = fullName.toLowerCase();

    return collection.filter((item) => {
      if (!item.team) return false;
      const teamMembers = item.team
        .split(";")
        .map((s) => s.trim().toLowerCase());
      return teamMembers.includes(normalizedName);
    });
  });

  eleventyConfig.addFilter("byLocationTeam", (collection, locationTeam) => {
    if (!locationTeam) return collection;

    const locationMembers = locationTeam
      .split(";")
      .map((s) => s.trim().toLowerCase());

    return collection.filter((item) => {
      if (!item.team) return false;
      const itemTeamMembers = item.team
        .split(";")
        .map((s) => s.trim().toLowerCase());
      return itemTeamMembers.some((member) => locationMembers.includes(member));
    });
  });

  // filter used on location detail page to show which services are available at that location
  eleventyConfig.addFilter("byService", (locations, serviceName) => {
    if (!serviceName) return locations;

    const normalizedService = serviceName.toLowerCase();

    return locations.filter((location) => {
      if (!location.services) return false;
      const locationServices = location.services
        .split(";")
        .map((s) => s.trim().toLowerCase());
      return locationServices.includes(normalizedService);
    });
  });

  // filter used on location detail page to show which team members are available at that location
  eleventyConfig.addFilter("byTeamMemberLocation", (locations, fullName) => {
    if (!fullName) return locations;

    const normalizedName = fullName.toLowerCase();

    return locations.filter((location) => {
      if (!location.team) return false;
      const locationTeam = location.team
        .split(";")
        .map((s) => s.trim().toLowerCase());
      return locationTeam.includes(normalizedName);
    });
  });

  // general filter for published key
  eleventyConfig.addFilter("byPublished", (collection) => {
    return collection.filter((item) => item.published);
  });

  // general filter for sorting key
  eleventyConfig.addFilter("bySorting", (collection) => {
    return collection.sort((a, b) => {
      return b.sorting - a.sorting;
    });
  });

  const map = {
    ą: "a",
    ć: "c",
    ę: "e",
    ł: "l",
    ń: "n",
    ó: "o",
    ś: "s",
    ż: "z",
    ź: "z",
  };

  eleventyConfig.addFilter("slugify", (str) => {
    return str
      .toLowerCase()
      .replace(/[ąćęłńóśżź]/g, (m) => map[m])
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  });

  // ─── COLLECTIONS ──────────────────────────────────────────────────────────

  eleventyConfig.addCollection("teamPages", (collectionApi) => {
    const team = require("./src/_data/team.json");
    return team;
  });

  eleventyConfig.addCollection("servicesPages", (collectionApi) => {
    const services = require("./src/_data/services.json");
    return services;
  });

  eleventyConfig.addCollection("locationsPages", (collectionApi) => {
    const locations = require("./src/_data/locations.json");
    return locations;
  });

  eleventyConfig.addCollection("pricesPages", (collectionApi) => {
    const prices = require("./src/_data/prices.json");
    return prices;
  });

  eleventyConfig.addCollection("articlesPages", (collectionApi) => {
    const articles = require("./src/_data/articles.json");
    return articles;
  });
  // ─── ELEVENTY CONFIG ──────────────────────────────────────────────────────

  // eleventyConfig.on("eleventy.before", () => {
  //   if (fs.existsSync("_site")) {
  //     fs.rmSync("_site", { recursive: true, force: true });
  //   }
  // });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes", // relative to input directory
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
