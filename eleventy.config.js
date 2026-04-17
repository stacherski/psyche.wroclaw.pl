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

  eleventyConfig.addFilter("byPublished", (collection, published) => {
    return collection.filter((item) => item.published === published);
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
