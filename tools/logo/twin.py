import sys,math; sys.path.insert(0,'.')
from flame import COMMON,GL,GL2,BG,G
def mirror(d):
    import re
    out=[];toks=re.findall(r'[A-Za-z]|-?[\d.]+',d);i=0;isx=True
    for t in toks:
        if t.isalpha(): out.append(t);isx=True
        else:
            v=float(t)
            if isx: v=512-v
            out.append(f'{v:g}');isx=not isx
    return ' '.join(out)
EXTRA=(G('tb',[(0,'#5b21ff'),(.5,'#0080ff'),(1,'#00f0ff')],0,0)+G('tr',[(0,'#ff2bd6'),(.5,'#ff1f4b'),(.85,'#ff7a00'),(1,'#ffd60a')],0,0)
 +'<radialGradient id="ve" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d1fff0"/><stop offset=".35" stop-color="#00ff9c"/><stop offset="1" stop-color="#00b86b"/></radialGradient>'
 +'<radialGradient id="vv" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f5e1ff"/><stop offset=".35" stop-color="#c04dff"/><stop offset="1" stop-color="#7a1fff"/></radialGradient>'
 +G('gd',[(0,'#fff3c4'),(1,'#f5b700')]))
# gradients for flames go bottom->top: set y1=1,y2=0
EXTRA=EXTRA.replace('id="tb" x1="0" y1="0" x2="0" y2="0"','id="tb" x1="0" y1="1" x2="0.3" y2="0"').replace('id="tr" x1="0" y1="0" x2="0" y2="0"','id="tr" x1="1" y1="1" x2="0.7" y2="0"')
LF='M256 440 C146 428 100 336 136 252 C160 196 214 172 240 128 C258 98 290 70 352 52 C316 66 296 92 286 124 C278 150 274 168 266 186 C244 234 204 272 206 332 C208 386 236 420 256 440 Z'
def m_embrace(glow=True):
    f=' filter="url(#gl2)"' if glow else ''
    return f'''<g{f}><path d="{LF}" fill="url(#tb)"/><path d="{mirror(LF)}" fill="url(#tr)" style="mix-blend-mode:screen"/></g>
<g{f}><circle cx="176" cy="318" r="22" fill="url(#ve)"/><circle cx="336" cy="318" r="22" fill="url(#vv)"/></g>'''
# paisley pair (ornamental, two forms curled around each other)
PA='M0 84 C-62 84 -96 34 -86 -18 C-76 -70 -24 -104 34 -112 C12 -96 2 -80 8 -60 C44 -48 72 -8 62 32 C54 66 32 84 0 84 Z'
PI='M0 52 C-36 52 -56 24 -50 -6 C-44 -34 -16 -50 6 -54 C2 -40 6 -30 14 -24 C34 -14 44 8 38 26 C32 44 18 52 0 52 Z'
def paisley(cx,cy,rot,fill,dot):
    return f'''<g transform="translate({cx} {cy}) rotate({rot})"><path d="{PA}" fill="{fill}"/><path d="{PI}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="5"/>
<circle cx="-12" cy="22" r="20" fill="{dot}"/></g>'''
def m_paisley(glow=True,orn=True):
    f=' filter="url(#gl2)"' if glow else ''
    ring=''
    if orn:
        ring='<g fill="url(#gd)">'+''.join(f'<circle cx="{256+190*math.cos(math.radians(a)):.1f}" cy="{256+190*math.sin(math.radians(a)):.1f}" r="{7 if a%30==0 else 4}"/>' for a in range(0,360,15))+'</g>'
    return f'''{ring}<g{f}>{paisley(218,272,-28,"url(#tb)","url(#ve)")}{paisley(294,240,152,"url(#tr)","url(#vv)")}</g>'''
MARKS={'e':m_embrace,'p':m_paisley}
def svg(body,vb='0 0 512 512',glow=True): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"><defs>{COMMON}{EXTRA}{(GL+GL2) if glow else ""}</defs>{body}</svg>\n'
def sc(k,s=1.0,glow=True): return f'<g transform="translate(256 256) scale({s}) translate(-256 -256)">{MARKS[k](glow)}</g>'
if __name__=='__main__':
    for k in MARKS: open(f'T{k}.svg','w').write(svg(BG+sc(k)))

