'use strict';
/* ===== Research Split: one topic, split into subtopics, each partner owns some of them.
   Every day both partners check in (what I learned, links, questions, next step), then compare notes side by side
   and mark what they learned from each other.
   Data: S.research = topics {id,title,kind,status:'active'|'done',subs:[{id,title,owner:'A'|'B'|'both'}],skillId,by,at}
         S.checkins = one item per topic + day + partner, id `ci-<topic>-<date>-<slot>`, {topic,date,by,notes:{subId:{l,s,q,n}},got:{subId:true},take}
   Each partner only ever writes their own check-in item, so two people checking in at the same time never overwrite each other. */
const RS_GOAL=5; // shared check-in days that finish the research skill
let rsSel=null,rsDay=null;

const rsTopics=()=>(S.research||[]).filter(t=>t.status!=='done');
const rsTopic=id=>(S.research||[]).find(t=>t.id===id);
const rsCur=()=>rsTopic(rsSel)&&rsTopic(rsSel).status!=='done'?rsTopic(rsSel):rsTopics()[0]||rsTopic(rsSel)||null;
const rsCiId=(tid,date,slot)=>`ci-${tid}-${date}-${slot}`;
const rsCi=(tid,date,slot)=>(S.checkins||[]).find(c=>c.id===rsCiId(tid,date,slot));
const rsFilled=n=>n&&['l','s','q','n'].some(k=>String(n[k]||'').trim());
const rsCounts=c=>!!c&&Object.values(c.notes||{}).some(rsFilled);
const rsMine=(t,slot=me())=>t.subs.filter(s=>s.owner===slot||s.owner==='both');
const rsForSkill=sid=>(S.research||[]).find(t=>t.skillId===sid);
function rsDays(t){const by={};(S.checkins||[]).filter(c=>c.topic===t.id&&rsCounts(c)).forEach(c=>{(by[c.date]=by[c.date]||{})[c.by]=c});
  return Object.keys(by).sort().reverse().map(d=>({date:d,A:by[d].A,B:by[d].B}))}
const rsShared=t=>rsDays(t).filter(d=>d.A&&d.B).length;
function rsStreak(t){const done=new Set(rsDays(t).filter(d=>d.A&&d.B).map(d=>d.date));let n=0;let d=today();
  if(!done.has(d))d=rsShift(d,-1);while(done.has(d)){n++;d=rsShift(d,-1)}return n}
function rsShift(date,n){const [y,m,d]=date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10)}
const rsFmtDay=d=>d===today()?'Today':d===rsShift(today(),-1)?'Yesterday':new Date(d+'T12:00').toLocaleDateString([], {weekday:'short',month:'short',day:'numeric'});
/* topics where I still owe today's check-in (used by the agenda, Start slide and the dashboard) */
const rsDue=()=>rsTopics().filter(t=>rsMine(t).length&&!rsCounts(rsCi(t.id,today(),me())));

/* ----- starter subtopics ----- */
function rsSuggest(title,kind){const t=String(title||'').toLowerCase();
  if(!kind&&typeof scanText==='function'){try{kind=scanText(title,'').kind}catch(e){}}
  let subs=kind==='product'
    ?['What it is and who buys it','Best-selling products and brands','Price, commission and margins','What top creators post (hooks and angles)','Samples, sourcing and shipping','Platform rules and risks']
    :['How it works (the basics)','Who is already doing it','What they charge or earn','Costs and tools to start','Where the customers or audience are','Rules, risks and requirements'];
  if(/clip/.test(t))subs[4]='Where to find paid campaigns';
  if(/local|detailing|cleaning|landscap|handyman/.test(t))subs[4]='Local demand and competitors nearby';
  if(/ugc|brand/.test(t))subs[4]='Which brands hire and how to pitch';
  subs=[...subs,'Our first small test'];
  return subs.map((s,i,a)=>({id:uid(),title:s,owner:i===a.length-1?'both':i%2?'B':'A'}))}
