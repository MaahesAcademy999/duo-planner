import sys; sys.path.insert(0,'.')
from twin import *
open('icon-full.svg','w').write(svgf(BG+sc('f')))
open('icon-maskable.svg','w').write(svgf(BG+sc('f',.8)))
open('favicon.svg','w').write(svgf('<rect width="512" height="512" rx="112" fill="url(#bg)"/>'+sc('f',1.08,False),glow=False))
open('logo-mark.svg','w').write(svgf(sc('f',1,False),anim=True,vb='92 40 328 412',glow=False))
open('logo-mark-static.svg','w').write(svgf(sc('f',1,False),vb='92 40 328 412',glow=False))
open('badge.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(256 256) scale(1.1) translate(-256 -256)" fill="#fff"><path d="{LF}"/><path d="{mirror(LF)}"/></g></svg>\n')
