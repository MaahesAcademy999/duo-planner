'use strict';
/* ===== Live clipping & content campaigns — manual workflow (no live-monitoring, auto-clipping or auto-publishing integration)
   Campaign → clips on a pipeline board → review → submit → paid. Estimated, confirmed and paid amounts stay separate;
   only "paid" can be recorded as actual income. */
const CLIP_STEPS=['Research the creator or campaign','Record the source and permission status','Review the campaign rules','Find a moment / add a timestamp','Assign editing and review tasks','Prepare and review the clip','Record the approved export or submission link','Track reported results and payments'];
const PERMS=[['unknown','❓ Not checked'],['requested','✉ Requested'],['granted','✔ Granted by creator'],['campaign','📜 Covered by campaign terms'],['denied','✖ Denied']];
const STAGES=[['moment','💡 Moment found'],['editing','✂ Editing'],['review','👀 Review'],['approved','✔ Approved'],['submitted','📤 Submitted'],['paid','💵 Paid']];
const stageLabel=k=>(STAGES.find(s=>s[0]===k)||STAGES[0])[1];
let clipSel=null,clipTab='board';
const clipsOf=()=>S.clips||[];
const today=()=>new Date().toISOString().slice(0,10);
const daysTo=d=>Math.round((new Date(d+'T12:00')-new Date(today()+'T12:00'))/864e5);

/* ----- scorecard math (only numbers you enter) ----- */
function campaignScore(c){const items=c.items||[],subs=(c.subs||[]).filter(s=>!s.item||!items.some(i=>i.id===s.item));/* subs created from a clip are counted via the clip */const views=items.reduce((a,i)=>a+(+i.views||0),0)+subs.reduce((a,s)=>a+(+String(s.views||'').replace(/[^0-9.]/g,'')||0),0);
  const rate=+c.rate||0,cap=+c.capAmount||0;const raw=rate?views/1000*rate:0;const est=cap?Math.min(raw,cap):raw;
  const paid=items.reduce((a,i)=>a+(+i.paid||0),0)+subs.reduce((a,s)=>a+(+s.paid||0),0);const confirmed=subs.reduce((a,s)=>a+(+s.confirmed||0),0)+items.reduce((a,i)=>a+(+i.confirmed||0),0);
  return {views,rate,cap,est,paid,confirmed,capPct:cap&&rate?Math.min(100,Math.round(raw/cap*100)):null,count:items.length,approved:items.filter(i=>['approved','submitted','paid'].includes(i.stage)).length}}
function bestOf(){const byCreator=clipsOf().map(c=>({name:c.name,...campaignScore(c)})).filter(x=>x.views||x.paid).sort((a,b)=>b.paid-a.paid||b.views-a.views);
  const fm=new Map();clipsOf().forEach(c=>(c.items||[]).forEach(i=>{const k=(i.format||'').trim();if(!k)return;const m=fm.get(k)||{name:k,views:0,paid:0,n:0};m.views+=+i.views||0;m.paid+=+i.paid||0;m.n++;fm.set(k,m)}));
  return {byCreator,byFormat:[...fm.values()].sort((a,b)=>b.paid-a.paid||b.views/b.n-a.views/a.n)}}

/* ----- deadlines & reminders (used by Dashboard and Schedule) ----- */
function clipDue(){const out=[];clipsOf().forEach(c=>{if(c.deadline&&!(c.items||[]).every(i=>i.stage==='paid'&&(c.items||[]).length))out.push({kind:'campaign',c,date:c.deadline,label:`${c.name} — campaign deadline`});
  (c.items||[]).forEach(i=>{if(i.due&&!['submitted','paid'].includes(i.stage))out.push({kind:'clip',c,i,date:i.due,label:`${c.name} · ${i.hook||'clip'} (${stageLabel(i.stage)})`})})});
  return out.map(x=>({...x,days:daysTo(x.date)})).filter(x=>x.days<=7).sort((a,b)=>a.days-b.days)}
function clipAttentionHTML(){const due=clipDue();const waiting=clipsOf().reduce((a,c)=>a+(c.items||[]).filter(i=>i.stage==='review'&&i.owner!==me()).length,0);
  return due.map(x=>`<div class="small">${x.days<0?'⛔':'⏰'} ${esc(x.label)} — ${x.days<0?`${-x.days}d overdue`:x.days===0?'today':`in ${x.days}d`} <a href="#" data-goclip="${x.c.id}">Open</a></div>`).join('')+(waiting?`<div class="small">👀 ${waiting} clip${waiting>1?'s':''} waiting for your review <a href="#" data-go="clips">Open</a></div>`:'')}
function clipScheduleHTML(d){if(d.name!=='Wednesday')return '';const ed=clipsOf().flatMap(c=>(c.items||[]).filter(i=>['moment','editing'].includes(i.stage)).map(i=>({c,i})));
  const due=clipDue();if(!ed.length&&!due.length)return '';return `<div class="small" style="margin-top:6px">✂ <b>Clipping:</b> ${ed.length} clip${ed.length===1?'':'s'} to edit${due.length?` · ${due.length} deadline${due.length>1?'s':''} this week`:''} <a href="#" data-go="clips">Open board</a></div>`}
function wireClipLinks(root){$$('[data-goclip]',root).forEach(a=>a.onclick=e=>{e.preventDefault();clipSel=a.dataset.goclip;clipTab='board';go('clips')})}