function rsEven(subs){let k=0;return subs.map(s=>({...s,owner:s.owner==='both'&&/test/i.test(s.title)?'both':(k++%2?'B':'A')}))}

/* ----- new topic: 1) pick a topic, 2) split it ----- */
function rsTopicChoices(preset){const out=[];const seen=new Set();const add=(title,why,kind,tag)=>{const k=String(title||'').trim();if(!k||seen.has(k.toLowerCase()))return;seen.add(k.toLowerCase());out.push({title:k,why,kind,tag})};
  if(preset)add(preset,'From your walkthrough','',  '🧭 Your pick');
  S.skills.forEach(s=>{const g=s.guide&&s.guide.pick;if(g&&g.title)add(g.title,`Picked in “${s.title}”`,g.kind||'','🧭 Your pick')});
  if(typeof scoredIdeas==='function'){const list=scoredIdeas().filter(i=>i.kind==='topic'||i.kind==='product');const rec=typeof recommended==='function'?recommended():null;
    if(rec)add(rec.title,rec.why||'',rec.kind,'✨ Recommended');list.slice(0,5).forEach(i=>add(i.title,i.why||'',i.kind,`${i.score}/100`))}
  return out.filter(x=>!rsTopics().some(t=>t.title.toLowerCase()===x.title.toLowerCase())).slice(0,7)}

function rsNew(preset,opts={}){const draft={title:preset||'',kind:opts.kind||'',subs:null,skillFrom:opts.skillFrom||'',advance:opts.advance};
  if(preset){draft.subs=rsSuggest(preset,draft.kind);return rsSplitStep(draft)}
  rsPickStep(draft)}
function rsPickStep(draft){const ch=rsTopicChoices();
  modal('🧩 Split a topic between us',`<ol class="gd-dots" aria-label="Step 1 of 2"><li class="on"><button type="button" disabled>1</button><span>Pick a topic</span></li><li><button type="button" disabled>2</button><span>Split it</span></li></ol>
    <p class="small mute">Choose one topic you'll both study. Next you split it into parts and each take some.</p>
    ${ch.length?`<div class="gd-picks" role="radiogroup" aria-label="Topic">${ch.map((c,i)=>`<button type="button" role="radio" aria-checked="${draft.title===c.title}" class="gd-pick ${draft.title===c.title?'on':''}" data-rsp="${i}"><span style="flex:1;min-width:0"><span class="tiny" style="color:var(--acc);font-weight:700">${esc(c.tag)}</span><b>${esc(c.title)}</b>${c.why?`<span class="tiny mute">${esc(c.why)}</span>`:''}</span></button>`).join('')}</div>`:''}
    <label class="f" for="rsT">${ch.length?'Or type your own topic':'Topic'}</label><input id="rsT" value="${esc(ch.some(c=>c.title===draft.title)?'':draft.title)}" placeholder="e.g. Podcast clipping, pet products, Notion templates" autocomplete="off" enterkeyhint="next">`,
    [{t:'Next →',c:'p',keep:true,f:()=>{const typed=val('rsT');if(typed){draft.title=typed;draft.kind=''}if(!draft.title){toast('Pick or type a topic');return}
      draft.subs=rsSuggest(draft.title,draft.kind);rsSplitStep(draft)}}],{noFocus:true,onOpen:d=>{
      $$('[data-rsp]',d).forEach(b=>b.onclick=()=>{const c=ch[+b.dataset.rsp];draft.title=c.title;draft.kind=c.kind;$('#rsT',d).value='';
        $$('[data-rsp]',d).forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',String(x===b))})});
      $('#rsT',d).onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('.dlg-f .btn.p',d).click()}}}})}

