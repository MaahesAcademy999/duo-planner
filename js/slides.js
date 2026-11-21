'use strict';
/* ===== Simple slide style: one part at a time (Start › Schedule › Projects › My Tasks › Skill Tree) =====
   Personal setting (profile.layout = 'slides' | 'full'). Swipe, the ‹ › buttons, or the arrow keys move between slides.
   Every other page (Mind Web, Clips, Notes …) opens as a side trip with a "Back to slides" button. */
const DECK=[
  {k:'dash',t:'Start',h:'Where to?',ic:'◈',sub:'Go through the flow, or jump straight to one part.'},
  {k:'schedule',t:'Schedule',h:'Set up your day',ic:'📅',sub:'Choose the topic, add what needs doing, then slide on.'},
  {k:'projects',t:'Projects',h:'Your projects',ic:'🚀',sub:'What you are building and the next task for each.'},
  {k:'tasks',t:'My Tasks',h:'My tasks',ic:'✓',sub:'Tick things off or add a new one.'},
  {k:'journey',t:'Skill Tree',h:'One skill at a time',ic:'🌳',sub:'Work on one skill with a step-by-step walkthrough.'},
];
const SLIDE_MORE=['research','web','clips','post','notes','suggest','checklist','activity','profile','settings'];
const slideIdx=k=>DECK.findIndex(d=>d.k===k);
const slideMode=()=>prof(me()).layout==='slides';
let slideDay=null;

function setLayout(v){if(!S.partners.some(p=>p.id===me()))return toast('Set up your profile first');
  commit(s=>{s.partners.find(p=>p.id===me()).layout=v},v==='slides'?'Slide style on. Swipe, tap Next, or use the arrow keys.':'Full view on');scrollTo(0,0)}

function slideGo(j,dir){j=Math.max(0,Math.min(DECK.length-1,j));go(DECK[j].k);
  const pg=$('#page');pg.classList.remove('sl-r','sl-l','fx-enter');void pg.offsetWidth;pg.classList.add(dir<0?'sl-l':'sl-r')}
function slideStep(dir){const i=slideIdx(page);if(i<0||slidePeek)return;
  if(dir>0&&i===DECK.length-1){toast('All done. Back to the start ✓');return slideGo(0,1)}
  if(dir<0&&i===0)return;slideGo(i+dir,dir)}
function slideBack(){if(slidePeek){slidePeek=false;render();scrollTo(0,0)}else go(slideIdx(LOCAL.slideLast)>=0?LOCAL.slideLast:'dash')}

/* top bar button + bottom slide bar (called from shell) */
function slideShell(){const sm=slideMode();const lb=$('#layoutBtn');
  if(lb){lb.innerHTML=sm?'▦ Full<span class="hide-m"> view</span>':'▭ Slides';lb.title=sm?'Switch to the full layout':'Switch to the simple slide style';lb.setAttribute('aria-pressed',String(sm));lb.onclick=()=>setLayout(sm?'full':'slides')}
  const bar=$('#slidebar');if(!bar)return;bar.hidden=!sm;if(!sm){bar.innerHTML='';return}
  const i=slideIdx(page);
  if(i<0||slidePeek){bar.innerHTML=`<button class="btn p sl-wide" id="slBarBack">← ${slidePeek?'Back to the simple view':'Back to slides'}</button>`;$('#slBarBack').onclick=slideBack;return}
  const prev=DECK[i-1],next=DECK[i+1];
  bar.innerHTML=`<button class="btn sl-nav" id="slPrev" ${prev?'':'disabled'} aria-label="${prev?'Back to '+prev.t:'Back'}">‹<span class="sl-lbl"> ${prev?esc(prev.t):'Back'}</span></button>
    <ol class="sl-dots">${DECK.map((d,j)=>`<li><button data-sl="${j}" ${j===i?'aria-current="step"':''} aria-label="${j+1} of ${DECK.length}: ${esc(d.t)}" title="${esc(d.t)}"><span aria-hidden="true">${d.ic}</span></button></li>`).join('')}</ol>
    <button class="btn p sl-nav" id="slNext" aria-label="${next?'Next: '+next.t:'Finish'}">${next?`<span class="sl-lbl">${esc(next.t)} </span>›`:'Done ✓'}</button>`;
  $('#slPrev').onclick=()=>slideStep(-1);$('#slNext').onclick=()=>slideStep(1);
  $$('[data-sl]',bar).forEach(b=>b.onclick=()=>{const j=+b.dataset.sl;if(j!==i)slideGo(j,j>i?1:-1)});
  $('#crumbs').innerHTML=`<button data-go="dash">◈ ${esc(S.workspace.name)}</button>${i?` <span aria-hidden="true">›</span> <b>${esc(DECK[i].t)}</b> <span class="tiny">· ${i} of ${DECK.length-1}</span>`:''}`;
  $$('[data-go]',$('#crumbs')).forEach(b=>b.onclick=()=>slideGo(0,-1));
}
function slideBanner(el){el.insertAdjacentHTML('afterbegin',`<div class="sl-banner"><button class="btn s" id="slBack">← ${slidePeek?'Back to the simple view':'Back to slides'}</button><span class="tiny mute">${slidePeek?'Full page':'Outside the slide flow'}</span></div>`);
  $('#slBack',el).onclick=slideBack}