# 5a rainbow: one spectrum flowing diagonally through both flames
RB=('<linearGradient id="rbL" gradientUnits="userSpaceOnUse" x1="140" y1="440" x2="360" y2="50">'+''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o,c in [(0,'#7a1fff'),(.18,'#2a5bff'),(.36,'#00d0ff'),(.54,'#00ff9c'),(.72,'#c6ff00'),(.86,'#ffd000'),(1,'#ff7a00')])+'</linearGradient>'
   +'<linearGradient id="rbR" gradientUnits="userSpaceOnUse" x1="372" y1="440" x2="152" y2="50">'+''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o,c in [(0,'#ff1f8f'),(.2,'#ff1f3d'),(.4,'#ff7a00'),(.58,'#ffd000'),(.76,'#00ff9c'),(.9,'#00d0ff'),(1,'#7a1fff')])+'</linearGradient>'
   +'<radialGradient id="wc" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#fff6d0"/><stop offset="1" stop-color="#ffc2f0"/></radialGradient>')
EXTRA+=RB
def m_rainbow(glow=True):
    f=' filter="url(#gl2)"' if glow else ''
    return f'''<g{f}><path d="{LF}" fill="url(#rbL)"/><path d="{mirror(LF)}" fill="url(#rbR)" style="mix-blend-mode:screen"/></g>
<g{f}><circle cx="176" cy="318" r="22" fill="url(#ve)"/><circle cx="336" cy="318" r="22" fill="url(#vv)"/></g>'''
MARKS['r']=m_rainbow
if __name__=='__main__':
    open('Tr.svg','w').write(svg(BG+sc('r')))

# rainbow that flows upward through both flames (SMIL; static when anim=False)
# Ascension flow: ruby -> orange -> gold -> emerald -> aurora -> blue flame -> indigo -> violet -> magenta -> silver-white light -> back to ruby
SPEC=['#ff1450','#ff6a00','#ffc400','#00d26a','#00f0d0','#1e7bff','#4b2bff','#9b30ff','#ff2bd6','#eef0ff','#ff1450']
def flowgrad(anim):
    st=''.join(f'<stop offset="{i/(len(SPEC)-1):.3f}" stop-color="{c}"/>' for i,c in enumerate(SPEC))
    a='<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="0 -640" dur="9s" repeatCount="indefinite"/>' if anim else ''
    a2='<animateTransform attributeName="gradientTransform" type="translate" from="0 -320" to="0 -960" dur="9s" repeatCount="indefinite"/>' if anim else ''
    return (f'<linearGradient id="flow" gradientUnits="userSpaceOnUse" x1="0" y1="470" x2="0" y2="-170" spreadMethod="repeat">{st}{a}</linearGradient>'
            f'<linearGradient id="flow2" gradientUnits="userSpaceOnUse" x1="0" y1="470" x2="0" y2="-170" spreadMethod="repeat" gradientTransform="translate(0 -320)">{st}{a2}</linearGradient>')
def m_flow(glow=True):
    f=' filter="url(#gl2)"' if glow else ''
    return f'''<g{f}><path d="{LF}" fill="url(#flow)"/><path d="{mirror(LF)}" fill="url(#flow2)" style="mix-blend-mode:screen"/></g>
<g{f}><circle cx="176" cy="318" r="22" fill="url(#ve)"/><circle cx="336" cy="318" r="22" fill="url(#vv)"/></g>'''
MARKS['f']=m_flow
def svgf(body,anim=False,vb='0 0 512 512',glow=True): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"><defs>{COMMON}{EXTRA}{flowgrad(anim)}{(GL+GL2) if glow else ""}</defs>{body}</svg>\n'
if __name__=='__main__':
    open('Tf.svg','w').write(svgf(BG+sc('f'),anim=True))
