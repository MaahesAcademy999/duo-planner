'use strict';
/* ===== Shell, navigation, and main pages ===== */
const PAGES=[
  {k:'dash',l:'Command Center',ic:'◈',g:'Home'},
  {k:'web',l:'Mind Web',ic:'🕸',g:'Home'},
  {k:'journey',l:'Skill Tree & Milestones',ic:'🌳',g:'Home'},
  {k:'schedule',l:'Schedule',ic:'📅',g:'Plan'},
  {k:'projects',l:'Projects',ic:'🚀',g:'Plan'},
  {k:'tasks',l:'My Tasks',ic:'✓',g:'Plan'},
  {k:'post',l:'Post & Submit',ic:'🚀',g:'Plan'},
  {k:'clips',l:'Clipping Campaigns',ic:'✂',g:'Plan'},
  {k:'checklist',l:'Shared Checklist',ic:'☑',g:'Plan'},
  {k:'research',l:'Research Split',ic:'🧩',g:'Together'},
  {k:'notes',l:'Notes',ic:'📝',g:'Together'},
  {k:'suggest',l:'Suggestions',ic:'💬',g:'Together'},
  {k:'activity',l:'Activity',ic:'⚡',g:'Together'},
  {k:'profile',l:'Profile',ic:'👤',g:'You'},
  {k:'settings',l:'Themes & Settings',ic:'🎨',g:'You'},
];
const MOBILE=['dash','post','clips','schedule','suggest'];
let page='dash',scopes={tasks:'mine',projects:'all',notes:'all',schedule:'all'},noteQ='',taskQ='';
const pageOf=k=>PAGES.find(p=>p.k===k)||PAGES[0];
let slidePeek=false;   // slide style: show the full page for the current slide
function go(k){slidePeek=false;page=pageOf(k).k;if(location.hash!=='#/'+page)history.pushState(null,'','#/'+page);$('.side').classList.remove('open');render();const pg=$('#page');pg.classList.remove('fx-enter');void pg.offsetWidth;pg.classList.add('fx-enter');clearTimeout(pg._fx);pg._fx=setTimeout(()=>pg.classList.remove('fx-enter'),900);$('#main').focus({preventScroll:true});scrollTo(0,0)}
window.addEventListener('popstate',()=>{slidePeek=false;page=pageOf(location.hash.replace('#/','')).k;render()});

function unseenSuggestions(){return S.suggestions.filter(g=>g.status==='open'&&g.by!==me()&&!(g.seen||{})[me()]).length}
function pendingProposals(){return S.proposals.filter(p=>p.status==='pending'&&p.by!==me()).length}