function rsSplitStep(draft,edit){const subs=draft.subs;const A=pname('A'),B=pname('B');
  const cnt=o=>subs.filter(s=>s.owner===o).length;
  const row=(s,i)=>`<div class="rs-sub-row"><input data-rst="${i}" value="${esc(s.title)}" aria-label="Subtopic ${i+1}" placeholder="Subtopic">
      <div class="seg rs-own" role="group" aria-label="Who researches it">${['A','B','both'].map(o=>`<button type="button" aria-pressed="${s.owner===o}" data-rso="${i}:${o}">${o==='both'?'Both':esc(pname(o).split(' ')[0])}</button>`).join('')}</div>
      <button type="button" class="btn s ghost" data-rsx="${i}" aria-label="Remove ${esc(s.title)}">✕</button></div>`;
  modal(edit?`✎ Edit split: ${draft.title}`:'🧩 Split a topic between us',`${edit?'':`<ol class="gd-dots" aria-label="Step 2 of 2"><li class="done"><button type="button" data-rsback>✓</button><span>Pick a topic</span></li><li class="on"><button type="button" disabled>2</button><span>Split it</span></li></ol>`}
    ${edit?`<label class="f" for="rsTitle">Topic</label><input id="rsTitle" value="${esc(draft.title)}">`:`<h3 class="gd-h" style="margin-top:4px">${esc(draft.title)}</h3>`}
    <p class="small mute">Starter parts are filled in for you. Rename, add or remove them, and choose who researches each one.</p>
    <div class="rs-tally tiny"><span class="pill o-A">● ${esc(A)}: ${cnt('A')}</span><span class="pill o-B">● ${esc(B)}: ${cnt('B')}</span><span class="pill o-both">⚭ Both: ${cnt('both')}</span><span class="sp"></span><button type="button" class="btn s ghost" id="rsEven">↺ Split evenly</button></div>
    <div class="col rs-subs">${subs.map(row).join('')}</div>
    <form class="row" id="rsAddF" style="margin-top:8px"><input id="rsAdd" placeholder="Add a subtopic" style="flex:1 1 200px;width:auto;min-width:0"><button class="btn s" type="submit">＋ Add</button></form>`,
    [{t:edit?'Save':'✔ Create split',c:'p',keep:true,f:()=>{grab();const clean=subs.filter(s=>s.title.trim());if(!clean.length){toast('Add at least one subtopic');return}
      if(edit){const title=val('rsTitle')||draft.title;commit(x=>{const t=x.research.find(y=>y.id===draft.id);if(t){t.title=title;t.subs=clean}},'Split saved',`updated the research split for “${title}”`);$('#dlg').close();return}
      rsCreate(draft.title,clean,draft);$('#dlg').close()}}],{noFocus:true,onOpen:d=>{
      $$('[data-rso]',d).forEach(b=>b.onclick=()=>{grab();const [i,o]=b.dataset.rso.split(':');subs[+i].owner=o;rsSplitStep(draft,edit)});
      $$('[data-rsx]',d).forEach(b=>b.onclick=()=>{grab();subs.splice(+b.dataset.rsx,1);rsSplitStep(draft,edit)});
      $('#rsEven',d).onclick=()=>{grab();draft.subs=rsEven(subs);rsSplitStep(draft,edit)};
      const bk=$('[data-rsback]',d);if(bk)bk.onclick=()=>{grab();rsPickStep(draft)};
      $('#rsAddF',d).onsubmit=e=>{e.preventDefault();grab();const v=val('rsAdd');if(!v)return;const a=cnt('A'),b=cnt('B');subs.push({id:uid(),title:v,owner:a<=b?'A':'B'});rsSplitStep(draft,edit);const i=$('#rsAdd');if(i)i.focus()}}});
  function grab(){$$('[data-rst]').forEach(i=>{const s=subs[+i.dataset.rst];if(s)s.title=i.value});if(edit&&$('#rsTitle'))draft.title=val('rsTitle')||draft.title}}

