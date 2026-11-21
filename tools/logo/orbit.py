import math
def arc(r,a0,a1,cx=256,cy=256):
    p=lambda a:(cx+r*math.cos(math.radians(a)),cy+r*math.sin(math.radians(a)))
    (x0,y0),(x1,y1)=p(a0),p(a1); large=1 if (a1-a0)%360>180 else 0
    return f'M{x0:.1f} {y0:.1f} A{r} {r} 0 {large} 1 {x1:.1f} {y1:.1f}'
G=lambda i,a,b:f'<linearGradient id="{i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>'
EM=('#5eead4','#10b981'); CY=('#67e8f9','#06b6d4'); VI=('#c4b5fd','#8b5cf6'); EMCY=('#34d399','#22d3ee')
VARIANTS={
 'a':dict(L=EM,R=CY,dl=EM,dr=CY,label='Emerald + cyan'),
 'b':dict(L=EM,R=EM,dl=EM,dr=VI,label='All emerald, violet partner dot'),
 'c':dict(L=EMCY,R=('#22d3ee','#a78bfa'),dl=EM,dr=VI,label='Emerald → cyan → violet sweep'),
}
def mark(v,glow=True,scale=1.0):
    f=' filter="url(#gl)"' if glow else ''
    return f'''<g transform="translate(256 256) scale({scale}) translate(-256 -256)"><g{f} fill="none" stroke-width="40" stroke-linecap="round">
<path d="{arc(150,110,250)}" stroke="url(#L)"/><path d="{arc(150,290,70)}" stroke="url(#R)"/></g>
<g{f}><circle cx="212" cy="256" r="34" fill="url(#dl)"/><circle cx="300" cy="256" r="34" fill="url(#dr)"/></g></g>'''
def defs(v,glow=True):
    g='<filter id="gl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' if glow else ''
    return '<defs>'+G('bg','#0b1a1d','#060d0f')+G('L',*v['L'])+G('R',*v['R'])+G('dl',*v['dl'])+G('dr',*v['dr'])+g+'</defs>'
def svg(v,body,vb='0 0 512 512',glow=True): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{defs(v,glow)}{body}</svg>\n'
BG='<rect width="512" height="512" fill="url(#bg)"/>'
if __name__=='__main__':
    for k,v in VARIANTS.items(): open(f'O{k}.svg','w').write(svg(v,BG+mark(v)))
