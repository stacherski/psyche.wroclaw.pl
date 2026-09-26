# Psyche design lab: handover

Working notes for the psyche.wroclaw.pl homepage redesign. The goal is to change the **visual design without changing structure**. Every change is CSS loaded after the site's existing stylesheets, so no HTML or template edits are needed.

Last updated: 2026-09-24 (drawer and body-font change added).

---

## TL;DR

- `lab/` holds a **local copy of the live homepage** plus a **design-token layer** on top of it.
- There are four switchable directions: **Current**, **A · Refine**, **C · Blend** (recommended) and **B · Fresh**.
- **C · Blend** = Refine's teal system + **Fraunces** headings + **Newsreader** paragraphs + **Instrument Sans** for navigation and UI + **coral** as teal's complementary colour + a **tertiary palette** (ochre, sage, berry, sky).
- In C the menu opens as a **detached, frosted anthracite drawer on the left**.
- Service cards in C "pop out" on hover (scale 1.1) while a coral fill **passes through** the card. There are two fill modes, **Rise** (default) and **Sweep**.
- Nothing is committed yet. `lab/` is untracked in the repo, and the real site in `src/` is untouched.

---

## Run it

The pages use root-relative paths (`/css/…`, `/design/…`), so serve `lab/` as the web root. Opening `index.html` as a `file://` URL will not work.

```bash
cd lab
python3 design/serve.py        # http://localhost:8765, sends Cache-Control: no-store
```

Use `design/serve.py` rather than `python3 -m http.server`. The plain server sends no cache headers, so browsers keep showing old copies of `tokens.*.css` and the scripts after you rebuild, which looks as if the direction switcher isn't working. The switcher also adds a `?v=` stamp to the tokens stylesheet it loads, as a second safeguard. If a browser still shows an old version from before this change, hard-reload once (Cmd+Shift+R).

Then open:
- http://localhost:8765/: the homepage with the direction switcher (bottom-left)
- http://localhost:8765/design/proposal.html: the token reference, palette, contrast tables and change list

In VS Code, the *Live Server* extension also works if you open `lab/` as the workspace root.

**Switcher controls** (local only; `design/switcher.js` is not part of the site):

| Key | Action |
|---|---|
| `1` / `2` / `3` / `4` | Current / A · Refine / C · Blend / B · Fresh |
| `F` | Toggle the card fill between **Rise** and **Sweep** (C only) |
| `P` | Cycle service audience tags: **Pill** → **Pill + bar** → **Bar** (C only) |
| `?dir=blend` | Deep-link a direction (the choice is also remembered in localStorage) |

**Caching:** handled by `serve.py` (no-store) plus the switcher's `?v=` stamp. The preview config (`.claude/launch.json`, name `psyche-local`) runs `serve.py`.

---

## Folder map

```
lab/
├── HANDOVER.md             ← this file
├── index.html              ← mirrored homepage + 3 injected lines (tokens link, switcher, service filter)
├── index.original.html     ← untouched copy of the live page, for diffing
├── oferta/                 ← mirrored Oferta index + 20 service pages (each with index.original.html)
├── css/  media/  script/   ← mirrored from the live site (do not edit; they stand in for src/)
├── design/                 ← ALL the actual work lives here
│   ├── tokens.py           ← SOURCE OF TRUTH: every token × every direction
│   ├── patch.css           ← SOURCE: component layer (restyles existing selectors via tokens)
│   ├── proposal.tpl.html   ← SOURCE: template for the proposal page
│   ├── build.py            ← generates the files below
│   ├── make_avatars.py     ← nav avatar thumbnails from src/ team photos → media/avatars + avatars.json
│   ├── avatars.json        ← generated: slug → avatar path
│   ├── audiences.json      ← HAND-CURATED: service slug → kids / youth / adult / online
│   ├── label-metrics.json  ← measured: '·' positions per label, for the Pill colour cuts
│   ├── tokens.current.css  ← generated: current system as tokens (no visual change)
│   ├── tokens.refine.css   ← generated: A tokens + patch
│   ├── tokens.blend.css    ← generated: C tokens + patch (+ sweep preset)
│   ├── tokens.fresh.css    ← generated: B tokens + patch
│   ├── proposal.html       ← generated: token reference / palette / contrast
│   ├── mirror.py           ← mirror live pages into the lab (python3 mirror.py /oferta/ --children)
│   ├── faq.json            ← FAQ entries (service, question, answer, origin, sources) — 134 for 20 pages
│   ├── merge_faq.py        ← validate + merge per-service FAQ parts into faq.json
│   ├── build_faq.py        ← render faq.json into lab/oferta/<slug>/ as <details> accordions + FAQPage JSON-LD
│   ├── faq-tone-changes.md ← log of the tone pass (old → new answer, why the facts are unchanged)
│   ├── service-filter.js   ← homepage service filter (lab injects markup; behaviour is production-ready)
│   ├── serve.py            ← lab server with caching disabled (use instead of http.server)
│   └── switcher.js         ← lab-only direction + fill toggle
└── site/                   ← ⚠️ STALE duplicate from an early snapshot. Safe to delete.
```

### Edit → build loop

Never hand-edit the generated `tokens.*.css` or `proposal.html` files; `build.py` overwrites them.

