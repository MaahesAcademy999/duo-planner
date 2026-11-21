'use strict';
/* ===== Journey: evolving skill tree + income log + money / consistency milestones + public showcase =====
   Pure helpers take plain data so public.html can reuse them with a sanitized snapshot. */
/* Doubling ladder: start at $10 and double (10,20,40,80) until the next power of ten ($100), then repeat from there
   (100,200,400,800 -> 1,000 -> 2,000, 4,000 ...). $5,000 is inserted as a MAJOR milestone. */
const MAJOR_TIERS=new Set([1000,5000,10000,25000,50000,100000,1000000]);
const MONEY_TIERS=(()=>{const out=[];for(let d=10;d<=1e6;d*=10){for(let v=d;v<d*10;v*=2)out.push(v)}out.push(1e7);MAJOR_TIERS.forEach(m=>{if(!out.includes(m))out.push(m)});return out.sort((a,b)=>a-b)})();
const RUNRATE_TIERS=[500,1000,2500,5000,10000,25000];   // $/month held for 3 consecutive months
const STREAK_TIERS=[3,6,12,24];                          // consecutive months with income
const SK_SIZES=[[10,'Small step'],[25,'Milestone'],[50,'Major'],[100,'Legendary']];
const fmt$=n=>n>=1e6?'$'+(n/1e6).toFixed(n%1e6?1:0)+'M':n>=1000?'$'+(n/1000).toFixed(n%1000?1:0)+'k':'$'+Math.round(n);
const monthKey=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`};
const monthLabel=k=>new Date(k+'-01T12:00').toLocaleDateString([], {month:'short',year:'2-digit'});

/* ---------- skill logic ---------- */
function skState(sk,all){if(sk.status==='done')return 'done';const ps=sk.parents.map(id=>all.find(x=>x.id===id)).filter(Boolean);
  if(ps.some(p=>p.status!=='done'))return 'locked';return sk.status==='progress'?'progress':'available'}
function levelInfo(xp){let lvl=1,need=50,acc=0;while(xp>=acc+need){acc+=need;lvl++;need=50*lvl}return {lvl,into:xp-acc,need,pct:Math.round((xp-acc)/need*100)}}
const totalXP=skills=>skills.filter(s=>s.status==='done').reduce((a,s)=>a+(+s.xp||10),0);

function layoutTree(skills,cols=Infinity){const by=new Map(skills.map(s=>[s.id,s]));const depth=new Map();
  const d=(s,seen=new Set())=>{if(depth.has(s.id))return depth.get(s.id);if(seen.has(s.id))return 0;seen.add(s.id);
    const ps=s.parents.map(id=>by.get(id)).filter(Boolean);const v=ps.length?Math.max(...ps.map(p=>d(p,seen)))+1:0;depth.set(s.id,v);return v};
  skills.forEach(s=>d(s));const layers=[];skills.forEach(s=>{const v=depth.get(s.id);(layers[v]=layers[v]||[]).push(s)});
  /* a very wide level wraps onto extra rows (cols per row) so the tree keeps a shape that fits a phone or a narrow box */
  const W=216,H=70,GX=22,GY=50,GR=22,pos=new Map();const widest=Math.max(1,...layers.map(L=>L?L.length:0));
  const per=Math.max(1,Math.min(cols,widest)),maxW=per*(W+GX);let y=0;
  layers.forEach((L,i)=>{if(!L)return;if(i>0)L.sort((a,b)=>avgX(a)-avgX(b));
    for(let k=0;k<L.length;k+=per){const row=L.slice(k,k+per);const off=(maxW-row.length*(W+GX))/2;row.forEach((s,j)=>pos.set(s.id,{x:off+j*(W+GX),y}));y+=H+(k+per<L.length?GR:GY)}});
  function avgX(s){const xs=s.parents.map(id=>pos.get(id)).filter(Boolean).map(p=>p.x);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0}
  const P=16;pos.forEach(v=>{v.x+=P;v.y+=P});   // even padding on every side so glows are never clipped
  return {pos,W,H,per,widest,width:maxW-GX+P*2,height:Math.max(H,y-GY)+P*2}}

/* split a title over two lines at a word break; the second line gets an ellipsis if it still runs long */
function wrap2(t,max){if(t.length<=max)return [t,''];let cut=t.lastIndexOf(' ',max);if(cut<max*.5)cut=max;const a=t.slice(0,cut).trimEnd();let b=t.slice(cut).trim();
  if(b.length>max)b=b.slice(0,max-1).trimEnd()+'…';return [a,b]}
function treeSVG(skills,{interactive=true,sel=null,cols=Infinity}={}){if(!skills.length)return '';const L=layoutTree(skills,cols);let edges='',nodes='';
  skills.forEach(s=>{const b=L.pos.get(s.id);s.parents.forEach(pid=>{const a=L.pos.get(pid);if(!a)return;const done=skills.find(x=>x.id===pid)?.status==='done'&&s.status==='done';const live=skills.find(x=>x.id===pid)?.status==='done';
    const x1=a.x+L.W/2,y1=a.y+L.H,x2=b.x+L.W/2,y2=b.y;edges+=`<path class="sk-edge ${done?'done':live?'live':''}" d="M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}"/>`})});
  skills.forEach(s=>{const p=L.pos.get(s.id);const st=skState(s,skills);const ic={done:'✔',progress:'◐',available:'✦',locked:'🔒'}[st];
    const [l1,l2]=wrap2(ic+' '+s.title,Math.floor((L.W-22)/7.1));const own=s.owner==='both'?'Both':(window.pname?pname(s.owner):s.ownerName||s.owner);
    nodes+=`<g class="sk-node st-${st} ${sel===s.id?'sel':''}" ${interactive?`data-sk="${s.id}" tabindex="0" role="button"`:''} aria-label="${esc(s.title)}, ${st}" transform="translate(${p.x},${p.y})">
     <rect width="${L.W}" height="${L.H}" rx="12"/><title>${esc(s.title)}</title><text x="12" y="${l2?22:28}" class="sk-t">${esc(l1)}</text>${l2?`<text x="12" y="39" class="sk-t">${esc(l2)}</text>`:''}
     <text x="12" y="${l2?58:50}" class="sk-s">${st==='done'&&s.doneAt?new Date(s.doneAt).toLocaleDateString([], {month:'short',day:'numeric'}):st} · ${esc(own)} · +${s.xp||10} XP</text></g>`});
  return `<svg class="sk-svg" width="${L.width}" height="${L.height}" viewBox="0 0 ${L.width} ${L.height}" role="img" aria-label="Skill tree">${edges}${nodes}</svg>`}

/* ---------- zoomable tree viewport: drag to pan, pinch / Ctrl+wheel / buttons to zoom, Auto-fit by default ---------- */
const skView={},skBoxes={};   // skView: per box {mode:'fit'|'manual',s,x,y,W,H}, kept across re-renders
function treeBox(skills,opts={},key='main'){if(!skills.length)return '';skBoxes[key]={skills,opts};
  return `<div class="sk-wrap sk-zoom" data-zk="${key}"><div class="sk-stage"></div>
   <div class="sk-tools" role="toolbar" aria-label="Zoom the tree"><button type="button" data-z="out" aria-label="Zoom out" title="Zoom out (−)">−</button><span class="sk-pct" aria-live="polite">100%</span><button type="button" data-z="in" aria-label="Zoom in" title="Zoom in (+)">+</button><button type="button" data-z="fit" class="sk-fit" aria-label="Auto-fit the whole tree" title="Auto-fit (0)"><span aria-hidden="true">⤢</span> Fit</button></div>
   <div class="sk-hint" aria-hidden="true">Drag to move · pinch or Ctrl + scroll to zoom</div></div>`}
function mountZoom(root=document){$$('.sk-zoom',root).forEach(initZoom)}
function initZoom(box){const stage=$('.sk-stage',box),key=box.dataset.zk||'main',def=skBoxes[key];if(!def||box.dataset.zon)return;box.dataset.zon='1';
  const MIN=.15,MAX=2.5,PAD=18,BOT=54,pct=$('.sk-pct',box);const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const maxH=()=>Math.max(260,Math.min(innerHeight*(innerWidth<700?.68:.7),720));
  /* pick how many skills sit side by side so the auto-fit view is as large (readable) as possible; ties keep fewer rows */
  let W,H,cols;function build(){const bw=box.clientWidth||600,mh=maxH();let best=null;const widest=layoutTree(def.skills).widest;
    for(let c=widest;c>=1;c--){const L=layoutTree(def.skills,c);const sc=Math.min(1.1,(bw-PAD*2)/L.width,(mh-PAD-BOT)/L.height);if(!best||sc>best.sc*1.04)best={c,sc}}
    cols=best.c;stage.innerHTML=treeSVG(def.skills,{...def.opts,cols});const svg=$('svg',stage);W=+svg.getAttribute('width');H=+svg.getAttribute('height')}
  build();let v=skView[key];if(!v||v.W!==W||v.H!==H)v=skView[key]={mode:'fit',s:1,x:0,y:0,W,H};
  const apply=()=>{stage.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.s})`;pct.textContent=Math.round(v.s*100)+'%';box.classList.toggle('is-fit',v.mode==='fit')};
  /* the box height follows the tree's shape, so a wide tree on a phone doesn't sit in a tall empty box */
  function sizeBox(){const bw=box.clientWidth;const want=H*Math.min((bw-PAD*2)/W,1)+PAD+BOT;box.style.height=Math.round(clamp(want,230,maxH()))+'px'}
  function fit(){sizeBox();const bw=box.clientWidth,bh=box.clientHeight;v.s=clamp(Math.min(1.1,(bw-PAD*2)/W,(bh-PAD-BOT)/H),MIN,MAX);
    v.x=(bw-W*v.s)/2;v.y=PAD+Math.max(0,(bh-PAD-BOT-H*v.s)/2);v.mode='fit';apply()}
  function keepIn(){const bw=box.clientWidth,bh=box.clientHeight,m=70;v.x=clamp(v.x,m-W*v.s,bw-m);v.y=clamp(v.y,m-H*v.s,bh-m)}
  function zoomAt(f,cx,cy){const ns=clamp(v.s*f,MIN,MAX);if(cx==null){cx=box.clientWidth/2;cy=box.clientHeight/2}
    v.x=cx-(cx-v.x)*ns/v.s;v.y=cy-(cy-v.y)*ns/v.s;v.s=ns;v.mode='manual';keepIn();apply()}
  if(v.mode==='fit')fit();else{sizeBox();keepIn();apply()}
  $$('[data-z]',box).forEach(b=>{b.onclick=e=>{e.stopPropagation();const z=b.dataset.z;z==='fit'?fit():zoomAt(z==='in'?1.25:0.8)}});
  box.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(1.25)}else if(e.key==='-'||e.key==='_'){e.preventDefault();zoomAt(.8)}else if(e.key==='0'){e.preventDefault();fit()}});
  /* Ctrl+wheel (a laptop trackpad pinch arrives as Ctrl+wheel too) zooms at the cursor; a plain wheel still scrolls the page */
  box.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();const r=box.getBoundingClientRect();zoomAt(Math.exp(-clamp(e.deltaY,-50,50)*.004),e.clientX-r.left,e.clientY-r.top)},{passive:false});
  /* pointers: one finger or the mouse pans, two fingers pinch. Capture starts only on a real drag, so a tap still opens a skill. */
  const pts=new Map();let moved=false,last=null;
  const mid=()=>{const [a,b]=[...pts.values()];const r=box.getBoundingClientRect();return {x:(a.x+b.x)/2-r.left,y:(a.y+b.y)/2-r.top,d:Math.hypot(a.x-b.x,a.y-b.y)}};
  box.addEventListener('pointerdown',e=>{if(!pts.size)moved=false;if(e.target.closest('.sk-tools')||(e.pointerType==='mouse'&&e.button!==0))return;
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY});last=pts.size===2?mid():null});
  box.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;
    if(!moved&&pts.size<2&&Math.hypot(e.clientX-p.x0,e.clientY-p.y0)<6)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(!moved){moved=true;box.classList.add('dragging')}try{if(!box.hasPointerCapture(e.pointerId))box.setPointerCapture(e.pointerId)}catch(_){}
    if(pts.size>=2){const m=mid();if(last){v.x+=m.x-last.x;v.y+=m.y-last.y;if(last.d>0)zoomAt(m.d/last.d,m.x,m.y)}last=m}
    else{v.x+=dx;v.y+=dy;v.mode='manual';keepIn();apply()}});
  const up=e=>{pts.delete(e.pointerId);last=pts.size===2?mid():null;if(!pts.size)box.classList.remove('dragging')};
  box.addEventListener('pointerup',up);box.addEventListener('pointercancel',up);
  box.addEventListener('click',e=>{if(moved&&!e.target.closest('.sk-tools')){e.stopPropagation();e.preventDefault();moved=false}},true);
  box.addEventListener('dblclick',e=>{if(!e.target.closest('.sk-node,.sk-tools'))fit()});
  /* re-fit when the box changes width (rotating a phone, resizing the window) */
  let bw0=box.clientWidth;const ro=new ResizeObserver(()=>{if(!box.isConnected){ro.disconnect();return}if(Math.abs(box.clientWidth-bw0)<2)return;bw0=box.clientWidth;if(v.mode==='fit'){build();v.W=W;v.H=H;fit()}else{keepIn();apply()}});ro.observe(box);
}