function vSlide(el){const i=slideIdx(page);const D=DECK[i];setLocal({slideLast:D.k});
  el.innerHTML=`<div class="slide" data-slide="${D.k}">${i?`<div class="sl-head"><div class="sl-step tiny">Step ${i} of ${DECK.length-1} · ${esc(D.t)}</div><h1 class="title">${D.ic} ${esc(D.h)}</h1><p class="mute small">${esc(D.sub)}</p></div>`:''}
    <div class="sl-body" id="slBody"></div>${i?`<div class="sl-foot"><button class="btn s ghost" id="slPeek">▦ Open the full ${esc(D.t)} page</button></div>`:''}</div>`;
  ({dash:sDash,schedule:sSchedule,projects:sProjects,tasks:sTasks,journey:sJourney})[D.k]($('#slBody',el));
  const pk=$('#slPeek',el);if(pk)pk.onclick=()=>{slidePeek=true;render();scrollTo(0,0)};
  $$('[data-slgo]',el).forEach(b=>b.onclick=()=>slideGo(slideIdx(b.dataset.slgo),1));
}

/* ----- slide: Start ----- */
const myOpen=()=>S.tasks.filter(t=>!t.done&&(t.owner===me()||t.owner==='both'));
function slideFocusSkill(){const sk=S.skills;const ok=s=>s&&['progress','available'].includes(skState(s,sk));
  const sel=sk.find(x=>x.id===skSel);if(ok(sel))return sel;return sk.find(s=>skState(s,sk)==='progress')||sk.find(s=>skState(s,sk)==='available')||null}
function slidePeekLine(k){const today=todayDay();
  if(k==='schedule'){if(!today)return 'No workday today. Plan the week.';const n=S.tasks.filter(t=>t.dayId===today.id&&!t.done).length;
    const need=today.topicRule!=='none'&&today.topics.filter(Boolean).length<(today.topicRule==='thursday'&&today.format==='two'?2:1);
    return `Today: ${today.theme} · ${n} task${n===1?'':'s'}${need?' · ⚠ topic to choose':''}`}
  if(k==='projects'){const n=S.nodes.filter(p=>p.kind==='project'&&!p.archived&&p.status!=='completed').length;return n?`${n} active project${n===1?'':'s'}`:'No projects yet'}
  if(k==='tasks'){const n=myOpen().length;return n?`${n} open task${n===1?'':'s'}`:'Nothing open 🎉'}
  if(k==='journey'){const f=slideFocusSkill();return f?`Next: ${f.title}`:'Add your next goal'}
  return ''}