function shell(){
  const badges={suggest:unseenSuggestions()+pendingProposals()};
  let g='';$('#nav').innerHTML=PAGES.map(p=>{const head=p.g!==g?(g=p.g,`<div class="navgrp">${p.g}</div>`):'';
    return head+`<button class="navi" data-go="${p.k}" ${page===p.k?'aria-current="page"':''}><span class="ic" aria-hidden="true">${p.ic}</span>${p.l}${badges[p.k]?`<span class="badge" aria-label="${badges[p.k]} new">${badges[p.k]}</span>`:''}</button>`}).join('');
  $('#bottomnav').innerHTML=MOBILE.map(k=>{const p=pageOf(k);return `<button data-go="${k}" ${page===k?'aria-current="page"':''}><span aria-hidden="true" style="font-size:18px">${p.ic}</span>${p.l.replace('Command Center','Home').replace('Suggestions','Ideas').replace('Skill Tree & Milestones','Journey').replace('Post & Submit','Post').replace('Clipping Campaigns','Clips')}${badges[k]?` (${badges[k]})`:''}</button>`}).join('');
  const P=pageOf(page);
  $('#crumbs').innerHTML=`<button data-go="dash">◈ ${esc(S.workspace.name)}</button>${page!=='dash'?` <span aria-hidden="true">›</span> <b>${esc(P.l)}</b>`:''}${page==='web'&&selId&&node(selId)?` <span>›</span> <span>${esc(node(selId).label)}</span>`:''}`;
  $('#meChip').innerHTML=`${avatar(me(),30)}<span class="hide-m small">${esc(prof(me()).name)}</span>`;
  $$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
  document.title=`${P.l} · Duo`;
  if(typeof slideShell==='function')slideShell();
}
function render(){applyTheme();if(window.FX)FX.sync();const sm=typeof slideMode==='function'&&slideMode();document.documentElement.toggleAttribute('data-slides',sm);shell();
  const v={post:vPost,clips:vClips,journey:vJourney,dash:vDash,web:vWeb,schedule:vSchedule,projects:vProjects,tasks:vTasks,checklist:vChecklist,notes:vNotes,suggest:vSuggest,research:vResearch,activity:vActivity,profile:vProfile,settings:vSettings}[page];
  if(sm&&!slidePeek&&slideIdx(page)>=0)vSlide($('#page'));
  else{v($('#page'));if(sm)slideBanner($('#page'));else if(typeof injectTip==='function')injectTip($('#page'),page)}
  $$('[data-scope]').forEach(b=>b.onclick=()=>{scopes[b.dataset.scopeKey]=b.dataset.scope;render()});
  $$('[data-go]',$('#page')).forEach(b=>b.onclick=()=>go(b.dataset.go));
  $$('[data-qa]',$('#page')).forEach(b=>b.onclick=()=>quickAdd(b.dataset.qa));
  if(!prof(me()).onboarded&&window.Auth&&Auth.signedIn&&Sync.room&&!document.body.classList.contains('gated')&&!$('#dlg').open&&!window.__onboardShown){window.__onboardShown=true;setTimeout(()=>{if(!document.body.classList.contains('gated'))onboarding();else window.__onboardShown=false},150)}
}
const empty=(msg,qa,label)=>`<div class="empty">${msg}${qa?`<br><button class="btn s p" data-qa="${qa}">${label}</button>`:''}</div>`;
const hdr=(title,sub,right='')=>`<div class="row" style="margin-bottom:14px;align-items:flex-end"><div><h1 class="title">${title}</h1>${sub?`<div class="mute small">${sub}</div>`:''}</div><span class="sp"></span>${right}</div>`;

