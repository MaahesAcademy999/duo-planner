'use strict';
/* ===== Ideas & Scanner: viable topics and products, a scanner that scores any idea, and a Recommended pick =====
   Scores are a guide, not a promise. Starting ratings for the built-in ideas are our own estimates; "fit" is
   worked out from what you have already done in Duo (Mind Web statuses, recorded income, clips, skills, weekly
   topics). The optional live check reads public Wikipedia page views (free, no key) as a rough interest signal. */

/* factors are 1–5. demand: how many buyers/brands want it · comp: how crowded (5 = very) ·
   cost: how cheap to start (5 = almost free) · speed: how fast to a first $ (5 = days) */
const IDEA_LIB=[
 /* ---- topics (work you can do / services you can sell) ---- */
 {id:'t-ugc-beauty',kind:'topic',title:'UGC videos for skincare & beauty brands',branch:'UGC & Ads',demand:5,comp:4,cost:4,speed:4,kw:['ugc','skincare','beauty','makeup','brand'],
  why:'Beauty brands buy the most UGC and re-order often.',goal:'Pitch 10 skincare brands for paid UGC',step:'Film 3 sample videos with products you already own, then pitch.'},
 {id:'t-ugc-tiktokshop',kind:'topic',title:'UGC for TikTok Shop sellers',branch:'Creator partnerships & UGC',alt:['UGC & Ads','TikTok'],demand:5,comp:3,cost:4,speed:4,kw:['ugc','tiktok','shop','seller'],
  why:'New TikTok Shop sellers need lots of short videos fast and pay per video.',goal:'Land first UGC client from TikTok Shop',step:'Message 15 small TikTok Shop sellers with a 3-video starter offer.'},
 {id:'t-clip-stream',kind:'topic',title:'Live-stream clipping campaigns',branch:'Live Clipping & Content Campaigns',demand:4,comp:3,cost:5,speed:5,kw:['clip','clipping','stream','twitch','kick','campaign'],
  why:'Pays per 1k views with no client to find: join a campaign and post.',goal:'Earn first payout from a clipping campaign',step:'Join one campaign and post 5 clips this week.'},
 {id:'t-clip-podcast',kind:'topic',title:'Podcast & interview clipping',branch:'Live Clipping & Content Campaigns',demand:4,comp:3,cost:5,speed:4,kw:['podcast','interview','clip','clipping'],
  why:'Podcasters want short clips for every episode, so it can become a monthly retainer.',goal:'Offer a clipping retainer to 5 podcasts',step:'Cut 3 free sample clips from one podcast and send them to the host.'},
 {id:'t-local-video',kind:'topic',title:'Short-form videos for local businesses',branch:'Local Marketing',demand:4,comp:2,cost:5,speed:3,kw:['local','restaurant','gym','salon','business'],
  why:'Few local shops post good video, and they are easy to reach in person.',goal:'Sign first local business video client',step:'Visit 5 nearby businesses with a 30-second sample of their shop.'},
 {id:'t-amazon-reviews',kind:'topic',title:'Product review & comparison videos',branch:'Amazon',alt:['Affiliate Marketing'],demand:4,comp:4,cost:4,speed:3,kw:['review','comparison','amazon','affiliate'],
  why:'Review content earns affiliate commission long after it is posted.',goal:'Post 10 product comparison videos',step:'Pick one product type and compare the top 3 options.'},
 {id:'t-faceless',kind:'topic',title:'Faceless explainer channel',branch:'Faceless Content',demand:4,comp:4,cost:4,speed:2,kw:['faceless','explainer','channel','youtube','narrated'],
  why:'No camera needed and it can be batched, but views take months to build.',goal:'Publish 20 faceless shorts on one channel',step:'Choose one niche and script 5 shorts.'},
 {id:'t-ai-content',kind:'topic',title:'AI-assisted editing & captions service',branch:'AI-Assisted Content',demand:4,comp:3,cost:4,speed:4,kw:['ai','edit','editing','caption','repurpose'],
  why:'Creators pay to have long videos cut and captioned; AI tools make it quick.',goal:'Land first editing client',step:'Repurpose one creator video into 5 captioned shorts as a sample.'},
 {id:'t-templates',kind:'topic',title:'Sell Canva / Notion templates',branch:'Digital Products',demand:4,comp:4,cost:5,speed:3,kw:['template','canva','notion','digital','download'],
  why:'Make once, sell many times; no stock or shipping.',goal:'Launch our first digital template',step:'Build one template you would use yourselves and list it.'},
 {id:'t-stock',kind:'topic',title:'Stock video & photo licensing',branch:'Stock Licensing',demand:3,comp:4,cost:4,speed:2,kw:['stock','licensing','footage','photo'],
  why:'Slow, but footage you already shoot can earn on the side.',goal:'Upload our first 25 stock clips',step:'Sort existing footage and upload the 25 sharpest clips.'},
 {id:'t-detailing',kind:'topic',title:'Mobile car detailing',branch:'Mobile Detailing',demand:4,comp:3,cost:2,speed:4,kw:['detailing','car','wash','mobile'],
  why:'Steady local demand and cash on day one, but needs supplies and a vehicle.',goal:'Book first 3 detailing jobs',step:'Price a basic package and post it in local groups.'},
 {id:'t-transcription',kind:'topic',title:'Transcription & captioning gigs',branch:'Freelance Transcription & 1099',demand:3,comp:4,cost:5,speed:5,kw:['transcription','caption','freelance','typing'],
  why:'Quick to start and paid fast, but low pay per hour.',goal:'Finish first paid transcription job',step:'Sign up on two transcription platforms and pass their tests.'},
 /* ---- products (things to promote, review or sell) ---- */
 {id:'p-beauty-minis',kind:'product',title:'Skincare & beauty minis',branch:'TikTok',alt:['UGC & Ads'],demand:5,comp:5,cost:4,speed:4,kw:['skincare','beauty','serum','makeup','lip'],
  why:'Top-selling TikTok Shop category; free samples are easy to get.',goal:'Request 3 beauty samples on TikTok Shop',step:'Apply for free samples from 3 sellers in the affiliate centre.'},
 {id:'p-kitchen',kind:'product',title:'Kitchen gadgets',branch:'TikTok',alt:['Amazon'],demand:5,comp:4,cost:4,speed:4,kw:['kitchen','gadget','blender','cooking','food'],
  why:'Very visual: the demo sells it in 10 seconds.',goal:'Film 5 kitchen gadget demo videos',step:'Pick 3 gadgets under $25 with a clear before/after.'},
 {id:'p-home-org',kind:'product',title:'Home organisation & cleaning',branch:'Amazon',alt:['TikTok'],demand:4,comp:4,cost:4,speed:4,kw:['organization','organisation','cleaning','storage','home'],
  why:'Satisfying before/after videos and evergreen demand.',goal:'Post 5 home organisation videos',step:'Film one messy-to-tidy space with 2 products.'},
 {id:'p-pets',kind:'product',title:'Pet products',branch:'TikTok',alt:['Amazon'],demand:4,comp:3,cost:4,speed:4,kw:['pet','dog','cat','toy'],
  why:'Pet videos get shared a lot and the niche is less crowded than beauty.',goal:'Find 3 pet products to promote',step:'Shortlist 3 pet products with good reviews and free samples.'},
 {id:'p-phone',kind:'product',title:'Phone & desk accessories',branch:'Amazon',alt:['TikTok'],demand:4,comp:4,cost:4,speed:4,kw:['phone','desk','charger','accessory','tech','gadget'],
  why:'Cheap to buy, easy to film, wide audience.',goal:'Review 5 phone or desk accessories',step:'Order 2 accessories under $20 and film unboxings.'},
 {id:'p-fitness',kind:'product',title:'Fitness accessories (no supplements)',branch:'TikTok',alt:['Amazon'],demand:4,comp:4,cost:3,speed:3,kw:['fitness','gym','workout','band','yoga'],
  why:'Strong January–spring demand; gear avoids the health-claim rules supplements have.',goal:'Film 5 home workout gear videos',step:'Pick bands, mats or grips and show them in use.'},
 {id:'p-car',kind:'product',title:'Car accessories',branch:'Amazon',alt:['TikTok'],demand:4,comp:3,cost:4,speed:4,kw:['car','auto','vehicle','dash'],
  why:'Clear problem-solution demos and fewer creators than beauty.',goal:'Post 5 car accessory videos',step:'Pick 3 accessories that fix an everyday annoyance.'},
 {id:'p-decor',kind:'product',title:'LED & room decor',branch:'TikTok',alt:['Amazon'],demand:4,comp:4,cost:4,speed:4,kw:['led','decor','room','light','aesthetic'],
  why:'Looks great on camera; works with night-time setup videos.',goal:'Film a room makeover with 3 decor products',step:'Choose a corner to transform and list 3 products.'},
 {id:'p-digital',kind:'product',title:'Our own e-book or guide',branch:'Digital Products',demand:3,comp:3,cost:5,speed:3,kw:['ebook','e-book','guide','course','pdf'],
  why:'Keeps 100% of the margin and builds on what you already know.',goal:'Write and list our first guide',step:'Outline a 15-page guide on something you have done yourselves.'},
 {id:'p-walmart',kind:'product',title:'Walmart Creator picks',branch:'Walmart',demand:3,comp:2,cost:4,speed:3,kw:['walmart','creator'],
  why:'Fewer creators than Amazon, so posts stand out (needs approval).',goal:'Apply to Walmart Creator',step:'Check eligibility and apply with your best 3 videos.'},
];
const RISK_WORDS=[['supplement','health claims'],['weight loss','health claims'],['detox','health claims'],['cbd','age & legal limits'],['vape','age & legal limits'],['crypto','financial claims'],
  ['forex','financial claims'],['gambling','age & legal limits'],['casino','age & legal limits'],['firearm','platform bans'],['knife','platform rules'],['medical','health claims'],['replica','counterfeit rules']];