function sDash(el){const A=prof(me());const today=todayDay();const h=new Date().getHours();const greet=h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  const ag=typeof agendaData==='function'?agendaData():{items:[]};const first=ag.items[0];
  const last=slideIdx(LOCAL.slideLast)>0?LOCAL.slideLast:null;
  const badges={suggest:unseenSuggestions()+pendingProposals()};
  el.innerHTML=`<div class="sl-hello"><p class="hello">${greet}, ${esc(A.name)}</p><div class="mute small">${today?`Today is <b>${esc(today.name)}</b> · ${today.icon||''} ${esc(today.theme)}`:'No workday scheduled today'}</div><div class="tiny mute" style="margin-top:4px">Go through the flow one part at a time, or jump straight to one.</div></div>
    <div class="card sl-focus"><div class="sl-fc-row">${avatar(me(),30)}<div class="sl-fc-t"><span class="tiny mute">You</span><span class="small">${A.working?`🛰 <b>${esc(A.working)}</b>`:'<span class="mute">No current focus set</span>'}</span></div><button class="btn s" id="slFocus">${A.working?'Change':'🛰 Set my focus'}</button></div>
      <div class="sl-fc-row">${avatar(partnerId(),30)}<div class="sl-fc-t"><span class="tiny mute">${esc(prof(partnerId()).name||'Your partner')}</span><span class="small">${prof(partnerId()).working?`🛰 <b>${esc(prof(partnerId()).working)}</b>`:'<span class="mute">No current focus set</span>'}</span></div></div></div>
    ${first?`<div class="card glow sl-next"><div class="tiny mute">Next up today</div><div class="row" style="flex-wrap:nowrap"><b style="flex:1;min-width:0;overflow-wrap:anywhere">${esc(first.title)}</b>${agendaWhen(first)}</div><button class="btn p" id="slAg">▶ Start it</button></div>`:''}
    ${first&&first.kind==='checkin'?'':rsSlideCard()}
    <button class="btn p sl-big" data-slgo="${last||'schedule'}">${last?`Continue: ${esc(DECK[slideIdx(last)].t)}`:'Start the flow'} ›</button>
    <h2 class="sl-sub">Or pick a part</h2>
    <div class="sl-cards">${DECK.slice(1).map((d,j)=>`<button class="sl-card" data-slgo="${d.k}"><span class="sl-ic" aria-hidden="true">${d.ic}</span><span style="flex:1;min-width:0"><span class="tiny mute">Step ${j+1}</span><b>${esc(d.t)}</b><span class="small mute">${esc(slidePeekLine(d.k))}</span></span><span class="sl-arr" aria-hidden="true">›</span></button>`).join('')}</div>
    <h2 class="sl-sub">Outside the flow</h2>
    <div class="sl-more">${SLIDE_MORE.map(k=>{const p=pageOf(k);return `<button class="btn s" data-go="${k}">${p.ic} ${esc(p.l)}${badges[k]?` <span class="badge">${badges[k]}</span>`:''}</button>`}).join('')}</div>`;
  const s=$('#slAg',el);if(s)s.onclick=()=>agendaOpen(first);rsWireCards(el);$('#slFocus',el).onclick=editFocus;
}

/* ----- slide: Schedule (one day at a time) ----- */
function sSchedule(el){const days=S.days.filter(d=>!d.archived);const today=todayDay();const d=days.find(x=>x.id===slideDay)||today||days[0];
  const un=S.tasks.filter(t=>!t.dayId&&!t.done);
  if(!d){el.innerHTML=empty('No workdays yet.')+'<div class="row" style="justify-content:center"><button class="btn p" id="slAddDay">+ Add a workday</button></div>';$('#slAddDay').onclick=()=>editDay();return}
  el.innerHTML=`<div class="sl-chips" role="group" aria-label="Choose a day">${days.map(x=>`<button aria-pressed="${x===d}" data-sday="${x.id}">${x.icon||'📅'} ${esc(x.name.slice(0,3))}${today&&x.id===today.id?' · today':''}</button>`).join('')}</div>
    <div class="sl-one">${dayCard(d,'all')}</div>
    ${un.length?`<details class="card sl-un"><summary><b>📥 ${un.length} task${un.length===1?'':'s'} without a day</b> <span class="tiny mute">· open one to give it a day</span></summary><div class="drop" data-day="">${un.map(taskHTML).join('')}</div></details>`:''}`;
  wireDayCards(el);$$('[data-sday]',el).forEach(b=>b.onclick=()=>{slideDay=b.dataset.sday;render()});
}