1. Change values in `design/tokens.py` and/or rules in `design/patch.css` (or `proposal.tpl.html`).
2. Rebuild:
   ```bash
   cd lab/design && python3 build.py
   ```
3. Hard-reload the browser.

`tokens.py` structure:
- `T`: a list of `(group, name, role, current, refine, fresh, status)`. `status` is `keep` (existing token name), `new` or `fix` (was undefined or broken).
- `BLEND`: overrides for C. Any token not listed falls back to Refine's value.
- `BLEND_SWEEP`: the alternative card-fill preset. It is emitted as `:root[data-card-fill="sweep"]`.
- `TERTIARY`: the four tertiary families (soft / base / strong).
- `CURRENT_CSS`: real CSS values for the "current" column wherever the table shows prose.

---

## What the audit found (current site)

- **Contrast:** white on brand teal `#018E87` is **4.0:1**, below AA for normal text; this covers the buttons, CTA bar and top bar. The white "Artykuły i Baza Wiedzy" heading on `#66CCC7` is **1.9:1**.
- **Two type scales disagree.** `main.css` uses fixed sizes and `typographies.css` uses fluid `clamp()`. As a result the hero h1 (32px) is smaller than every h2 (43px).
- **Body line-height** borrows `var(--font-size-h4)`.
- **Intro copy** is wrapped in `<strong>`, so it renders all bold. Lines run to about 120 characters.
- **Raleway's old-style figures** make phone numbers look uneven.
- **Variables used but never defined:** `--space-small`, `--border-radius-small`, `--font-size-h6`. `--border-radius-circle: var(50%)` is invalid.
- **Hard-coded values:** `#333`, `#cacaca` and `#fff`; stray 30px, 4rem, 6rem and 1310px; the sub-page header uses two extra teals (`#3FA299`, `#3F8378`).
- **Live-server bug:** `/media/psyche-video.webm` is **0 bytes** (HTTP 200), so browsers fall back to the MP4.
- **Content typo:** "Wszystkie **arytkuły**" should be "artykuły".

---

## C · Blend: the recommended direction

### Colour roles

| Role | Tokens | Values |
|---|---|---|
| Primary (brand, everyday actions) | `--clr-base`, `--clr-base-strong`, `--clr-brand` | `#007A74`, `#0B5E59`, logo `#018E87` |
| Secondary (teal's complement; **booking only**) | `--clr-accent`, `--clr-accent-soft`, `--clr-accent-strong` | `#E8836B`, `#F6B39F`, `#B34A36` |
| Article band | `--clr-tint`, `--clr-on-tint` | peach `#FBEDE6`, heading `#0B5E59` |
| Neutrals | `--clr-surface`, `--clr-text`, `--clr-text-2`, `--clr-footer-bg` | `#F2F5F4`, `#1B2B2A`, `#3A4948`, `#12302E` |
| Tertiary (categories, badges, filters, illustration) | `--clr-{ochre,sage,berry,sky}-{soft,base,strong}` | see below |

Tertiary families. The strong shade reaches at least 5.2:1 on its own soft tint, and dark ink reaches at least 5.0:1 on the base shade.

| Family | soft | base | strong | Suggested use |
|---|---|---|---|---|
| Ochre (yellow-orange) | `#FCF3E3` | `#CE8F22` | `#885E16` | dzieci / Psyche KIDS |
| Sage (yellow-green) | `#EFF6E9` | `#79A857` | `#4D6C37` | on-line, wellbeing |
| Berry (red-violet) | `#F8E8F0` | `#CD84AB` | `#9C4071` | dorośli, pary |
| Sky (blue) | `#E7F1F9` | `#68A1CA` | `#31668C` | młodzież, diagnostyka |

**Rule:** tertiaries never style buttons, so teal and coral keep their meaning. They already drive the team-page category filters (`--clr-cat-*`), which previously used the named colours orange, blue, red and green.

### Type

- **Headings:** **Fraunces** (`"SOFT" 100`).
- **Paragraphs and prose lists:** **Newsreader**, a text serif, via `--font-text`.
- **Navigation, buttons, card titles, chips, hero info line, footer:** **Instrument Sans**, via `--font-regular`.
- All three are loaded from Google Fonts at the top of `tokens.blend.css`, and all cover Polish diacritics.
- The logo keeps Raleway (it is live SVG text).
- `font-size-adjust: 0.5` on the serif evens out its x-height against the sans.
- `main.css` pins `b, strong, i, em` to `--font-regular`. The patch makes them inherit inside prose; otherwise the `<strong>`-wrapped intro would stay in sans.
- The nav was briefly tried in the serif and reverted: uppercase serif items read too light at drawer size.

### Navigation drawer (C)

The drawer restyles the existing `nav.navigation-panel` and `.navigation-overlay`; all values are `--nav-*` tokens.

- **Position:** floats on the **left**, `--nav-gap` = `clamp(1.25rem, 3vw, 1.5rem)` (20–24px) from the top, left and bottom, max width `400px`, corner radius `1.25rem`.
- **Look:** anthracite `rgb(38 42 46 / .72)` with `backdrop-filter: blur(18px) saturate(140%)`, a faint white hairline and a soft shadow.
- **Items:** top-level items are Instrument Sans (not the paragraph serif) 600, uppercase, letter-spacing .06em. Sub-items are sentence case, weight 500. Items get rounded hover backgrounds and visible focus rings.
- **Motion:** slides in from the left (350ms) and is `visibility: hidden` when closed, so it can't be tabbed into. The page dimmer fades in instead of sliding from the right.
- **Mobile:** the drawer and dimmer stack above the site's bottom bar (`--nav-z` 850 vs the bar's 800), so the drawer isn't cut off.
- **A and B:** keep the original full-height panel on the right; their tokens reproduce it.
- **Moving the drawer to the right:** set `--nav-left: auto`, `--nav-right: var(--nav-gap)` and `--nav-hidden-x: calc(100% + 2 * var(--nav-gap))` in `BLEND`.
- **Specialist avatars:** each specialist under Zespół shows a 32px round photo (`--nav-avatar-*` tokens), with a soft ring that turns coral on hover or focus. Member rows have 6px padding around the avatar (`--nav-avatar-pad`) and a pill hover (`--nav-avatar-row-radius: 999px`), so the hover shape is concentric with the avatar: 16px avatar radius + 6px padding = 22px, half the 44px row. The sub-menu indent moves from padding to margin on these rows so the left gap matches. The avatar was kept at 32px rather than shrunk, so faces stay recognisable.
  - CSS only: the generic rule in `patch.css` targets `a[href^="/zespół/"] > span::before`. `build.py` appends one generated rule per person, `a[href="/zespół/<slug>/"] { --avatar: url(…) }`, from `design/avatars.json`.
  - Thumbnails are 96×96 JPEGs in `media/avatars/` (111 KB total), cropped around the face from the photos in `src/media/`. Run `python3 make_avatars.py && python3 build.py` from `lab/design` (needs macOS `sips`). Per-person crop fixes go in `CROP_Y`; Weronika's photo needs 30%.
  - The rules are scoped to `nav.navigation-panel.open`, so **no avatar downloads until the drawer is opened** (verified: 0 requests before, 20 after).
  - Someone without a generated avatar gets an empty translucent circle. **When the team changes, rerun the script.**
  - For production, a template approach would be sturdier: render an `<img>` from `team.json` in the nav partial (a markup change), or keep this CSS and have Eleventy generate the rules. The CSS version is here to respect the "no structure change" rule.
