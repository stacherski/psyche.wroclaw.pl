const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
const fs = require("fs");
const path = require("path");
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

  // first n items (homepage article list, llms-full.txt article list)
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

  // "2026-09-03" → "3 września 2026"
  const DATE_FORMAT = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  eleventyConfig.addFilter("dateDisplay", (date) => DATE_FORMAT.format(new Date(date)));

  // section a page is listed under in the search filters (/szukaj/); no section → no filter
  const SEARCH_SECTIONS = [
    ["/o-nas/artykuly/@", "Artykuły"],
    ["/oferta/", "Oferta"],
    ["/zespół/", "Zespół"],
    ["/gabinety/", "Gabinety"],
    ["/najczestsze-pytania/", "Najczęstsze pytania"],
  ];
  eleventyConfig.addFilter("searchSection", (url) => {
    const match = SEARCH_SECTIONS.find(([prefix]) => (url || "").startsWith(prefix));
    return match ? match[1] : "";
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

  // ─── STRUCTURED DATA (schema.org JSON-LD) ────────────────────────────────

  const SITE = "https://psyche.wroclaw.pl";
  const NAME = "Centrum PSYCHE Wrocław";
  const ORG = { "@id": `${SITE}/#organization` };
  const slugOf = (str) => eleventyConfig.getFilter("slugify")(str);

  // absolute URL of a site path, percent-encoded the same way as sitemap.xml
  const abs = (path) => SITE + encodeURI(path);
  const serviceUrl = (service) => abs(`/oferta/${slugOf(service.fullName)}/`);
  const memberUrl = (fullName) => abs(`/zespół/${slugOf(fullName)}/`);
  const mediaUrl = (file) => (file && fs.existsSync(`src/media/${file}`) ? abs(`/media/${file}`) : undefined);

  // "200,00" in prices.json → "200.00"
  const amount = (price) => price.replace(/\s/g, "").replace(",", ".");
  const splitList = (str) => (str || "").split(";").map((s) => s.trim().toLowerCase()).filter(Boolean);

  // an HTML fragment from the data files as plain text
  const ENTITIES = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
  const plain = (html) =>
    (html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
      .replace(/&(\w+);/g, (entity, name) => ENTITIES[name] ?? entity)
      .replace(/\s+/g, " ")
      .trim();

  // escape "<" so a value can never close the surrounding <script> tag
  const ld = (data) => JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");

  // a team member, linked to their page and to the Person on it
  const person = (fullName, team) => {
    const member = team.find((item) => item.fullName === fullName);
    return {
      "@type": "Person",
      name: fullName,
      ...(member && {
        "@id": `${memberUrl(member.fullName)}#person`,
        jobTitle: member.specialization,
        url: memberUrl(member.fullName),
      }),
    };
  };

  // schema.org FAQPage structured data for the entries of partials/faq.njk
  eleventyConfig.addFilter("faqJsonLd", (faqs, review, slug, team) => {
    const reviewed = review && !review.notReviewed.includes(slug);
    return ld({
      "@type": "FAQPage",
      ...(reviewed && {
        reviewedBy: person(review.reviewer, team),
        lastReviewed: review.date,
      }),
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer.split(/\s+/).join(" "),
        },
      })),
    });
  });

  // the clinic, both locations, opening hours, the phone registration hours
  // and the catalogue of services (each one described on its own page by serviceJsonLd)
  eleventyConfig.addFilter("clinicJsonLd", (locations, services, prices) => {
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
      ...(location.maplink && { hasMap: location.maplink }),
      image: `${SITE}/media/${location.coverimage}`,
    });
    const published = locations.filter((location) => location.published);
    const [main, ...others] = published;
    const amounts = prices
      .filter((price) => price.published === "Yes")
      .map((price) => Number(amount(price.price)));

    return ld({
      "@type": "MedicalClinic",
      ...ORG,
      name: NAME,
      description:
        "Prywatna poradnia zdrowia psychicznego i centrum psychoterapii we Wrocławiu: psycholog, psychoterapeuta, psycholog dziecięcy, logopeda, diagnoza (ADOS-2, DIVA-5, MMPI-2, QEEG) i EEG Biofeedback dla dzieci, młodzieży i dorosłych.",
      url: `${SITE}/`,
      logo: `${SITE}/media/psyche-logo-square.png`,
      telephone: "+48 668 093 234",
      email: "info@psyche.wroclaw.pl",
      sameAs: ["https://fb.me/centrumpsyche"],
      areaServed: { "@type": "City", name: "Wrocław" },
      medicalSpecialty: ["Psychiatric", "Pediatric", "SpeechPathology", "DietNutrition"],
      priceRange: `${Math.min(...amounts)}–${Math.max(...amounts)} zł`,
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
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Oferta usług Centrum PSYCHE",
        url: `${SITE}/oferta/`,
        itemListElement: services
          .filter((service) => service.published)
          .map((service) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              "@id": `${serviceUrl(service)}#service`,
              name: service.fullName,
              url: serviceUrl(service),
            },
          })),
      },
      department: others.map((location) => {
        const url = abs(`/gabinety/${slugOf(location.fullName)}/`);
        return {
          "@type": "MedicalClinic",
          "@id": `${url}#clinic`,
          name: /małopanewska/i.test(location.fullName)
            ? `Psyche KIDS – ${NAME}`
            : `${NAME} – ${location.fullName}`,
          url,
          parentOrganization: ORG,
          telephone: "+48 668 093 234",
          ...place(location),
          openingHoursSpecification: openingHours,
        };
      }),
    });
  });

  // the site itself (homepage only), so search results show its name
  eleventyConfig.addShortcode("websiteJsonLd", () =>
    ld({
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: NAME,
      alternateName: ["Centrum Psyche", "Psyche"],
      url: `${SITE}/`,
      inLanguage: "pl",
      publisher: ORG,
    }),
  );

  // one service (/oferta/…) with the prices listed in its Cennik table
  eleventyConfig.addFilter("serviceJsonLd", (service, prices) => {
    const url = serviceUrl(service);
    const names = splitList(service.prices);
    const offers = prices.filter((price) => names.includes(price.fullName.toLowerCase()));
    const image = mediaUrl(service.poster01);
    return ld({
      "@type": "Service",
      "@id": `${url}#service`,
      name: service.fullName,
      description: plain(service.metaDescription),
      url,
      ...(image && { image }),
      provider: ORG,
      areaServed: { "@type": "City", name: "Wrocław" },
      ...(offers.length && {
        offers: offers.map((price) => ({
          "@type": "Offer",
          name: price.fullName,
          price: amount(price.price),
          priceCurrency: "PLN",
          url,
        })),
      }),
    });
  });

  // one team member (/zespół/…) with the services listed under "Moje usługi"
  eleventyConfig.addFilter("personJsonLd", (member, services) => {
    const url = memberUrl(member.fullName);
    const image = mediaUrl(member.photo);
    const offered = eleventyConfig.getFilter("byTeamMember")(services, member.fullName);
    return ld({
      "@type": "Person",
      "@id": `${url}#person`,
      name: member.fullName,
      jobTitle: member.specialization,
      ...(member.tagline && { description: plain(member.tagline) }),
      url,
      ...(image && { image }),
      worksFor: ORG,
      ...(offered.length && {
        knowsAbout: offered.map((service) => ({
          "@type": "Service",
          "@id": `${serviceUrl(service)}#service`,
          name: service.fullName,
        })),
      }),
    });
  });

  // one article (/o-nas/artykuly/@id/…); the clinic is the author unless one is named
  eleventyConfig.addFilter("articleJsonLd", (article, pageUrl, team) => {
    const url = abs(pageUrl);
    const image = mediaUrl(article.Images);
    const clinic = { ...ORG, name: NAME, url: `${SITE}/` };
    return ld({
      "@type": "Article",
      headline: article.title,
      description: plain(article.textShort),
      url,
      mainEntityOfPage: url,
      inLanguage: "pl",
      datePublished: article.date,
      ...(image && { image }),
      author: article.author ? person(article.author, team) : clinic,
      publisher: { ...clinic, logo: `${SITE}/media/psyche-logo-square.png` },
      ...(article.sourceLink && { isBasedOn: article.sourceLink }),
    });
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
    szukaj: "Szukaj",
  };

  eleventyConfig.addFilter("breadcrumbJsonLd", (url, title) => {
    const segments = decodeURI(url).split("/").filter(Boolean);
    const items = [{ name: "Psyche", url: `${SITE}/` }];
    let path = "";
    segments.forEach((segment, i) => {
      path += `/${segment}`;
      const last = i === segments.length - 1;
      // article id, not a page of its own, unless the article URL has no title after it
      if (segment.startsWith("@") && !last) return;
      let name = SECTION_NAMES[segment];
      if (last) name = /^\d+$/.test(segment) ? `${title} – strona ${segment}` : name || title;
      if (name) items.push({ name, url: abs(`${path}/`) });
    });
    return ld({
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
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
    const articles = require("./src/_data/articles.json").reverse();
    return articles
  });


  // ─── PAGEFIND INDEX ───────────────────────────────────────────────────────

  // site-wide search (/szukaj/): index the built pages into _site/pagefind/
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const outputPath = path.join(dir.output, "pagefind");

    // delete the stale index so removed pages don't linger
    fs.rmSync(outputPath, { recursive: true, force: true });

    const pagefind = await import("pagefind");
    const { index } = await pagefind.createIndex();
    const { page_count } = await index.addDirectory({ path: dir.output });
    await index.writeFiles({ outputPath });
    await pagefind.close();
    console.log("[pagefind] Indexed %i page(s) → %s", page_count, outputPath);
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