/* ----- slide: Projects ----- */
function sProjects(el){const projs=S.nodes.filter(n=>n.kind==='project'&&!n.archived);const act=projs.filter(p=>p.status!=='completed');const fin=projs.length-act.length;
  el.innerHTML=`<div class="row sl-actions"><button class="btn p" id="slNewProj">+ New project</button><button class="btn" data-go="web">🕸 Turn an idea into a project</button></div>`+
   (act.length?`<div class="col sl-list">${act.map(p=>{const ts=S.tasks.filter(t=>t.nodeId===p.id);const dn=ts.filter(t=>t.done).length;const pct=ts.length?Math.round(dn/ts.length*100):0;const nx=ts.find(t=>!t.done);
     return `<div class="card sl-proj"><div class="row" style="flex-wrap:nowrap"><b style="flex:1;min-width:0;overflow-wrap:anywhere">${esc(p.label)}</b>${stPill(p.status)}</div>
      <div class="sl-prog" role="progressbar" aria-label="Tasks done" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><div class="tiny mute">${ts.length?`${dn} of ${ts.length} tasks done`:'No tasks yet'}</div>
      ${nx?`<div class="tiny mute" style="margin-top:8px">Next task</div><div class="drop">${taskHTML(nx)}</div>`:''}
      <div class="row" style="margin-top:6px"><button class="btn s" data-ptask="${p.id}">+ Task</button><button class="btn s ghost" data-node="${p.id}">Open in Mind Web</button></div></div>`}).join('')}</div>`
    :empty('No projects yet. Start one here, or turn an idea from the Mind Web into a project.'))+
   (fin?`<p class="tiny mute" style="text-align:center">${fin} finished project${fin===1?' is':'s are'} on the full page.</p>`:'');
  wireTasks(el);wireLinks(el);$('#slNewProj',el).onclick=newProject;
  $$('[data-ptask]',el).forEach(b=>b.onclick=()=>editTask(null,{nodeId:b.dataset.ptask}));
}

/* ----- slide: My Tasks ----- */
function sTasks(el){const today=todayDay();const days=S.days.filter(d=>!d.archived);const ti=today?days.indexOf(today):0;
  const ord=t=>{const i=days.findIndex(d=>d.id===t.dayId);return i<0?99:(i-ti+days.length)%days.length};
  const open=myOpen().sort((a,b)=>ord(a)-ord(b)||(a.time||'~').localeCompare(b.time||'~'));
  const done=S.tasks.filter(t=>t.done&&(t.owner===me()||t.owner==='both'));
  el.innerHTML=`<form class="sl-add" id="slAddT"><input id="slT" placeholder="Add a task…" aria-label="New task" autocomplete="off"><select id="slTD" aria-label="Which day">${dayOptions(today?today.id:'')}</select><button class="btn p" type="submit">Add</button></form>
    <div class="card"><h3>To do (${open.length})</h3><div class="drop">${open.map(taskHTML).join('')||empty('Nothing open 🎉')}</div></div>
    ${done.length?`<details class="sl-done"><summary class="small mute">✓ ${done.length} done</summary><div class="drop">${done.slice(0,30).map(taskHTML).join('')}</div></details>`:''}
    <p class="tiny mute" style="text-align:center">Your tasks and shared ones. Your partner's are on the full page.</p>`;
  wireTasks(el);
  $('#slAddT',el).onsubmit=e=>{e.preventDefault();const title=val('slT');if(!title){toast('Type the task first');return}const dayId=val('slTD')||null;
    commit(s=>s.tasks.push({id:uid(),done:false,by:me(),title,owner:me(),dayId,time:'',due:'',mode:'',nodeId:'',notes:''}),'Added ✓',`added task “${title}”`);
    const i=$('#slT');if(i)i.focus()};
}