/* ---------- scoring ---------- */
const IDEA_W={demand:.25,comp:.15,cost:.15,speed:.2,fit:.25};
function ideaScore(f){const v=f.demand*IDEA_W.demand+(6-f.comp)*IDEA_W.comp+f.cost*IDEA_W.cost+f.speed*IDEA_W.speed+f.fit*IDEA_W.fit; /* 1..5 */
  return Math.max(0,Math.min(100,Math.round((v-1)/4*100-(f.risks&&f.risks.length?8:0))))}
const findNode=label=>label&&S.nodes.find(n=>!n.archived&&n.label.toLowerCase()===String(label).toLowerCase());
const subtree=id=>{const out=[id];for(let i=0;i<out.length;i++)S.nodes.forEach(n=>{if(n.parent===out[i])out.push(n.id)});return out};
const ST_FIT={active:5,completed:4.5,testing:4.5,ready:4,researching:3.5,needs_req:3.5,paused:2,idea:0,declined:-1};
/* fit 1–5 from your own Duo data, with a short reason for each signal */
function ideaFit(idea){let fit=2;const why=[];const labels=[idea.branch,...(idea.alt||[])];let declined=false;
  labels.forEach(l=>{const n=findNode(l);if(!n)return;const ids=subtree(n.id);
    ids.forEach(id=>{const x=node(id);const v=ST_FIT[x.status]??0;if(x.status==='declined'&&id===n.id)declined=true;
      if(v>fit){fit=v;why.push(`${x.label} is ${(STATUS_LABEL[x.status]||x.status).toLowerCase()} in your Mind Web`)}});
    const inc=S.income.filter(r=>ids.includes(r.branch)&&!isCost(r)&&r.kind!=='invoiced');
    if(inc.length){fit+=1;why.push(`you have recorded income under ${n.label}`)}});
  const kw=idea.kw||[];const hit=t=>kw.some(k=>String(t||'').toLowerCase().includes(k));
  const sk=S.skills.filter(s=>(s.status==='done'||s.status==='progress')&&hit(s.title));
  if(sk.length){fit+=.5;why.push(`you've worked on “${sk[0].title}”`)}
  if(kw.includes('clipping')&&(S.clips||[]).length){fit+=1;why.push(`you already run ${(S.clips||[]).length} clipping campaign${S.clips.length>1?'s':''}`)}
  if(S.days.some(d=>labels.some(l=>d.topics.includes(l)))){fit+=.5;why.push('it is one of your weekly topics')}
  if(declined){fit=1;why.length=0;why.push('you marked this “not pursuing”')}
  return {fit:Math.max(1,Math.min(5,Math.round(fit*2)/2)),why:[...new Set(why)].slice(0,3)}}