/* ----- page ----- */
function vClips(el){const list=clipsOf();const c=clipSel&&list.find(x=>x.id===clipSel);
  el.innerHTML=hdr('✂ Clipping Campaigns','Shared, manual workflow. No automatic monitoring, clipping or posting is connected.',`<button class="btn p" id="clNew">+ New campaign</button>`)+
  `<div class="banner">Creator permission doesn't automatically cover game footage, music or other third-party content. Payout rates are whatever you enter from the campaign — nothing is assumed.</div>`+
  (c?campaignView(c):campaignList(list));
  $('#clNew').onclick=()=>editClip();$$('[data-clip]',el).forEach(b=>b.onclick=()=>{clipSel=b.dataset.clip;render()});if(c)wireCampaign(c,el);
}
function campaignList(list){const due=clipDue();const best=bestOf();
  return `${due.length?`<div class="card" style="margin-bottom:14px"><h3>⏰ Due this week</h3>${clipAttentionHTML()}</div>`:''}
   <div class="grid g3">${list.map(x=>{const sc=campaignScore(x);const done=(x.steps||[]).filter(Boolean).length;
    return `<button class="card" style="text-align:left;color:inherit;font:inherit;cursor:pointer" data-clip="${x.id}"><h3>${esc(x.name)}</h3><div class="row">${ownerPill(x.owner)}<span class="tag">${(PERMS.find(p=>p[0]===x.perm)||PERMS[0])[1]}</span>${x.host?`<span class="tag">${esc(x.host)}</span>`:''}${x.deadline?`<span class="tag">⏰ ${esc(x.deadline)}</span>`:''}</div>
     <div class="row small" style="margin-top:6px"><span>${sc.count} clips</span><span>· ${sc.approved} approved</span>${sc.views?`<span>· ${sc.views.toLocaleString()} views</span>`:''}${sc.paid?`<span>· paid ${fmt$(sc.paid)}</span>`:''}</div>
     <div class="jbar"><i style="width:${done/CLIP_STEPS.length*100}%"></i></div><div class="tiny mute">${done}/${CLIP_STEPS.length} workflow steps</div></button>`}).join('')||empty('No campaigns yet — start one with “+ New campaign”.')}</div>
   ${best.byCreator.length||best.byFormat.length?`<div class="grid g2" style="margin-top:14px"><div class="card"><h3>🏆 Best creators / campaigns</h3>${best.byCreator.slice(0,5).map(b=>`<div class="row small"><span>${esc(b.name)}</span><span class="sp"></span>${b.views.toLocaleString()} views · paid ${fmt$(b.paid)}</div>`).join('')}</div>
    <div class="card"><h3>🎞 Best formats</h3>${best.byFormat.slice(0,5).map(b=>`<div class="row small"><span>${esc(b.name)}</span><span class="sp"></span>${b.n} clips · ${Math.round(b.views/b.n).toLocaleString()} avg views · paid ${fmt$(b.paid)}</div>`).join('')||'<div class="tiny mute">Add a format (e.g. “reaction”, “tutorial moment”) to clips to compare.</div>'}<p class="tiny mute">Based only on views and payments you recorded.</p></div></div>`:''}`}
function campaignView(c){const sc=campaignScore(c);const n=c.nodeId&&node(c.nodeId);
  return `<div class="row" style="margin-bottom:10px"><button class="btn s ghost" id="clBack">← All campaigns</button><h2 style="margin:0">${esc(c.name)}</h2>${ownerPill(c.owner)}<span class="tag">${(PERMS.find(p=>p[0]===c.perm)||PERMS[0])[1]}</span>${n?`<span class="tag">${nodeIcon(n)} ${esc(n.label)}</span>`:''}<span class="sp"></span>${c.campaignUrl?`<a class="btn s" href="${esc(c.campaignUrl)}" target="_blank" rel="noopener">Open on ${esc(c.host||'campaign site')} ↗</a>`:''}<button class="btn s" data-go="post">🚀 Post & Submit</button><button class="btn s" id="ciImp">⬇ Import clips</button><button class="btn s" id="clEdit">✎ Edit campaign</button><button class="btn s p" id="ciNew">+ Clip</button></div>
   <div class="grid g3" style="margin-bottom:12px">
    <div class="card"><div class="tiny mute">Reported views</div><b style="font-size:22px">${sc.views.toLocaleString()}</b><div class="tiny mute">${sc.rate?`at ${fmt$(sc.rate)} per 1k views (from campaign)`:'Set the campaign rate per 1k views to estimate'}</div></div>
    <div class="card"><div class="tiny mute">Estimated · confirmed · paid</div><b style="font-size:18px">${fmt$(sc.est)} · ${fmt$(sc.confirmed)} · ${fmt$(sc.paid)}</b><div class="tiny mute">Only paid counts as income</div></div>
    <div class="card"><div class="tiny mute">Payout cap</div>${sc.capPct!==null?`<b>${sc.capPct}%</b> of ${fmt$(sc.cap)}<div class="jbar"><i style="width:${sc.capPct}%"></i></div>`:`<div class="small">${c.cap?esc(c.cap):'No cap entered'}</div>`}${c.deadline?`<div class="tiny mute">⏰ Deadline ${esc(c.deadline)} (${daysTo(c.deadline)<0?`${-daysTo(c.deadline)}d overdue`:`${daysTo(c.deadline)}d left`})</div>`:''}</div></div>
   <div class="seg" role="group" aria-label="Section" style="margin-bottom:10px">${[['board','🗂 Board'],['workflow','✅ Workflow & rules'],['subs','📤 Submissions'],['library','📚 Library']].map(([k,l])=>`<button aria-pressed="${clipTab===k}" data-ct="${k}">${l}</button>`).join('')}</div>
   <div id="clBody">${clipTab==='board'?boardHTML(c):clipTab==='workflow'?workflowHTML(c):clipTab==='library'?libraryHTML():subsHTML(c)}</div>
   <div class="row" style="margin-top:10px"><button class="btn s d" id="clDel">Delete campaign</button></div>`}