/* ---------- money logic (only user-recorded income) ---------- */
/* kinds: income-type entries add, cost-type entries subtract (profit basis only); trading kept separate unless opted in */
const COST_KINDS=new Set(['cost','product_cost','platform_fee','ad_spend','software','fulfillment','refund']);
const isCost=r=>COST_KINDS.has(r.kind);
function incomeSummary(income,{includeTrading=false,basis='revenue',branch=null}={}){
  const inBranch=r=>!branch||r.branch===branch||(window.nodeAncestors&&nodeAncestors(r.branch).includes(branch));
  const rows=income.filter(r=>r.kind!=='invoiced'&&(includeTrading||r.kind!=='trading')&&(basis==='profit'||!isCost(r))&&inBranch(r)).sort((a,b)=>a.date.localeCompare(b.date));
  const val=r=>isCost(r)?-(+r.amount||0):(+r.amount||0);
  const months=new Map();let run=0,peak=0;const tierHits=[];let ti=0;
  rows.forEach(r=>{run+=val(r);months.set(monthKey(r.date),(months.get(monthKey(r.date))||0)+val(r));
    if(run>peak){peak=run;while(ti<MONEY_TIERS.length&&peak>=MONEY_TIERS[ti]){const t=MONEY_TIERS[ti];tierHits.push({kind:MAJOR_TIERS.has(t)?'major':'money',label:`${MAJOR_TIERS.has(t)?'🏆 MAJOR: ':''}${fmt$(t)} ${basis==='profit'?'profit':'earned'} in total`,tier:t,at:r.date});ti++}}});
  const keys=[...months.keys()].sort();const series=[];if(keys.length){let k=keys[0];const end=monthKey(Date.now())>keys[keys.length-1]?monthKey(Date.now()):keys[keys.length-1];
    while(k<=end){series.push({m:k,amount:months.get(k)||0});const [y,mm]=k.split('-').map(Number);k=mm===12?`${y+1}-01`:`${y}-${String(mm+1).padStart(2,'0')}`}}
  const hits=[...tierHits];let streak=0,best=0;const sHit=new Set(),rHit=new Set(),mHit=new Set();const window3=[];let prevAmt=null;
  series.forEach(s=>{streak=s.amount>0?streak+1:0;best=Math.max(best,streak);
    STREAK_TIERS.forEach(t=>{if(streak>=t&&!sHit.has(t)){sHit.add(t);hits.push({kind:'streak',label:`${t} months in a row with income`,tier:t,at:s.m+'-28'})}});
    window3.push(s.amount);if(window3.length>3)window3.shift();
    if(window3.length===3)RUNRATE_TIERS.forEach(t=>{if(window3.every(v=>v>=t)&&!rHit.has(t)){rHit.add(t);hits.push({kind:'runrate',label:`${fmt$(t)}+/month for 3 months straight`,tier:t,at:s.m+'-28'})}});
    /* monthly doubling ladder: a level counts only after it is held 2 months in a row */
    if(prevAmt!==null)MONEY_TIERS.forEach(t=>{if(prevAmt>=t&&s.amount>=t&&!mHit.has(t)){mHit.add(t);hits.push({kind:'monthly',label:`${fmt$(t)}/month held 2 months in a row`,tier:t,at:s.m+'-28'})}});
    prevAmt=s.amount});
  const nextMoney=MONEY_TIERS.find(t=>t>run);const nextStreak=STREAK_TIERS.find(t=>!sHit.has(t));const nextRun=RUNRATE_TIERS.find(t=>!rHit.has(t));
  const monthlyLevel=[...mHit].sort((a,b)=>b-a)[0]||0;const nextMonthly=MONEY_TIERS.find(t=>t>monthlyLevel);
  /* pace estimate from the last 3 complete months — labelled as an estimate in the UI */
  const done=series.slice(0,-1);const recent=(done.length?done:series).slice(-3);const avg=recent.length?recent.reduce((a,x)=>a+x.amount,0)/recent.length:0;
  const forecast=nextMoney&&avg>0?{months:Math.ceil((nextMoney-run)/avg),avg}:null;
  return {total:run,series,hits:hits.sort((a,b)=>a.at.localeCompare(b.at)),streak,best,nextMoney,nextStreak,nextRun,monthlyLevel,nextMonthly,forecast,count:rows.filter(r=>!isCost(r)).length,basis}}