function scoredIdeas(){const have=new Set(S.skills.map(s=>s.title.toLowerCase()));
  return IDEA_LIB.map(i=>{const f=ideaFit(i);const r={...i,fit:f.fit,fitWhy:f.why,inTree:have.has(i.goal.toLowerCase())};r.score=ideaScore(r);return r}).sort((a,b)=>b.score-a.score)}
const recommended=(kind)=>scoredIdeas().filter(i=>!i.inTree&&i.fit>1&&(!kind||i.kind===kind))[0]||null;
function scoreWhy(i){const out=[];if(i.demand>=5)out.push('very high demand');else if(i.demand>=4)out.push('strong demand');
  if(i.speed>=4)out.push('quick first payout');if(i.cost>=5)out.push('almost free to start');else if(i.cost>=4)out.push('cheap to start');
  if(i.comp<=2)out.push('not crowded');else if(i.comp>=5)out.push('crowded, so you need a clear angle');return out}

/* ---------- scanner: rate any typed topic or product ---------- */
function scanText(text,kind){const t=text.toLowerCase();const words=t.split(/[^a-z0-9]+/).filter(w=>w.length>2);
  let best=null,bestHits=0;IDEA_LIB.forEach(i=>{if(kind&&i.kind!==kind)return;const hits=i.kw.filter(k=>t.includes(k)).length+words.filter(w=>i.title.toLowerCase().includes(w)).length*.5;
    if(hits>bestHits){bestHits=hits;best=i}});
  const base=best?{demand:best.demand,comp:best.comp,cost:best.cost,speed:best.speed,branch:best.branch,alt:best.alt}:{demand:3,comp:3,cost:3,speed:3,branch:''};
  const r={id:'scan',kind:kind||(best?best.kind:'topic'),title:text,...base,kw:[...new Set([...words,...(best?best.kw:[])])],like:best,goal:(kind||(best?best.kind:'topic'))==='product'?`Film 3 videos for ${text}`:`Make our first test piece for ${text}`,step:best?best.step:''};
  if(!best){const n=S.nodes.find(n=>!n.archived&&words.some(w=>n.label.toLowerCase().includes(w)));if(n)r.branch=n.label}
  r.risks=[...new Set(RISK_WORDS.filter(([w])=>t.includes(w)).map(x=>x[1]))];
  const f=ideaFit(r);r.fit=f.fit;r.fitWhy=f.why;r.score=ideaScore(r);return r}