/* ----- slide: Skill Tree & Milestones (one skill at a time) ----- */
function sJourney(el){const sk=S.skills;const xp=totalXP(sk),L=levelInfo(xp);const f=slideFocusSkill();const doneN=sk.filter(s=>s.status==='done').length;
  const ready=sk.filter(s=>s!==f&&['progress','available'].includes(skState(s,sk)));const locked=sk.filter(s=>skState(s,sk)==='locked').length;
  const inc=incomeSummary(S.income,incOpts());const ni=MONEY_TIERS.findIndex(t=>t>inc.total);const prevT=ni>0?MONEY_TIERS[ni-1]:0,nextT=MONEY_TIERS[ni];
  const mp=nextT?Math.max(0,Math.min(100,Math.round((inc.total-prevT)/(nextT-prevT)*100))):100;
  let focus;
  if(f){const st=skState(f,sk);const G=guideFor(f);const g=gState(f);const at=Math.min(g.at,G.steps.length-1);
    focus=`<div class="card glow sl-skill"><div class="row sl-center"><span class="tag">${st==='progress'?'◐ In progress':'✦ Ready'}</span><span class="tag">+${f.xp||10} XP</span>${ownerPill(f.owner)}</div>
      <h2 class="sl-skt">${esc(f.title)}</h2>
      ${st==='progress'?`<div class="tiny mute">Walkthrough step ${at+1} of ${G.steps.length}: ${esc(G.steps[at].t)}</div><div class="sl-prog"><i style="width:${Math.round(at/Math.max(1,G.steps.length-1)*100)}%"></i></div>`
        :`<p class="small mute">A short walkthrough takes you through it, one step at a time.</p>`}
      <button class="btn p sl-big" id="slSkGo">${st==='progress'?'▶ Continue walkthrough':'▶ Start walkthrough'}</button>
      <div class="row sl-center"><button class="btn s" id="slSkDone">✔ Mark done</button>${ready.length?'<button class="btn s ghost" id="slSkSkip">Show another skill ›</button>':''}</div></div>`}
  else focus=`<div class="card glow sl-skill"><h2 class="sl-skt">${sk.length?'All caught up 🎉':'No skills yet'}</h2><p class="small mute">Add the next goal you want to reach. The Recommended pick can fill it in for you.</p><button class="btn p sl-big" id="slSkAdd">+ Add your next goal</button></div>`;
  el.innerHTML=`<div class="sl-lvl"><div class="lvl" aria-hidden="true">${L.lvl}</div><div style="flex:1"><b>Level ${L.lvl}</b> <span class="tiny mute">${xp} XP · ${doneN} skill${doneN===1?'':'s'} done</span><div class="jbar"><i style="width:${L.pct}%"></i></div></div></div>
    ${focus}
    ${ready.length?`<h2 class="sl-sub">Also ready</h2><div class="sl-chips wrap">${ready.slice(0,5).map(s=>`<button data-slsk="${s.id}">${skState(s,sk)==='progress'?'◐':'✦'} ${esc(s.title)}</button>`).join('')}</div>`:''}
    ${locked?`<p class="tiny mute" style="text-align:center">🔒 ${locked} more unlock as you finish these.</p>`:''}
    ${sk.length>1?`<details class="card sl-tree"><summary>🌳 See the whole tree <span class="tiny mute">· zoom, drag, Fit</span></summary>${treeBox(sk,{sel:f?f.id:null},'slide')}</details>`:''}
    <div class="card sl-mile"><div class="row"><b style="flex:1">💰 Next money milestone${nextT?`: ${fmt$(nextT)}`:''}</b><span class="tiny mute">${inc.count?fmt$(inc.total)+' recorded':'Nothing recorded yet'}</span></div>
      <div class="sl-prog"><i style="width:${mp}%"></i></div><div class="row"><span class="tiny mute" style="flex:1">Only income you record counts.</span><button class="btn s" id="slInc">+ Record income</button></div></div>
    <div class="row sl-center" style="margin-top:10px"><button class="btn s ghost" id="slIdeas">🔎 Find ideas</button><button class="btn s ghost" id="slSkNew">+ New goal</button></div>`;
  const on=(id,fn)=>{const b=$('#'+id,el);if(b)b.onclick=fn};
  on('slSkGo',()=>skState(f,S.skills)==='progress'?openGuide(f.id):startGuide(f.id));
  on('slSkDone',()=>completeSkill(f.id));
  on('slSkSkip',()=>{skSel=ready[0].id;render()});
  on('slSkAdd',()=>editSkill(null,{parents:[]}));on('slSkNew',()=>editSkill(null,{parents:f?[f.id]:[],branch:f?f.branch:''}));
  on('slInc',()=>{jTab='money';slidePeek=true;render();scrollTo(0,0)});
  on('slIdeas',()=>{jTab='ideas';slidePeek=true;render();scrollTo(0,0)});
  $$('[data-slsk]',el).forEach(b=>b.onclick=()=>{skSel=b.dataset.slsk;render()});
  const dt=$('.sl-tree',el);if(dt){dt.open=slTreeOpen;const m=()=>{if(dt.open)mountZoom(dt)};dt.ontoggle=()=>{slTreeOpen=dt.open;m()};m();
    dt.addEventListener('click',e=>{const g=e.target.closest('[data-sk]');if(g)openSkill(g.dataset.sk)});dt.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const g=e.target.closest('[data-sk]');if(g){e.preventDefault();openSkill(g.dataset.sk)}}})}
}
let slTreeOpen=false;