/* combined timeline: level-ups + money milestones on one track */
function journeyEvents(skills,inc){const done=skills.filter(s=>s.status==='done'&&s.doneAt).sort((a,b)=>a.doneAt-b.doneAt);let xp=0,lvl=1;const ev=[];
  done.forEach(s=>{xp+=+s.xp||10;const L=levelInfo(xp).lvl;ev.push({kind:'skill',label:s.title,at:new Date(s.doneAt).toISOString().slice(0,10)});if(L>lvl){lvl=L;ev.push({kind:'level',label:`Reached level ${L}`,at:new Date(s.doneAt).toISOString().slice(0,10)})}});
  return [...ev,...inc.hits].sort((a,b)=>a.at.localeCompare(b.at))}
const EV_IC={skill:'✔',level:'⬆',money:'💰',major:'🏆',streak:'🔥',runrate:'📈',monthly:'📅'};
function timelineHTML(ev,{showAmounts=true}={}){if(!ev.length)return '<div class="empty">Your journey starts with the first completed skill or recorded income.</div>';
  return `<ol class="jline">${ev.map(e=>`<li class="j-${e.kind}"><span class="jdot" aria-hidden="true">${EV_IC[e.kind]}</span><div><b>${esc(showAmounts||e.kind==='skill'||e.kind==='level'?e.label:e.label)}</b><div class="tiny mute">${new Date(e.at+'T12:00').toLocaleDateString([], {month:'short',day:'numeric',year:'numeric'})}</div></div></li>`).join('')}</ol>`}
