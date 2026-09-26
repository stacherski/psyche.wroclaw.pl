"""Mirror live psyche.wroclaw.pl pages into the lab (same treatment as the homepage).

    python3 mirror.py /oferta/                # one page
    python3 mirror.py /oferta/ --children     # a page + every /oferta/<slug>/ it links to

For each page:
  * saves the HTML to lab/<path>/index.html (the untouched copy as index.original.html)
  * downloads referenced /css, /media and /script assets that aren't in the lab yet
    (including url(...) references inside CSS)
  * strips Google Tag Manager and the Netlify badge script (no analytics from the lab)
  * injects the design layer: tokens link + switcher (like the homepage), plus the
    service filter on FILTER_PAGES
"""
import os, re, sys, urllib.parse, urllib.request

BASE = "https://psyche.wroclaw.pl"
FILTER_PAGES = {"/oferta/"}  # pages that get the service filter (homepage has it already)
LAB = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INJECT = '''
    <!-- design-tokens layer (local proposal only — not part of the site) -->
    <link rel="stylesheet" href="/design/tokens.current.css" id="dir-css">
    <script src="/design/switcher.js" defer></script>
  </head>'''
FILTER_TAG = '    <script src="/design/service-filter.js" defer></script>\n'



def fetch(path):
    url = BASE + urllib.parse.quote(path, safe="/%?=&@")
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "psyche-lab-mirror"}), timeout=30) as r:
        return r.read()


def save_asset(path):
    path = path.split("?")[0].split("#")[0]
    dst = os.path.join(LAB, urllib.parse.unquote(path).lstrip("/"))
    if os.path.exists(dst):
        return False
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    try:
        data = fetch(path)
    except Exception as e:
        print("  ! asset failed", path, e)
        return False
    open(dst, "wb").write(data)
    if dst.endswith(".css"):
        for ref in re.findall(r"url\((/[^)'\"]+)\)", data.decode("utf-8", "ignore")):
            save_asset(ref)
    return True


def mirror(path):
    html = fetch(path).decode("utf-8")
    out_dir = os.path.join(LAB, urllib.parse.unquote(path).strip("/"))
    os.makedirs(out_dir, exist_ok=True)
    open(os.path.join(out_dir, "index.original.html"), "w").write(html)

    refs = set()
    for attr in re.findall(r'(?:src|href|poster|srcset)="([^"]+)"', html):
        for part in attr.split(","):
            p = part.strip().split(" ")[0]
            if re.match(r"^/(css|media|script)/", p):
                refs.add(p)
    new = sum(save_asset(r) for r in sorted(refs))

    html = re.sub(r"\s*<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->", "", html, flags=re.S)
    html = re.sub(r"\s*<!-- Google Tag Manager \(noscript\) -->.*?<!-- End Google Tag Manager \(noscript\) -->", "", html, flags=re.S)
    html = re.sub(r'<script async src="/\.netlify[^>]*></script>', "", html)
    if "dir-css" not in html:
        html = html.replace("\n  </head>", INJECT, 1)
    if path in FILTER_PAGES and "service-filter.js" not in html:
        html = html.replace("  </head>", FILTER_TAG + "  </head>", 1)
    open(os.path.join(out_dir, "index.html"), "w").write(html)
    print(f"{path}  ({len(refs)} assets, {new} new)")
    return html


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    for page in args:
        html = mirror(page)
        if "--children" in sys.argv:
            kids = sorted(set(re.findall(r'href="(' + re.escape(page.rstrip("/")) + r'/[^"/#?]+/)"', html)))
            for k in kids:
                mirror(k)
    # re-apply the FAQ sections the fresh HTML doesn't have
    if os.path.exists(os.path.join(os.path.dirname(__file__), "faq.json")):
        import build_faq
        build_faq.main()