function boardHTML(c){const items=c.items||[];
  return `<p class="tiny mute">Drag clips between columns, or open a clip to move it. Each clip has an owner and optional due date.</p><div class="board">${STAGES.map(([k,l])=>{const col=items.filter(i=>(i.stage||'moment')===k);
    return `<div class="bcol"><div class="bhead">${l} <span class="tiny mute">${col.length}</span></div><div class="drop bdrop" data-stage="${k}">${col.map(i=>`<div class="task bitem" draggable="true" data-item="${i.id}" tabindex="0" role="button" aria-label="Open clip ${esc(i.hook||i.start||'')}">
      <div class="t-body"><div class="t-title">${esc(i.hook||'Untitled clip')}</div><div class="row" style="gap:4px">${avatar(i.owner==='both'?'A':i.owner,16)} ${i.start?`<span class="tag">${esc(i.start)}${i.end?'–'+esc(i.end):''}</span>`:''}${i.platform?`<span class="tag">${esc(i.platform)}</span>`:''}${i.due?`<span class="tag ${daysTo(i.due)<0?'warn':''}">⏰ ${esc(i.due)}</span>`:''}${(i.notes||[]).length?`<span class="tag">💬 ${(i.notes||[]).length}</span>`:''}${i.changes?'<span class="tag warn">changes requested</span>':''}${['approved','submitted','paid','review'].includes(i.stage)?rightsSummary(i):''}</div></div></div>`).join('')||'<div class="tiny mute" style="padding:6px">Drop here</div>'}</div></div>`}).join('')}</div>`}
function workflowHTML(c){return `<div class="grid g2"><div class="card"><h3>Workflow</h3>${CLIP_STEPS.map((s,i)=>`<label class="row small"><input type="checkbox" class="chk" data-step="${i}" ${(c.steps||[])[i]?'checked':''}> ${i+1}. ${s}</label>`).join('')}</div>
   <div class="card"><h3>Campaign details</h3><div class="small">${c.source?`<div>Source: ${/^https?:/.test(c.source)?`<a href="${esc(c.source)}" target="_blank" rel="noopener">${esc(c.source)}</a>`:esc(c.source)}</div>`:''}${c.platforms?`<div>Eligible platforms: ${esc(c.platforms)}</div>`:''}${c.viewReq?`<div>View requirement: ${esc(c.viewReq)}</div>`:''}${c.rules?`<div style="white-space:pre-wrap">Rules: ${esc(c.rules)}</div>`:'<div class="mute">No rules recorded yet.</div>'}</div>
   <label class="f">Moments / timestamps</label>${(c.moments||[]).map((m,i)=>`<div class="row small"><span class="tag">${esc(m.ts)}</span>${esc(m.note)} <span class="tiny mute">· ${esc(pname(m.by))}</span><span class="sp"></span><button class="btn s" data-mclip="${i}">→ Clip</button><button class="btn s ghost d" data-mdel="${i}" aria-label="Remove">✕</button></div>`).join('')}
   <form id="mF" class="row"><input id="mTs" placeholder="1:23:45" style="width:100px" aria-label="Timestamp"><input id="mNote" placeholder="What happens" style="flex:1" aria-label="Moment note"><button class="btn s">Add</button></form></div></div>`}
function subsHTML(c){return `<div class="card">${(c.subs||[]).map((s,i)=>`<div class="task" style="cursor:default"><div class="t-body" style="cursor:default"><div class="t-title">${/^https?:/.test(s.link)?`<a href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.link)}</a>`:esc(s.link)}</div>
   <div class="row tiny"><label>Views <input type="number" min="0" data-sub="${i}" data-k="views" value="${esc(s.views||'')}" style="width:90px"></label><label>Est. <input type="number" min="0" step="0.01" data-sub="${i}" data-k="est" value="${esc(s.est||'')}" style="width:80px"></label><label>Confirmed <input type="number" min="0" step="0.01" data-sub="${i}" data-k="confirmed" value="${esc(s.confirmed||'')}" style="width:80px"></label><label>Paid <input type="number" min="0" step="0.01" data-sub="${i}" data-k="paid" value="${esc(s.paid||'')}" style="width:80px"></label>${+s.paid&&!s.recorded?`<button class="btn s p" data-rec="${i}">Record paid as income</button>`:s.recorded?'<span class="tag">✔ in income</span>':''}</div></div><button class="btn s ghost d" data-sdel="${i}" aria-label="Remove">✕</button></div>`).join('')||'<div class="tiny mute">Submissions you add here (or by moving a clip to “Submitted”) appear in this list.</div>'}
  <form id="sF" class="row" style="margin-top:8px"><input id="sLink" placeholder="Submission link" style="flex:1" aria-label="Submission link"><button class="btn s">Add</button></form></div>`}

