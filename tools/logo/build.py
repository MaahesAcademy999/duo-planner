import sys; sys.path.insert(0,'.')
from orbit import *
k=sys.argv[1]; v=VARIANTS[k]
open('icon-full.svg','w').write(svg(v,BG+mark(v)))
open('icon-maskable.svg','w').write(svg(v,BG+mark(v,scale=.78)))
open('favicon.svg','w').write(svg(v,'<rect width="512" height="512" rx="112" fill="url(#bg)"/>'+mark(v,glow=False,scale=1.18),glow=False))
open('logo-mark.svg','w').write(svg(v,mark(v,glow=False),vb='84 84 344 344',glow=False))
open('badge.svg','w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(256 256) scale(1.2) translate(-256 -256)"><g fill="none" stroke="#fff" stroke-width="44" stroke-linecap="round"><path d="{arc(150,110,250)}"/><path d="{arc(150,290,70)}"/></g><circle cx="212" cy="256" r="36" fill="#fff"/><circle cx="300" cy="256" r="36" fill="#fff"/></g></svg>\n''')
