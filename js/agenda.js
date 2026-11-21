'use strict';
/* ===== Today's agenda (Command Center)
   One ordered list of what still needs doing today: overdue items first, then anything with a time (earliest first),
   then today's deadlines, then the rest of today's workday tasks. Completed items are left out.
   "Start" opens the first item where the work happens (task details, the clip on its board, or Post & Submit).
   Uses the same rules as the morning phone summary (duo-reminders), so the two agree. */
let agendaScope='me'; // 'me' = mine + shared, 'all' = both partners

/* Start time from the free-text time field: "3pm", "3:30 PM", "15:00", "9am–11am", "9.15". Same as the reminders function. */
function agendaParseTime(s){const m=String(s??'').trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);if(!m)return null;
  let h=+m[1];const min=m[2]?+m[2]:0;const ap=(m[3]||'').toLowerCase()[0];if(min>59||h>23)return null;
  if(ap){if(h<1||h>12)return null;if(ap==='p'&&h<12)h+=12;if(ap==='a'&&h===12)h=0}return h*60+min}
const agendaFmtMin=m=>{const h=Math.floor(m/60),mm=m%60;return `${h%12||12}${mm?':'+String(mm).padStart(2,'0'):''} ${h<12?'AM':'PM'}`};
const agendaIsDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);

function agendaData(){const date=today();const day=todayDay();const dayId=day&&day.id;
  const mine=o=>agendaScope==='all'||!o||o==='both'||o===me();
  const items=[];let done=0;
  S.tasks.forEach(t=>{const onDay=dayId&&t.dayId===dayId;const dueToday=t.due===date;const late=agendaIsDate(t.due)&&t.due<date;
    if(!(onDay||dueToday||late)||!mine(t.owner))return;
    if(t.done){if(onDay||dueToday)done++;return}
    const at=onDay||dueToday?agendaParseTime(t.time):null;
    items.push({key:'t:'+t.id,kind:'task',id:t.id,title:t.title||'Task',owner:t.owner,
      group:late?0:at!==null?1:dueToday?2:3,sort:late?t.due:at!==null?at:0,late:late?-daysTo(t.due):0,at,dueToday})});
  clipsOf().forEach(c=>{const its=c.items||[];const allPaid=its.length>0&&its.every(i=>i.stage==='paid');
    if(agendaIsDate(c.deadline)&&c.deadline<=date&&mine(c.owner)){if(allPaid){if(c.deadline===date)done++}
      else items.push({key:'c:'+c.id,kind:'campaign',cid:c.id,title:`${c.name||'Campaign'} — campaign deadline`,owner:c.owner||'both',group:c.deadline<date?0:2,sort:c.deadline<date?c.deadline:1,late:c.deadline<date?-daysTo(c.deadline):0,dueToday:c.deadline===date})}
    its.forEach(i=>{if(!agendaIsDate(i.due)||i.due>date||!mine(i.owner??c.owner))return;
      if(['submitted','paid'].includes(i.stage)){if(i.due===date)done++;return}
      items.push({key:'i:'+i.id,kind:'clip',cid:c.id,iid:i.id,stage:i.stage,title:i.hook||'Untitled clip',ctx:`${c.name||'Campaign'} · ${stageLabel(i.stage)}`,owner:i.owner??c.owner??'both',
        group:i.due<date?0:2,sort:i.due<date?i.due:1,late:i.due<date?-daysTo(i.due):0,dueToday:i.due===date})})});
  items.sort((a,b)=>a.group-b.group||(a.sort<b.sort?-1:a.sort>b.sort?1:0));
  return {items,done,day,date}}

/* where "Start" / tapping an item takes you */
function agendaOpen(it){
  if(it.kind==='task')return editTask(it.id);
  if(it.kind==='clip'){const q=postQueue();const qi=q.findIndex(x=>x.i.id===it.iid);
    if(qi>=0){postIdx=qi;return go('post')}
    clipSel=it.cid;clipTab='board';go('clips');return editItem(it.cid,it.iid)}
  clipSel=it.cid;clipTab='board';go('clips')}