function wireCampaign(c,el){const up=(fn,msg,act)=>commit(s=>fn(s.clips.find(x=>x.id===c.id)),msg,act);
  $('#clBack').onclick=()=>{clipSel=null;render()};$('#clEdit').onclick=()=>editClip(c.id);$('#ciNew').onclick=()=>editItem(c.id);$('#ciImp').onclick=()=>importClips(c.id);wireLibrary(el);
  $$('[data-ct]',el).forEach(b=>b.onclick=()=>{clipTab=b.dataset.ct;render()});
  $('#clDel').onclick=()=>modal('Delete campaign?',`<p>Removes “${esc(c.name)}”, its clips and submissions. Undo is available.</p>`,[{t:'Delete',c:'d',f:()=>{commit(s=>s.clips=s.clips.filter(x=>x.id!==c.id),'Deleted — Undo available');clipSel=null;render()}}]);
  /* board drag & drop */
  $$('[data-item]',el).forEach(e=>{e.ondragstart=ev=>{window.__dragging=true;ev.dataTransfer.setData('text/clip',e.dataset.item)};e.ondragend=()=>{window.__dragging=false};
    e.onclick=()=>editItem(c.id,e.dataset.item);e.onkeydown=ev=>{if(ev.key==='Enter')editItem(c.id,e.dataset.item)}});
  $$('[data-stage]',el).forEach(z=>{z.ondragover=ev=>{ev.preventDefault();z.classList.add('over')};z.ondragleave=()=>z.classList.remove('over');
    z.ondrop=ev=>{ev.preventDefault();z.classList.remove('over');window.__dragging=false;const id=ev.dataTransfer.getData('text/clip');if(id)moveItem(c.id,id,z.dataset.stage)}});
  /* workflow tab */
  $$('[data-step]',el).forEach(b=>b.onchange=()=>up(x=>{x.steps=[...(x.steps||[])];x.steps[+b.dataset.step]=b.checked},null,b.checked?`completed “${CLIP_STEPS[+b.dataset.step]}” on ${c.name}`:null));
  if($('#mF'))$('#mF').onsubmit=e=>{e.preventDefault();const ts=val('mTs'),note=val('mNote');if(!ts&&!note)return;up(x=>x.moments=[...(x.moments||[]),{ts,note,by:me()}],'Moment added')};
  $$('[data-mdel]',el).forEach(b=>b.onclick=()=>up(x=>x.moments=x.moments.filter((_,i)=>i!==+b.dataset.mdel)));
  $$('[data-mclip]',el).forEach(b=>b.onclick=()=>{const m=c.moments[+b.dataset.mclip];editItem(c.id,null,{start:m.ts,hook:m.note})});
  /* submissions tab */
  if($('#sF'))$('#sF').onsubmit=e=>{e.preventDefault();const link=val('sLink');if(!link)return toast('Add the link');up(x=>x.subs=[...(x.subs||[]),{link,views:'',est:'',confirmed:'',paid:'',by:me()}],'Submission added',`added a submission to ${c.name}`)};
  $$('[data-sub]',el).forEach(i=>i.onchange=()=>up(x=>{x.subs=x.subs.map((s,k)=>k===+i.dataset.sub?{...s,[i.dataset.k]:i.value}:s)}));
  $$('[data-sdel]',el).forEach(b=>b.onclick=()=>up(x=>x.subs=x.subs.filter((_,i)=>i!==+b.dataset.sdel),'Removed — Undo available'));
  $$('[data-rec]',el).forEach(b=>b.onclick=()=>{const s=c.subs[+b.dataset.rec];up(x=>{x.subs=x.subs.map((y,k)=>k===+b.dataset.rec?{...y,recorded:true}:y)});recordResult({amount:+s.paid,kind:'business',branch:c.nodeId||'',owner:c.owner,note:`Clipping payout · ${c.name}`})});
}
function moveItem(cid,iid,stage){const c=clipsOf().find(x=>x.id===cid);const i=(c.items||[]).find(x=>x.id===iid);if(!i||i.stage===stage)return;if(!guardSubmit(i,stage))return;
  commit(s=>{const it=s.clips.find(x=>x.id===cid).items.find(x=>x.id===iid);it.stage=stage;if(stage!=='editing')it.changes=false;if(stage==='submitted'&&it.export){const cc=s.clips.find(x=>x.id===cid);if(!(cc.subs||[]).some(x=>x.link===it.export))cc.subs=[...(cc.subs||[]),{link:it.export,views:'',est:'',confirmed:'',paid:'',by:me(),item:iid}]}},
    `Moved to ${stageLabel(stage)}`,`moved clip “${i.hook||'untitled'}” to ${stageLabel(stage).replace(/^\S+\s/,'')}`);if(stage==='paid')celebrate(true);clipAfter(cid,iid)}

