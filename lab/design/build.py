import html, re
from tokens import T, CURRENT_CSS, BLEND, TERTIARY, BLEND_SWEEP
patch = open('patch.css').read()
FONTS_FRESH = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..700,0..100,0..1&family=Onest:wght@400..700&display=swap');\n"
FONTS_BLEND = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..700,0..100,0..1&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&display=swap');\n"
HEAD = {
 'current': "Current system, formalised. Same names main.css already uses, plus the\n   values it hard-codes. Loading this file changes nothing visually — it only\n   defines the 4 variables the site references but never declares.",
 'refine':  "Direction A — Refine. Keep the teal and Raleway; fix scale, contrast,\n   weights, elevation and rhythm.",
 'blend':   "Direction C — Blend. Refine's teal system + Fraunces headings,\n   Newsreader paragraphs, Instrument Sans navigation & UI + coral, teal's complementary colour,\n   reserved for the booking actions, the article band and focus.",
 'fresh':   "Direction B — Fresh. Same structure, new identity: dusk indigo + lilac,\n   Fraunces (soft) for headings, Onest for text. Logo stays as-is.",
}
def audience_rules():
    """(slug, (label, bar-gradient)) for each service card, from audiences.json."""
    import json
    aud = {k: v for k, v in json.load(open('audiences.json')).items() if not k.startswith('_')}
    label = {'kids': 'dzieci', 'youth': 'młodzież', 'adult': 'dorośli', 'online': 'on-line'}
    color = {'kids': 'var(--clr-cat-kids)', 'youth': 'var(--clr-cat-youth)', 'adult': 'var(--clr-cat-adult)'}
    tint = {g: f'var(--clr-cat-{g}-tint)' for g in ('kids', 'youth', 'adult', 'online')}
    metrics = json.load(open('label-metrics.json'))['labels']
    out = []
    for slug, groups in aud.items():
        segs = [g for g in groups if g in color]   # on-line is a delivery mode: text only, no segment
        # Equal segments: each is (100% − total gaps) / n, gaps are 3px between them.
        n, stops, gap = len(segs), [], 3
        seg = f"(100% - {gap * (n - 1)}px) / {n}"
        for i, g in enumerate(segs):
            start = f"calc({seg} * {i} + {gap * i}px)" if i else "0"
            end = f"calc({seg} * {i + 1} + {gap * i}px)" if i < n - 1 else "100%"
            if i:
                stops.append(f"transparent {prev_end} {start}")
            stops.append(f"{color[g]} {start} {end}")
            prev_end = end
        text = " · ".join(label[g] for g in groups)
        # Pill: hard colour cuts centred on each '·' (measured, see label-metrics.json).
        # The pill's left padding is .75rem; cut offsets are em of the label font.
        cuts = metrics.get(text, {}).get('cutsEm')
        if len(groups) == 1:
            pill = tint[groups[0]]
        elif cuts is not None and len(cuts) == len(groups) - 1:
            edges = ["0"] + [f"calc(.75rem + {c}em)" for c in cuts] + ["100%"]
            pill = "linear-gradient(90deg, " + ", ".join(f"{tint[g]} {edges[i]} {edges[i+1]}" for i, g in enumerate(groups)) + ")"
        else:  # unmeasured label: fall back to a soft blend
            pill = f"linear-gradient(90deg, {', '.join(tint[g] for g in groups)})"
        out.append((slug, (text, f"linear-gradient(90deg, {', '.join(stops)})", pill)))
    return out

def equal_segments(colors, gap=3):
    """linear-gradient with n equal segments separated by `gap` px."""
    n, stops, prev_end = len(colors), [], None
    seg = f"(100% - {gap * (n - 1)}px) / {n}"
    for i, c in enumerate(colors):
        start = f"calc({seg} * {i} + {gap * i}px)" if i else "0"
        end = f"calc({seg} * {i + 1} + {gap * i}px)" if i < n - 1 else "100%"
        if i:
            stops.append(f"transparent {prev_end} {start}")
        stops.append(f"{c} {start} {end}")
        prev_end = end
    return f"linear-gradient(90deg, {', '.join(stops)})"

def member_bar_rules():
    """One rule per combination of team.json filter attributes on .member."""
    from itertools import combinations
    groups = ['kids', 'youth', 'adult', 'online']
    out = ""
    for r in range(1, 5):
        for combo in combinations(groups, r):
            sel = ".member" + "".join(f"[{g}]" for g in combo) + "".join(f":not([{g}])" for g in groups if g not in combo)
            out += f"{sel} {{ --member-bar: {equal_segments([f'var(--clr-cat-{g})' for g in combo])}; }}\n"
    return out

def val(t, d):
    g,n,role,cur,ref,fre,st = t
    if d=='current': return CURRENT_CSS.get(n, cur)
    if d=='blend': return BLEND.get(n, ref)
    return ref if d=='refine' else fre
