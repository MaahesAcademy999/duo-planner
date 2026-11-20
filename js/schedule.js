'use strict';
/* ===== Weekly schedule (editable template) ===== */
const topicOpts=v=>`<option value="">— choose —</option>${S.nodes.filter(n=>!n.parent&&!n.archived).map(n=>`<option ${n.label===v?'selected':''}>${esc(n.label)}</option>`).join('')}<option value="__new">+ New subject…</option>`;
function vSchedule(el){const sc=scopes.schedule;const days=S.days.filter(d=>!d.archived);const un=S.tasks.filter(t=>!t.dayId&&inScope(t.owner,sc));
  el.innerHTML=hdr('📅 Weekly Schedule',`Editable template · no times or deadlines unless you add them · times in <b>${esc(S.tz)}</b> · App-only calendar (no external calendar connected)`,
   `${scopeSeg(sc,'schedule')}<button class="btn" data-qa="task">+ Task</button><button class="btn" id="addMeet">+ Shared meeting</button><button class="btn" id="addDay">+ Workday</button>`)+
  `<div class="grid days">${days.map(d=>dayCard(d,sc)).join('')}
   <div class="card"><h3>📥 Unscheduled</h3><div class="drop" data-day="">${un.map(taskHTML).join('')||'<div class="tiny mute" style="padding:8px">Drop tasks here to unschedule them</div>'}</div></div></div>`;
  wireTasks(el);
  $('#addDay').onclick=()=>editDay();$('#addMeet').onclick=()=>editTask(null,{owner:'both',title:'Shared meeting: '});
  $$('[data-day-edit]',el).forEach(b=>b.onclick=()=>editDay(b.dataset.dayEdit));
  $$('[data-day-add]',el).forEach(b=>b.onclick=()=>editTask(null,{dayId:b.dataset.dayAdd}));
  $$('[data-day-note]',el).forEach(b=>b.onclick=()=>editNote(null,{dayId:b.dataset.dayNote,owner:'both'}));
  $$('[data-nt]',el).forEach(a=>a.onclick=e=>{e.preventDefault();editNote(a.dataset.nt)});
  $$('[data-topic]',el).forEach(s=>s.onchange=()=>{const [did,i]=s.dataset.topic.split(':');let v=s.value;const dn=S.days.find(d=>d.id===did).name;
    if(v==='__new'){v=(prompt('New subject:')||'').trim();if(!v){render();return}
      commit(st=>{if(!st.nodes.some(n=>n.label.toLowerCase()===v.toLowerCase()))st.nodes.push({id:uid(),label:v,parent:null,kind:'category',status:'researching',owner:'both',x:(Math.random()-.5)*500,y:(Math.random()-.5)*300,notes:'',archived:false,collapsed:true});st.days.find(d=>d.id===did).topics[+i]=v},'Subject added to Mind Web',`chose “${v}” for ${dn}`);return}
    commit(st=>{st.days.find(d=>d.id===did).topics[+i]=v},'Topic set',v?`chose “${v}” for ${dn}`:null)});
  $$('[data-fmt]',el).forEach(s=>s.onchange=()=>commit(st=>{const d=st.days.find(x=>x.id===s.dataset.fmt);d.format=s.value;if(s.value==='one')d.topics=d.topics.slice(0,1)},'Format updated'));
}
function dayCard(d,sc){const tasks=S.tasks.filter(t=>t.dayId===d.id&&inScope(t.owner,sc));const notes=S.notes.filter(n=>n.dayId===d.id);const pend=S.proposals.filter(p=>p.status==='pending'&&p.dayId===d.id).length;
  const isToday=todayDay()&&todayDay().id===d.id;let topics='';
  if(d.topicRule!=='none'){const n=d.topicRule==='thursday'&&d.format==='two'?2:1;
    topics=(d.topicRule==='thursday'?`<label class="f">Format</label><select data-fmt="${d.id}" aria-label="${esc(d.name)} format"><option value="two" ${d.format==='two'?'selected':''}>Two separate topics</option><option value="one" ${d.format==='one'?'selected':''}>One topic in detail</option></select>`:'')+
    Array.from({length:n},(_,i)=>{const lbl=d.topicRule==='thursday'?'Topic '+(i+1):d.name==='Friday'?'Focus topic (alongside trading)':'Research subject (required)';
      return `<label class="f">${lbl}${!d.topics[i]?' <span class="warn">⚠ not chosen</span>':''}</label><select data-topic="${d.id}:${i}" aria-label="${esc(d.name)} ${lbl}">${topicOpts(d.topics[i])}</select>`}).join('')}
  return `<div class="card ${isToday?'glow':''}"><h3><span aria-hidden="true">${d.icon||'📅'}</span>${esc(d.name)}${isToday?' <span class="tag">Today</span>':''}<span class="sp"></span><button class="btn s ghost" data-day-edit="${d.id}" aria-label="Edit ${esc(d.name)}">✎ Edit</button></h3>
   <div style="font-weight:600">${esc(d.theme)}</div>
   <div class="row" style="gap:4px;margin:4px 0">${ownerPill(d.owner)}${d.time?`<span class="tag">🕐 ${esc(d.time)} ${esc(S.tz)}</span>`:''}<span class="tag">${d.recurring?'↻ weekly':'one-off'}</span>${pend?`<span class="tag warn">🔁 ${pend} proposed change</span>`:''}</div>
   <ul class="focus-list">${d.focus.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>${topics}
   ${d.notes?`<div class="small" style="white-space:pre-wrap;margin-top:6px">📝 ${esc(d.notes)}</div>`:''}
   ${notes.map(n=>`<div class="small">📝 <a href="#" data-nt="${n.id}">${esc(n.title)}</a> <span class="tiny mute">· ${esc(pname(n.by))}</span></div>`).join('')}
   ${typeof clipScheduleHTML==='function'?clipScheduleHTML(d):''}
   <div class="drop" data-day="${d.id}" style="margin-top:8px">${tasks.map(taskHTML).join('')||'<div class="tiny mute" style="padding:8px">Drop tasks here</div>'}</div>
   <div class="row"><button class="btn s" data-day-add="${d.id}">+ Task</button><button class="btn s" data-day-note="${d.id}">+ Note</button></div></div>`}