/* ----- clip card ----- */
function editItem(cid,iid,preset={}){const c=clipsOf().find(x=>x.id===cid);const i=iid?(c.items||[]).find(x=>x.id===iid):{hook:'',start:'',end:'',caption:'',tags:'',platform:'',format:'',export:'',owner:me(),due:'',stage:'moment',views:'',paid:'',notes:[],...preset};if(!i)return;
  modal(iid?'Clip':'New clip',`${libraryDatalists()}<div class="row"><label class="f" for="iH" style="flex:1">Hook / title</label><button type="button" class="btn s ghost" data-lib="hook">★ Save to library</button></div><input id="iH" list="libHook" value="${esc(i.hook)}" placeholder="e.g. Streamer's reaction to the jump scare">
   <div class="row"><div style="flex:1;min-width:90px"><label class="f" for="iS">Start</label><input id="iS" value="${esc(i.start)}" placeholder="1:23:45"></div><div style="flex:1;min-width:90px"><label class="f" for="iE">End</label><input id="iE" value="${esc(i.end)}" placeholder="1:24:10"></div>
    <div style="flex:1;min-width:130px"><label class="f" for="iSt">Stage</label><select id="iSt">${STAGES.map(([k,l])=>`<option value="${k}" ${i.stage===k?'selected':''}>${l}</option>`).join('')}</select></div></div>
   <div class="row"><label class="f" for="iC" style="flex:1">Caption</label><button type="button" class="btn s ghost" data-lib="caption">★ Save to library</button><button type="button" class="btn s ghost" id="iCLib">📚 Use saved</button></div><textarea id="iC" rows="2">${esc(i.caption)}</textarea>
   <div class="row"><div style="flex:2;min-width:150px"><label class="f" for="iT">Hashtags</label><input id="iT" value="${esc(i.tags)}" placeholder="#gaming #clips"></div><div style="flex:1;min-width:120px"><label class="f" for="iP">Platform</label><input id="iP" value="${esc(i.platform)}" list="plats"><datalist id="plats"><option>TikTok</option><option>YouTube Shorts</option><option>Instagram Reels</option><option>X</option></datalist></div>
    <div style="flex:1;min-width:120px"><label class="f" for="iF">Format</label><input id="iF" list="libFmt" value="${esc(i.format)}" placeholder="reaction, tutorial…"></div></div>
   <div class="row"><div style="flex:1;min-width:130px"><label class="f" for="iO">Owner</label>${ownerSel('iO',i.owner)}</div><div style="flex:1;min-width:130px"><label class="f" for="iD">Due (optional)</label><input type="date" id="iD" value="${esc(i.due)}"></div></div>
   <label class="f" for="iX">Export / submission link</label><input id="iX" value="${esc(i.export)}" placeholder="https://…">
   <div class="row"><div style="flex:1"><label class="f" for="iV">Reported views</label><input type="number" min="0" id="iV" value="${esc(i.views)}"></div><div style="flex:1"><label class="f" for="iPd">Paid ($)</label><input type="number" min="0" step="0.01" id="iPd" value="${esc(i.paid)}"></div></div>
   ${rightsHTML(i)}
   ${iid?`<h3 style="margin:14px 0 4px">Review notes</h3>${(i.notes||[]).map(n=>`<div class="it row small" style="padding:4px 0">${avatar(n.by,20)}<b>${esc(pname(n.by))}</b> ${n.changes?'<span class="tag warn">requested changes</span>':''} ${esc(n.text)}</div>`).join('')||'<div class="tiny mute">No notes yet.</div>'}
    <textarea id="iN" rows="2" placeholder="Leave a review note…" style="margin-top:6px"></textarea>`:''}`,
   [...(iid?[{t:'Delete',c:'d',f:()=>commit(s=>{const cc=s.clips.find(x=>x.id===cid);cc.items=cc.items.filter(x=>x.id!==iid)},'Clip deleted — Undo available')},
     {t:'Request changes',f:()=>{const t=val('iN')||'Please revise';saveItem(cid,iid,{stage:'editing',changes:true},{text:t,changes:true})}},
     {t:'Add note',f:()=>{const t=val('iN');if(!t){toast('Write a note first');return false}saveItem(cid,iid,{},{text:t})}}]:[]),
    {t:'Save',c:'p',f:()=>saveItem(cid,iid,{})}],{onOpen:d=>{$$('[data-lib]',d).forEach(b=>b.onclick=()=>saveToLibrary(b.dataset.lib,b.dataset.lib==='hook'?val('iH'):val('iC'),c.name));
      $('#iCLib',d).onclick=()=>{const caps=libOf().filter(x=>x.kind==='caption');if(!caps.length)return toast('No saved captions yet');const pick=caps[caps.length-1];$('#iC',d).value=pick.text;toast('Inserted latest saved caption — edit as needed')}}})}