for d in ('current','refine','blend','fresh'):
    out = {'fresh':FONTS_FRESH,'blend':FONTS_BLEND}.get(d,'') + f"/* {HEAD[d]} */\n\n:root {{\n"
    grp=None
    for t in T:
        if t[0]!=grp: grp=t[0]; out+=f"\n    /* {grp} */\n"
        out+=f"    {t[1]}: {val(t,d)};{'  /* was undefined */' if t[6]=='fix' else ''}\n"
    out+="}\n"
    if d=='blend':
        out+="\n/* Alternative card fill: diagonal sweep. Add data-card-fill=\"sweep\" to <html>,\n   or copy these values into :root above to make it the default. */\n:root[data-card-fill=\"sweep\"] {\n"
        out+="".join(f"    {k}: {v};\n" for k,v in BLEND_SWEEP.items())+"}\n"
    if d!='current':
        out += "\n" + patch
        out += "\n/* Generated — team-card audience bar, equal segments for each attribute combination */\n" + member_bar_rules()
    if d=='blend':
        import json as _j
        av=_j.load(open('avatars.json'))
        out+="\n/* Generated from avatars.json — one rule per specialist profile link */\n"
        out+="".join(f'nav.navigation-panel.open a[href="/zespół/{k}/"] {{ --avatar: url("{v["avatar"]}"); }}\n' for k,v in av.items())
        out+="\n/* Generated from audiences.json — audience label + bar per service card */\n"
        for k,v in audience_rules():
            out+=f'ul.services a.service[href="/oferta/{k}/"] {{ --aud-label: "{v[0]}"; --aud-bar: {v[1]}; --aud-pill: {v[2]}; }}\n'
    open(f'tokens.{d}.css','w').write(out)

# ---- contrast
def hx(h):h=h.lstrip('#')[:6];return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
def L(c):
    f=lambda v: v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4
    r,g,b=map(f,hx(c));return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b):
    x,y=sorted([L(a),L(b)],reverse=True);return (x+0.05)/(y+0.05)
DIRS=('current','refine','blend','fresh')
tok={d:{t[1]:val(t,d) for t in T} for d in DIRS}
PAIRS=[("Hero / primary button label","--clr-base","--clr-surface-raised","text"),
 ("CTA bar text","--clr-text-inverse","--clr-base-strong","large"),
 ("Heading on page ground","--clr-text","--clr-surface","text"),
 ("Running text on page ground","--clr-text-2","--clr-surface","text"),
 ("Muted text on page ground","--clr-text-muted","--clr-surface","text"),
 ("Knowledge-base heading on band","--clr-on-tint","--clr-tint","large"),
 ("Footer link on footer","--clr-footer-link","--clr-footer-bg","text"),
 ("Booking button label on its ground","--btn-emph-fg","--btn-emph-bg","text")]
def badge(r,kind):
    need=3 if kind=='large' else 4.5
    ok=r>=need; aaa=r>=(4.5 if kind=='large' else 7)
    return f'<span class="cr {"ok" if ok else "bad"}">{r:.1f}:1 · {"AAA" if aaa else "AA" if ok else "fails AA"}</span>'
def chip(v):
    m=re.match(r'^#[0-9A-Fa-f]{6}',v)
    return f'<i class="sw" style="background:{v}"></i>' if m else ''
def res(tk,v):
    while v.startswith('var('): v=tk[v[4:-1]]
    return v
rows=''
for label,fg,bg,kind in PAIRS:
    rows+=f'<tr><th scope="row">{label}<small>{fg} on {bg}</small></th>'
    for d in DIRS:
        a,b=res(tok[d],tok[d][fg]),res(tok[d],tok[d][bg])
        rows+=f'<td><span class="pair" style="color:{a};background:{b}">Aa</span>{badge(cr(a,b),kind)}</td>'
    rows+='</tr>\n'

trows=''; grp=None
for t in T:
    g,n,role,cur,ref,fre,st=t
    if g!=grp: grp=g; trows+=f'<tr class="grp"><th colspan="5" scope="colgroup">{g}</th></tr>\n'
    tag={'keep':'','new':'<span class="tag new">new</span>','fix':'<span class="tag fix">fix</span>'}[st]
    cell=lambda v: f'<td>{chip(v)}<code>{html.escape(v)}</code></td>'
    trows+=f'<tr><th scope="row"><code>{n}</code>{tag}<small>{html.escape(role)}</small></th>{cell(cur)}{cell(ref)}{cell(val(t,"blend"))}{cell(fre)}</tr>\n'

# ---- palette (C · Blend)
INK='#12302E'
FAM=[("Teal","Primary · brand & everyday actions","#E6F2F1","#007A74","#0B5E59","Psychoterapia"),
     ("Coral","Secondary · complementary, booking only","#FBEDE6","#E8836B","#B34A36","Umów wizytę")]
FAM+=[(n.capitalize(),"Tertiary · "+r.split(' · ')[0]+" — "+r.split(' · ')[1],so,ba,st,
      {"ochre":"Dzieci","sage":"On-line","berry":"Dorośli","sky":"Młodzież"}[n]) for n,r,so,ba,st in TERTIARY]
pal=''
for name,role,so,ba,st,label in FAM:
    base_on = '#FFFFFF' if name=='Teal' else INK
    pal+=f'''<div class="fam">
  <div class="fam-h"><h3>{name}</h3><small>{role}</small></div>
  <div class="ramp"><div style="background:{so}"><code>{so}</code><span>soft</span></div><div style="background:{ba};color:{base_on}"><code>{ba}</code><span>base</span></div><div style="background:{st};color:#fff"><code>{st}</code><span>strong</span></div></div>
  <div class="demo"><span class="chip" style="background:{so};color:{st}">{label}</span><span class="chip" style="background:{ba};color:{base_on}">{label}</span><span class="chip line" style="border-color:{st};color:{st}">{label}</span></div>
  <p class="crs"><span>strong on soft {cr(st,so):.1f}:1</span><span>{"white" if name=="Teal" else "ink"} on base {cr(base_on,ba):.1f}:1</span><span>strong on white {cr(st,"#FFFFFF"):.1f}:1</span></p>
</div>
'''
page=open('proposal.tpl.html').read().replace('{{PALETTE}}',pal)
page=page.replace('{{CONTRAST}}',rows).replace('{{TOKENS}}',trows)
open('proposal.html','w').write(page)
print('ok')