/* live interest: Wikipedia page views for the closest article, last 30 days vs the 60 before */
async function liveInterest(text){const day=d=>d.toISOString().slice(0,10).replace(/-/g,'');
  const q=await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&origin=*&search=${encodeURIComponent(text)}`).then(r=>r.json());
  const title=q&&q[1]&&q[1][0];if(!title)return null;const end=new Date(Date.now()-864e5),start=new Date(Date.now()-91*864e5);
  const pv=await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(title.replace(/ /g,'_'))}/daily/${day(start)}/${day(end)}`).then(r=>r.ok?r.json():null);
  const v=(pv&&pv.items||[]).map(x=>x.views);if(v.length<20)return {title,views:0,trend:0};
  const last=v.slice(-30),prev=v.slice(0,-30);const avg=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
  return {title,views:Math.round(avg(last)),trend:avg(prev)?avg(last)/avg(prev)-1:0}}
const interestDemand=li=>{let d=li.views<50?2:li.views<300?3:li.views<2000?4:5;if(li.trend>.15)d+=.5;if(li.trend<-.15)d-=.5;return Math.max(1,Math.min(5,d))};

/* ---------- UI pieces ---------- */
const IDEA_F=[['demand','Demand'],['comp','Low competition'],['cost','Low start cost'],['speed','Speed to first $'],['fit','Fit for you']];
const scoreClass=s=>s>=75?'hi':s>=55?'mid':'lo';
const ring=s=>`<div class="id-ring ${scoreClass(s)}" style="--p:${s}" aria-label="Score ${s} out of 100"><b>${s}</b></div>`;
function bars(i,edit){return `<div class="id-bars">${IDEA_F.map(([k,l])=>{const v=k==='comp'?6-i[k]:i[k];
  const mid=edit&&k!=='fit'?`<select data-f="${k}" aria-label="${l}">${[1,2,3,4,5].map(n=>`<option ${n===Math.round(v)?'selected':''}>${n}</option>`).join('')}</select>`:`<b>${v}</b>`;
  return `<div class="id-bar"><span>${l}</span>${mid}<i title="${l}: ${v} out of 5"><em style="width:${v/5*100}%"></em></i></div>`}).join('')}</div>`}