function rsCreate(title,subs,draft){const tid=uid(),sid=uid();
  const from=draft.skillFrom&&S.skills.find(s=>s.id===draft.skillFrom);
  const idea=typeof scoredIdeas==='function'?scoredIdeas().find(i=>i.title.toLowerCase()===title.toLowerCase()):null;
  const n=idea&&typeof findNode==='function'?(findNode(idea.branch)||(idea.alt||[]).map(findNode).find(Boolean)):null;
  commit(x=>{x.research.push({id:tid,title,kind:draft.kind||'',status:'active',subs,skillId:sid,by:me(),at:Date.now()});
    if(from&&draft.advance!=null){const k=x.skills.find(y=>y.id===from.id);if(k)k.guide={...gState(k),at:draft.advance}}
    x.skills.push({id:sid,title:`Research ${title} together`,parents:from?[from.id]:[],status:'progress',owner:'both',xp:30,branch:(from&&from.branch)||(n?n.id:''),
      notes:`Research split: ${subs.map(s=>`${s.title} (${s.owner==='both'?'both':pname(s.owner)})`).join(', ')}.\nDone after ${RS_GOAL} days where you both check in.`,doneAt:0})},
    'Split created. Check in each day 🧩',`split “${title}” into ${subs.length} research parts`);
  rsSel=tid;rsDay=null;if(page!=='research')go('research')}

/* ----- daily check-in ----- */
function rsCheckin(tid,date){const t=rsTopic(tid);if(!t)return;date=date||today();const cur=rsCi(tid,date,me())||{notes:{}};
  const mine=rsMine(t),other=t.subs.filter(s=>!mine.includes(s));const part=rsCi(tid,date,partnerId());
  const block=(s,open)=>{const n=cur.notes[s.id]||{};return `<details class="rs-ci" ${open?'open':''}><summary><b>${esc(s.title)}</b> ${ownerPill(s.owner)}${rsFilled(n)?' <span class="tiny" style="color:var(--ok)">✓</span>':''}</summary>
    <label class="f" for="l-${s.id}">What I learned</label><textarea id="l-${s.id}" rows="3" data-cin="${s.id}:l" placeholder="The 1–3 most useful things you found">${esc(n.l||'')}</textarea>
    <label class="f" for="s-${s.id}">Key links or sources</label><input id="s-${s.id}" data-cin="${s.id}:s" value="${esc(n.s||'')}" placeholder="Paste links, video names, people" inputmode="url" autocomplete="off">
    <div class="rs-2"><div><label class="f" for="q-${s.id}">Questions</label><input id="q-${s.id}" data-cin="${s.id}:q" value="${esc(n.q||'')}" placeholder="Still unsure about…" autocomplete="off"></div>
    <div><label class="f" for="n-${s.id}">Next step</label><input id="n-${s.id}" data-cin="${s.id}:n" value="${esc(n.n||'')}" placeholder="Tomorrow I'll…" autocomplete="off"></div></div></details>`};
  modal(`✍ Check-in · ${t.title}`,`<p class="small mute" style="margin-top:0">${rsFmtDay(date)}. Write a few lines for each of your parts, then compare with ${esc(pname(partnerId()))}. ${rsCounts(part)?`<b style="color:var(--ok)">${esc(pname(partnerId()))} has already checked in.</b>`:''}</p>
    ${mine.length?mine.map((s,i)=>block(s,i===0||rsFilled(cur.notes[s.id]))).join(''):'<p class="small">None of the parts are yours yet. Edit the split to take some, or add notes on any part below.</p>'}
    ${other.length?`<details class="rs-more"><summary class="small mute">Notes on ${esc(pname(partnerId()))}'s parts (optional)</summary>${other.map(s=>block(s,rsFilled(cur.notes[s.id]))).join('')}</details>`:''}`,
    [{t:'Save check-in',c:'p',f:()=>{const notes={};$$('[data-cin]').forEach(e=>{const [sid,k]=e.dataset.cin.split(':');const v=e.value.trim();if(v)(notes[sid]=notes[sid]||{})[k]=v});
      if(!Object.values(notes).some(rsFilled)){toast('Write at least one line first');return false}
      const id=rsCiId(tid,date,me());const was=rsCounts(rsCi(tid,date,me()));
      commit(x=>{const c=x.checkins.find(y=>y.id===id);if(c){c.notes=notes;c.at=Date.now()}else x.checkins.push({id,topic:tid,date,by:me(),notes,got:{},take:'',at:Date.now()})},
        null,was?null:`checked in on “${t.title}”`);
      const both=rsCounts(rsCi(tid,date,partnerId()));rsSel=tid;rsDay=date;
      toast(both?'🤝 You both checked in. Compare notes!':`Saved ✓ ${pname(partnerId())} sees it now`);if(both&&!was)celebrate(true);
      if(page!=='research')go('research');else render()}}],{noFocus:true})}