function paceChart(skills,inc,{showAmounts=true}={}){const doneBy=new Map();skills.filter(s=>s.status==='done'&&s.doneAt).forEach(s=>{const k=monthKey(s.doneAt);doneBy.set(k,(doneBy.get(k)||0)+(+s.xp||10))});
  const keys=[...new Set([...inc.series.map(s=>s.m),...doneBy.keys()])].sort().slice(-12);if(!keys.length)return '<div class="tiny mute">The pace chart fills in as you complete skills and record income.</div>';
  const maxXP=Math.max(1,...keys.map(k=>doneBy.get(k)||0)),maxM=Math.max(1,...keys.map(k=>(inc.series.find(s=>s.m===k)||{}).amount||0));
  return `<div class="pace" role="img" aria-label="Monthly progress XP and income">${keys.map(k=>{const x=doneBy.get(k)||0,m=(inc.series.find(s=>s.m===k)||{}).amount||0;
    return `<div class="pcol" title="${monthLabel(k)}: ${x} XP${showAmounts?', '+fmt$(m):''}"><div class="pbars"><i class="px" style="height:${x/maxXP*100}%"></i><i class="pm" style="height:${m/maxM*100}%"></i></div><span>${monthLabel(k)}</span></div>`}).join('')}</div>
   <div class="row tiny mute" style="margin-top:4px"><span><i class="lg px"></i> Skill XP</span><span><i class="lg pm"></i> Income${showAmounts?'':' (relative)'}</span></div>`}

