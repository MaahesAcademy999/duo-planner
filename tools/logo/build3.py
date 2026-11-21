import sys; sys.path.insert(0,'.')
from flame import *
k=sys.argv[1]
open('icon-full.svg','w').write(svg(BG+sc(k)))
open('icon-maskable.svg','w').write(svg(BG+sc(k,.78)))
open('favicon.svg','w').write(svg('<rect width="512" height="512" rx="112" fill="url(#bg)"/>'+sc(k,1.16,False),glow=False))
open('logo-mark.svg','w').write(svg(sc(k,1,False),vb='78 78 356 356',glow=False))
wf=lambda cx,cy,s:f'<g transform="translate({cx} {cy}) scale({s})"><path d="M0 -64 C22 -36 40 -14 40 14 C40 40 22 56 0 56 C-22 56 -40 40 -40 14 C-40 -6 -28 -18 -20 -30 C-16 -14 -8 -6 -2 -4 C-8 -26 -6 -46 0 -64Z" fill="#fff"/></g>'
open('badge.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(256 256) scale(1.2) translate(-256 -256)"><g fill="none" stroke="#fff" stroke-width="38" stroke-linecap="round"><path d="{arc(160,112,248)}"/><path d="{arc(160,292,68)}"/></g>{wf(206,262,1.2)}{wf(306,262,1.2)}</g></svg>\n')
