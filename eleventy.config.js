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

    // write generated images as static files into _site/media/
    outputDir: "./_site/media/",
    urlPath: "/media/",

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
  eleventyConfig.addPassthroughCopy("src/robots.txt");


  // ─── FILTERS ──────────────────────────────────────────────────────────────

  // limit reversed array to 15 records only
  eleventyConfig.addFilter("firstBatch", (collection) => {
    return collection.reverse().slice(0, 15);
  });

  // first n items (llms-full.txt article list)
  eleventyConfig.addFilter("head", (collection, n) => collection.slice(0, n));

  eleventyConfig.addFilter("reverse", (collection) => {
    return collection.reverse();
  });


  // filter used with partials/team.njk for when it is being used
  // on services page details to display only those team members offering current service
  eleventyConfig.addFilter("byMember", (collection, members) => {
    const displayMembers = members
      .split(";")
      .map((s) => s.trim().toLowerCase());

    return collection.filter(
      (item) =>
        item.published?.toLowerCase() === "yes" &&
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

  // filter used on service detail page to show only prices applicable to that service
  eleventyConfig.addFilter("byServicePrices", (collection, priceNames) => {
    if (!priceNames) return collection;

    const priceList = priceNames
      .split(";")
      .map((s) => s.trim().toLowerCase());

    return collection.filter((item) =>
      priceList.includes(item.fullName.toLowerCase()),
    );
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

  // general filter for sorting by date descending (newest first); same date → higher id first
  eleventyConfig.addFilter("byDateDesc", (collection) => {
    return collection.sort((a, b) => {
      return new Date(b.date) - new Date(a.date) || (b.id || 0) - (a.id || 0);
    });
  });

  // FAQ entries for one service page (partials/faq.njk), with the answer split into
  // paragraphs and the sources of web-researched answers shortened to their domain
  eleventyConfig.addFilter("faqFor", (faq, slug) => {
    return faq
      .filter((item) => item.service === slug)
      .map((item) => ({
        id: `${slug}-${eleventyConfig.getFilter("slugify")(item.question)}`,
        question: item.question,
        answer: item.answer,
        paragraphs: item.answer.split("\n").map((p) => p.trim()).filter(Boolean),
        sources:
          item.origin === "web"
            ? (item.sources || []).map((url) => ({
                url,
                domain: new URL(url).hostname.replace(/^www\./, ""),
              }))
            : [],
      }));
  });

  // services that have at least one FAQ entry (sections of /najczestsze-pytania/)
  eleventyConfig.addFilter("withFaq", (services, faq) => {
    const slugs = new Set(faq.map((item) => item.service));
    return services.filter((service) =>
      slugs.has(eleventyConfig.getFilter("slugify")(service.fullName)),
    );
  });

  // schema.org FAQPage structured data for the same entries
  eleventyConfig.addFilter("faqJsonLd", (faqs) => {
    const data = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer.split(/\s+/).join(" "),
        },
      })),
    };
    // escape "<" so an answer can never close the surrounding <script> tag
    return JSON.stringify(data).replace(/</g, "\\u003c");
  });

  // ─── STRUCTURED DATA (schema.org JSON-LD) ────────────────────────────────

  const SITE = "https://psyche.wroclaw.pl";

  // the clinic, both locations, opening hours and the phone registration hours
  eleventyConfig.addFilter("clinicJsonLd", (locations) => {
    const day = (days, opens, closes) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens,
      closes,
    });
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const openingHours = [day(weekdays, "09:00", "21:00"), day(["Saturday"], "09:00", "15:00")];
    const place = (location) => ({
      address: {
        "@type": "PostalAddress",
        streetAddress: location.address,
        postalCode: location.postalcode,
        addressLocality: location.city,
        addressCountry: "PL",
      },
      // locations.json has lat/lon the wrong way round (lat 16.99 is Wrocław's longitude)
      geo: {
        "@type": "GeoCoordinates",
        latitude: location.lon,
        longitude: location.lat,
      },
      image: `${SITE}/media/${location.coverimage}`,
    });
    const published = locations.filter((location) => location.published);
    const [main, ...others] = published;

    const data = {
      "@context": "https://schema.org",
      "@type": "MedicalClinic",
      "@id": `${SITE}/#organization`,
      name: "Centrum PSYCHE Wrocław",
      description:
        "Prywatna poradnia zdrowia psychicznego i centrum psychoterapii we Wrocławiu: psycholog, psychoterapeuta, psycholog dziecięcy, logopeda, diagnoza (ADOS-2, DIVA-5, MMPI-2, QEEG) i EEG Biofeedback dla dzieci, młodzieży i dorosłych.",
      url: SITE,
      logo: `${SITE}/media/psyche-favicon.svg`,
      telephone: "+48 668 093 234",
      email: "info@psyche.wroclaw.pl",
      sameAs: ["https://fb.me/centrumpsyche"],
      areaServed: { "@type": "City", name: "Wrocław" },
      currenciesAccepted: "PLN",
      paymentAccepted: "Gotówka, karta płatnicza, przelew",
      ...place(main),
      openingHoursSpecification: openingHours,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "rejestracja",
        telephone: "+48 668 093 234",
        email: "info@psyche.wroclaw.pl",
        availableLanguage: "pl",
        hoursAvailable: day(weekdays, "09:00", "18:00"),
      },
      department: others.map((location) => ({
        "@type": "MedicalClinic",
        name: /małopanewska/i.test(location.fullName)
          ? "Psyche KIDS – Centrum PSYCHE Wrocław"
          : `Centrum PSYCHE Wrocław – ${location.fullName}`,
        url: `${SITE}/gabinety/${eleventyConfig.getFilter("slugify")(location.fullName)}/`,
        telephone: "+48 668 093 234",
        ...place(location),
      })),
    };
    return JSON.stringify(data).replace(/</g, "\\u003c");
  });

  // breadcrumb trail for the current page, following the URL; section names match bcrumb.njk
  const SECTION_NAMES = {
    "o-nas": "O nas",
    artykuly: "Artykuły",
    oferta: "Oferta",
    "zespół": "Zespół",
    gabinety: "Gabinety",
    cennik: "Cennik",
    kontakt: "Kontakt",
    "pracuj-z-nami": "Pracuj z nami",
    regulamin: "Regulamin",
    "polityka-ochrony-małoletnich": "Polityka Ochrony Małoletnich",
    "najczestsze-pytania": "Najczęstsze pytania",
  };

  eleventyConfig.addFilter("breadcrumbJsonLd", (url, title) => {
    const segments = decodeURI(url).split("/").filter(Boolean);
    const items = [{ name: "Psyche", url: `${SITE}/` }];
    let path = "";
    segments.forEach((segment, i) => {
      path += `/${segment}`;
      if (segment.startsWith("@")) return; // article id, not a page of its own
      const last = i === segments.length - 1;
      let name = SECTION_NAMES[segment];
      if (last) name = /^\d+$/.test(segment) ? `${title} – strona ${segment}` : name || title;
      if (name) items.push({ name, url: SITE + encodeURI(`${path}/`) });
    });
    const data = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    };
    return JSON.stringify(data).replace(/</g, "\\u003c");
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
    const articles = require("./src/_data/articles.json").reverse();
    return articles
  });


  // ─── DEV SERVER ───────────────────────────────────────────────────────────

  eleventyConfig.setServerOptions({
    middleware: [
      function (req, res, next) {
        if (req.url.endsWith(".txt")) {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
        }
        next();
      },
    ],
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
