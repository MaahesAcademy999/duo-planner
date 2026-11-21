import math
def P(a,r=160,cx=256,cy=256): return (cx+r*math.cos(math.radians(a)),cy+r*math.sin(math.radians(a)))
def arc(r,a0,a1):
    (x0,y0),(x1,y1)=P(a0,r),P(a1,r); large=1 if (a1-a0)%360>180 else 0
    return f'M{x0:.1f} {y0:.1f} A{r} {r} 0 {large} 1 {x1:.1f} {y1:.1f}'
def G(i,stops,x2=1,y2=1): return f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="{y2}">'+''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o,c in stops)+'</linearGradient>'
def flame(cx,cy,s,fill,core):
    o=f'M0 -64 C22 -36 40 -14 40 14 C40 40 22 56 0 56 C-22 56 -40 40 -40 14 C-40 -6 -28 -18 -20 -30 C-16 -14 -8 -6 -2 -4 C-8 -26 -6 -46 0 -64Z'
    i='M0 -10 C12 4 18 16 18 28 C18 42 10 48 0 48 C-10 48 -18 42 -18 28 C-18 16 -10 4 0 -10Z'
    return f'<g transform="translate({cx} {cy}) scale({s})"><path d="{o}" fill="{fill}"/><path d="{i}" fill="{core}" opacity=".9"/></g>'
def crescent(a0,a1,fill,r=160,ri=235):
    (x0,y0),(x1,y1)=P(a1,r),P(a0,r)
    return f'<path d="M{x0:.1f} {y0:.1f} A{r} {r} 0 0 0 {x1:.1f} {y1:.1f} A{ri} {ri} 0 0 1 {x0:.1f} {y0:.1f}Z" fill="{fill}"/>'
GL='<filter id="gl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
BGD=G('bg',[(0,'#0b1a1d'),(1,'#060d0f')])
COMMON=BGD+G('em',[(0,'#6ee7b7'),(1,'#059669')])+G('blue',[(0,'#7dd3fc'),(1,'#2563eb')],0,1)+G('vio',[(0,'#e9d5ff'),(1,'#7c3aed')],0,1)+G('ruby',[(0,'#fda4af'),(1,'#be123c')],0,1)+G('ind',[(0,'#a5b4fc'),(1,'#4338ca')],0,1)+G('aur',[(0,'#34d399'),(.35,'#22d3ee'),(.65,'#6366f1'),(1,'#c084fc')])+G('aur2',[(0,'#c084fc'),(.5,'#e11d48'),(1,'#fbbf24')],0,1)+G('gold',[(0,'#fff7d6'),(1,'#f5c542')])
def star(cx,cy,r,fill):
    pts=[]
    for k in range(8):
        a=math.radians(k*45-90); rr=r if k%2==0 else r*.38
        pts.append(f'{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}')
    return f'<polygon points="{" ".join(pts)}" fill="{fill}"/>'
# 4a Twin Flames: emerald orbit, blue + violet flames
def m_a(glow=True):
    f=' filter="url(#gl)"' if glow else ''
    return f'''<g{f} fill="none" stroke="url(#em)" stroke-width="34" stroke-linecap="round"><path d="{arc(160,112,248)}"/><path d="{arc(160,292,68)}"/></g>
<g{f}>{flame(206,262,1.15,"url(#blue)","#e0f2fe")}{flame(306,262,1.15,"url(#vio)","#faf5ff")}</g>'''
# 4b Covenant (vesica): aurora orbit, two seed circles crossing, partner dots, gold star at the heart
def m_b(glow=True):
    f=' filter="url(#gl)"' if glow else ''
    return f'''<g{f} fill="none" stroke="url(#aur)" stroke-width="30" stroke-linecap="round"><path d="{arc(166,112,248)}"/><path d="{arc(166,292,68)}"/></g>
<g fill="none" stroke-width="9" opacity=".95"><circle cx="216" cy="256" r="72" stroke="url(#em)"/><circle cx="296" cy="256" r="72" stroke="url(#vio)"/></g>
<g{f}><circle cx="160" cy="256" r="22" fill="url(#em)"/><circle cx="352" cy="256" r="22" fill="url(#vio)"/>{star(256,256,46,"url(#gold)")}</g>'''
# 4c Aurora Flame: two flame crescents swirling (blue/indigo and violet/ruby), emerald + ruby partner dots
def m_c(glow=True):
    f=' filter="url(#gl)"' if glow else ''
    return f'''<g{f} transform="rotate(-24 256 256)">{crescent(104,256,"url(#blue)")}<g transform="rotate(180 256 256)">{crescent(104,256,"url(#aur2)")}</g></g>
<g{f}><circle cx="218" cy="256" r="30" fill="url(#em)"/><circle cx="294" cy="256" r="30" fill="url(#vio)"/></g>'''
MARKS={'a':m_a,'b':m_b,'c':m_c}
def svg(body,vb='0 0 512 512',glow=True): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"><defs>{COMMON}{GL if glow else ""}</defs>{body}</svg>\n'
def sc(k,s=1.0,glow=True): return f'<g transform="translate(256 256) scale({s}) translate(-256 -256)">{MARKS[k](glow)}</g>'
BG='<rect width="512" height="512" fill="url(#bg)"/>'
if __name__=='__main__':
    for k in MARKS: open(f'F{k}.svg','w').write(svg(BG+sc(k)))

# 4c vibrant: saturated multi-stop flames, stronger two-layer glow, bright partner dots with highlights
VIV=(G('vb',[(0,'#00f0ff'),(.45,'#0080ff'),(1,'#5b21ff')],0,1)
    +G('vr',[(0,'#ff2bd6'),(.4,'#ff1f4b'),(.75,'#ff7a00'),(1,'#ffd60a')],0,1)
    +'<radialGradient id="ve" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d1fff0"/><stop offset=".35" stop-color="#00ff9c"/><stop offset="1" stop-color="#00b86b"/></radialGradient>'
    +'<radialGradient id="vv" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f5e1ff"/><stop offset=".35" stop-color="#c04dff"/><stop offset="1" stop-color="#7a1fff"/></radialGradient>')
GL2='<filter id="gl2" filterUnits="userSpaceOnUse" x="-64" y="-64" width="640" height="640"><feGaussianBlur stdDeviation="16" result="b1"/><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b2"/><feColorMatrix in="b1" type="saturate" values="1.6" result="b1s"/><feMerge><feMergeNode in="b1s"/><feMergeNode in="b1s"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
COMMON+=VIV
def m_v(glow=True):
    f=' filter="url(#gl2)"' if glow else ''
    return f'''<g{f} transform="rotate(-24 256 256)">{crescent(104,256,"url(#vb)")}<g transform="rotate(180 256 256)">{crescent(104,256,"url(#vr)")}</g></g>
<g{f}><circle cx="218" cy="256" r="31" fill="url(#ve)"/><circle cx="294" cy="256" r="31" fill="url(#vv)"/></g>'''
MARKS['v']=m_v
_svg=svg
def svg(body,vb='0 0 512 512',glow=True): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"><defs>{COMMON}{(GL+GL2) if glow else ""}</defs>{body}</svg>\n'
if __name__=='__main__':
    open('Fv.svg','w').write(svg(BG+sc('v')))