function ideaCard(i,{rec=false}={}){const kindTag=i.kind==='product'?'📦 Product':'🧭 Topic';
  return `<div class="card id-card ${rec?'id-rec glow':''}" data-idea="${i.id}">
   <div class="row" style="flex-wrap:nowrap;align-items:flex-start">${ring(i.score)}<div style="flex:1;min-width:0">
    ${rec?'<span class="id-badge">✨ Recommended for you</span>':''}<h3 class="id-t">${esc(i.title)}</h3>
    <div class="row"><span class="tag">${kindTag}</span>${i.branch?`<span class="tag">${nodeIcon(findNode(i.branch))||'✦'} ${esc(i.branch)}</span>`:''}${i.inTree?'<span class="tag">🌳 in your tree</span>':''}</div></div></div>
   <p class="small" style="margin:8px 0 4px">${esc(i.why||'')}</p>
   ${rec||i.fitWhy.length?`<div class="tiny mute">${[...scoreWhy(i),...i.fitWhy].map(esc).join(' · ')}</div>`:''}
   ${bars(i)}
   ${i.step?`<div class="tiny" style="margin-top:6px"><b>First step:</b> ${esc(i.step)}</div>`:''}
   <div class="row" style="margin-top:8px"><button class="btn s p" data-goal="${i.id}">🎯 Add as goal</button><button class="btn s" data-web="${i.id}">💡 Add to Mind Web</button></div></div>`}
function ideaToGoal(i){const n=findNode(i.branch)||(i.alt||[]).map(findNode).find(Boolean);
  editSkill(null,{title:i.goal||i.title,branch:n?n.id:'',notes:`From Ideas & scanner (score ${i.score}/100): ${i.title}.${i.step?'\nFirst step: '+i.step:''}`,parents:skSel?[skSel]:[]})}
function ideaToWeb(i){const p=findNode(i.branch);const id=uid();const a=Math.random()*Math.PI*2;
  commit(s=>s.nodes.push({id,label:i.title,parent:p?p.id:null,kind:p?(nodeAncestors(p.id).length>=1?'path':'sub'):'category',status:'researching',owner:'both',
    notes:`Scanned in Duo: ${i.score}/100.${i.why?' '+i.why:''}${i.step?'\nFirst step: '+i.step:''}`,archived:false,collapsed:false,x:(Math.random()-.5)*300,y:(Math.random()-.5)*200,dx:Math.cos(a)*150,dy:Math.sin(a)*95}),
    'Added to Mind Web',`added idea “${i.title}” to the Mind Web`)}