function saveItem(cid,iid,extra,note){const rights=$$('[data-right]').length?readRights():undefined;const d={hook:val('iH'),start:val('iS'),end:val('iE'),stage:val('iSt'),caption:val('iC'),tags:val('iT'),platform:val('iP'),format:val('iF'),owner:val('iO'),due:val('iD'),export:val('iX'),views:val('iV'),paid:val('iPd'),...(rights?{rights}:{}),...extra};
  if(!guardSubmit({...(iid?clipsOf().find(x=>x.id===cid).items.find(x=>x.id===iid):{}),...d},d.stage))return false;
  const prevStage=iid?clipsOf().find(x=>x.id===cid).items.find(x=>x.id===iid).stage:null;
  commit(s=>{const cc=s.clips.find(x=>x.id===cid);cc.items=cc.items||[];let it=iid&&cc.items.find(x=>x.id===iid);if(!it){it={id:uid(),notes:[],by:me()};cc.items.push(it)}
    Object.assign(it,d);if(note)it.notes=[...(it.notes||[]),{by:me(),text:note.text,changes:!!note.changes,at:Date.now()}];
    if(d.stage==='submitted'&&it.export&&!(cc.subs||[]).some(x=>x.link===it.export))cc.subs=[...(cc.subs||[]),{link:it.export,views:it.views||'',est:'',confirmed:'',paid:'',by:me(),item:it.id}]},
    note?(note.changes?'Changes requested':'Note added'):'Clip saved',note?(note.changes?`requested changes on “${d.hook||'a clip'}”`:`left a note on “${d.hook||'a clip'}”`):(iid?(prevStage!==d.stage?`moved clip “${d.hook||'untitled'}” to ${stageLabel(d.stage).replace(/^\S+\s/,'')}`:null):`added clip “${d.hook||'untitled'}”`));
  if(d.stage==='paid'&&prevStage!=='paid')celebrate(true);const savedId=iid||clipsOf().find(x=>x.id===cid).items.slice(-1)[0].id;setTimeout(()=>clipAfter(cid,savedId),50)}

/* ----- Campaign autofill: copy a past campaign, or read details out of text pasted from a campaign page ----- */
const AF_FIELDS={cN:'name',cH:'host',cU:'campaignUrl',cSU:'submitUrl',cO:'owner',cP:'perm',cS:'source',cR:'rules',cPl:'platforms',cV:'viewReq',cRt:'rate',cCa:'capAmount',cC:'cap',cD:'deadline',cNd:'nodeId'};
const AF_PLATFORMS=[[/\btik ?tok\b/i,'TikTok'],[/\b(instagram|insta|ig reels?|reels)\b/i,'Instagram Reels'],[/\b(youtube shorts|yt shorts|shorts)\b/i,'YouTube Shorts'],[/\byoutube\b(?! shorts)/i,'YouTube'],[/\btwitter\b|\bx\.com\b|(?:^|[\s,\/&])X(?=[\s,\/.)]|$)/,'X'],[/\bfacebook\b|\bfb reels\b/i,'Facebook'],[/\bsnapchat\b|\bspotlight\b/i,'Snapchat']];
const afNum=s=>{if(s==null)return NaN;const t=String(s).replace(/[$,\s]/g,'').toLowerCase();const m=t.match(/^([\d.]+)(k|m)?$/);if(!m)return NaN;return +m[1]*(m[2]==='k'?1e3:m[2]==='m'?1e6:1)};
const afMoney=n=>isNaN(n)?'':String(Math.round(n*100)/100);
function afDate(s){if(!s)return '';const iso=s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);let d;
  if(iso)d=new Date(+iso[1],+iso[2]-1,+iso[3]);
  else{const us=s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if(us)d=new Date(+us[3]<100?2000+ +us[3]:+us[3],+us[1]-1,+us[2]);
    else{const clean=s.replace(/(\d)(st|nd|rd|th)\b/i,'$1').replace(/\./g,'');const hasYear=/\d{4}/.test(clean);const t=Date.parse(hasYear?clean:clean+' '+new Date().getFullYear());if(!isNaN(t)){d=new Date(t);if(!hasYear&&d<new Date(Date.now()-864e5*30))d.setFullYear(d.getFullYear()+1)}}}
  if(!d||isNaN(d))return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
