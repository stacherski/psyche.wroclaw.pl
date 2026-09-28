#!/usr/bin/env node
// Adds newly fetched Google reviews to src/_data/reviews.json.
//
//   node .claude/skills/update-google-reviews/merge.js <fetched.json> [--today=YYYY-MM-DD] [--dry-run]
//
// <fetched.json> is an array of the objects extract.js returns, each optionally
// with "team" and "service" added (see SKILL.md for the matching rules):
//   { "name", "stars", "date", "text", "hasReply", "team"?, "service"? }
//
// A review already in reviews.json is skipped: same text (reviewers rename
// themselves, so names aren't compared), or for reviews without text, same stars
// and a date within 10 days. Google's dates ("12 mar 2024", "26 tygodni temu")
// become YYYY-MM-DD; relative ones are counted back from --today.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const data = (file) => JSON.parse(fs.readFileSync(path.join(root, "src/_data", file), "utf8"));
const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const today = new Date((args.find((a) => a.startsWith("--today=")) || "").slice(8) || Date.now());
if (!input) throw new Error("usage: merge.js <fetched.json> [--today=YYYY-MM-DD] [--dry-run]");

const MONTHS = { sty: 0, lut: 1, mar: 2, kwi: 3, maj: 4, cze: 5, lip: 6, sie: 7, wrz: 8, paź: 9, lis: 10, gru: 11 };
const DAYS = { dzień: 1, dni: 1, tydzień: 7, tygodnie: 7, tygodni: 7, miesiąc: 30, miesiące: 30, miesięcy: 30, rok: 365, lata: 365, lat: 365 };
const iso = (d) => d.toISOString().slice(0, 10);

function toDate(raw) {
  const s = raw.trim().toLowerCase();
  let m = s.match(/^(\d{1,2}) (\p{L}{3})\p{L}* (\d{4})$/u);
  if (m && m[2] in MONTHS) return iso(new Date(Date.UTC(+m[3], MONTHS[m[2]], +m[1])));
  m = s.match(/^(\d+|jeden|jedna|tydzień|miesiąc|rok) ?(\p{L}+)? temu$/u);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? +m[1] : 1;
    const unit = DAYS[m[2] || m[1]];
    if (unit) return iso(new Date(today.getTime() - n * unit * 864e5));
  }
  throw new Error(`Unrecognised date: "${raw}"`);
}

const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
const reviews = data("reviews.json");
const team = new Set(data("team.json").map((m) => m.fullName));
const services = new Set(data("services.json").map((s) => s.fullName));
const fetched = JSON.parse(fs.readFileSync(input, "utf8"));

let id = Math.max(0, ...reviews.map((r) => r.id));
const added = [];
for (const review of fetched) {
  const date = toDate(review.date);
  const text = (review.text || "").trim();
  const known = reviews.some((r) =>
    text
      ? norm(r.Review) === norm(text)
      : !norm(r.Review) && r.Stars === review.stars && Math.abs(new Date(r.date) - new Date(date)) <= 10 * 864e5,
  );
  if (known) continue;
  if (review.team && !team.has(review.team)) throw new Error(`Not in team.json: "${review.team}"`);
  if (review.service && !services.has(review.service)) throw new Error(`Not in services.json: "${review.service}"`);
  if (!(review.stars >= 1 && review.stars <= 5)) throw new Error(`Bad stars for "${review.name}": ${review.stars}`);
  const [first, ...rest] = review.name.trim().split(/\s+/);
  const entry = {
    id: ++id, Created: "", "Created by": "", Edited: "", "Edited by": "",
    fullName: first, surname: rest.join(" "), Stars: review.stars, date, Review: text,
    Response: "", Source: 10, Link: "", Team: review.team || "", service: review.service || "",
  };
  reviews.push(entry);
  added.push(entry);
}

for (const r of added) console.log(`+ ${r.id} ${r.date} ${r.Stars}★ ${r.fullName} ${r.surname} | ${r.Team || "-"} | ${r.service || "-"}`);
console.log(`${added.length} new, ${fetched.length - added.length} already in reviews.json`);
if (!dryRun && added.length) {
  const file = path.join(root, "src/_data/reviews.json");
  const raw = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, JSON.stringify(reviews, null, 2) + (raw.endsWith("\n") ? "\n" : ""));
}