function wireIdeaButtons(el,list){const get=id=>list.find(x=>x.id===id);
  $$('[data-goal]',el).forEach(b=>b.onclick=()=>ideaToGoal(get(b.dataset.goal)));
  $$('[data-web]',el).forEach(b=>b.onclick=()=>ideaToWeb(get(b.dataset.web)))}

/* scan result block (used on the page and inside the new-goal form) */
function scanResultHTML(r,{compact=false}={}){return `<div class="card id-card id-scan" data-idea="scan">
   <div class="row" style="flex-wrap:nowrap;align-items:flex-start">${ring(r.score)}<div style="flex:1;min-width:0"><span class="id-badge">${r.score>=75?'✅ Looks viable':r.score>=55?'🤔 Worth testing':'⚠ Weak right now'}</span>
    <h3 class="id-t">${esc(r.title)}</h3><div class="tiny mute">${r.like?`Rated like “${esc(r.like.title)}”. Adjust any rating below.`:'No close match in the idea list, so ratings start in the middle. Adjust them below.'}</div></div></div>
   ${r.risks.length?`<p class="small warn" style="margin:6px 0">⚠ Check the platform rules first: ${r.risks.map(esc).join(', ')}.</p>`:''}
   ${r.fitWhy.length?`<div class="tiny mute">Fit: ${r.fitWhy.map(esc).join(' · ')}</div>`:''}
   <div class="tiny mute id-live">${r.live?liveLine(r.live):'<button class="btn s ghost" data-live>🌐 Check live interest</button>'}</div>
   ${bars(r,true)}
   ${compact?'':`<div class="row" style="margin-top:8px"><button class="btn s p" data-goal="scan">🎯 Add as goal</button><button class="btn s" data-web="scan">💡 Add to Mind Web</button></div>`}</div>`}
const liveLine=li=>li.err?'Live check could not reach Wikipedia. Ratings above still work.':!li.title?'No public page found for this, so demand stays as rated.':
  `🌐 Public interest (Wikipedia “${esc(li.title)}”): ${li.views.toLocaleString()} views/day, ${li.trend>.15?'📈 rising':li.trend<-.15?'📉 falling':'➡ steady'} ${li.trend?`(${li.trend>0?'+':''}${Math.round(li.trend*100)}% vs the 2 months before)`:''}. Demand set to ${interestDemand(li)}/5.`;
function wireScan(box,r,onChange){
  $$('select[data-f]',box).forEach(s=>s.onchange=()=>{const k=s.dataset.f;r[k]=k==='comp'?6-s.value:+s.value;r.score=ideaScore(r);onChange()});
  const lb=$('[data-live]',box);if(lb)lb.onclick=async()=>{lb.disabled=true;lb.textContent='Checking…';
    try{const li=await liveInterest(r.title);r.live=li||{};if(li&&li.views)r.demand=interestDemand(li)}catch(e){r.live={err:true}}r.score=ideaScore(r);onChange()}}