/* ---------- page ---------- */
let skSel=null,jTab='tree';
function vJourney(el){const skills=S.skills,inc=incomeSummary(S.income,incOpts());const xp=totalXP(skills),L=levelInfo(xp);
  const done=skills.filter(s=>s.status==='done').length,avail=skills.filter(s=>skState(s,skills)==='available'||skState(s,skills)==='progress').length;
  el.innerHTML=hdr('🌳 Skill Tree & Milestones','Every finished step unlocks the next. Money milestones come <b>only</b> from income you record — nothing is estimated.',
   `<div class="seg" role="group" aria-label="Section">${[['tree','🌳 Skill tree'],['ideas','🔎 Ideas & scanner'],['money','💰 Income & milestones'],['journey','🛤 Journey'],['public','🌐 Public showcase']].map(([k,l])=>`<button aria-pressed="${jTab===k}" data-jt="${k}">${l}</button>`).join('')}</div>`)+
  `<div class="grid g3 jstats" style="margin-bottom:14px">
    <div class="card glow"><div class="row"><div class="lvl" aria-label="Level ${L.lvl}">${L.lvl}</div><div style="flex:1"><b>Level ${L.lvl}</b><div class="tiny mute">${xp} XP · ${L.into}/${L.need} to level ${L.lvl+1}</div><div class="jbar"><i style="width:${L.pct}%"></i></div></div></div></div>
    <div class="card"><div class="jst-v">${done}<small>/ ${skills.length}</small></div><div class="tiny mute">skills done · <b style="color:var(--ink)">${avail}</b> ready to work on</div></div>
    <div class="card"><div class="jst-v">${inc.count?fmt$(inc.total):'$0'}</div><div class="tiny mute">${inc.count?`recorded${S.showcase.includeTrading?' (incl. trading)':' (business)'}`:'No income recorded yet'}${inc.nextMoney?` · next ${fmt$(inc.nextMoney)}`:''}${inc.streak?` · 🔥 ${inc.streak} mo`:''}</div></div></div>
   <div id="jbody"></div>`;
  $$('[data-jt]',el).forEach(b=>b.onclick=()=>{jTab=b.dataset.jt;render()});
  ({tree:jTree,ideas:jIdeas,money:jMoney,journey:jJourney,public:jPublic})[jTab]($('#jbody'),inc);
}
function jTree(el){const skills=S.skills;
  el.innerHTML=`<div class="webwrap skwrap"><div class="card sk-card"><div class="sk-head"><button class="btn s p" id="skAdd">+ New skill / goal</button><div class="sk-legend" aria-label="Legend"><span><i class="l-done"></i>✔ Done</span><span><i class="l-prog"></i>◐ In progress</span><span><i class="l-ready"></i>✦ Ready</span><span><i class="l-lock"></i>🔒 Locked</span></div></div>
   ${treeBox(skills,{sel:skSel})||empty('No skills yet — add your first goal.')}</div><aside class="card sk-detail" id="skDetail"></aside></div>`;
  mountZoom(el);const pick=g=>{if(g){skSel=g.dataset.sk;render()}};
  el.onclick=e=>pick(e.target.closest('[data-sk]'));el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){const g=e.target.closest('[data-sk]');if(g){e.preventDefault();pick(g)}}};
  $('#skAdd').onclick=()=>editSkill(null,{parents:skSel?[skSel]:[]});skDetail();
}
function skDetail(){const el=$('#skDetail');const s=skSel&&S.skills.find(x=>x.id===skSel);
  if(!s){el.innerHTML=`<h3>How the tree grows</h3><ol class="small mute" style="padding-left:18px"><li>Pick a ✦ ready skill and start it.</li><li>Mark it ✔ done — what it unlocks lights up.</li><li>Add the next step whenever you know it. The tree never ends.</li></ol><p class="tiny mute">Completing a Mind Web idea or project also adds it here automatically. Starter goals are suggestions — not accomplishments.</p>`;return}
  const st=skState(s,S.skills);const kids=S.skills.filter(x=>x.parents.includes(s.id));const n=s.branch&&node(s.branch);
  el.innerHTML=`<div class="row"><span class="tag">${{done:'✔ done',progress:'◐ in progress',available:'✦ ready',locked:'🔒 locked'}[st]}</span><span class="sp"></span><button class="btn s ghost" id="skX" aria-label="Close">✕</button></div>
   <h2 class="sk-title">${esc(s.title)}</h2><div class="row">${ownerPill(s.owner)}<span class="tag">+${s.xp||10} XP</span>${n?`<a href="#" data-node="${n.id}" class="tag">${nodeIcon(n)} ${esc(n.label)}</a>`:''}</div>
   ${s.notes?`<p class="small" style="white-space:pre-wrap">${esc(s.notes)}</p>`:''}${s.doneAt?`<p class="tiny mute">Completed ${new Date(s.doneAt).toLocaleDateString()}</p>`:''}
   ${st==='locked'?`<p class="small warn">Finish first: ${s.parents.map(id=>S.skills.find(x=>x.id===id)).filter(p=>p&&p.status!=='done').map(p=>esc(p.title)).join(', ')}</p>`:''}
   <div class="row" style="margin-top:8px">${st==='available'?'<button class="btn s p" id="skStart">▶ Start</button>':''}${st==='progress'?'<button class="btn s p" id="skGuide">▶ Continue walkthrough</button>':''}${st!=='done'?`<button class="btn s" id="skDone" ${st==='locked'?'disabled':''}>✔ Mark done</button>`:'<button class="btn s" id="skUndo">Reopen</button>'}
    <button class="btn s" id="skNext">+ Next step</button><button class="btn s" id="skEdit">✎ Edit</button><button class="btn s" id="skTask">+ Task</button></div>
   ${(()=>{const t=typeof rsForSkill==='function'&&rsForSkill(s.id);return t?`<div class="rs-skp"><div class="small">🧩 Research split: <b>${Math.min(rsShared(t),RS_GOAL)} of ${RS_GOAL}</b> days you both checked in</div><button class="btn s" id="skRs">Open research split →</button></div>`:''})()}
   ${kids.length?`<label class="f">Unlocks</label>${kids.map(k=>`<div class="small"><a href="#" data-skp="${k.id}">${esc(k.title)}</a></div>`).join('')}`:''}`;
  wireLinks(el);$$('[data-skp]',el).forEach(a=>a.onclick=e=>{e.preventDefault();skSel=a.dataset.skp;render()});
  $('#skX').onclick=()=>{skSel=null;render()};$('#skEdit').onclick=()=>editSkill(s.id);$('#skNext').onclick=()=>editSkill(null,{parents:[s.id],branch:s.branch});
  $('#skTask').onclick=()=>editTask(null,{title:s.title,nodeId:s.branch,owner:s.owner});
  if($('#skStart'))$('#skStart').onclick=()=>startGuide(s.id);if($('#skGuide'))$('#skGuide').onclick=()=>openGuide(s.id);
  if($('#skDone'))$('#skDone').onclick=()=>completeSkill(s.id);
  if($('#skRs'))$('#skRs').onclick=()=>{rsSel=rsForSkill(s.id).id;rsDay=null;go('research')};
  if($('#skUndo'))$('#skUndo').onclick=()=>commit(x=>Object.assign(x.skills.find(y=>y.id===s.id),{status:'available',doneAt:0}),'Reopened');
}
function completeSkill(id){const s=S.skills.find(x=>x.id===id);const before=levelInfo(totalXP(S.skills)).lvl;
  commit(x=>Object.assign(x.skills.find(y=>y.id===id),{status:'done',doneAt:Date.now(),starter:false}),`+${s.xp||10} XP`,`completed “${s.title}” (+${s.xp||10} XP)`);
  const after=levelInfo(totalXP(S.skills)).lvl;celebrate(after>before||s.owner==='both');if(after>before)toast(`⬆ Level ${after}!`);
  const unlocked=S.skills.filter(k=>k.parents.includes(id)&&skState(k,S.skills)==='available');
  nextStepModal(id,unlocked)}
function editSkill(id,preset={}){const s=id?S.skills.find(x=>x.id===id):{title:'',parents:[],owner:'both',xp:10,branch:'',notes:'',...preset};const others=S.skills.filter(x=>x.id!==id);
  modal(id?'Edit skill':'New skill / goal',`${id?'':goalAssistHTML()}<label class="f" for="skT">Skill or goal</label><div class="row" style="flex-wrap:nowrap"><input id="skT" value="${esc(s.title)}" placeholder="e.g. Land first UGC client" style="flex:1;min-width:0">${id?'':'<button type="button" class="btn s" id="skScan" title="Score this idea">🔎 Scan</button>'}</div>${id?'':'<div id="skScanOut"></div>'}
   <div class="row"><div style="flex:1;min-width:140px"><label class="f" for="skO">Who</label>${ownerSel('skO',s.owner)}</div><div style="flex:1;min-width:140px"><label class="f" for="skXP">Size</label><select id="skXP">${SK_SIZES.map(([v,l])=>`<option value="${v}" ${+s.xp===v?'selected':''}>${l} (+${v} XP)</option>`).join('')}</select></div></div>
   <label class="f">Comes after (must be done first)</label><div class="col" style="max-height:150px;overflow:auto;border:1px solid var(--line);border-radius:9px;padding:6px">${others.map(o=>`<label class="row small"><input type="checkbox" class="skP" value="${o.id}" ${s.parents.includes(o.id)?'checked':''}> ${esc(o.title)}</label>`).join('')||'<span class="tiny mute">This will be a starting point.</span>'}</div>
   <label class="f" for="skB">Mind Web branch (optional)</label><select id="skB"><option value="">— none —</option>${nodeOptions(s.branch)}</select>
   ${id?'':`<input type="hidden" id="skL" value="${esc(JSON.stringify(s.ladder||null))}">`}<label class="f" for="skN">Notes / proof of completion</label><textarea id="skN">${esc(s.notes)}</textarea>`,
   [...(id?[{t:'Delete',c:'d',f:()=>commit(x=>{x.skills=x.skills.filter(y=>y.id!==id);x.skills.forEach(y=>y.parents=y.parents.filter(p=>p!==id))},'Deleted — Undo available')}]:[]),
    {t:'Save',c:'p',f:()=>{const title=val('skT');if(!title){toast('Name the skill');return false}const parents=$$('.skP:checked').map(c=>c.value);
     const data={title,owner:val('skO'),xp:+val('skXP'),branch:val('skB'),notes:val('skN'),parents};if(!id&&$('#skL')){try{const l=JSON.parse(val('skL')||'null');if(l&&l.t===title)data.ladder={idea:l.idea,r:l.r}}catch(e){}}
     commit(x=>{if(id)Object.assign(x.skills.find(y=>y.id===id),data);else{const nid=uid();x.skills.push({id:nid,status:'available',doneAt:0,...data});skSel=nid}},'Saved',id?`edited skill “${title}”`:`added skill “${title}”`)}}],id?{}:{onOpen:d=>wireGoalAssist(d)})}

