'use strict';
/* ===== Holodeck FX — ported from UGC Studio: particle network, cursor glow, card spotlight, tile tilt, boot ring =====
   Runs only when motion = full; calm keeps spotlight only; off disables everything. */
const FX=(()=>{
  let C={a:'#34d399',b:'#22d3ee'},raf=0,pts=[],mouse={x:-999,y:-999,on:false},tilted=null;
  const motion=()=>document.documentElement.dataset.motion||'full';
  const simple=()=>document.documentElement.hasAttribute('data-simple');
  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function toHex(c){if(/^#([0-9a-f]{6})$/i.test(c))return c;const d=document.createElement('div');d.style.color=c;document.body.appendChild(d);const m=getComputedStyle(d).color.match(/\d+/g)||[0,0,0];d.remove();return '#'+m.slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join('')}
  const rgba=(hex,a)=>{const h=hex.replace('#','');return `rgba(${parseInt(h.substr(0,2),16)},${parseInt(h.substr(2,2),16)},${parseInt(h.substr(4,2),16)},${a})`};
  function colors(){setTimeout(()=>{C={a:toHex(css('--acc'))||'#34d399',b:toHex(css('--acc2'))||'#22d3ee'}},60)}
  function start(){cancelAnimationFrame(raf);colors();const cv=$('#fx-bg');if(!cv||motion()!=='full'||simple()){if(cv)cv.getContext('2d').clearRect(0,0,cv.width,cv.height);return}
    const ctx=cv.getContext('2d');let W=0,H=0,last=0;
    const size=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;const n=Math.max(26,Math.min(80,Math.round(W*H/26000)));
      pts=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,r:Math.random()*1.6+.6,c:Math.random()<.5}))};
    size();window.onresize=size;
    const tick=t=>{raf=requestAnimationFrame(tick);if(document.hidden||t-last<33)return;last=t;ctx.clearRect(0,0,W,H);
      for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;if(p.y<-20)p.y=H+20;if(p.y>H+20)p.y=-20;
        if(mouse.on){const dx=p.x-mouse.x,dy=p.y-mouse.y,d=dx*dx+dy*dy;if(d<19600){const f=(1-d/19600)*.6;p.x+=dx/Math.sqrt(d+1)*f;p.y+=dy/Math.sqrt(d+1)*f}}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fillStyle=rgba(p.c?C.a:C.b,.7);ctx.fill()}
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j],dx=a.x-b.x,dy=a.y-b.y,d=dx*dx+dy*dy;
        if(d<17000){ctx.strokeStyle=rgba(a.c?C.a:C.b,(1-d/17000)*.28);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}
      if(mouse.on)for(const p of pts){const dx=p.x-mouse.x,dy=p.y-mouse.y,d=dx*dx+dy*dy;if(d<32000){ctx.strokeStyle=rgba(C.a,(1-d/32000)*.4);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(mouse.x,mouse.y);ctx.stroke()}}};
    raf=requestAnimationFrame(tick)}
  const TILT='.task,.themecard,.picker button';
  document.addEventListener('pointermove',e=>{if(motion()==='off'||e.pointerType==='touch')return;mouse.x=e.clientX;mouse.y=e.clientY;mouse.on=true;
    const c=e.target.closest&&e.target.closest('.card');if(c){const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}
    if(motion()!=='full'||simple())return;const cur=$('#fx-cursor');if(cur){cur.style.opacity=1;cur.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0)`}
    if(window.__dragging)return;const t=e.target.closest&&e.target.closest(TILT);if(tilted&&tilted!==t){tilted.style.transform='';tilted=null}
    if(t){const r=t.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;t.style.transform=`perspective(700px) rotateX(${(-py*5).toFixed(2)}deg) rotateY(${(px*5).toFixed(2)}deg) translateY(-2px)`;tilted=t}},{passive:true});
  document.addEventListener('pointerleave',()=>{mouse.on=false;const cur=$('#fx-cursor');if(cur)cur.style.opacity=0;if(tilted){tilted.style.transform='';tilted=null}});
  function bootOut(){const b=$('#boot');if(b&&!b.classList.contains('out')){b.classList.add('out');setTimeout(()=>b.remove(),800)}}
  let lastKey='';
  /* re-run when theme / motion changes */
  function sync(){const k=[document.documentElement.dataset.theme,motion(),simple(),document.documentElement.style.getPropertyValue('--acc')].join('|');if(k!==lastKey){lastKey=k;start()}}
  return {start,sync,bootOut};
})();
window.FX=FX;
