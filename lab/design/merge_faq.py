"""Merge per-service FAQ part files into design/faq.json, with checks.

    python3 merge_faq.py <parts-dir> [<page-text-dir>]

<parts-dir>/<slug>.json   JSON array of {service, question, answer, origin, sources}
<page-text-dir>/<slug>.txt the page's text (optional) — enables the price check

Checks (errors stop the merge, warnings are printed):
  * fields present, origin is "page" or "web", service matches the file name and
    a mirrored page exists
  * 5–7 entries per service; questions end with "?", no exact/near-duplicate questions
  * answers ≤ ~100 words, no "!", no HTML
  * web entries have ≥ 1 https source; page entries have none
  * every złoty amount in an answer appears verbatim in that service's page text
"""
import difflib, glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.abspath(os.path.join(HERE, ".."))


def norm(q):
    return re.sub(r"[^a-ząćęłńóśźż0-9 ]", "", q.lower()).strip()


def main(parts_dir, text_dir=None):
    errors, warnings, merged = [], [], []
    for f in sorted(glob.glob(os.path.join(parts_dir, "*.json"))):
        slug = os.path.basename(f)[:-5]
        try:
            items = json.load(open(f))
        except Exception as e:
            errors.append(f"{slug}: invalid JSON ({e})")
            continue
        if not os.path.exists(os.path.join(LAB, "oferta", slug, "index.html")):
            errors.append(f"{slug}: no mirrored page")
        if not 5 <= len(items) <= 7:
            warnings.append(f"{slug}: {len(items)} entries (expected 5–7)")
        page_text = open(os.path.join(text_dir, slug + ".txt")).read() if text_dir and os.path.exists(os.path.join(text_dir, slug + ".txt")) else None
        seen = []
        for i, it in enumerate(items):
            tag = f"{slug}#{i+1}"
            missing = {"service", "question", "answer", "origin", "sources"} - set(it)
            if missing:
                errors.append(f"{tag}: missing {sorted(missing)}")
                continue
            if it["service"] != slug:
                errors.append(f"{tag}: service '{it['service']}' ≠ file '{slug}'")
            if it["origin"] not in ("page", "web"):
                errors.append(f"{tag}: origin '{it['origin']}'")
            q, a = it["question"].strip(), it["answer"].strip()
            if not q.endswith("?"):
                errors.append(f"{tag}: question doesn't end with '?'")
            if "!" in q + a:
                errors.append(f"{tag}: exclamation mark")
            if re.search(r"<[a-z/][^>]*>", a):
                errors.append(f"{tag}: HTML in answer")
            words = len(a.split())
            if words > 110:
                errors.append(f"{tag}: answer {words} words")
            elif words > 95:
                warnings.append(f"{tag}: answer {words} words")
            if it["origin"] == "web" and not [u for u in it["sources"] if u.startswith("https://")]:
                errors.append(f"{tag}: web entry without https source")
            if it["origin"] == "page" and it["sources"]:
                warnings.append(f"{tag}: page entry has sources (ignored)")
            for other in seen:
                if difflib.SequenceMatcher(None, norm(q), norm(other)).ratio() > .85:
                    errors.append(f"{tag}: near-duplicate of '{other}'")
            seen.append(q)
            if page_text is not None:
                for amount in re.findall(r"\d[\d  ]*,\d{2}\s*zł|\d+\s*zł", a):
                    if amount.replace(" ", " ") not in page_text.replace(" ", " "):
                        errors.append(f"{tag}: price '{amount}' not found on the page")
            merged.append({"service": slug, "question": q, "answer": a,
                           "origin": it["origin"], "sources": it["sources"] if it["origin"] == "web" else []})
    for w in warnings:
        print("warn ", w)
    for e in errors:
        print("ERROR", e)
    if errors:
        sys.exit(1)
    json.dump(merged, open(os.path.join(HERE, "faq.json"), "w"), ensure_ascii=False, indent=1)
    services = sorted({m["service"] for m in merged})
    web = sum(m["origin"] == "web" for m in merged)
    print(f"faq.json: {len(merged)} entries ({len(merged) - web} page, {web} web) for {len(services)} services")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