const incOpts=()=>({includeTrading:!!S.showcase.includeTrading,basis:S.showcase.basis||'revenue'});
const RESULT_KINDS=[['business','💵 Revenue / sale'],['commission','🔗 Affiliate commission'],['client_fee','🤝 Client fee received'],['invoiced','🧾 Invoiced (not yet paid)'],
  ['product_cost','📦 Product cost'],['platform_fee','🏷 Platform fee'],['ad_spend','📣 Ad spend'],['software','💻 Software / generation'],['fulfillment','🚚 Fulfillment & shipping'],['refund','↩ Refund'],['cost','🧾 Other cost'],['trading','📈 Trading P&L (live) — kept separate']];
const kindLabel=k=>(RESULT_KINDS.find(x=>x[0]===k)||[k,k])[1];
function ladderCard(inc,title){const ni=MONEY_TIERS.findIndex(t=>t>inc.total);const prevT=ni>0?MONEY_TIERS[ni-1]:0,nextT=MONEY_TIERS[ni];const pct=nextT?Math.max(0,Math.min(100,Math.round((inc.total-prevT)/(nextT-prevT)*100))):100;
  const fc=inc.forecast?`Estimate: about ${inc.forecast.months} month${inc.forecast.months>1?'s':''} at your recent average of ${fmt$(inc.forecast.avg)}/month — an estimate, not a promise`:'Record a few months of income to see a pace estimate';
  return `<div class="card glow" style="padding:12px;margin:6px 0"><div class="tiny mute">${title}</div><div class="row"><b style="font-size:22px">${fmt$(inc.total)} → ${nextT?fmt$(nextT):'🏁'}</b>${nextT&&MAJOR_TIERS.has(nextT)?'<span class="tier hit">🏆 major</span>':''}</div><div class="jbar"><i style="width:${pct}%"></i></div><div class="tiny mute">${nextT?`${fmt$(Math.max(0,nextT-inc.total))} to go`:'Ladder complete'}</div><div class="tiny mute">🔮 ${fc}</div></div>`}