/* ----- Command Center ----- */
function vDash(el){const A=prof(me()),B=prof(partnerId());const today=todayDay();const days=S.days.filter(d=>!d.archived);const ti=today?days.indexOf(today):0;
  const order=t=>{const i=days.findIndex(d=>d.id===t.dayId);return i<0?99:(i-ti+days.length)%days.length};
  const open=S.tasks.filter(t=>!t.done);const sched=open.filter(t=>t.dayId).sort((a,b)=>order(a)-order(b)||(a.time||'~').localeCompare(b.time||'~'));
  const next=sched[0];const mineN=open.filter(t=>t.owner===me()).length,partN=open.filter(t=>t.owner===partnerId()).length,bothN=open.filter(t=>t.owner==='both').length;
  const activeProj=S.nodes.filter(n=>n.kind==='project'&&!n.archived&&n.status!=='completed');
  const topicGaps=days.filter(d=>d.topicRule!=='none'&&d.topics.filter(Boolean).length<(d.topicRule==='thursday'&&d.format==='two'?2:1));
  const hour=new Date().getHours();const greet=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
  const person=(p,n,lbl)=>`<div class="person">${avatar(p.id,58)}<div><div class="small mute">${lbl}</div><b style="font-size:17px">${esc(p.name)}</b>${p.pronouns?` <span class="tiny mute">(${esc(p.pronouns)})</span>`:''}
    <div class="small">${p.working?`🛰 Working on: <b>${esc(p.working)}</b>`:'<span class="mute">No current focus set</span>'}</div><div class="tiny mute">${n} open task${n===1?'':'s'}</div></div></div>`;
  const wk=weekKey();const st=S.steps[wk]||[];
  el.innerHTML=`<div class="row" style="margin-bottom:14px"><div><p class="hello">${greet}, ${esc(A.name)}</p><div class="mute small">${today?`Today is <b>${esc(today.name)}</b> · ${today.icon||''} ${esc(today.theme)}`:'No workday scheduled today'}</div></div><span class="sp"></span>
    <button class="btn" data-go="web">🕸 Open Mind Web</button></div>
  ${agendaHTML()}
  <div class="card glow" style="margin-bottom:14px"><div class="pair">${person(A,mineN,'You')}<div class="bond hide-m" aria-hidden="true"></div>${person(B,partN,'Your partner')}</div>
    <div class="row small" style="margin-top:10px"><a href="#" data-go="journey" class="tag">🌳 Level ${levelInfo(totalXP(S.skills)).lvl} · ${S.skills.filter(s=>s.status==='done').length} skills done</a><span class="mute">Shared open tasks:</span> <b>${bothN}</b><span class="sp"></span><button class="btn s" id="setFocus">🛰 ${A.working?'Change my focus':'Set my current focus'}</button></div></div>
  <div class="grid g3">
   ${typeof ppCardHTML==='function'?ppCardHTML():''}
   <div class="card"><h3>🧭 What should we work on next?</h3>${nextUp(next,topicGaps,today)}</div>
   <div class="card"><h3>📅 Today</h3>${today?`<b>${today.icon||''} ${esc(today.theme)}</b>${topicLine(today)}<ul class="focus-list">${today.focus.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>
     <div class="drop" data-day="${today.id}">${S.tasks.filter(t=>t.dayId===today.id&&!t.done).map(taskHTML).join('')||'<div class="tiny mute">No tasks on today yet.</div>'}</div><button class="btn s" data-qa="schedule">+ Add to today</button>`:empty('No workday today. Add one in Schedule.')}</div>
   <div class="card"><h3>🚀 Active projects</h3>${activeProj.length?activeProj.slice(0,6).map(p=>`<div class="row small" style="padding:4px 0"><a href="#" data-node="${p.id}">${esc(p.label)}</a><span class="sp"></span>${stPill(p.status)}</div>`).join(''):empty('No projects yet. Turn an idea into a project from the Mind Web.')}</div>
   ${rsDashCard()}
   <div class="card"><h3>⚠ Needs attention</h3>${attention(topicGaps)}</div>
   <div class="card"><h3>💬 Notes & suggestions</h3>${[...S.suggestions.filter(g=>g.status==='open').slice(0,3).map(g=>`<div class="row small" style="padding:4px 0">${avatar(g.by,22)}${g.by!==me()&&!(g.seen||{})[me()]?'<span class="new-dot" title="New"></span>':''}<a href="#" data-sg="${g.id}">${esc(g.text.slice(0,70))}</a></div>`),
       ...S.notes.slice(0,3).map(n=>`<div class="row small" style="padding:4px 0">${avatar(n.by,22)}📝 <a href="#" data-nt="${n.id}">${esc(n.title)}</a></div>`)].join('')||empty('Nothing yet.','suggestion','+ Suggest something')}</div>
   <div class="card"><h3>⚡ Recent activity</h3><div class="feed">${S.activity.slice(0,5).map(actItem).join('')||'<div class="tiny mute">Activity appears as you both make changes.</div>'}</div><button class="btn s" data-go="activity">See all</button></div>
  </div>
  <div class="card" style="margin-top:14px"><h3>🗓 Weekly planning · week of ${wk}</h3><div class="steps">${STEPS.map((s,i)=>`<label><input type="checkbox" class="chk" data-step="${i}" ${st.includes(i)?'checked':''}> ${i+1}. ${esc(s)}</label>`).join('')}</div>
   <div class="row" style="margin-top:8px"><button class="btn s" data-go="schedule">Open schedule →</button><button class="btn s" id="carry">↻ Carry forward to new week</button></div></div>`;
  wireTasks(el);wireLinks(el);wireAgenda(el);rsWireCards(el);if(typeof ppWire==='function')ppWire();if(typeof wireClipLinks==='function')wireClipLinks(el);
  $$('[data-step]',el).forEach(c=>c.onchange=()=>commit(s=>{const a=new Set(s.steps[wk]||[]);c.checked?a.add(+c.dataset.step):a.delete(+c.dataset.step);s.steps[wk]=[...a]}));
  $('#setFocus').onclick=editFocus;
  $('#carry').onclick=()=>modal('Carry forward to a new week','<p>Completed tasks are cleared, unfinished tasks stay on their days, and Tuesday / Thursday / Friday topics reset so you choose fresh ones. Undo is available.</p>',[{t:'Carry forward',c:'p',f:()=>commit(s=>{s.tasks=s.tasks.filter(t=>!t.done);s.days.forEach(d=>d.topics=[])},'New week ready','started a new week')}]);
}
/* "Set my current focus": tells your partner what you're doing right now (shown on Start in both styles) */
function setFocus(v){v=String(v||'').trim().slice(0,120);
  if(!S.partners.some(p=>p.id===me()))return toast('Set up your profile first');
  if(v===(prof(me()).working||''))return;
  commit(s=>{s.partners.find(p=>p.id===me()).working=v},v?'Focus updated':'Focus cleared',v?`is now working on “${v}”`:'cleared their focus')}
function editFocus(){const cur=prof(me()).working||'';const seen=new Set();
  const ag=typeof agendaData==='function'?agendaData().items:[];
  const picks=[...ag.map(i=>i.title),...S.tasks.filter(t=>!t.done&&(t.owner===me()||t.owner==='both')).map(t=>t.title)]
    .map(x=>String(x||'').trim()).filter(x=>x&&x!==cur&&!seen.has(x)&&seen.add(x)).slice(0,5);
  modal('🛰 My current focus',`<p class="small mute" style="margin-top:0">Tell your partner what you're working on right now. It shows next to your name on Start.</p>
    <label class="f" for="fcIn">Working on</label><input id="fcIn" maxlength="120" placeholder="e.g. Editing Tuesday's clip" value="${esc(cur)}" autocomplete="off" enterkeyhint="done">
    ${picks.length?`<div class="tiny mute" style="margin:10px 0 4px">Or pick one of today's things</div><div class="row" style="gap:6px">${picks.map(t=>`<button type="button" class="btn s" data-fc="${esc(t)}">${esc(t.length>40?t.slice(0,39)+'…':t)}</button>`).join('')}</div>`:''}`,
    [{t:'Save',c:'p',f:()=>setFocus(val('fcIn'))},...(cur?[{t:'Clear focus',f:()=>setFocus('')}]:[])],
    {onOpen:d=>{const i=$('#fcIn',d);i.select();
      i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();d.close();setFocus(i.value)}};
      $$('[data-fc]',d).forEach(b=>b.onclick=()=>{d.close();setFocus(b.dataset.fc)})}})}
