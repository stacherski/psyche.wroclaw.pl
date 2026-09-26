"""Render FAQ accordions into the mirrored service pages from design/faq.json.

    python3 build_faq.py          # (re)writes every lab/oferta/<slug>/index.html that has entries

faq.json is a flat list of entries:
    { "service": "<oferta slug>", "question": "...", "answer": "...",
      "origin": "page" | "web", "sources": ["https://...", ...] }

For each service page this writes, between marker comments (so it can be re-run):
  * <section class="faq"> with an <h2> and one <details>/<summary> per question.
    All items share name="faq-<slug>", so the browser keeps one open at a time
    (exclusive accordion, no JS). Answers are <p>s; web-derived answers list their sources.
  * a schema.org FAQPage JSON-LD block in <head>.
Placement: before the "dostępna jest w gabinetach" block (ul.locations), else before
the price table, else at the end of .page-content. Re-run after mirror.py.

In production the same markup comes from an Eleventy partial (see HANDOVER.md).
"""
import html, json, os, re, urllib.parse
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.abspath(os.path.join(HERE, ".."))
START, END = "<!-- faq:start -->", "<!-- faq:end -->"
LD_START, LD_END = "<!-- faq-ld:start -->", "<!-- faq-ld:end -->"
TITLE = "Najczęstsze pytania"


def esc(s):
    return html.escape(s, quote=True)


def domain(url):
    host = urllib.parse.urlparse(url).netloc
    return host[4:] if host.startswith("www.") else host


def section(slug, items):
    out = [START,
           f'<section class="faq" aria-labelledby="faq-{slug}-title">',
           f'  <h2 id="faq-{slug}-title">{TITLE}</h2>',
           '  <div class="faq-list">']
    for it in items:
        paras = "".join(f"<p>{esc(p.strip())}</p>" for p in it["answer"].split("\n") if p.strip())
        src = ""
        if it.get("origin") == "web" and it.get("sources"):
            links = ", ".join(f'<a href="{esc(u)}" rel="noopener" target="_blank">{esc(domain(u))}</a>' for u in it["sources"])
            src = f'<p class="faq-sources">Źródła: {links}</p>'
        out.append(f'    <details class="faq-item" name="faq-{slug}">'
                   f'<summary>{esc(it["question"])}</summary>'
                   f'<div class="faq-answer">{paras}{src}</div></details>')
    out += ["  </div>", "</section>", END]
    return "\n".join(out)


def json_ld(items):
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
            "@type": "Question",
            "name": it["question"],
            "acceptedAnswer": {"@type": "Answer", "text": " ".join(it["answer"].split())},
        } for it in items],
    }
    return f'{LD_START}\n    <script type="application/ld+json">{json.dumps(data, ensure_ascii=False)}</script>\n    {LD_END}'


def strip_block(s, a, b):
    return re.sub(re.escape(a) + r".*?" + re.escape(b) + r"\n?", "", s, flags=re.S)


def insert_point(s):
    i = s.find('<ul class="locations"')
    if i == -1:
        i = s.find('<table class="table prices"')
    if i != -1:
        j = s.rfind("<article", 0, i)
        if j != -1:
            return j
    # fallback: end of .page-content (its closing div before the footer)
    f = s.find("<footer")
    return s.rfind("</div>", 0, f) if f != -1 else len(s)


def main():
    entries = json.load(open(os.path.join(HERE, "faq.json")))
    by = OrderedDict()
    for e in entries:
        by.setdefault(e["service"], []).append(e)
    done = []
    for slug, items in by.items():
        path = os.path.join(LAB, "oferta", slug, "index.html")
        if not os.path.exists(path):
            print("  ! no page for", slug)
            continue
        s = open(path).read()
        s = strip_block(s, START, END)
        s = strip_block(s, LD_START, LD_END)
        at = insert_point(s)
        s = s[:at] + section(slug, items) + "\n" + s[at:]
        s = s.replace("  </head>", "    " + json_ld(items) + "\n  </head>", 1)
        open(path, "w").write(s)
        done.append((slug, len(items)))
    print(f"{len(done)} pages, {sum(n for _, n in done)} questions")
    for slug, n in done:
        print(f"  {n:2}  {slug}")


if __name__ == "__main__":
    main()