/* ----- layout picker (Themes & Settings) ----- */
function layoutPicker(){const cur=slideMode()?'slides':'full';
  return `<p class="small mute">Personal: only changes your view. Your partner keeps their own.</p><div class="gd-picks">${[['full','▦ Full view','Every page and option, with the side menu.'],['slides','▭ Simple slides','One part at a time: Schedule › Projects › My Tasks › Skill Tree. Swipe, tap Next, or use the ← → keys.']].map(([k,t,d])=>`<button type="button" class="gd-pick ${cur===k?'on':''}" aria-pressed="${cur===k}" data-layout="${k}"><span style="flex:1"><b>${t}</b><span class="tiny mute">${d}</span></span></button>`).join('')}</div>`}

/* ----- swipe + keyboard ----- */
(function slideInput(){let sx=0,sy=0,st=0,ok=false;
  const inDeck=()=>slideMode()&&!slidePeek&&slideIdx(page)>=0&&!$('#dlg').open;
  const scrollsX=(el)=>{for(let n=el;n&&n!==document.body;n=n.parentElement){if(n.scrollWidth>n.clientWidth+2&&/(auto|scroll)/.test(getComputedStyle(n).overflowX))return true}return false};
  document.addEventListener('touchstart',e=>{ok=false;if(!inDeck()||e.touches.length!==1)return;const t=e.target;
    if(t.closest('input,textarea,select,[contenteditable],svg,.sk-wrap,#slidebar,.top')||scrollsX(t))return;
    ok=true;sx=e.touches[0].clientX;sy=e.touches[0].clientY;st=Date.now()},{passive:true});
  document.addEventListener('touchend',e=>{if(!ok)return;ok=false;const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.6&&Date.now()-st<800&&inDeck())slideStep(dx<0?1:-1)},{passive:true});
  document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.target.matches('input,textarea,select,[contenteditable]')||!inDeck())return;
    if(e.key==='ArrowRight'){e.preventDefault();slideStep(1)}else if(e.key==='ArrowLeft'){e.preventDefault();slideStep(-1)}});
})();