function agendaWhen(it){
  if(it.group===0)return `<span class="ag-when late">${it.late===1?'Yesterday':`${it.late}d late`}</span>`;
  if(it.at!==null&&it.at!==undefined)return `<span class="ag-when">${agendaFmtMin(it.at)}</span>`;
  if(it.dueToday)return `<span class="ag-when due">Due today</span>`;
  return `<span class="ag-when any">Anytime</span>`}
const agendaIcon=it=>it.kind==='task'?'✓':it.kind==='clip'?(it.stage==='approved'?'🚀':'✂'):'⏰';
function agendaRow(it,i){const who=agendaScope==='all'&&it.owner&&it.owner!=='both'?avatar(it.owner,18):''; /* whose item, only needed when both partners' items show */
  return `<li class="ag-item${i===0?' next':''}">
    ${it.kind==='task'?`<input type="checkbox" class="chk" data-agdone="${it.id}" aria-label="Mark ${esc(it.title)} done">`:`<span class="ag-ic" aria-hidden="true">${agendaIcon(it)}</span>`}
    <button class="ag-body" data-ag="${i}">${agendaWhen(it)}<span class="ag-txt"><span class="ag-title">${esc(it.title)}</span>${it.ctx?`<span class="tiny mute">${esc(it.ctx)}</span>`:''}</span>${who}<span class="ag-go" aria-hidden="true">›</span></button></li>`}

function agendaHTML(){const {items,done,day,date}=agendaData();const total=items.length+done;const pct=total?Math.round(done/total*100):0;
  const dLabel=new Date(date+'T12:00').toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'});
  const first=items[0];const MAX=6;
  const list=items.length?`<ol class="ag-list">${items.slice(0,MAX).map(agendaRow).join('')}</ol>${items.length>MAX?`<details class="ag-more"><summary class="small">Show ${items.length-MAX} more</summary><ol class="ag-list" start="${MAX+1}">${items.slice(MAX).map((it,j)=>agendaRow(it,j+MAX)).join('')}</ol></details>`:''}`
    :`<div class="empty">${done?'🎉 Everything for today is done.':day?'Nothing scheduled for today yet.':'No workday today, and nothing is due.'}<br><button class="btn s p" data-qa="schedule">+ Add to today</button></div>`;
  return `<div class="card glow agenda" id="agenda"><div class="row ag-head"><div><h2 style="margin:0">🗓 Today's agenda</h2><div class="tiny mute">${esc(dLabel)}${day?` · ${day.icon||''} ${esc(day.theme)}`:''}</div></div><span class="sp"></span>
    <div class="seg" role="group" aria-label="Whose items"><button aria-pressed="${agendaScope==='me'}" data-agscope="me">Mine & shared</button><button aria-pressed="${agendaScope==='all'}" data-agscope="all">Everyone</button></div></div>
   ${total?`<div class="ag-prog" role="progressbar" aria-label="Done today" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${total}"><i style="width:${pct}%"></i></div><div class="tiny mute">${done} of ${total} done today${items.length?` · ${items.length} to go`:''}</div>`:''}
   ${first?`<button class="btn p ag-start" id="agStart">▶ Start: ${esc(first.title.length>48?first.title.slice(0,46)+'…':first.title)}</button>`:''}
   ${list}</div>`}

function wireAgenda(root){const {items}=agendaData();
  $$('[data-ag]',root).forEach(b=>b.onclick=()=>agendaOpen(items[+b.dataset.ag]));
  const s=$('#agStart',root);if(s)s.onclick=()=>agendaOpen(items[0]);
  $$('[data-agscope]',root).forEach(b=>b.onclick=()=>{agendaScope=b.dataset.agscope;render()});
  $$('[data-agdone]',root).forEach(c=>c.onchange=()=>{const id=c.dataset.agdone;const t=S.tasks.find(x=>x.id===id);if(!t)return;
    c.closest('.ag-item').classList.add('pop');commit(x=>{x.tasks.find(y=>y.id===id).done=true},'Nice — done ✓',`completed task “${t.title}”`);celebrate(t.owner==='both')})}