function nextUp(next,gaps,today){const out=[];
  const qw=window.recommended&&recommended();if(qw)out.push(`<div class="qwin small"><span class="id-badge">⚡ ${LEVEL_NAME[qw.rung]} · ${timeLabel(qw.mins)}</span><div class="row" style="flex-wrap:nowrap"><b style="flex:1;min-width:0">${esc(qw.goal)}</b><button class="btn s p" onclick="startNow(recommended())">▶ ${qw.existing?'Continue':'Start'}</button></div></div>`);
  if(gaps.length)out.push(`<div class="small">Pick ${gaps.map(d=>`<b>${esc(d.name)}</b>`).join(', ')} topic${gaps.length>1?'s':''} <button class="btn s" data-go="schedule">Choose</button></div>`);
  if(next){const d=S.days.find(x=>x.id===next.dayId);out.push(`<div class="small mute" style="margin-top:6px">Next scheduled block · ${esc(d.name)}${next.time?' '+esc(next.time)+' '+esc(S.tz):''}</div><div class="drop">${taskHTML(next)}</div>`)}
  const unsched=S.tasks.filter(t=>!t.done&&!t.dayId);if(unsched.length)out.push(`<div class="small">${unsched.length} unscheduled task${unsched.length>1?'s':''} — <a href="#" data-go="schedule">drag them onto a day</a></div>`);
  return out.join('')||empty('Nothing scheduled yet — add your first work block.','task','+ Add task')}