/* ---------- Skill Tree tab ---------- */
let idKind='',idScan=null;
function jIdeas(el){const all=scoredIdeas();const list=all.filter(i=>!idKind||i.kind===idKind);const rec=recommended(idKind);
  el.innerHTML=`<div class="card" style="margin-bottom:14px"><h3>🔎 Scan a topic or product</h3>
    <p class="tiny mute" style="margin:2px 0 8px">Type any niche, service or product. Duo rates demand, competition, start cost and speed, and checks how well it fits what you two already do.</p>
    <form class="row" id="idForm"><input id="idQ" placeholder="e.g. pet grooming gloves, podcast clipping, Notion budget template" style="flex:1 1 240px;width:auto;min-width:0" value="${esc(idScan?idScan.title:'')}">
     <select id="idK" aria-label="Topic or product" style="width:auto;flex:none"><option value="">Auto</option><option value="topic">Topic</option><option value="product">Product</option></select><button class="btn p" type="submit">Scan</button></form>
    <div id="idOut" style="margin-top:10px">${idScan?scanResultHTML(idScan):''}</div></div>
   <div class="row" style="margin-bottom:10px"><div class="seg" role="group" aria-label="Show">${[['','All'],['topic','🧭 Topics'],['product','📦 Products']].map(([k,l])=>`<button aria-pressed="${idKind===k}" data-ik="${k}">${l}</button>`).join('')}</div>
    <span class="tiny mute">Ranked best first. Score = demand 25% · fit for you 25% · speed 20% · low competition 15% · low cost 15%.</span></div>
   ${rec?`<div style="margin-bottom:14px">${ideaCard(rec,{rec:true})}</div>`:''}
   <div class="grid g3">${list.filter(i=>!rec||i.id!==rec.id).map(i=>ideaCard(i)).join('')}</div>
   <p class="tiny mute" style="margin-top:12px">Scores are a starting guide, not a promise of income. Built-in ratings are general estimates; “fit” comes from your own Mind Web, income, clips and skills, so it changes as you work.</p>`;
  $$('[data-ik]',el).forEach(b=>b.onclick=()=>{idKind=b.dataset.ik;render()});
  wireIdeaButtons(el,[...all,...(idScan?[idScan]:[])]);
  const out=$('#idOut',el);const paint=()=>{out.innerHTML=scanResultHTML(idScan);wireIdeaButtons(out,[idScan]);wireScan(out,idScan,paint)};
  if(idScan)wireScan(out,idScan,paint);
  $('#idForm',el).onsubmit=e=>{e.preventDefault();const q=val('idQ');if(!q){toast('Type a topic or product');return}idScan=scanText(q,val('idK'));paint()};
  if(idScan)$('#idK',el).value=idKind&&idScan.kind===idKind?idKind:''}

/* ---------- inside the New skill / goal form ---------- */
function goalAssistHTML(){const rec=recommended();if(!rec)return '';
  return `<div class="id-assist"><div class="row" style="flex-wrap:nowrap">${ring(rec.score)}<div style="flex:1;min-width:0"><span class="id-badge">✨ Recommended</span>
   <div class="small"><b>${esc(rec.goal)}</b></div><div class="tiny mute">${esc(rec.title)} · ${[...scoreWhy(rec),...rec.fitWhy].slice(0,3).map(esc).join(' · ')}</div></div></div>
   <div class="row" style="margin-top:6px"><button type="button" class="btn s p" id="idUse">Use this</button><button type="button" class="btn s" id="idMore">More ideas →</button></div></div>`}
function wireGoalAssist(d){const rec=recommended();
  const fill=i=>{$('#skT',d).value=i.goal||i.title;const n=findNode(i.branch)||(i.alt||[]).map(findNode).find(Boolean);if(n)$('#skB',d).value=n.id;
    const N=$('#skN',d);if(!N.value)N.value=`From Ideas & scanner (score ${i.score}/100): ${i.title}.${i.step?'\nFirst step: '+i.step:''}`};
  if($('#idUse',d))$('#idUse',d).onclick=()=>fill(rec);
  if($('#idMore',d))$('#idMore',d).onclick=()=>{d.close();jTab='ideas';if(location.hash!=='#/journey')location.hash='#/journey';render()};
  const sb=$('#skScan',d),out=$('#skScanOut',d);if(!sb)return;let r=null;
  const paint=()=>{out.innerHTML=scanResultHTML(r,{compact:true});wireScan(out,r,paint)};
  sb.onclick=()=>{const q=$('#skT',d).value.trim();if(!q){toast('Type a goal or idea first');return}r=scanText(q,'');paint()}}