function editDay(id){const d=id?S.days.find(x=>x.id===id):{name:'',theme:'',icon:'📅',focus:[],topicRule:'none',time:'',owner:'both',notes:'',recurring:true};
  modal(id?'Edit '+d.name:'Add workday',`
   <div class="row"><div style="flex:2;min-width:160px"><label class="f" for="dN">Day name</label><input id="dN" value="${esc(d.name)}" placeholder="e.g. Saturday"></div><div style="flex:1;min-width:90px"><label class="f" for="dI">Icon</label><input id="dI" value="${esc(d.icon||'')}" maxlength="4"></div><div style="flex:2;min-width:160px"><label class="f" for="dO">Belongs to</label>${ownerSel('dO',d.owner)}</div></div>
   <label class="f" for="dT">Theme</label><input id="dT" value="${esc(d.theme)}">
   <label class="f" for="dF">Focus items (one per line)</label><textarea id="dF">${esc(d.focus.join('\n'))}</textarea>
   <div class="row"><div style="flex:1;min-width:160px"><label class="f" for="dTm">Time (optional · ${esc(S.tz)})</label><input id="dTm" value="${esc(d.time)}" placeholder="leave blank if not set"></div>
   <div style="flex:1;min-width:160px"><label class="f" for="dR">Topic picker</label><select id="dR">${[['none','None'],['one','One topic'],['thursday','Two topics or one detailed']].map(([v,l])=>`<option value="${v}" ${v===d.topicRule?'selected':''}>${l}</option>`).join('')}</select></div></div>
   <label class="row small" style="margin-top:10px"><input type="checkbox" id="dRc" ${d.recurring?'checked':''}> Repeats weekly (uncheck to make it one-off)</label>
   <label class="f" for="dNo">Day notes (both partners)</label><textarea id="dNo">${esc(d.notes)}</textarea>
   ${id?'<p class="tiny mute">“Propose change” keeps the current version until your partner accepts. “Save now” applies it immediately.</p>':''}`,
   [...(id?[{t:'Remove day',c:'d',f:()=>commit(s=>{s.days.find(x=>x.id===id).archived=true;s.tasks.forEach(t=>{if(t.dayId===id)t.dayId=null})},'Day removed — Undo available',`removed ${d.name} from the schedule`)},
     {t:'Propose change',f:()=>{const nd=readDay();if(!nd)return false;const diff=Object.keys(nd).filter(k=>JSON.stringify(nd[k])!==JSON.stringify(d[k]));if(!diff.length){toast('No changes to propose');return false}
       commit(s=>s.proposals.push({id:uid(),kind:'schedule',by:me(),dayId:id,changes:nd,summary:`${d.name}: change ${diff.join(', ')}`,status:'pending',thread:[],at:Date.now()}),'Proposal sent — original kept',`proposed a change to ${d.name}`)}}]:[]),
    {t:id?'Save now':'Add day',c:'p',f:()=>{const nd=readDay();if(!nd)return false;commit(s=>{if(id)Object.assign(s.days.find(x=>x.id===id),nd);else s.days.push({id:uid(),topics:[],format:'two',archived:false,...nd})},'Saved',id?`edited ${nd.name}`:`added ${nd.name} to the schedule`)}}])}
function readDay(){const name=val('dN');if(!name){toast('Day name required');return null}return {name,icon:val('dI'),owner:val('dO'),theme:val('dT'),focus:val('dF').split('\n').map(x=>x.trim()).filter(Boolean),time:val('dTm'),topicRule:val('dR'),recurring:$('#dRc').checked,notes:val('dNo')}}