function attention(gaps){const items=[];const pp=pendingProposals();const us=unseenSuggestions();
  if(pp)items.push(`<div class="small">🔁 ${pp} schedule change${pp>1?'s':''} waiting for you <a href="#" data-go="suggest">Review</a></div>`);
  if(us)items.push(`<div class="small">💬 ${us} new suggestion${us>1?'s':''} from ${esc(pname(partnerId()))} <a href="#" data-go="suggest">Open</a></div>`);
  gaps.forEach(d=>items.push(`<div class="small">🔭 ${esc(d.name)} topic not chosen yet</div>`));
  const mine=S.tasks.filter(t=>!t.done&&t.owner===me()&&!t.dayId).length;if(mine)items.push(`<div class="small">📥 ${mine} of your tasks have no day</div>`);
  const ch=typeof clipAttentionHTML==='function'?clipAttentionHTML():'';
  return items.join('')+ch||'<div class="small mute">All clear ✓</div>'}
function actItem(a){return `<div class="it">${avatar(a.by,26)}<div><div class="small"><b>${esc(pname(a.by))}</b> ${esc(a.text)}</div><div class="tiny mute">${new Date(a.at).toLocaleString([], {weekday:'short',hour:'numeric',minute:'2-digit'})}</div></div></div>`}
function wireLinks(el){$$('[data-node]',el).forEach(a=>a.onclick=e=>{e.preventDefault();openNode(a.dataset.node)});
  $$('[data-sg]',el).forEach(a=>a.onclick=e=>{e.preventDefault();editSuggestion(a.dataset.sg)});
  $$('[data-nt]',el).forEach(a=>a.onclick=e=>{e.preventDefault();editNote(a.dataset.nt)})}
