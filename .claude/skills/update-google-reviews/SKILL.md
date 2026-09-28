---
name: update-google-reviews
description: Fetch new reviews from Centrum PSYCHE's Google Business profiles through the user's signed-in Chrome, add them to src/_data/reviews.json tagged with specialist and service, then build, check and commit. Use when the user asks to update, refresh, sync or fetch Google reviews / opinie.
---

# Update Google reviews

Reviews on the site (specialist pages, service pages, `/opinie/`, the homepage rating
summary) all come from `src/_data/reviews.json`. This skill adds the reviews that are on
Google but not in that file yet. It never edits or deletes existing entries.

## Profiles

| Profile | Address | Reviews page (id) |
|---|---|---|
| Centrum Psyche | Białowieska 3a/5d | `16548052971868160810` |
| Diagnoza ADHD Wrocław | Białowieska 3a | `2027320072476843921` |
| PSYCHE Kids | Małopanewska 18/13 | `470859287529803054` |
| QEEG Wrocław | Białowieska 3a | `13316374764525435371` |

Reviews page: `https://www.google.com/local/business/<id>/customers/reviews`
(the `business.google.com/n/<id>/profile?...` links redirect to Google Search and show the
same list inside an iframe; open the reviews page directly instead). If the user
mentions a new profile, add it to this table.

## Steps

1. **Chrome.** Use Claude in Chrome (the user's signed-in session). Read only: never
   click Odpowiedz, Edytuj, Usuń or the report flag. If the extension doesn't connect,
   check `list_connected_browsers`; if it's empty, ask the user to open the Claude side
   panel in Chrome, check the account, or restart Chrome.
2. **Each profile.** Open its reviews page. If it says "Uzyskaj pierwszą opinię" it has
   none. Otherwise scroll to the bottom with the `computer` scroll action (scripted
   scrolling doesn't reach the list) until the last review stays put.
3. **Extract.** Run `extract.js` (this folder) with `javascript_exec`, then read
   `window.__chunk(0)`, `window.__chunk(1)`, … and join them into one JSON array per
   profile. Save all profiles' arrays together as one file in the scratchpad.
4. **Tag.** Add `"team"` and `"service"` to each review, using exact `fullName`s:
   - `team`: only when the text names the specialist. "Pani Paulina" in QEEG/biofeedback
     reviews is Paulina Stacherska; a "Paulina" in child psychology may be Paulina
     Armatys. Leave empty when unsure (two Krystynas, for example). An owner reply that
     names the specialist counts.
   - `service`: from what the review describes (QEEG → "QEEG Wrocław", biofeedback →
     "EEG Biofeedback Wrocław", ADOS → "Diagnoza autyzmu ADOS 2 Wrocław", a child's
     consultation → "Psycholog Dziecięcy Wrocław"); generic praise → "Psycholog Wrocław".
     Reviews from the QEEG Wrocław profile are QEEG unless they say otherwise.
5. **Merge.** `node .claude/skills/update-google-reviews/merge.js <file> --dry-run`,
   check the list, then run it again without `--dry-run`. It skips reviews already in the
   file (matched on text, since reviewers rename themselves), converts Google's dates
   and fails on names not in team.json / services.json.
6. **Check.** `npx @11ty/eleventy`, then look at `/opinie/` and one affected specialist
   and service page in the browser pane.
7. **Report and ask.** Tell the user what was added per profile, which tags you guessed,
   any review below 4 stars, and any review in reviews.json that's no longer on Google
   (leave those, the user decides). Ask before committing.

## How the site uses the data (don't change without asking)

- A review naming a specialist (`Team`) shows on their page and on its service's page;
  one without only on the service's page; every review on `/opinie/`.
- Reviews below 4 stars (`REVIEWS_MIN_STARS` in `eleventy.config.js`) aren't shown
  anywhere, but stay in reviews.json and count in the average. The user chose this:
  deleting them would inflate the average shown as "z … opinii w Google".
- Reviewers are shown as first name and initial. Owner replies aren't stored.
- Relative Google dates ("26 tygodni temu") are only accurate to about a week.
