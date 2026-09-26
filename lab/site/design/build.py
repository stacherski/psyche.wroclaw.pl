import html, re
from tokens import T, CURRENT_CSS
patch = open('patch.css').read()
FONTS_FRESH = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..700,0..100,0..1&family=Onest:wght@400..700&display=swap');\n"
HEAD = {
 'current': "Current system, formalised. Same names main.css already uses, plus the\n   values it hard-codes. Loading this file changes nothing visually — it only\n   defines the 4 variables the site references but never declares.",
 'refine':  "Direction A — Refine. Keep the teal and Raleway; fix scale, contrast,\n   weights, elevation and rhythm.",
 'fresh':   "Direction B — Fresh. Same structure, new identity: dusk indigo + lilac,\n   Fraunces (soft) for headings, Onest for text. Logo stays as-is.",
}
def val(t, d):
    g,n,role,cur,ref,fre,st = t
    if d=='current': return CURRENT_CSS.get(n, cur)
    return ref if d=='refine' else fre
for d,col in (('current',3),('refine',4),('fresh',5)):
    out = (FONTS_FRESH if d=='fresh' else '') + f"/* {HEAD[d]} */\n\n:root {{\n"
    grp=None
    for t in T:
        if t[0]!=grp: grp=t[0]; out+=f"\n    /* {grp} */\n"
        out+=f"    {t[1]}: {val(t,d)};{'  /* was undefined */' if t[6]=='fix' else ''}\n"
    out+="}\n"
    if d!='current': out += "\n" + patch
    open(f'tokens.{d}.css','w').write(out)

# ---- contrast
def hx(h):h=h.lstrip('#')[:6];return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
def L(c):
    f=lambda v: v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4
    r,g,b=map(f,hx(c));return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b):
    x,y=sorted([L(a),L(b)],reverse=True);return (x+0.05)/(y+0.05)
tok={d:{t[1]:val(t,d) for t in T} for d in ('current','refine','fresh')}
PAIRS=[("Hero / primary button label","--clr-base","--clr-surface-raised","text"),
 ("CTA bar text","--clr-text-inverse","--clr-base-strong","large"),
 ("Heading on page ground","--clr-text","--clr-surface","text"),
 ("Running text on page ground","--clr-text-2","--clr-surface","text"),
 ("Muted text on page ground","--clr-text-muted","--clr-surface","text"),
 ("Knowledge-base heading on band","--clr-on-tint","--clr-tint","large"),
 ("Footer link on footer","--clr-footer-link","--clr-footer-bg","text")]
def badge(r,kind):
    need=3 if kind=='large' else 4.5
    ok=r>=need; aaa=r>=(4.5 if kind=='large' else 7)
    return f'<span class="cr {"ok" if ok else "bad"}">{r:.1f}:1 · {"AAA" if aaa else "AA" if ok else "fails AA"}</span>'
def chip(v):
    m=re.match(r'^#[0-9A-Fa-f]{6}',v)
    return f'<i class="sw" style="background:{v}"></i>' if m else ''
rows=''
for label,fg,bg,kind in PAIRS:
    rows+=f'<tr><th scope="row">{label}<small>{fg} on {bg}</small></th>'
    for d in ('current','refine','fresh'):
        a,b=tok[d][fg],tok[d][bg]
        rows+=f'<td><span class="pair" style="color:{a};background:{b}">Aa</span>{badge(cr(a,b),kind)}</td>'
    rows+='</tr>\n'

trows=''; grp=None
for t in T:
    g,n,role,cur,ref,fre,st=t
    if g!=grp: grp=g; trows+=f'<tr class="grp"><th colspan="5" scope="colgroup">{g}</th></tr>\n'
    tag={'keep':'','new':'<span class="tag new">new</span>','fix':'<span class="tag fix">fix</span>'}[st]
    cell=lambda v: f'<td>{chip(v)}<code>{html.escape(v)}</code></td>'
    trows+=f'<tr><th scope="row"><code>{n}</code>{tag}<small>{html.escape(role)}</small></th>{cell(cur)}{cell(ref)}{cell(fre)}</tr>\n'

page=open('proposal.tpl.html').read().replace('{{CONTRAST}}',rows).replace('{{TOKENS}}',trows)
open('proposal.html','w').write(page)
print('ok')