function jMoney(el,inc){const rows=[...S.income].sort((a,b)=>b.date.localeCompare(a.date));const o=incOpts();
  const tierCard=(label,list,hitSet,fmtv)=>`<div><div class="tiny mute" style="margin:8px 0 4px">${label}</div><div class="tiers">${list.map(t=>`<span class="tier ${hitSet.has(t)?'hit':''}" title="${hitSet.has(t)?'Reached':'Not yet'}">${hitSet.has(t)?'✔':'○'} ${fmtv(t)}</span>`).join('')}</div></div>`;
  const hs=k=>new Set(inc.hits.filter(h=>h.kind===k||(k==='money'&&h.kind==='major')).map(h=>h.tier));
  const ni=MONEY_TIERS.findIndex(t=>t>inc.total);const ladder=MONEY_TIERS.slice(0,Math.max(ni+4,13));
  const mi=MONEY_TIERS.findIndex(t=>t>inc.monthlyLevel);const mLadder=MONEY_TIERS.slice(0,Math.max(mi+4,10));
  const tops=S.nodes.filter(n=>!n.parent&&!n.archived&&S.income.some(r=>r.branch===n.id||(window.nodeAncestors&&nodeAncestors(r.branch).includes(n.id))));
  const costs=S.income.filter(isCost).reduce((a,r)=>a+(+r.amount||0),0);
  el.innerHTML=`<div class="grid g2"><div class="card"><h3>💰 Doubling ladder</h3>
     <div class="seg" role="group" aria-label="Count"><button aria-pressed="${o.basis==='revenue'}" data-basis="revenue">Money in</button><button aria-pressed="${o.basis==='profit'}" data-basis="profit">Profit (after costs)</button></div>
     <p class="tiny mute">Only money you record below${o.includeTrading?' (live trading included)':'; trading P&L is kept separate unless included'}.${o.basis==='profit'?(costs?` Costs logged: ${fmt$(costs)}.`:' ⚠ No costs logged yet — profit may be overstated.'):''}</p>
     ${ladderCard(inc,'Next doubling goal — combined')}
     ${tierCard('Combined ladder (x2 until each power of ten, then repeat · 🏆 = major)',ladder,hs('money'),t=>MAJOR_TIERS.has(t)?'🏆 '+fmt$(t):fmt$(t))}
     ${tierCard(`Monthly ladder — a level counts after 2 months in a row at it (now ${inc.monthlyLevel?fmt$(inc.monthlyLevel)+'/mo':'none yet'})`,mLadder,hs('monthly'),t=>fmt$(t)+'/mo')}
     ${tierCard('Consistency — months in a row with income',STREAK_TIERS,hs('streak'),t=>t+' mo')}
     <label class="row small" style="margin-top:10px"><input type="checkbox" id="incTr" ${o.includeTrading?'checked':''}> Count live trading results toward milestones</label>
     <h3 style="margin-top:14px">🧩 Ladder per business</h3>${tops.length?tops.map(b=>{const bi=incomeSummary(S.income,{...o,branch:b.id});const n=MONEY_TIERS.find(t=>t>bi.total);const pv=[...MONEY_TIERS].reverse().find(t=>t<=bi.total)||0;
       return `<div style="margin:6px 0"><div class="row small"><b>${nodeIcon(b)} ${esc(b.label)}</b><span class="sp"></span>${fmt$(bi.total)} → ${n?fmt$(n):'🏁'}</div><div class="jbar"><i style="width:${n?Math.max(0,Math.min(100,(bi.total-pv)/(n-pv)*100)):100}%"></i></div></div>`}).join(''):'<div class="tiny mute">Choose a business when recording money to get a ladder for each one.</div>'}
     <h3 style="margin-top:14px">📊 Progress vs income</h3>${paceChart(S.skills,inc)}</div>
   <div class="card"><h3>Record a result or cost</h3><form id="incF" class="col"><div class="row"><input id="incA" type="number" min="0" step="0.01" placeholder="Amount ($)" required style="flex:1;min-width:110px" aria-label="Amount"><input id="incD" type="date" value="${new Date().toISOString().slice(0,10)}" style="flex:1;min-width:140px" aria-label="Date"></div>
     <div class="row"><select id="incB" style="flex:2;min-width:150px" aria-label="Business, path or project"><option value="">Business / path / project…</option>${nodeOptions('')}</select>
      <select id="incK" style="flex:1;min-width:150px" aria-label="Type">${RESULT_KINDS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select>${ownerSel('incO','both')}</div>
     <input id="incN" placeholder="Note or evidence (order #, client, link…)" aria-label="Note"><button class="btn p">+ Record</button></form>
     <p class="tiny mute">Only record money actually received or spent. Invoiced amounts are tracked but don't count until received. Simulated or demo trading doesn't belong here.</p>
     <div style="margin-top:8px">${rows.map(r=>{const b=r.branch&&node(r.branch);return `<div class="task" style="cursor:default"><div class="t-body" style="cursor:default"><div class="t-title">${isCost(r)?'−':''}${fmt$(+r.amount)} <span class="tiny mute">· ${esc(r.date)}</span></div><div class="row" style="gap:4px">${ownerPill(r.owner)}<span class="tag">${esc(kindLabel(r.kind))}</span>${b?`<span class="tag">${nodeIcon(b)} ${esc(b.label)}</span>`:''}${r.note?`<span class="tiny mute">${esc(r.note)}</span>`:''}</div></div><button class="btn s ghost d" data-incd="${r.id}" aria-label="Delete entry">✕</button></div>`}).join('')||'<div class="tiny mute">Nothing recorded yet.</div>'}</div></div></div>`;
  $$('[data-basis]',el).forEach(b=>b.onclick=()=>commit(x=>x.showcase={...x.showcase,basis:b.dataset.basis}));
  $('#incF').onsubmit=e=>{e.preventDefault();const amount=+val('incA');if(!(amount>0))return toast('Enter an amount above 0');recordResult({amount,date:val('incD'),branch:val('incB'),kind:val('incK'),owner:val('incO'),note:val('incN')})};
  $$('[data-incd]',el).forEach(b=>b.onclick=()=>commit(x=>x.income=x.income.filter(r=>r.id!==b.dataset.incd),'Entry deleted — Undo available'));
  $('#incTr').onchange=e=>commit(x=>x.showcase={...x.showcase,includeTrading:e.target.checked});
}
function recordResult(r){const before=new Set(incomeSummary(S.income,incOpts()).hits.map(h=>h.kind+h.tier));
  commit(x=>x.income.push({id:uid(),date:new Date().toISOString().slice(0,10),owner:'both',note:'',branch:'',...r,date:r.date||new Date().toISOString().slice(0,10),by:me()}),isCost(r)?'Cost recorded':'Result recorded',`recorded ${kindLabel(r.kind).replace(/^\S+\s/,'').toLowerCase()} of ${fmt$(r.amount)}`);
  const after=incomeSummary(S.income,incOpts());const fresh=after.hits.filter(h=>!before.has(h.kind+h.tier));if(fresh.length)moneyHits(fresh,after)}
/* money -> skill tree: each new doubling goal becomes an achievement and unlocks the next goal; majors ask what worked */
function moneyHits(fresh,inc){const tierHits=fresh.filter(h=>h.kind==='money'||h.kind==='major');celebrate(true);toast('🏆 '+fresh[fresh.length-1].label);
  if(!tierHits.length)return;const top=tierHits[tierHits.length-1];let major=null;
  commit(x=>{let parent=x.skills.filter(s=>s.fromMoney&&s.status==='done').sort((a,b)=>b.fromMoney-a.fromMoney)[0];
    x.skills=x.skills.filter(s=>!(s.moneyGoal&&s.status!=='done'));
    tierHits.forEach(h=>{if(x.skills.some(s=>s.fromMoney===h.tier))return;const sk={id:uid(),title:`${h.kind==='major'?'🏆 ':'💰 '}Reached ${fmt$(h.tier)}`,parents:parent?[parent.id]:[],status:'done',owner:'both',xp:h.kind==='major'?100:25,branch:'',notes:'',doneAt:Date.now(),fromMoney:h.tier};x.skills.push(sk);parent=sk;if(h.kind==='major')major=sk.id});
    if(inc.nextMoney)x.skills.push({id:uid(),title:`Reach ${fmt$(inc.nextMoney)}`,parents:parent?[parent.id]:[],status:'available',owner:'both',xp:MAJOR_TIERS.has(inc.nextMoney)?100:25,branch:'',notes:'Next doubling goal — added automatically',doneAt:0,moneyGoal:inc.nextMoney});
  },null,`reached ${fmt$(top.tier)}`);
  if(major)setTimeout(()=>modal('🏆 Major milestone!',`<p>You reached <b>${fmt$(top.tier)}</b>. Write down what worked so you can repeat it — it's saved on this milestone in your skill tree.</p><label class="f" for="mw">What worked?</label><textarea id="mw" placeholder="Channels, offers, habits, people…"></textarea>`,
    [{t:'Save',c:'p',f:()=>{const t=val('mw');if(t)commit(x=>x.skills.find(s=>s.id===major).notes=t,'Saved to your skill tree','reflected on a major milestone')}}]),400)}