- **Close button:** the × now has a 36px square box (`--nav-close-size`) with a round hover. It sits `--nav-close-inset` (.75rem) from the drawer's right edge, which puts its centre on the same line as the sub-menu arrows (measured 39.0px vs 38.2px from the edge). Previously it was a bare 32px glyph about 14px further right.
- **Mobile bottom bar (C):** `.mobile_nav` is now detached like the drawer. It uses the same gap (20–24px from the left, right and bottom, plus the safe-area inset), the same 1.25rem radius, and the same frosted anthracite (`--nav-bg`, `--nav-backdrop`), hairline and shadow, via the `--mnav-*` tokens.
  - Items get rounded hover backgrounds and focus rings. Item padding is kept tight (.375rem .25rem) so all five labels fit a 320–375px phone (verified: 9px inset at both ends at 375px).
  - It still only shows ≤ 37.5rem, as the site CSS decides. A and B keep the full-width bar.
- **Menu button placement:** the button that opens the drawer is still top-right (that's markup). Only the close × sits inside the drawer.

### Service audiences (C)

Each homepage service card shows who it's for, echoing the team page's colour bars:
- **What it shows:** a small text label ("dzieci · młodzież · dorośli") in Instrument Sans 12px, muted, plus a 56×4px segmented bar under it. Segments use the tertiary category colours (`--clr-cat-kids` ochre, `--clr-cat-youth` sky, `--clr-cat-adult` berry), separated by 3px gaps.
- **On-line** is a delivery mode, not an audience, so it appears in the label text only, with no segment.
- **Text and colour:** the label means the meaning never depends on colour alone (WCAG 1.4.1), so no separate legend is needed. It's CSS `content`, which screen readers generally announce.
- **Hover:** on the coral fill, the bar sits on a small white track so the segments stay distinct.
- **Pill presets** (`data-aud-style` on `<html>`; toggle with the switcher's **Tags** button or the `P` key; the lab starts on Pill). Each card has one pseudo-element, so it's one pill per card, not one pill per group; separate pills would need markup.
  - `pill`: the colour code is the pill background, with **hard colour cuts centred on each "·"**. One group gives a single tint (`--clr-cat-*-tint`, i.e. `color-mix` 40% of the category colour into white; on-line uses sage). Text is ink, about 9.6:1 on every tint.
    - Cut positions come from `design/label-metrics.json`: the centre of each "·" in em, measured in the browser with the pill's exact text style (Instrument Sans 500, 0.75rem, letter-spacing .01em). `build.py` writes stops as `calc(.75rem + <cut>em)`, where .75rem is the pill's left padding.
    - A label that hasn't been measured falls back to a soft blend.
    - **Re-measure if the label font, weight, size, letter-spacing or wording changes.** Paste this into the browser console on the lab page (with C active), then copy the result into `label-metrics.json`:
      ```js
      await document.fonts.ready;
      const ps = getComputedStyle(document.querySelector('ul.services .service'), '::after');
      const labels = [...new Set([...document.querySelectorAll('ul.services .service')].map(c => getComputedStyle(c, '::after').content.slice(1, -1)))];
      const box = Object.assign(document.createElement('span'), { style: `position:absolute;white-space:nowrap;visibility:hidden;font:${ps.fontWeight} ${ps.fontSize} ${ps.fontFamily};letter-spacing:${ps.letterSpacing}` });
      document.body.append(box); const fs = parseFloat(ps.fontSize), out = {};
      for (const l of labels) { box.textContent = l; const t = box.firstChild, x0 = box.getBoundingClientRect().left, cuts = [];
        [...l].forEach((ch, i) => { if (ch === '·') { const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + 1); const b = r.getBoundingClientRect(); cuts.push(+(((b.left + b.right) / 2 - x0) / fs).toFixed(4)); } });
        out[l] = { cutsEm: cuts, widthEm: +(box.getBoundingClientRect().width / fs).toFixed(4) }; }
      box.remove(); JSON.stringify(out, null, 1)
      ```
    - If Instrument Sans hasn't loaded yet, the cuts sit a little off in the fallback font until it swaps in.
  - `pill-bar`: a neutral pill (`--clr-surface`) holding the label, with a small segmented colour key at its start (`--aud-key-w` 1.5rem × `--aud-key-h` 6px) that uses the same segments as the team page. Segments are always equal width, (width − 3px gaps) ÷ n, so three groups show as three even 6px squares. It turns white on the coral hover.
  - No attribute: the plain label + bar described above.
  - To ship one, move its rules from `:root[data-aud-style="…"]` into the base rules, or set the attribute in the template.
- **Spacing:** cards get more bottom padding (`--card-pad-bottom: 3.75rem`) and less space above the icon (`--card-icon-offset: .75rem`), so 3-line titles don't crowd the label.

**Data:** `design/audiences.json` is a **hand-curated** list, confirmed with the client on 2026-09-24. Keys are `/oferta/<slug>/`; values are `kids` / `youth` / `adult` / `online`. `build.py` generates one rule per card (`--aud-label`, `--aud-bar`), matched on the card's `href`.
- Don't derive it from the specialists: the union of `team.json` `filter*` flags for each service's `team` overstates badly (e.g. DIVA-5, an adult ADHD diagnosis, would come out as every group), and some service teams list people who are no longer in `team.json`.
- **For production:** add an `audiences` field to `services.json` and render the label/bar in the card template. That also enables the next step: a **filter row** above the grid, reusing the team page's filter buttons, which would need markup and a little JS.

### Service filter (all directions)

A filter row above the homepage services that works exactly like the Zespół page:
- **Markup:** the same `.filters` / `.filter-btn` buttons: Wszystkie · Dla dzieci · Dla młodzieży · Dla dorosłych · On-line.
- **Tagging:** the same attributes on each card (`<a all kids youth … class="service">`).
- **Filtering:** hides the non-matching `<li>`s inside `document.startViewTransition()`, with a `view-transition-name` per card, so the grid animates. `team.css` already sets the .75s duration.
- **Verified:** 20 cards tagged, and the counts match `audiences.json`: dzieci 11, młodzież 15, dorośli 16, on-line 1. Every click runs a View Transition.
- **Accessibility:** buttons get `aria-pressed`. A visually hidden live region announces the result with Polish plurals ("Pokazano 11 usług", "1 usługa"). With reduced motion, the transition animations are off.
- **Bug fixed along the way:** the Zespół script's no-View-Transitions fallback falls through to `document.startViewTransition` and throws in unsupported browsers (a missing `return`). `service-filter.js` does it right; apply the same one-line fix in `src/zespół/index.njk`.
- **Button style:** the component layer restyles `div.filters` (both pages share it). White raised pills with a hairline, a short centred category bar instead of a full-width underline, and a brand-filled active state, replacing the neumorphic look.
- **Button hover:** the same as the service cards, driven by the same tokens.
  - The coral fill passes through the button via `::before`, following the Rise or Sweep preset (`--card-fill-*`). The label turns ink, the outline turns coral, the shadow deepens, and the button pops out to `--filter-hover-scale` (1.05 in C; smaller than the cards' 1.1 because the buttons sit 8px apart).
  - The category bar gets a white track on the coral. Keyboard focus shows the same state.
  - The active (teal) button is excluded. A and B get the cards' gentle lift instead. With reduced motion there's no movement.
- **Labels never break:** `white-space: nowrap`. The row is a wrapping flex row rather than fixed grid columns, and each button is `flex: 1 0 auto`: never narrower than its label, and it grows to fill its line. Verified at 320, 375, 496, 768 and 1024px: one line (51px) everywhere, no overflow, no horizontal page scroll. It's 1 row on tablet and desktop, 3 rows on phones.
- **Button padding:** block padding is equal top and bottom (`--filter-pad-block: 1rem`, line-height 1.2), so the label is centred; measured at 16.5px above and 17.3px below, the difference being font metrics. The category bar sits inside the bottom padding (`--filter-bar-offset: .375rem`), about 7px below the text.

In the lab, `design/service-filter.js` **injects** the markup and attributes from `audiences.json`. It's loaded on the homepage and on `/oferta/` (added by `mirror.py` via `FILTER_PAGES`). Verified on `/oferta/` too: 20 cards tagged, with the same counts as the homepage. **Production** needs a template change, since this is real structure:
1. Add `"audiences": ["kids","youth"]` to each entry in `src/_data/services.json` (values from `design/audiences.json`).
2. In `src/_includes/partials/services.njk`, render the attributes on the card and the filter row on the **homepage and the Oferta index** only. The partial is also used on location and team-member pages. The simplest switch is a front-matter flag: add `serviceFilter: true` to `src/index.md` and `src/oferta/index.njk`, and test `{% if serviceFilter %}` instead of `isHomepage` below.
   ```njk
   {% if isHomepage %}
   <div class="filters" data-for="services" role="group" aria-label="Filtruj usługi">
     <button type="button" class="filter-btn active" data-category="all" aria-pressed="true">Wszystkie</button>
     <button type="button" class="filter-btn" data-category="kids" aria-pressed="false">Dla dzieci</button>
     <button type="button" class="filter-btn" data-category="youth" aria-pressed="false">Dla młodzieży</button>
     <button type="button" class="filter-btn" data-category="adult" aria-pressed="false">Dla dorosłych</button>
     <button type="button" class="filter-btn" data-category="online" aria-pressed="false">On-line</button>
   </div>
   <p class="filter-status" aria-live="polite"></p>
   {% endif %}
   …
   <a all {% for a in service.audiences %}{{ a }} {% endfor %}class="service" href="/oferta/{{ service.fullName | slugify }}/">
   ```
3. Ship `service-filter.js` (it skips injection when the cards already carry `all`), or copy just its `initFilter` part into the page.
4. The label and bar CSS could then read the same data, e.g. `a.service[kids]` rules instead of per-href generated rules.

### Sub-pages: Oferta index and service pages (C)

**Mirrored:** `/oferta/` and all 20 `/oferta/<slug>/` pages, via `design/mirror.py`:

```bash
cd lab/design && python3 mirror.py /oferta/ --children
```

It does the same as the homepage mirror: downloads missing assets, strips GTM and Netlify, and injects the tokens link and switcher. Each page keeps an `index.original.html`.

**Sub-page header** (`.gradient-bg`, `page-header.css`):
- **Brand aurora.** The blob colours are the site's own `--color1…5` and `--color-bg1/2` variables, which C sets to teal, coral, sage, peach and sky on a deep-teal ground, with `--blending: screen`. `soft-light` looked muddy.
- **Height:** lower, `--ph-height: clamp(10rem, 24vh, 15rem)` instead of 40vh.
- **Eyebrow title.** The header title is a small uppercase label (0.8125rem, 600, 0.18em tracking), nudged down by `--ph-title-offset` to clear the fixed top bar. The page's H1 is now the only big title, which fixes the doubled title on service pages.
- **Reduced motion:** the blobs stop.
- A and B keep the original rainbow header.

**Fixes that apply on every page:**
- **Running text font:** Newsreader now applies to *prose only*, `.page-content :is(p, ul:not(.team, .services, .locations, .breadcrumb) > li, ol > li)`. Before, team names and location cards (which are list items) rendered in serif capitals.
- **Bold in headings** (`<b>` in "Specjaliści oferujący usługę **…**") stays in the heading face; `main.css` pins `b` to the body font.
- **Team cards** (`.member`, service pages and the Zespół page) are restyled in the card language:
  - **At rest:** rounded card (`--radius-card`) with a hairline and `--shadow-1` instead of the neumorphic double shadow. The photo is a circle with a 3px white ring. The name is in Instrument Sans 600, `--clr-base-strong`. The name box is narrower than the card (`--member-name-gap` .5rem each side) and padded (`--member-name-pad` .75rem), with `text-wrap: balance`. Long names wrap onto two even lines instead of touching the edge: the minimum text-to-edge gap is now 30px, where it was 9px for Michalina Frosztęga.
  - **Audience bar:** short and centred (`--aud-bar-w` × 4px) with **equal segments**. `build.py` generates one `--member-bar` rule per attribute combination (15 rules, `.member[kids][youth]:not([adult]):not([online])` etc.) for all directions, because the old bar used four fixed 25% slots and left holes. The colours come from the tertiary palette.
  - **Hover and focus: full-photo reveal, updated.**
    - The circle grows into a 2:3 portrait with `--radius-card` corners and a coral ring (`--member-ring`).
    - The name moves into a frosted pill over the photo, using the drawer glass (`--member-pill-bg`, `--member-pill-backdrop`), with white text. The audience bar travels into the pill under the name.
    - The card pops out to 1.05. The reveal takes `--member-reveal`, 350ms.
    - **It animates smoothly now.** The photo's *height* animates (60% → 90% of the 2:3 card, i.e. circle → portrait at 90% width) instead of `aspect-ratio`, which can't transition; the original just jumped.
    - Team cards are **not** in the shared coral fill, because the portrait would cover it. `:focus` is included so a clicked card behaves like a hovered one (team.css keys its morph on `:focus` too).
- **Location cards** (`ul.locations .location`, "dostępna jest w gabinetach") are photo cards:
  - The photo is at full strength (it was 20% opacity), with a bottom scrim (`--location-scrim`).
  - The address sits bottom-left. The street is styled in the heading face via `::first-line`, since street and city are one element split by `<br>`; "Wrocław" is smaller, in Instrument Sans.
  - Rounded corners with a hairline and shadow.
  - **Hover and focus:** pop-out 1.05, coral ring (`--member-ring`), slow photo zoom 1.06. This replaces the teal flood and the overlay blend.
  - Section spacing is reduced from 6rem to 2rem above and `--space-section` below.
- **Price table** (`.table.prices`) is a quiet card:
  - Rounded, hairline border and shadow.
  - **Header:** a light background (`--table-head-bg`) with small uppercase muted labels (`nowrap`, so "CZAS TRWANIA" stays on one line), instead of the solid teal bar.
  - **Rows:** hairlines with a tint row hover (`--table-row-hover`). Service names are medium weight, durations muted, prices 600 with tabular figures.
  - Space before the CTA bar.
  - On phones, the stacked rows are separated by hairlines.
- **Text panels** (`.panel`) no longer scale on hover, and their text is capped at `--measure` (about 90 characters per line instead of about 150).
- **Text-only panels use an editorial two-column layout** (≥ 56rem): headings in a left rail at h3 size, reading text in a right column at `--measure`, `--panel-rail-gap` between.
  - This fills the card by design. The line-length cap alone had left an empty strip on the right; now only the 30px panel padding remains.
  - Each heading shares a row with the start of its section, so panels with several h2 + text sections read as a list of topics. Panels without a heading put their text in the right column too, so body copy keeps one left edge down the page.
  - **CMS gotcha:** content often contains empty `<p></p>` right after a heading, which took the cell beside it and pushed the text down a row. `p:empty` is hidden and the spacing rules skip it.
  - Verified on Psycholog (3 panels) and Logopeda (6 panels, 9 sections): heading-to-text offset 0px everywhere. Single column below 56rem (768px tablet: block, no horizontal scroll).
  - Panels with a photo keep their text + photo layout.
- **Booking panel** ("Zarejestruj w Booksy", `.panel.action`) is coral with ink text in C (`--action-panel-bg/fg`), matching the booking rule.

### Layer order (all directions)

From top to bottom:

| Layer | z-index |
|---|---|
| Nav drawer | 850 |
| Menu dimmer | 840 |
| Mobile bottom bar | 800 |
| Top bar | 400 |
| Breadcrumb (`--index-bcrumb`) | 390 |
| All page content | — |

`.page-content` and the sub-page header band (`.gradient-bg`) use `isolation: isolate`. Their internal z-indexes (panel text at 10, hovered cards and chips, the header title at 10) are contained and can never paint over the top bar or the breadcrumb.

**Before the fix:** the breadcrumb was at 5, the same as sections lifted above other content, so they painted over it while scrolling under. The header title (10) also leaked out of its band.

**Verified** by scanning every 120px of scroll at three x-positions, checking which element is on top inside the top bar and the breadcrumb:

| Page | Overlaps with the old values | Overlaps after the fix |
|---|---|---|
| Psycholog | 63 | 0 |
| Oferta index | — | 0 |
| Homepage | — | 0 |

When open, the drawer covers the top bar, and the dimmer covers the rest of it.

### Content block scroll effects: tried and removed
Two scroll-driven effects for service-page content blocks were tried and dropped after review: sticky stacking, where a block zooms back as the next one covers it, and fade-out near the breadcrumb. Blocks now scroll normally, and `stack.js` and the `--stack-*` tokens are gone.

### FAQ on service pages (all directions)

**Data:** `design/faq.json` is a flat list of 134 entries for all 20 service pages (6–7 each):

```json
{ "service": "psycholog-wroclaw", "question": "…?", "answer": "…",
  "origin": "page" | "web", "sources": ["https://…"] }
```

- **Origin:** `page` (100 entries) are answered only from that page's own text. `web` (34) cover common real questions the page doesn't answer (referrals, qualifications, how to prepare, evidence), checked against gov.pl, pacjent.gov.pl, NFZ/RPP, PTP/PTPsych, test publishers, mp.pl, and peer-reviewed reviews (PMC). Their URLs are in `sources`.
- **How it was written:** Polish, neutral register, 2–5 sentences, no invented prices, durations or guarantees.
- **Tone: positive, never false** (client request, 2026-09-25). A review pass reframed 28 answers so they lead with what's true and helpful: limits are phrased constructively, research questions ask "Co mówią badania o…?", and crisis lines are framed as "pomoc jest dostępna całodobowo". Facts, numbers and sources are unchanged. Nothing claims proven efficacy where the sources don't support it. For example, the CST answer cites the reduced pain intensity found in the chronic-pain review and says researchers call for further studies. Every change, old → new, is in `design/faq-tone-changes.md`. **The CST, Warnke, QEEG and neurofeedback answers are the ones the clinic should sign off.** Where an answer depends on clinic policy (e.g. referrals), it ends with "Szczegóły warto potwierdzić przy rejestracji."
- **Checks:** `design/merge_faq.py` validates everything:
  - fields, and 5–7 entries per page
  - "?" at the end of every question, no "!", no HTML, answers ≤ ~100 words
  - no near-duplicate questions
  - https sources for web entries
  - every złoty amount in an answer must appear verbatim on its page

  ```bash
  python3 merge_faq.py <parts-dir> <page-text-dir>   # rebuild faq.json from per-service parts
  python3 build_faq.py                              # render into the mirrored pages
  ```

- **Editing:** edit `faq.json` directly and run `build_faq.py`. `mirror.py` also runs it after mirroring.

**Markup** (`build_faq.py`, static HTML between `<!-- faq:start/end -->`, placed before the "dostępna jest w gabinetach" block):
- **Section:** `<section class="faq" aria-labelledby="…">` with an `<h2>Najczęstsze pytania</h2>`, then one `<details class="faq-item" name="faq-<slug>"><summary>question</summary><div class="faq-answer"><p>…</p></div></details>` per question.
- **One open at a time:** the shared `name` makes the accordion exclusive in the browser, with no JS. The summary holds plain text only, so screen readers announce it cleanly as a disclosure button.
- **Sources:** web answers end with a small "Źródła: domain, domain" line.
- **Structured data:** a schema.org `FAQPage` JSON-LD block in `<head>`, between `<!-- faq-ld:start/end -->`, with the same questions and answers.

**Style** (component layer): cards like the rest (hairline, radius, `--shadow-1`), questions in Instrument Sans 600 (h5 size), answers in Newsreader at `--measure`, and a +/− icon in a tint circle that turns into − when open.
- **Hover:** coral outline + `--shadow-2`. There's no pop-out or fill, because this is reading content.
- **Open item:** teal outline and heading.
- **Opening animation:** smooth where supported (`::details-content` + `interpolate-size`, Chromium 131+), instant elsewhere, and off with reduced motion.

**Production (Eleventy):**
1. Copy `faq.json` to `src/_data/faq.json`.
2. Add a filter, e.g. `eleventyConfig.addFilter("faqFor", (faq, slug) => faq.filter(f => f.service === slug))`.
3. Create a partial `partials/faq.njk` with the markup above, included in `src/oferta/oferta.njk` with `{% set faqs = faq | faqFor(service.fullName | slugify) %}`, plus the JSON-LD in the page head.

**Content issues found while writing the FAQs** (on the live pages; worth a pass by the clinic):
- **Contradictory numbers:**
  - QEEG: "about an hour" vs a 90-minute visit (400 zł / 90 min); 20–30 vs "minimum ~30" sessions.
  - EEG Biofeedback: three different session counts.
  - Logopeda: "about 60 minutes" vs 50 in the price table.
  - KORP+KOZE: 180 min in the table vs 3–4 × 50–60 min in the text.
  - ADOS-2: "800 zł includes the interview" vs a separate 250 zł first consultation.
- **Claims the evidence doesn't support** (the FAQs stay neutral and sourced):
  - CST (ADHD, autism, depression, immunity).
  - The Warnke method, called "skuteczna" / "udowodnił".
  - QEEG "wskazuje przyczyny" ADHD.
  - Neurofeedback "skuteczna … trwałe efekty".
  - Dyslexia "gen Y".
  - EEG Biofeedback lists epilepsy as a contraindication but also says it "wspomaga leczenie padaczki".
- **Other:**
  - The psycholog page references "Stany Zjednoczone".
  - Price tables list "Wydanie opinii psychologicznej" on the logopeda, on-line and psychodietetyk pages, and the psychodietetyk table has no psychodietetic consultation.
  - "Metoda Warnego" is a typo.
  - The on-line page names Skype only (possibly outdated) and prints a bank account number.
- **Legal note:** the new act on the psychologist profession is the act of 23 January 2026 (Dz. U. 2026 poz. 187), mostly applicable from 19 May 2028, per gov.pl. The FAQ says exactly that.

### Where coral appears (CSS only, no markup)

- The hero **"Zarejestruj w Booksy"** button, via its existing `.btn__booksy` class.
- **"Umów się na wizytę"** in the CTA bar, via `a[href*="booksy"]`.
- The service-card hover fill, footer links, and focus rings on dark grounds.

### Service-card hover (the tricky bit)

Behaviour: the card scales to 1.1× and a **coral plane** (`--card-fill-final`, the accent `#E8836B`) travels through it. On leave, the plane **keeps moving the same way** and exits through the far edge, instead of reversing. The tertiary-colour bands that briefly led the plane were removed.

- **Rise** (default): a solid plane the size of the card. It enters at the bottom and exits at the top. 400ms.
- **Sweep**: a square plane 3× the card width carrying one diagonal coral stripe (the middle third of a 135° gradient), so both the leading and trailing edges are diagonal. It enters at the bottom-right and exits at the top-left. 500ms.

How it works (see the comment in `patch.css`, `ul.services li .service::before`):
- Position = `translate` (P) + `transform: translate()` (T), both in % of the plane's own size.
- At rest: P = `--card-fill-exit` (parked past the far edge), T = 0. On hover: P = `--card-fill-entry` (parked before the near edge), T = `--card-fill-travel` (entry to covering).
- On hover, P **snaps** (`transition: translate 0s`) while the plane is out of view, and T animates in.
- On leave, P and T animate together, and their sum only moves forward.
- Direction comes from `--card-fill-dx` (0 = vertical, 1 = diagonal).

| Mode | entry | covering | exit | travel |
|---|---|---|---|---|
| Rise | 100% | 0 | −100% | −100% |
| Sweep | 0 | −33.333% | −66.667% | −33.333% |

Verified by sampling the computed position during enter and leave (monotonic in both modes, e.g. Rise +294px, then 0, then −294px on a 294px card), plus screenshots of frames pinned mid-enter and mid-leave.

Known limitations:
- Re-entering *while* the fill is still leaving makes it jump back to the entry edge. Pure CSS can't avoid this.
- With `prefers-reduced-motion`, there is no movement or scaling; the colour state switches instantly.
- Icons are JPEG/WebP on white grounds and use `mix-blend-mode: multiply` so the fill shows through. In C, multiply stays on at rest too, so the exiting fill never reveals a white box. Teal parts of icons look muddier on coral.

**One hover, four components.** The pass-through fill rule (`::before`) is shared by the service cards, the filter buttons, the knowledge-base article chips and the CTA bar links. Team cards have their own photo-reveal hover.
- **How the plane gets its colour and shape:** colour comes from `background-color: var(--card-fill-final)`, which resolves per element, so any component can override `--card-fill-final` locally. The shape comes from `mask-image: var(--card-fill-mask)`: `none` for Rise (solid), and a 135° stripe for Sweep. The earlier `--card-fill-image` gradient was replaced because a gradient token resolves at `:root` and can't be recoloured per element.
- **CTA bar:** the links keep a transparent ground on hover (`--cta-hover-bg`), so the coral rises over the teal bar with no white flash. "Umów się na wizytę" is already coral, so it stays coral underneath (`--cta-emph-hover-bg`) and fills with the soft coral (`--cta-emph-fill`). A and B have no fill, so their CTA hover is a white pill with teal text. Chips and buttons pop out to `--filter-hover-scale` (1.05) rather than the cards' 1.1, lift over their neighbours, and turn their text ink with a coral outline. A chip shows the same state (plus a focus ring) when its link is focused by keyboard. This replaces the chips' earlier teal-flood hover.

Tunables in `tokens.py`: `--card-fill-final` (colour), `--card-fill-duration`, `--card-hover-scale`. If you change the sweep geometry, keep travel = covering − entry; the sweep's shape is `--card-fill-mask` in `BLEND_SWEEP`.

**To ship Sweep instead of Rise:** move the `BLEND_SWEEP` values into `BLEND` in `tokens.py` and rebuild.

---

## Open decisions / next steps

2. **Audience tags:** Pill, Pill + bar or Bar.
3. **Which "peach" should the fill end on?** The fill currently ends on coral `#E8836B`, which matches the approved pop-out. If "peach" meant the pale band tint `#FBEDE6`, set `"--card-fill-final": "var(--clr-tint)"` in `BLEND`. The card would end much lighter, with the bands as the only strong colour.
2. **Rise or Sweep:** pick one to ship.
3. **Icon blending on coral:** keep multiply (as the original teal hover did), or show icons unblended on a small white circle.
4. **Ship C to the real site.** Outline:
   - Copy `design/tokens.blend.css` to `src/css/tokens.blend.css`. It's already a passthrough folder: `eleventy.config.js` copies `src/css`.
   - Add `<link rel="stylesheet" href="/css/tokens.blend.css">` **after** `tables.css` in `src/_includes/layouts/sitelayout.njk`.
   - Remove the `:root[data-card-fill="sweep"]` block if Sweep isn't chosen.
   - Check sub-pages (team, article, pricing tables, breadcrumbs). The patch touches `.panel`, `.article`, `.mobile_nav` and the team `.filters`, but only the homepage was reviewed visually.
   - Optional clean-up: fold the `typographies.css` scale into the token file and remove the duplicate `p, li, td…` block in `main.css`.
5. **Content fixes outside CSS:** fix the "arytkuły" typo; fix or remove the empty `psyche-video.webm` on the server; consider removing the `<strong>` wrapper from the intro copy in the CMS (the CSS neutralises it for now).
6. **Housekeeping:** delete `lab/site/`. Decide whether `lab/` gets committed (e.g. on a `design-lab` branch) or stays local. It isn't deployed either way, since Eleventy only builds from `src/`. If committed, consider adding `lab/.DS_Store` and `lab/design/__pycache__/` to `.gitignore`.

---

## Lab-copy notes

- The local `index.html` has **Google Tag Manager and the Netlify badge script removed**, so previews don't send hits to the real analytics. `index.original.html` still has them.
- Mirrored assets: all homepage images (AVIF/WebP/JPEG), the video poster, the MP4, the favicon, and the list-arrow SVG referenced from CSS.
- External dependencies: Google Fonts (Raleway, plus Fraunces and Onest for B and C).
- Direction A and B details, the full token table and every contrast ratio are in `design/proposal.html`.