/* ----- page ----- */
function vResearch(el){const t=rsCur();const done=(S.research||[]).filter(x=>x.status==='done');
  el.innerHTML=hdr('🧩 Research Split','One topic, split between you. Each day you both check in, compare notes and learn from each other.',`<button class="btn p" id="rsNew">+ Split a new topic</button>`)+
   (t?rsTopicHTML(t):`<div class="card glow rs-empty"><h3>How it works</h3><ol class="small"><li><b>Pick one topic</b> to study together (from your walkthrough, the scanner or your own).</li><li><b>Split it</b> into parts and choose who researches each one.</li><li><b>Check in every day</b>: what you learned, links, questions, next step.</li><li><b>Compare</b> side by side and mark what you learned from each other.</li></ol>
     <p class="tiny mute">Each split adds a “Research … together” skill to your Skill Tree. It's ready to finish after ${RS_GOAL} days where you both check in.</p><button class="btn p" id="rsNew2">🧩 Split our first topic</button></div>`)+
   (done.length?`<details class="card" style="margin-top:14px"><summary><b>✔ ${done.length} finished topic${done.length===1?'':'s'}</b></summary>${done.map(d=>`<div class="row small" style="padding:4px 0"><a href="#" data-rsopen="${d.id}">${esc(d.title)}</a><span class="sp"></span><span class="tiny mute">${rsShared(d)} shared days</span></div>`).join('')}</details>`:'');
  $('#rsNew',el).onclick=()=>rsNew();const n2=$('#rsNew2',el);if(n2)n2.onclick=()=>rsNew();
  $$('[data-rsopen]',el).forEach(a=>a.onclick=e=>{e.preventDefault();rsSel=a.dataset.rsopen;rsDay=null;render()});
  if(t)rsWire(el,t)}