function jJourney(el,inc){el.innerHTML=`<div class="grid g2"><div class="card"><h3>🛤 One track: skills, levels & money</h3>${timelineHTML(journeyEvents(S.skills,inc))}</div><div class="card"><h3>📊 Monthly pace</h3>${paceChart(S.skills,inc)}
  <h3 style="margin-top:14px">Up next</h3><div class="col small">${S.skills.filter(s=>['available','progress'].includes(skState(s,S.skills))).slice(0,5).map(s=>`<div>✦ <a href="#" data-skp="${s.id}">${esc(s.title)}</a></div>`).join('')||'<div class="tiny mute">Add new goals to keep the tree growing.</div>'}
  ${inc.nextMoney?`<div>💰 ${fmt$(inc.total)} → ${fmt$(inc.nextMoney)}${inc.forecast?` <span class='tiny mute'>(estimate ~${inc.forecast.months} mo)</span>`:''}</div>`:''}${inc.nextMonthly?`<div>📅 Monthly ladder: ${fmt$(inc.monthlyLevel)}/mo → ${fmt$(inc.nextMonthly)}/mo</div>`:''}${inc.nextStreak?`<div>🔥 ${inc.streak}/${inc.nextStreak} months in a row</div>`:''}</div></div></div>`;
  $$('[data-skp]',el).forEach(a=>a.onclick=e=>{e.preventDefault();skSel=a.dataset.skp;jTab='tree';render()})}

/* ---------- public showcase ---------- */
function showcaseSnapshot(){const sc=S.showcase;const inc=incomeSummary(S.income,{includeTrading:sc.includeTrading,basis:sc.basis||'revenue'});
  return {v:1,ws:S.workspace.name,updated:Date.now(),showAmounts:!!sc.showAmounts,
    partners:S.partners.map(p=>({id:p.id,name:sc.showNames?p.name:(p.id==='A'?'Partner 1':'Partner 2'),avatar:{...p.avatar,kind:p.avatar.kind==='photo'?'char':p.avatar.kind}})),
    skills:S.skills.map(s=>({id:s.id,title:s.title,parents:s.parents,status:s.status,owner:s.owner,xp:s.xp,doneAt:s.doneAt})),
    income:{total:sc.showAmounts?inc.total:null,hits:inc.hits,series:inc.series.map(x=>({m:x.m,amount:sc.showAmounts?x.amount:(x.amount>0?1:0)})),streak:inc.streak,count:inc.count,nextMoney:sc.showAmounts?inc.nextMoney:null}}}
function publicURL(slug){return new URL('public.html?s='+encodeURIComponent(slug),location.href).href}
function jPublic(el){const sc=S.showcase;const room=Sync.room;
  el.innerHTML=`<div class="grid g2"><div class="card"><h3>🌐 Public showcase</h3>
    <p class="small">A read-only page anyone with the link can view: your skill tree, levels and milestone badges. It never includes notes, tasks, Mind Web details, private profile fields or photos.</p>
    ${room?'':'<p class="warn small">Open a shared workspace first — the public page is served from it.</p>'}
    <label class="row small"><input type="checkbox" id="scPub" ${sc.public?'checked':''} ${room?'':'disabled'}> Make showcase public</label>
    <label class="row small"><input type="checkbox" id="scAmt" ${sc.showAmounts?'checked':''}> Show exact dollar amounts (off = milestone badges only)</label>
    <label class="row small"><input type="checkbox" id="scNm" ${sc.showNames?'checked':''}> Show our display names</label>
    ${sc.public&&sc.slug?`<label class="f">Public link</label><div class="row"><input id="scUrl" readonly value="${esc(publicURL(sc.slug))}" style="flex:1"><button class="btn s" id="scCopy">Copy</button><a class="btn s" href="${esc(publicURL(sc.slug))}" target="_blank" rel="noopener">Open</a></div>
     <p class="tiny mute">This link works for others once the app is hosted online. Right now it's served from this computer.</p>`:''}</div>
   <div class="card"><h3>Preview</h3>${treeBox(S.skills,{interactive:false},'pub')}</div></div>`;
  const save=patch=>commit(x=>x.showcase={...x.showcase,...patch},null,null);
  $('#scPub').onchange=async e=>{if(e.target.checked){try{const slug=await Sync.publish(showcaseSnapshot(),true);save({public:true,slug});toast('Showcase is public')}catch(err){toast(err.message);render()}}else{try{await Sync.publish(null,false)}catch(err){}save({public:false});toast('Showcase is private')}};
  $('#scAmt').onchange=e=>save({showAmounts:e.target.checked});$('#scNm').onchange=e=>save({showNames:e.target.checked});
  if($('#scCopy'))$('#scCopy').onclick=()=>navigator.clipboard.writeText($('#scUrl').value).then(()=>toast('Link copied'),()=>toast('Select and copy the link'));
  mountZoom(el);
}

/* ---------- auto-evolve: completed Mind Web ideas/projects become achievements ---------- */
window.afterCommit=(prev,next)=>{const pm=new Map(prev.nodes.map(n=>[n.id,n.status]));
  next.nodes.forEach(n=>{if(n.status==='completed'&&pm.get(n.id)!=='completed'&&!next.skills.some(s=>s.fromNode===n.id)){
    const root=n.parent?next.nodes.find(x=>x.id===n.parent):null;let parentSkill=root&&next.skills.find(s=>s.fromBranch===root.id);
    if(root&&!parentSkill){parentSkill={id:uid(),title:`Explore ${root.label}`,parents:[],status:'done',owner:root.owner||'both',xp:10,branch:root.id,notes:'Added automatically when work in this branch was completed',doneAt:Date.now(),fromBranch:root.id};next.skills.push(parentSkill)}
    next.skills.push({id:uid(),title:`${n.kind==='project'?'Completed project':'Completed'}: ${n.label}`,parents:parentSkill?[parentSkill.id]:[],status:'done',owner:n.owner||'both',xp:n.kind==='project'?50:25,branch:n.id,notes:'Added automatically from the Mind Web',doneAt:Date.now(),fromNode:n.id});
    setTimeout(()=>toast('🌳 Added to your skill tree'),300)}})};
