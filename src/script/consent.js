// Cookie banner (CookieConsent v3, /script/cookieconsent.umd.js) wired to Google Consent
// Mode v2. The defaults (all denied, or the visitor's earlier choice) are set in
// sitelayout.njk before Google Tag Manager loads; this sends the updates.
//   analytics → Google Analytics 4 (analytics_storage)
//   marketing → Google Ads conversions + Google Maps embeds (ad_* signals)
// Footer link "Ustawienia cookies" (data-cc="show-preferencesModal") reopens the settings.

const POLICY_URL = "/polityka-prywatnosci/";

function updateGoogleConsent() {
  const analytics = CookieConsent.acceptedCategory("analytics") ? "granted" : "denied";
  const marketing = CookieConsent.acceptedCategory("marketing") ? "granted" : "denied";
  gtag("consent", "update", {
    analytics_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  });
  gtag("set", "ads_data_redaction", marketing === "denied");
  if (marketing === "granted") loadMaps();
}

// Google Maps embeds (Kontakt): <div class="map-embed" data-src="…"> with a
// "Pokaż mapę" button. Loaded on click, or right away once marketing is accepted.
function loadMap(box) {
  if (box.querySelector("iframe")) return;
  const iframe = document.createElement("iframe");
  iframe.src = box.dataset.src;
  iframe.title = box.dataset.title || "Mapa Google";
  iframe.loading = "lazy";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  box.replaceChildren(iframe);
  box.classList.add("loaded");
}

function loadMaps() {
  document.querySelectorAll(".map-embed[data-src]").forEach(loadMap);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".map-embed[data-src] .map-embed-load").forEach((button) =>
    button.addEventListener("click", () => loadMap(button.closest(".map-embed"))),
  );

  CookieConsent.run({
    guiOptions: {
      consentModal: { layout: "box", position: "bottom left", equalWeightButtons: true },
      preferencesModal: { layout: "box", equalWeightButtons: true },
    },

    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: { autoClear: { cookies: [{ name: /^_ga/ }] } },
      marketing: { autoClear: { cookies: [{ name: /^_gcl/ }] } },
    },

    onConsent: updateGoogleConsent,
    onChange: updateGoogleConsent,

    language: {
      default: "pl",
      translations: {
        pl: {
          consentModal: {
            title: "Pliki cookies",
            description:
              "Używamy niezbędnych plików cookies, żeby strona działała. Za Twoją zgodą użyjemy też cookies analitycznych (Google Analytics), żeby wiedzieć, jak korzystasz ze strony, i marketingowych (Google Ads, Mapy Google), żeby mierzyć skuteczność naszych reklam. " +
              `Szczegóły znajdziesz w <a href="${POLICY_URL}">polityce prywatności</a>.`,
            acceptAllBtn: "Akceptuję wszystkie",
            acceptNecessaryBtn: "Odrzuć",
            showPreferencesBtn: "Ustawienia",
          },
          preferencesModal: {
            title: "Ustawienia cookies",
            acceptAllBtn: "Akceptuję wszystkie",
            acceptNecessaryBtn: "Odrzuć wszystkie",
            savePreferencesBtn: "Zapisz wybór",
            closeIconLabel: "Zamknij",
            sections: [
              {
                description:
                  "Możesz zdecydować, na które pliki cookies się zgadzasz. Zgodę możesz w każdej chwili zmienić lub wycofać, klikając „Ustawienia cookies” w stopce strony.",
              },
              {
                title: "Niezbędne",
                description:
                  "Potrzebne do działania strony, m.in. do zapamiętania Twojego wyboru w tym oknie. Nie można ich wyłączyć.",
                linkedCategory: "necessary",
              },
              {
                title: "Analityczne",
                description:
                  "Google Analytics: anonimowe statystyki odwiedzin, dzięki którym wiemy, które treści są pomocne.",
                linkedCategory: "analytics",
                cookieTable: {
                  headers: { name: "Nazwa", domain: "Dostawca", desc: "Cel" },
                  body: [
                    { name: "_ga, _ga_*", domain: "Google", desc: "Rozróżnianie odwiedzających i sesji" },
                  ],
                },
              },
              {
                title: "Marketingowe",
                description:
                  "Google Ads: mierzenie, czy nasze reklamy prowadzą do umówienia wizyty. Mapy Google na stronie Kontakt: mapa ustawia własne pliki cookies Google.",
                linkedCategory: "marketing",
                cookieTable: {
                  headers: { name: "Nazwa", domain: "Dostawca", desc: "Cel" },
                  body: [
                    { name: "_gcl_au, _gcl_aw", domain: "Google", desc: "Pomiar konwersji z reklam" },
                    { name: "NID i inne", domain: "Google (Mapy)", desc: "Działanie osadzonej mapy" },
                  ],
                },
              },
              {
                title: "Więcej informacji",
                description: `Pełne informacje o przetwarzaniu danych znajdziesz w <a href="${POLICY_URL}">polityce prywatności</a>.`,
              },
            ],
          },
        },
      },
    },
  });
});