/* Returns only the fields it found. No DOM access, so it can be tested on its own. */
function parseCampaignText(raw){const txt=String(raw||'').replace(/\r/g,'').trim(),out={};if(!txt)return out;const flat=txt.replace(/\s+/g,' ');let m;
  const urls=[...txt.matchAll(/https?:\/\/[^\s<>"')]+/g)].map(x=>x[0].replace(/[.,;]+$/,''));
  const camp=urls.find(u=>/contentrewards|whop\.com|vyro/i.test(u))||urls.find(u=>!/twitch\.tv|kick\.com|youtube\.com|youtu\.be|rumble\.com|drive\.google|dropbox/i.test(u));if(camp)out.campaignUrl=camp;
  const sub=urls.find(u=>u!==camp&&/submit|submission/i.test(u));if(sub)out.submitUrl=sub;
  const src=urls.find(u=>u!==camp&&u!==sub&&/twitch\.tv|kick\.com|youtube\.com|youtu\.be|rumble\.com|drive\.google|dropbox/i.test(u));if(src)out.source=src;
  const hay=(camp||'')+' '+flat;const host=/contentrewards|content rewards/i.test(hay)?'Content Rewards':/whop/i.test(hay)?'Whop':/vyro/i.test(hay)?'Vyro':/discord/i.test(hay)?'Clipping agency / Discord':'';if(host)out.host=host;
  /* rate per 1k views */
  let rate;
  if((m=flat.match(/\$\s?([\d.,]+)\s*(?:usd)?\s*(?:per|\/|for(?: every)?|every|a)\s*(1\s?k|[\d.,]+\s?k?|thousand|million|1\s?m)?\s*(views?|cpm)/i))){const p=m[2]?m[2].replace(/\s/g,''):'';const per=m[3].toLowerCase()==='cpm'?1000:!p?1000:/million|^1m$/i.test(p)?1e6:/thousand/i.test(p)?1000:afNum(p);rate=afNum(m[1])/(per||1000)*1000}
  else if((m=flat.match(/([\d.,]+\s?[km]?)\s*views?\s*(?:=|:|for|pays?|→|->)\s*\$\s?([\d.,]+)/i)))rate=afNum(m[2])/afNum(m[1])*1000;
  else if((m=flat.match(/\$\s?([\d.,]+)\s*(?:rpm|cpm)\b/i))||(m=flat.match(/\b(?:rpm|cpm)\s*[:\-]?\s*\$\s?([\d.,]+)/i)))rate=afNum(m[1]);
  if(rate>0&&isFinite(rate))out.rate=afMoney(rate);
  /* payout cap */
  if((m=flat.match(/(?:max(?:imum)?|cap(?:ped)?(?: at)?|up to|limit)\s*(?:payout|earnings|pay)?\s*(?:of|is|:|-)?\s*\$\s?([\d.,]+\s?k?)([^.\n]{0,40})/i))||(m=flat.match(/\$\s?([\d.,]+\s?k?)\s*(?:max(?:imum)?|cap)\b([^.\n]{0,40})/i))){const a=afNum(m[1]);if(a>0){out.capAmount=afMoney(a);const per=(m[2]||'').match(/per\s+(clip|video|post|creator|clipper|account|person|month|week)/i);out.cap=`Max $${a.toLocaleString()}${per?' per '+per[1].toLowerCase():''}`}}
  if((m=flat.match(/(?:total\s+)?budget\s*(?:of|is|:|-)?\s*\$\s?([\d.,]+\s?k?)/i))){const b=afNum(m[1]);if(b>0)out.cap=(out.cap?out.cap+' · ':'')+`Campaign budget $${b.toLocaleString()}`}
  /* minimum views */
  if((m=flat.match(/(?:min(?:imum)?\.?|at least|requires?|need)\s*(?:of\s*)?([\d.,]+\s?k?)\s*views?/i))||(m=flat.match(/([\d.,]+\s?k?)\s*views?\s*(?:min(?:imum)?|required|to qualify|to get paid)/i))){const v=afNum(m[1]);if(v>0)out.viewReq=`${v.toLocaleString()} views minimum`}
  /* platforms */
  let plats=[...new Set(AF_PLATFORMS.filter(([re])=>re.test(flat)).map(p=>p[1]))];if(plats.includes('YouTube Shorts'))plats=plats.filter(p=>p!=='YouTube');if(plats.length)out.platforms=plats.join(', ');
  /* deadline */
  if((m=flat.match(/(?:deadline|ends?|ending|until|closes?|expires?|due|end date)\s*(?:on|:|-|by)?\s*((?:[a-z]{3,9}\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?)|(?:\d{1,2}\s+[a-z]{3,9}\.?(?:\s+\d{4})?)|(?:\d{4}-\d{1,2}-\d{1,2})|(?:\d{1,2}\/\d{1,2}\/\d{2,4}))/i))){const d=afDate(m[1]);if(d)out.deadline=d}
  /* name: first short line that isn't a link, a price or a heading */
  const first=txt.split('\n').map(l=>l.trim()).find(l=>l&&!/^https?:/i.test(l)&&l.length<=80&&!/^\$|\bviews?\b|^(rules|requirements|guidelines|terms|about|details)\b/i.test(l));if(first)out.name=first.replace(/^campaign\s*[:\-]\s*/i,'');
  /* rules: from a Rules/Requirements heading if there is one, else the whole paste */
  const rs=txt.search(/^\s*(campaign rules|rules|requirements|guidelines|terms)\b/im);out.rules=(rs>=0?txt.slice(rs):txt).trim().slice(0,4000);
  if(host)out.perm='campaign';
  return out}
function afApply(dlg,data){const filled=[];Object.entries(AF_FIELDS).forEach(([id,k])=>{const e=dlg.querySelector('#'+id);const v=data[k];if(!e||v==null||v==='')return;
    if(e.tagName==='SELECT'&&![...e.options].some(o=>o.value===String(v)))return;if(String(e.value)===String(v))return;
    e.value=v;e.classList.remove('autofilled');void e.offsetWidth;e.classList.add('autofilled');const l=dlg.querySelector(`label[for="${id}"]`);filled.push(l?l.textContent.replace(/\s*\(.*\)$/,''):k)});return filled}
function afBox(id){const past=clipsOf().filter(x=>x.id!==id);
  return `<details class="afbox" ${id?'':'open'}><summary>⚡ Autofill campaign details</summary>
   ${past.length?`<label class="f" for="afPast">Start from a campaign you've run before</label><select id="afPast"><option value="">— choose a campaign —</option>${past.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.host?' · '+esc(x.host):''}</option>`).join('')}</select>`:''}
   <label class="f" for="afTxt">${past.length?'Or paste':'Paste'} the campaign page (on the campaign page: select all, copy, paste here)</label><textarea id="afTxt" placeholder="Name, rate per 1k views, max payout, platforms, minimum views, deadline, rules, links…"></textarea>
   <div class="row" style="margin-top:6px"><button type="button" class="btn s p" id="afGo">Fill from pasted text</button><span class="tiny mute" id="afMsg">Check the filled fields before saving. Nothing is fetched from the internet.</span></div></details>`}
function wireAutofill(dlg){const box=dlg.querySelector(".afbox");if(box&&!box.open)dlg.querySelector("#cN").focus();const msg=t=>{const e=dlg.querySelector('#afMsg');if(e)e.textContent=t};const sel=dlg.querySelector('#afPast');
  if(sel)sel.onchange=()=>{const p=clipsOf().find(x=>x.id===sel.value);if(!p)return;const {deadline,id,steps,moments,subs,items,by,...rest}=p;const f=afApply(dlg,rest);
    msg(f.length?`Copied from “${p.name}”: ${f.join(', ')}. Set a new deadline if this round has one.`:'Those details already match.')};
  dlg.querySelector('#afGo').onclick=()=>{const t=dlg.querySelector('#afTxt').value;if(!t.trim()){msg('Paste the campaign page text first.');return}
    const f=afApply(dlg,parseCampaignText(t));msg(f.length?`Filled: ${f.join(', ')}. Check them before saving.`:'Couldn\'t spot any details in that text. Fill the fields by hand.')}}

function editClip(id){const c=id?clipsOf().find(x=>x.id===id):{name:'',host:'Content Rewards',campaignUrl:'',submitUrl:'',owner:'both',source:'',perm:'unknown',rules:'',platforms:'',viewReq:'',cap:'',capAmount:'',rate:'',deadline:'',nodeId:(S.nodes.find(n=>n.label==='Live Clipping & Content Campaigns')||{}).id||''};
  modal(id?'Edit campaign':'New clipping campaign',`${afBox(id)}<label class="f" for="cN">Creator or campaign</label><input id="cN" value="${esc(c.name)}">
   <div class="row"><div style="flex:1;min-width:140px"><label class="f" for="cO">Assigned</label>${ownerSel('cO',c.owner)}</div><div style="flex:1;min-width:140px"><label class="f" for="cP">Permission status</label><select id="cP">${PERMS.map(([k,l])=>`<option value="${k}" ${c.perm===k?'selected':''}>${l}</option>`).join('')}</select></div></div>
   <div class="row"><div style="flex:1;min-width:140px"><label class="f" for="cH">Campaign platform</label><select id="cH">${CAMPAIGN_HOSTS.map(h=>`<option ${c.host===h?'selected':''}>${h}</option>`).join('')}</select></div><div style="flex:2;min-width:180px"><label class="f" for="cU">Campaign page URL</label><input id="cU" value="${esc(c.campaignUrl||'')}" placeholder="https://…"></div></div>
   <label class="f" for="cSU">Submit page URL (where you paste post links)</label><input id="cSU" value="${esc(c.submitUrl||'')}" placeholder="https://…">
   <label class="f" for="cS">Source (stream / VOD link)</label><input id="cS" value="${esc(c.source)}">
   <label class="f" for="cR">Campaign rules & terms</label><textarea id="cR">${esc(c.rules)}</textarea>
   <div class="row"><div style="flex:1;min-width:140px"><label class="f" for="cPl">Eligible platforms</label><input id="cPl" value="${esc(c.platforms)}"></div><div style="flex:1;min-width:120px"><label class="f" for="cV">View requirement</label><input id="cV" value="${esc(c.viewReq)}"></div></div>
   <div class="row"><div style="flex:1;min-width:120px"><label class="f" for="cRt">Rate per 1k views ($, from campaign)</label><input type="number" min="0" step="0.01" id="cRt" value="${esc(c.rate||'')}"></div><div style="flex:1;min-width:120px"><label class="f" for="cCa">Payout cap ($)</label><input type="number" min="0" step="0.01" id="cCa" value="${esc(c.capAmount||'')}"></div><div style="flex:1;min-width:120px"><label class="f" for="cC">Cap notes</label><input id="cC" value="${esc(c.cap||'')}"></div></div>
   <div class="row"><div style="flex:1;min-width:140px"><label class="f" for="cD">Deadline (if any)</label><input type="date" id="cD" value="${esc(c.deadline)}"></div><div style="flex:2;min-width:160px"><label class="f" for="cNd">Mind Web link</label><select id="cNd"><option value="">— none —</option>${nodeOptions(c.nodeId)}</select></div></div>`,
   [{t:'Save',c:'p',f:()=>{const name=val('cN');if(!name){toast('Name the campaign');return false}const d={name,host:val('cH'),campaignUrl:val('cU'),submitUrl:val('cSU'),owner:val('cO'),perm:val('cP'),source:val('cS'),rules:val('cR'),platforms:val('cPl'),viewReq:val('cV'),rate:val('cRt'),capAmount:val('cCa'),cap:val('cC'),deadline:val('cD'),nodeId:val('cNd')};
     commit(s=>{s.clips=s.clips||[];if(id)Object.assign(s.clips.find(x=>x.id===id),d);else{const nid=uid();s.clips.push({id:nid,steps:[],moments:[],subs:[],items:[],by:me(),...d});clipSel=nid}},'Saved',id?`edited campaign ${name}`:`started clipping campaign ${name}`)}}],{onOpen:wireAutofill})}