const STEPS=['Review the default theme for each weekday',"Pick Tuesday's research topic","Pick Thursday's format (two topics / one detailed)","Pick Friday's focused topic",'Assign tasks or work blocks to each partner','Add shared meetings and notes','Make or respond to schedule suggestions','Review completed work and decide what carries forward'];
function weekKey(){const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function topicLine(d){if(d.topicRule==='none')return '';const need=d.topicRule==='thursday'&&d.format==='two'?2:1;const set=d.topics.filter(Boolean);
  const label=d.topicRule==='thursday'?(d.format==='two'?'Two topics':'One detailed topic'):(d.name==='Friday'?'Focus topic':'Research subject');
  return `<div class="small" style="margin:4px 0">${label}: ${set.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}${set.length<need?' <span class="warn">⚠ not chosen yet</span>':''}</div>`}

/* ----- Projects ----- */
function vProjects(el){const sc=scopes.projects;const projs=S.nodes.filter(n=>n.kind==='project'&&!n.archived&&inScope(n.owner||'both',sc));
  el.innerHTML=hdr('🚀 Projects','Projects are created from ideas in the Mind Web. Progress is calculated from their linked tasks.',`${scopeSeg(sc,'projects')}<button class="btn p" id="newProj">+ New project</button>`)+
  (projs.length?`<div class="grid g3">${projs.map(p=>{const ts=S.tasks.filter(t=>t.nodeId===p.id);const done=ts.filter(t=>t.done).length;const pct=ts.length?Math.round(done/ts.length*100):0;const par=p.parent&&node(p.parent);
    return `<div class="card"><h3><a href="#" data-node="${p.id}" class="plink">${esc(p.label)}</a></h3><div class="row">${stPill(p.status)}${ownerPill(p.owner||'both')}${par?`<span class="tag">${nodeIcon(par)} ${esc(par.label)}</span>`:''}</div>
     <div style="margin:10px 0 4px;height:6px;border-radius:3px;background:var(--line)" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="height:100%;width:${pct}%;border-radius:3px;background:linear-gradient(90deg,var(--acc),var(--acc2))"></div></div>
     <div class="tiny mute">${ts.length?`${done}/${ts.length} tasks done`:'No tasks linked yet'}</div>
     ${p.notes?`<p class="small mute" style="white-space:pre-wrap">${esc(p.notes.slice(0,160))}</p>`:''}
     <div class="drop">${ts.filter(t=>!t.done).slice(0,3).map(taskHTML).join('')}</div>
     <div class="row"><button class="btn s" data-node="${p.id}">Details</button><button class="btn s" data-ptask="${p.id}">+ Task</button></div></div>`}).join('')}</div>`
   :empty('No projects in this view yet. Open an idea in the Mind Web and choose “Make project”, or start one here.'));
  wireTasks(el);wireLinks(el);$$('[data-ptask]',el).forEach(b=>b.onclick=()=>editTask(null,{nodeId:b.dataset.ptask}));
  $('#newProj').onclick=newProject;
}
function newProject(){{const cats=S.nodes.filter(n=>!n.parent&&!n.archived);modal('New project',`<label class="f" for="pL">Project name</label><input id="pL"><label class="f" for="pP">Branch</label><select id="pP">${cats.map(c=>`<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select><label class="f" for="pO">Owner</label>${ownerSel('pO','both')}`,
    [{t:'Create',c:'p',f:()=>{const l=val('pL');if(!l){toast('Name required');return false}const par=val('pP');commit(s=>{s.nodes.push({id:uid(),label:l,parent:par,kind:'project',status:'researching',owner:val('pO'),dx:0,dy:120,notes:'',archived:false});s.nodes.find(x=>x.id===par).collapsed=false},'Project created',`created project “${l}”`)}}])};
}

/* ----- My Tasks ----- */
function vTasks(el){const sc=scopes.tasks;const q=taskQ.toLowerCase();
  const list=S.tasks.filter(t=>inScope(t.owner,sc)&&(!q||t.title.toLowerCase().includes(q)||(t.notes||'').toLowerCase().includes(q)));
  const open=list.filter(t=>!t.done),done=list.filter(t=>t.done);
  el.innerHTML=hdr('✓ Tasks','Drag onto a day in Schedule, or open a task to edit details.',`${scopeSeg(sc,'tasks')}<button class="btn p" data-qa="task">+ Task</button>`)+
   `<input id="tq" placeholder="🔍 Search tasks…" value="${esc(taskQ)}" style="max-width:360px;margin-bottom:12px" aria-label="Search tasks">
   <div class="grid g2"><div class="card"><h3>Open (${open.length})</h3><div class="drop">${open.map(taskHTML).join('')||empty('No open tasks here 🎉','task','+ Add a task')}</div></div>
   <div class="card"><h3>Done (${done.length})</h3><div class="drop">${done.map(taskHTML).join('')||'<div class="tiny mute">Completed tasks show here.</div>'}</div></div></div>`;
  wireTasks(el);const i=$('#tq');i.oninput=()=>{taskQ=i.value;const pos=i.selectionStart;render();const j=$('#tq');j.focus();j.setSelectionRange(pos,pos)}}

/* ----- Shared Checklist ----- */
function vChecklist(el){const items=S.checklist;
  el.innerHTML=hdr('☑ Shared Checklist','A simple list both of you can tick off — supplies, setup steps, errands.')+
  `<div class="card" style="max-width:720px"><form id="clf" class="row"><input id="clt" placeholder="Add an item and press Enter" aria-label="New checklist item" style="flex:1"><button class="btn p">Add</button></form>
   <div style="margin-top:10px">${items.map(c=>`<div class="task ${c.done?'done':''}" style="cursor:default"><input type="checkbox" class="chk" data-cl="${c.id}" ${c.done?'checked':''} aria-label="${esc(c.text)}"><div class="t-body" style="cursor:default"><div class="t-title">${esc(c.text)}</div><div class="tiny mute">added by ${esc(pname(c.by))}</div></div><button class="btn s ghost" data-cle="${c.id}" aria-label="Edit">✎</button><button class="btn s ghost d" data-cld="${c.id}" aria-label="Delete">✕</button></div>`).join('')||empty('Empty list — add the first item above.')}</div>
   ${items.some(c=>c.done)?'<button class="btn s" id="clclr">Clear completed</button>':''}</div>`;
  $('#clf').onsubmit=e=>{e.preventDefault();const t=val('clt');if(t)commit(s=>s.checklist.push({id:uid(),text:t,done:false,by:me()}),null,`added “${t}” to the checklist`);setTimeout(()=>$('#clt')&&$('#clt').focus())};
  $$('[data-cl]',el).forEach(c=>c.onchange=()=>{commit(s=>s.checklist.find(x=>x.id===c.dataset.cl).done=c.checked,null,c.checked?`checked off “${S.checklist.find(x=>x.id===c.dataset.cl).text}”`:null);if(c.checked&&S.checklist.every(x=>x.done))celebrate(true)});
  $$('[data-cle]',el).forEach(b=>b.onclick=()=>{const c=S.checklist.find(x=>x.id===b.dataset.cle);ask('Edit checklist item','Checklist item',c.text,t=>{commit(s=>s.checklist.find(x=>x.id===c.id).text=t)})});
  $$('[data-cld]',el).forEach(b=>b.onclick=()=>commit(s=>s.checklist=s.checklist.filter(x=>x.id!==b.dataset.cld),'Removed — Undo available'));
  if($('#clclr'))$('#clclr').onclick=()=>commit(s=>s.checklist=s.checklist.filter(x=>!x.done),'Cleared');
}

/* ----- Notes ----- */
function vNotes(el){const sc=scopes.notes;const q=noteQ.toLowerCase();const list=S.notes.filter(n=>inScope(n.owner,sc)&&(!q||(n.title+' '+n.body).toLowerCase().includes(q)));
  el.innerHTML=hdr('📝 Notes','Research findings, meeting notes, sources, costs, risks.',`${scopeSeg(sc,'notes')}<button class="btn p" data-qa="note">+ Note</button>`)+
  `<input id="nq" placeholder="🔍 Search notes…" value="${esc(noteQ)}" style="max-width:360px;margin-bottom:12px" aria-label="Search notes">`+
  (list.length?`<div class="grid g3">${list.map(n=>{const nd=n.nodeId&&node(n.nodeId);const d=n.dayId&&S.days.find(x=>x.id===n.dayId);return `<button class="card" style="text-align:left;cursor:pointer;color:inherit;font:inherit" data-nt="${n.id}">
    <h3>${esc(n.title)}</h3><p class="small mute" style="white-space:pre-wrap;margin:0 0 8px;max-height:6em;overflow:hidden">${esc(n.body)}</p>
    <div class="row">${avatar(n.by,20)}${ownerPill(n.owner)}${nd?`<span class="tag">${nodeIcon(nd)} ${esc(nd.label)}</span>`:''}${d?`<span class="tag">📅 ${esc(d.name)}</span>`:''}</div></button>`}).join('')}</div>`:empty('No notes yet.','note','+ Write a note'));
  wireLinks(el);const i=$('#nq');i.oninput=()=>{noteQ=i.value;const pos=i.selectionStart;render();const j=$('#nq');j.focus();j.setSelectionRange(pos,pos)}}

/* ----- Suggestions + schedule proposals ----- */
function vSuggest(el){const open=S.suggestions.filter(g=>g.status==='open'),closed=S.suggestions.filter(g=>g.status!=='open');
  const props=[...S.proposals].sort((a,b)=>(a.status==='pending'?0:1)-(b.status==='pending'?0:1)||b.at-a.at);
  el.innerHTML=hdr('💬 Suggestions','Ideas for each other, plus proposed schedule changes. Proposals never overwrite the current schedule until accepted.','<button class="btn p" data-qa="suggestion">+ Suggestion</button>')+
  `<div class="grid g2"><div class="card"><h3>💡 Suggestions</h3>${open.map(sgCard).join('')||empty('No open suggestions.')}${closed.length?`<details style="margin-top:8px"><summary class="small mute">Closed (${closed.length})</summary>${closed.map(sgCard).join('')}</details>`:''}</div>
   <div class="card"><h3>🔁 Schedule change proposals</h3>${props.map(propCard).join('')||empty('No proposals. Open a day in Schedule and choose “Propose change”.')}</div></div>`;
  wireLinks(el);
  const on=(a,f)=>$$(`[data-${a}]`,el).forEach(b=>b.onclick=()=>f(b.dataset[a]));
  on('psend',id=>{const t=$(`[data-pmsg="${id}"]`).value.trim();if(t)commit(s=>s.proposals.find(p=>p.id===id).thread.push({by:me(),text:t}),null,'commented on a schedule proposal')});
  on('pacc',id=>commit(s=>{const p=s.proposals.find(x=>x.id===id);const d=s.days.find(x=>x.id===p.dayId);if(d)Object.assign(d,p.changes);p.status='accepted'},'Accepted & applied','accepted a schedule change'));
  on('pdec',id=>commit(s=>s.proposals.find(x=>x.id===id).status='declined','Declined','declined a schedule change'));
  on('pwd',id=>commit(s=>s.proposals=s.proposals.filter(x=>x.id!==id),'Withdrawn'));
}
function sgCard(g){const isNew=g.by!==me()&&!(g.seen||{})[me()];return `<div class="task" style="cursor:pointer" data-sg="${g.id}" tabindex="0">${avatar(g.by,28)}<div class="t-body"><div class="t-title">${isNew?'<span class="new-dot"></span> ':''}${esc(g.text)}</div><div class="tiny mute">${esc(pname(g.by))} · ${g.status}${(g.replies||[]).length?` · ${g.replies.length} repl${g.replies.length>1?'ies':'y'}`:''}</div></div></div>`}
function propCard(p){const d=S.days.find(x=>x.id===p.dayId);const mine=p.by===me();
  const diff=Object.entries(p.changes||{}).filter(([k,v])=>d&&JSON.stringify(v)!==JSON.stringify(d[k]));
  return `<div class="card prop ${p.status}" style="margin-bottom:10px;padding:12px"><div class="row">${avatar(p.by,26)}<b class="small">${esc(p.summary)}</b><span class="sp"></span><span class="tag">${p.status}</span></div>
   <div class="small" style="margin:6px 0">${diff.map(([k,v])=>`<div><b>${k}</b>: <s class="mute">${esc(fmtV(d[k]))}</s> → ${esc(fmtV(v))}</div>`).join('')||'<i class="mute">No differences from the current version</i>'}</div>
   ${(p.thread||[]).map(m=>`<div class="small">💬 <b>${esc(pname(m.by))}</b>: ${esc(m.text)}</div>`).join('')}
   ${p.status==='pending'?`<div class="row" style="margin-top:6px"><input placeholder="Discuss…" data-pmsg="${p.id}" style="flex:1;min-width:140px" aria-label="Reply"><button class="btn s" data-psend="${p.id}">Send</button>
    ${mine?`<button class="btn s" data-pwd="${p.id}">Withdraw</button><span class="tiny mute">Waiting for ${esc(pname(partnerId()))}</span>`:`<button class="btn s p" data-pacc="${p.id}">Accept</button><button class="btn s d" data-pdec="${p.id}">Decline</button>`}</div>`:''}</div>`}
const fmtV=v=>Array.isArray(v)?v.join(' · '):typeof v==='boolean'?(v?'yes':'no'):v===''?'(blank)':String(v);

/* ----- Activity ----- */
function vActivity(el){el.innerHTML=hdr('⚡ Activity','Meaningful updates from both of you, newest first.')+
  `<div class="card" style="max-width:760px"><div class="feed">${S.activity.map(actItem).join('')||empty('No activity yet.')}</div></div>`}