function rsTopicHTML(t){const date=today();const day=rsDay||date;const P=partnerId();const mineC=rsCi(t.id,date,me()),partC=rsCi(t.id,date,P);
  const shared=rsShared(t),streak=rsStreak(t),days=rsDays(t);const sk=t.skillId&&S.skills.find(s=>s.id===t.skillId);const act=rsTopics();
  const chips=[...new Set([date,...days.map(d=>d.date)])].slice(0,10);
  const status=(id,c)=>`<div class="rs-who">${avatar(id,30)}<div><div class="tiny mute">${id===me()?'You':esc(pname(id))}</div><b class="small">${rsCounts(c)?'✅ Checked in':'⏳ Not yet'}</b></div></div>`;
  return `${act.length>1||t.status==='done'?`<div class="sl-chips rs-tabs" role="group" aria-label="Topic">${act.map(x=>`<button aria-pressed="${x.id===t.id}" data-rstab="${x.id}">${esc(x.title)}${rsDue().includes(x)?' •':''}</button>`).join('')}${t.status==='done'?`<button aria-pressed="true">✔ ${esc(t.title)}</button>`:''}</div>`:''}
   <div class="grid g2 rs-top">
    <div class="card glow"><div class="row" style="flex-wrap:nowrap;align-items:flex-start"><div style="flex:1;min-width:0"><div class="tiny mute">${t.status==='done'?'Finished topic':'Studying together'}</div><h2 class="rs-title">${esc(t.title)}</h2></div><button class="btn s" id="rsEdit">✎ Edit split</button></div>
     <div class="rs-today">${status(me(),mineC)}${status(P,partC)}</div>
     ${t.status!=='done'?`<button class="btn p rs-cta" id="rsCheck">${rsCounts(mineC)?'✎ Edit today\'s check-in':'✍ Today\'s check-in'}</button>`:''}
     <div class="rs-prog"><div class="row small"><b>${Math.min(shared,RS_GOAL)} of ${RS_GOAL}</b><span class="mute">days you both checked in</span><span class="sp"></span>${streak?`<span class="tag">🔥 ${streak} day${streak===1?'':'s'} in a row</span>`:''}</div>
      <div class="sl-prog" role="progressbar" aria-label="Shared check-in days" aria-valuenow="${Math.min(shared,RS_GOAL)}" aria-valuemin="0" aria-valuemax="${RS_GOAL}"><i style="width:${Math.min(100,shared/RS_GOAL*100)}%"></i></div>
      <div class="row tiny mute" style="margin-top:4px">${sk?`🌳 <a href="#" id="rsSkill">${esc(sk.title)}</a> · +${sk.xp||30} XP${sk.status==='done'?' · ✔ done':''}`:'Not linked to a skill'}</div>
      ${t.status!=='done'&&shared>=RS_GOAL?`<button class="btn s p" id="rsFinish" style="margin-top:8px">✔ Finish research${sk&&sk.status!=='done'?` (+${sk.xp||30} XP)`:''}</button>`:''}</div></div>
    <div class="card"><h3>Who researches what</h3><div class="col rs-split">${t.subs.map(s=>`<div class="row small rs-sp ${s.owner===me()||s.owner==='both'?'mine':''}"><span style="flex:1;min-width:0;overflow-wrap:anywhere">${esc(s.title)}</span>${ownerPill(s.owner)}</div>`).join('')}</div>
     ${t.status!=='done'?`<p class="tiny mute" style="margin-bottom:0">You have ${rsMine(t).length} part${rsMine(t).length===1?'':'s'}. Tap ✎ Edit split to swap.</p>`:''}</div></div>
   <div class="card" style="margin-top:14px"><div class="row"><h3 style="margin:0">🔁 Compare notes</h3><span class="sp"></span></div>
    <div class="sl-chips rs-days" role="group" aria-label="Day">${chips.map(d=>{const x=days.find(y=>y.date===d)||{};return `<button aria-pressed="${d===day}" data-rsday="${d}">${rsFmtDay(d)} <span class="tiny">${x.A?'●':'○'}${x.B?'●':'○'}</span></button>`}).join('')}</div>
    ${rsCompareHTML(t,day)}</div>
   ${days.length?`<details class="card" style="margin-top:14px"><summary><b>🗂 History</b> <span class="tiny mute">· ${days.length} day${days.length===1?'':'s'} of notes</span></summary><div class="col">${days.map(d=>{const take=[d.A,d.B].filter(Boolean).reduce((a,c)=>a+Object.keys(c.got||{}).length+(c.take?1:0),0);
      return `<button class="rs-hist" data-rsday="${d.date}"><b>${rsFmtDay(d.date)}</b><span class="small mute">${[d.A&&pname('A'),d.B&&pname('B')].filter(Boolean).map(esc).join(' & ')} checked in${take?` · 💡 ${take} learned from each other`:''}</span><span aria-hidden="true">›</span></button>`}).join('')}</div></details>`:''}
   ${t.status!=='done'?`<div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn s ghost" id="rsArchive">Mark topic finished</button><button class="btn s ghost d" id="rsDel">Delete topic</button></div>`:''}`}

function rsCompareHTML(t,day){const P=partnerId();const a=rsCi(t.id,day,me()),b=rsCi(t.id,day,P);
  if(!rsCounts(a)&&!rsCounts(b))return `<div class="empty">No notes for ${rsFmtDay(day).toLowerCase()} yet.${day===today()&&t.status!=='done'?'<br>Check in, and your partner\'s notes show up here next to yours.':''}</div>`;
  const note=(n,whose)=>rsFilled(n)?`<div class="rs-note">${n.l?`<div class="small rs-l">${esc(n.l)}</div>`:''}${n.s?`<div class="tiny">🔗 ${rsLinks(n.s)}</div>`:''}${n.q?`<div class="tiny">❓ ${esc(n.q)}</div>`:''}${n.n?`<div class="tiny">➡ ${esc(n.n)}</div>`:''}</div>`:`<div class="tiny mute rs-note none">${whose==='me'?'No notes from you':'No notes yet'}</div>`;
  const rows=t.subs.filter(s=>rsFilled((a&&a.notes||{})[s.id])||rsFilled((b&&b.notes||{})[s.id]));const got=(a&&a.got)||{};
  return `<div class="rs-cmp-h"><span>${avatar(me(),22)} You</span><span>${avatar(P,22)} ${esc(pname(P))}</span></div>
   ${rows.map(s=>{const bn=(b&&b.notes||{})[s.id];return `<div class="rs-cmp"><div class="rs-cmp-t"><b class="small">${esc(s.title)}</b> ${ownerPill(s.owner)}</div>
     <div class="rs-cmp-c"><div data-who="You">${note((a&&a.notes||{})[s.id],'me')}</div><div data-who="${esc(pname(P))}">${note(bn,'p')}${rsFilled(bn)?`<button class="btn s ${got[s.id]?'p':''} rs-got" data-rsgot="${s.id}" aria-pressed="${!!got[s.id]}">💡 ${got[s.id]?'Learned from this':'I learned from this'}</button>`:''}</div></div></div>`}).join('')}
   <div class="rs-take"><label class="f" for="rsTake">What I learned from ${esc(pname(P))} ${day===today()?'today':'that day'}</label>
    <div class="row" style="flex-wrap:nowrap"><input id="rsTake" value="${esc((a&&a.take)||'')}" placeholder="One takeaway in your own words" style="flex:1;min-width:0" autocomplete="off"><button class="btn s" id="rsTakeSave">Save</button></div>
    ${b&&b.take?`<p class="small" style="margin:8px 0 0">${avatar(P,18)} <b>${esc(pname(P))} learned from you:</b> ${esc(b.take)}</p>`:''}
    ${b&&Object.keys(b.got||{}).length?`<p class="tiny mute" style="margin:4px 0 0">💡 ${esc(pname(P))} marked ${Object.keys(b.got).length} of your notes as helpful.</p>`:''}</div>`}
const rsLinks=s=>esc(s).replace(/https?:\/\/[^\s,;]+/g,u=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${u.length>48?u.slice(0,46)+'…':u}</a>`);

/* my own check-in item for a day (created empty if needed, so reactions can be saved before writing notes) */
function rsMineItem(x,tid,date){const id=rsCiId(tid,date,me());let c=x.checkins.find(y=>y.id===id);if(!c){c={id,topic:tid,date,by:me(),notes:{},got:{},take:'',at:Date.now()};x.checkins.push(c)}return c}
function rsWire(el,t){const day=rsDay||today();
  $$('[data-rstab]',el).forEach(b=>b.onclick=()=>{rsSel=b.dataset.rstab;rsDay=null;render()});
  $$('[data-rsday]',el).forEach(b=>b.onclick=()=>{rsDay=b.dataset.rsday;render();if(b.classList.contains('rs-hist'))$('.rs-days').scrollIntoView({behavior:'smooth',block:'start'})});
  const c=$('#rsCheck',el);if(c)c.onclick=()=>rsCheckin(t.id);
  $('#rsEdit',el).onclick=()=>rsSplitStep({id:t.id,title:t.title,subs:structuredClone(t.subs)},true);
  const sk=$('#rsSkill',el);if(sk)sk.onclick=e=>{e.preventDefault();skSel=t.skillId;jTab='tree';go('journey')};
  const f=$('#rsFinish',el);if(f)f.onclick=()=>rsFinish(t.id);
  $$('[data-rsgot]',el).forEach(b=>b.onclick=()=>{const sid=b.dataset.rsgot;
    commit(x=>{const m=rsMineItem(x,t.id,day);m.got={...(m.got||{})};if(m.got[sid])delete m.got[sid];else m.got[sid]=true},null)});
  const ts=$('#rsTakeSave',el);if(ts){const save=()=>{const v=val('rsTake');commit(x=>{rsMineItem(x,t.id,day).take=v},v?'Takeaway saved':null,v?`learned from ${pname(partnerId())} on “${t.title}”`:null)};
    ts.onclick=save;$('#rsTake',el).onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();save()}}}
  const ar=$('#rsArchive',el);if(ar)ar.onclick=()=>rsFinish(t.id);
  const dl=$('#rsDel',el);if(dl)dl.onclick=()=>modal('Delete this topic?',`<p>Delete <b>${esc(t.title)}</b> and all its check-ins? Its skill stays in your tree. Undo is available.</p>`,[{t:'Delete',c:'d',f:()=>{
    commit(x=>{x.research=x.research.filter(y=>y.id!==t.id);x.checkins=x.checkins.filter(y=>y.topic!==t.id)},'Topic deleted',`deleted the research topic “${t.title}”`);rsSel=null;rsDay=null}}])}
function rsFinish(tid){const t=rsTopic(tid);if(!t)return;const sk=t.skillId&&S.skills.find(s=>s.id===t.skillId);
  commit(x=>{const y=x.research.find(z=>z.id===tid);if(y)y.status='done'},'Topic finished ✔',`finished researching “${t.title}”`);
  if(sk&&sk.status!=='done'){if(skState(sk,S.skills)==='locked')toast(`Finish “${sk.parents.map(id=>S.skills.find(x=>x.id===id)).filter(p=>p&&p.status!=='done').map(p=>p.title).join(', ')}” to collect the XP`);else completeSkill(sk.id)}}

/* ----- small surfaces elsewhere: dashboard card, Start slide card, skill panel ----- */
function rsDashCard(){const t=rsCur();
  if(!t)return `<div class="card"><h3>🧩 Research split</h3><p class="small mute">Study one topic together: split it into parts, check in daily and compare notes.</p><button class="btn s p" data-go="research">Split a topic</button></div>`;
  const due=rsDue();const P=partnerId();
  return `<div class="card"><h3>🧩 Research split</h3><b class="small">${esc(t.title)}</b><div class="tiny mute">${Math.min(rsShared(t),RS_GOAL)} of ${RS_GOAL} shared days · ${rsCounts(rsCi(t.id,today(),P))?`${esc(pname(P))} checked in today`:`${esc(pname(P))} hasn't checked in yet`}</div>
    <div class="row" style="margin-top:8px">${due.length?`<button class="btn s p" data-rsci="${due[0].id}">✍ Check in</button>`:'<span class="small" style="color:var(--ok)">✅ You checked in today</span>'}<button class="btn s" data-go="research">Compare notes</button></div></div>`}
function rsSlideCard(){const due=rsDue();if(!due.length)return '';const t=due[0];
  return `<div class="card sl-next rs-slide"><div class="tiny mute">🧩 Research check-in</div><b>${esc(t.title)}</b><div class="tiny mute">${rsMine(t).length} part${rsMine(t).length===1?'':'s'} for you today${rsCounts(rsCi(t.id,today(),partnerId()))?` · ${esc(pname(partnerId()))} already checked in`:''}</div><div class="row"><button class="btn p" data-rsci="${t.id}">✍ Check in</button><button class="btn" data-go="research">Compare</button></div></div>`}
function rsWireCards(root){$$('[data-rsci]',root).forEach(b=>b.onclick=()=>rsCheckin(b.dataset.rsci))}
