'use strict';
/* ===== UI building blocks: toast, dialog, avatars, themes, task cards, editors ===== */
const THEMES=[
  {g:'Duo',id:'emerald',name:'Emerald Nexus',d:'emerald + cyan',sw:['#060d0f','#34d399','#22d3ee','#a78bfa']},
  {g:'Duo',id:'violet',name:'Cosmic Violet',d:'deep space violet',sw:['#07061a','#a78bfa','#60a5fa','#f0abfc']},
  {g:'Duo',id:'solar',name:'Solar Gold',d:'warm gold + amber',sw:['#0e0a04','#fbbf24','#fb923c','#fde68a']},
  {g:'Duo',id:'arctic',name:'Arctic Hologram',d:'cool blue + silver',sw:['#050a14','#7dd3fc','#cbd5e1','#93c5fd']},
  {g:'Duo',id:'light',name:'Minimal Light',d:'bright + readable',sw:['#f4f6f8','#0f766e','#2563eb','#7c3aed'],light:true},
  {g:'UGC Studio · Core',id:'holo',name:'Holo Blue',d:'holographic glass',sw:['#050a1a','#4fc3ff','#b28cff','#ff7ad9']},
  {g:'UGC Studio · Core',id:'classic',name:'Classic',d:'the original UGC look',sw:['#070d13','#a7e972','#6cc6ff','#0f1a23']},
  {g:'UGC Studio · Soft',id:'coquette',name:'Coquette',d:'baby pink + silver, pearls',sw:['#fff6f9','#f4a7c3','#b8bec8','#fbe3ec'],light:true},
  {g:'UGC Studio · Anime-inspired',id:'monarch',name:'Shadow Monarch',d:'inspired by Solo Leveling',sw:['#03040b','#3fa9ff','#8b5cff','#111a3d']},
  {g:'UGC Studio · Anime-inspired',id:'ooo',name:'Land of Ooo',d:'inspired by Adventure Time',sw:['#0e2a47','#ffd23f','#ff7eb6','#3ccf6e']},
  {g:'UGC Studio · Anime-inspired',id:'grimoire',name:'Grimoire',d:'inspired by Black Clover',sw:['#0b0b0a','#d4af37','#3fa86b','#a3242c']},
  {g:'UGC Studio · Anime-inspired',id:'nen',name:'Nen Aura',d:'inspired by Hunter x Hunter',sw:['#05100b','#34e07f','#f5c842','#163327']},
  {g:'UGC Studio · Anime-inspired',id:'leaf',name:'Hidden Leaf',d:'inspired by Naruto',sw:['#0d0b0a','#ff7a1a','#2f8bff','#2c1e14']},
  {g:'UGC Studio · Anime-inspired',id:'saiyan',name:'Saiyan Ki',d:'inspired by Dragon Ball Z',sw:['#070a1f','#ff9a1f','#ffe14d','#1c2560']},
  {g:'UGC Studio · Cultivation',id:'jade',name:'Jade Immortal',d:'jade + gold, ink-wash mist',sw:['#06100e','#5fe0b5','#e6c36a','#17312b']},
  {g:'UGC Studio · Cultivation',id:'lotus',name:'Crimson Lotus',d:'demonic-sect red + gold',sw:['#0c0507','#ff3b5c','#f2c14e','#30121a']},
  {g:'UGC Studio · Cultivation',id:'celestial',name:'Celestial Sword',d:'moonlit silver-blue, stars',sw:['#090c1d','#9fc8ff','#e8e3ff','#1d2550']},
];
const ACCENTS=['','#34d399','#22d3ee','#a78bfa','#f472b6','#fbbf24','#fb7185','#7dd3fc','#4ade80'];
const AV_STYLES=[['explorer','Futuristic explorer'],['strategist','Tech strategist'],['visionary','Creative visionary'],['cosmic','Cosmic traveler'],['guardian','Digital guardian'],['geo','Minimal geometric'],['holo','Holographic figure']];
const SKINS=['#f6d7c3','#e8b896','#c68e6a','#a0694a','#6e4630','#3f2a1e','#9aa7b8'];
const HAIRS=['#2b2b2b','#6b4423','#c9a36a','#e6e6e6','#d9480f','#7048e8','#22d3ee'];
const COLORS=['#f472b6','#38bdf8','#34d399','#a78bfa','#fbbf24','#fb7185','#e2e8f0','#14b8a6'];
const ZODIAC=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),2000)}

/* ----- dialog with header close (×), body, footer ----- */
function modal(title,body,buttons=[],opts={}){const d=$('#dlg');
  d.innerHTML=`<div class="dlg-h">${opts.back?'<button class="btn s ghost" id="dlgBack" aria-label="Back">← Back</button>':''}<h2>${esc(title)}</h2><button class="btn s ghost" id="dlgX" aria-label="Close">✕ Close</button></div><div class="dlg-b">${body}</div><div class="dlg-f"></div>`;
  const f=$('.dlg-f',d);
  [...buttons,...(opts.noCancel?[]:[{t:'Cancel'}])].forEach(b=>{const e=document.createElement('button');e.className='btn'+(b.c?' '+b.c:'');e.textContent=b.t;
    e.onclick=async()=>{if(b.f&&(await b.f())===false)return;if(!b.keep)close()};f.appendChild(e)});
  const close=()=>{d.close()};$('#dlgX',d).onclick=close;if(opts.back)$('#dlgBack',d).onclick=()=>{close();opts.back()};
  d.onclose=()=>{if(window.Sync)Sync.flushPending()};
  if(!d.open)d.showModal();if(opts.onOpen)opts.onOpen(d);
  const i=$('.dlg-b input:not([type=checkbox]):not([type=radio]),.dlg-b textarea',d);if(i&&!opts.noFocus)i.focus();return d}
const val=id=>{const e=document.getElementById(id);return e?String(e.value).trim():''};
const ownerSel=(id,v)=>`<select id="${id}">${['A','B','both'].map(o=>`<option value="${o}" ${o===v?'selected':''}>${esc(o==='both'?'Both of us':pname(o)+(o===me()?' (me)':''))}</option>`).join('')}</select>`;
const ownerPill=o=>`<span class="pill o-${o}">${o==='both'?'⚭':'●'} ${esc(o===me()?'Me':o==='both'?'Both':pname(o))}</span>`;
const stPill=s=>`<span class="st st-${s}">${STATUS_IC[s]||''} ${(typeof STATUS_LABEL!=="undefined"?STATUS_LABEL:{})[s]||s}</span>`;
const nodeIcon=n=>n?(n.icon||CAT_ICON[n.label]||(n.kind==='project'?'🚀':n.parent?'◦':'✦')):'';

/* ----- avatars: original SVG shapes (no third-party art) ----- */
function avatarSVG(a,name){const s=a.style;const ini=esc((name||'?').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase());
  const aura=a.aura,out=a.outfit,skin=a.skin,hair=a.hair;
  const bg=`<defs><radialGradient id="g${s}${aura.slice(1)}" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="${aura}" stop-opacity=".9"/><stop offset="1" stop-color="${aura}" stop-opacity=".15"/></radialGradient></defs><rect width="64" height="64" fill="url(#g${s}${aura.slice(1)})"/>`;
  if(a.kind==='initials')return `<svg viewBox="0 0 64 64">${bg}<text x="32" y="40" text-anchor="middle" font-size="22" font-weight="700" fill="#fff" style="font-family:inherit">${ini}</text></svg>`;
  if(a.kind==='abstract')return `<svg viewBox="0 0 64 64">${bg}<g class="float"><circle cx="24" cy="28" r="12" fill="${out}" opacity=".85"/><rect x="30" y="24" width="20" height="20" rx="5" fill="${hair}" opacity=".8" transform="rotate(18 40 34)"/><circle cx="40" cy="20" r="5" fill="#fff" opacity=".8"/></g></svg>`;
  const body=`<path d="M12 64c2-14 10-20 20-20s18 6 20 20z" fill="${out}"/>`;
  const head=`<circle cx="32" cy="28" r="12" fill="${skin}"/>`;
  const eyes=`<circle cx="27.5" cy="29" r="1.6" fill="#1b1b1b"/><circle cx="36.5" cy="29" r="1.6" fill="#1b1b1b"/>`;
  const parts={
    explorer:`${body}${head}<path d="M19 27a13 13 0 0 1 26 0v2H19z" fill="${hair}"/><rect x="22" y="25" width="20" height="7" rx="3.5" fill="#0b1a1d" opacity=".85"/><rect x="23" y="26.5" width="18" height="3" rx="1.5" fill="${aura}"/>`,
    strategist:`${body}<rect x="29" y="44" width="6" height="12" fill="#fff" opacity=".7"/>${head}<path d="M20 26c0-9 6-12 12-12s12 3 12 12c-3-4-7-5-12-5s-9 1-12 5z" fill="${hair}"/>${eyes}<rect x="24" y="26.5" width="7" height="5" rx="1.5" fill="none" stroke="#e2e8f0" stroke-width="1.2"/><rect x="33" y="26.5" width="7" height="5" rx="1.5" fill="none" stroke="#e2e8f0" stroke-width="1.2"/>`,
    visionary:`${body}${head}<path d="M18 30c-2-12 6-18 14-18s17 5 14 18c-2-6-6-9-14-9s-12 3-14 9z" fill="${hair}"/><path d="M20 19c6-6 18-6 24 0l-2 3c-6-4-14-4-20 0z" fill="${aura}"/>${eyes}<path d="M28 34q4 3 8 0" stroke="#1b1b1b" stroke-width="1.4" fill="none"/>`,
    cosmic:`${body}<circle cx="32" cy="28" r="15" fill="none" stroke="#e2e8f0" stroke-width="2" opacity=".85"/>${head}<circle cx="32" cy="28" r="15" fill="${aura}" opacity=".18"/>${eyes}<circle cx="46" cy="14" r="2" fill="#fff"/><circle cx="16" cy="18" r="1.3" fill="#fff"/>`,
    guardian:`<path d="M10 64c2-15 10-21 22-21s20 6 22 21z" fill="${out}"/><path d="M22 44l10 8 10-8" fill="none" stroke="${aura}" stroke-width="2"/>${head}<path d="M19 28c0-10 6-15 13-15s13 5 13 15l-3-1c-1-6-5-9-10-9s-9 3-10 9z" fill="${hair}"/><path d="M24 29h16" stroke="${aura}" stroke-width="3" stroke-linecap="round"/>`,
    geo:`<polygon points="32,10 52,46 12,46" fill="${out}" opacity=".9"/><circle cx="32" cy="34" r="8" fill="${skin}"/><rect x="12" y="50" width="40" height="6" rx="3" fill="${hair}"/>`,
    holo:`<g opacity=".9"><path d="M14 64c2-14 9-20 18-20s16 6 18 20z" fill="none" stroke="${aura}" stroke-width="2"/><circle cx="32" cy="28" r="12" fill="none" stroke="${aura}" stroke-width="2"/><path d="M20 28h24M32 16v24" stroke="${out}" stroke-width="1" opacity=".7"/><circle cx="32" cy="28" r="4" fill="${out}"/></g>`,
  };
  return `<svg viewBox="0 0 64 64">${bg}<g class="float">${parts[s]||parts.explorer}</g></svg>`}
function avatar(id,size=40,p){p=p||prof(id);const idle=(prof(me()).motion!=='off')?' idle':'';
  const inner=p.avatar.kind==='photo'&&p.photo?`<img src="${esc(p.photo)}" alt="">`:avatarSVG(p.avatar,p.name);
  return `<span class="av${idle}" style="width:${size}px;height:${size}px" role="img" aria-label="${esc(p.name)}'s avatar">${inner}</span>`}

/* ----- themes (personal: only applied for the person using this device) ----- */
function applyTheme(p=prof(me())){const h=document.documentElement;h.dataset.theme=p.theme||'emerald';h.dataset.motion=normMotion(p.motion);
  if(p.simple)h.dataset.simple='';else delete h.dataset.simple;
  if(p.accent)h.style.setProperty('--acc',p.accent);else h.style.removeProperty('--acc');}

/* ----- celebrations (respect motion + per-person toggle) ----- */
function celebrate(big){const p=prof(me());if(!p.celebrate||normMotion(p.motion)!=='full')return;
  const c=document.createElement('div');c.className='celebrate';const cols=['var(--acc)','var(--acc2)','var(--acc3)','var(--a)','var(--b)'];
  for(let i=0;i<(big?60:18);i++){const e=document.createElement('i');e.style.left=Math.random()*100+'vw';e.style.background=cols[i%5];e.style.animationDelay=Math.random()*.4+'s';c.appendChild(e)}
  document.body.appendChild(c);setTimeout(()=>c.remove(),2200);$$('.bond').forEach(b=>{b.classList.remove('burst');void b.offsetWidth;b.classList.add('burst')})}

/* ----- scope filter: mine / partner / shared ----- */
function inScope(owner,scope){if(scope==='all')return true;if(scope==='mine')return owner===me();if(scope==='partner')return owner===partnerId();return owner==='both'}
function scopeSeg(cur,onKey){return `<div class="seg" role="group" aria-label="Whose work">${[['all','All'],['mine','My work'],['partner',"Partner's"],['shared','Shared']].map(([k,l])=>`<button aria-pressed="${cur===k}" data-scope="${k}" data-scope-key="${onKey}">${l}</button>`).join('')}</div>`}

/* ----- task cards ----- */
function taskHTML(t){const n=t.nodeId&&node(t.nodeId);const d=t.dayId&&S.days.find(x=>x.id===t.dayId);
  return `<div class="task ${t.done?'done':''}" draggable="true" data-task="${t.id}">
   <input type="checkbox" class="chk" data-done="${t.id}" ${t.done?'checked':''} aria-label="Mark ${esc(t.title)} done">
   <div class="t-body" data-open-task="${t.id}" tabindex="0" role="button" aria-label="Open task ${esc(t.title)}">
    <div class="t-title">${esc(t.title)}</div>
    <div class="row" style="gap:4px;margin-top:3px">${t.owner!=='both'?avatar(t.owner,18):`${avatar('A',18)}${avatar('B',18)}`} ${ownerPill(t.owner)}
     ${d?`<span class="tag">📅 ${esc(d.name)}${t.time?' '+esc(t.time):''}</span>`:''}${t.due?`<span class="tag ${!t.done&&typeof daysTo==='function'&&daysTo(t.due)<0?'warn':''}">⏰ ${esc(t.due)}</span>`:''}${n?`<span class="tag">${nodeIcon(n)} ${esc(n.label)}</span>`:''}${t.mode?`<span class="tag">📈 ${esc(t.mode)}</span>`:''}${t.notes?'<span class="tag">📝</span>':''}</div></div></div>`}
function wireTasks(root){
  $$('[data-done]',root).forEach(c=>c.onchange=()=>{const id=c.dataset.done;const t=S.tasks.find(x=>x.id===id);
    commit(s=>{s.tasks.find(x=>x.id===id).done=c.checked},c.checked?'Nice — done ✓':'Reopened',`${c.checked?'completed':'reopened'} task “${t.title}”`);
    if(c.checked){const el=$(`[data-task="${id}"]`);if(el)el.classList.add('pop');celebrate(t.owner==='both')}});
  $$('[data-open-task]',root).forEach(e=>{e.onclick=()=>editTask(e.dataset.openTask);e.onkeydown=ev=>{if(ev.key==='Enter')editTask(e.dataset.openTask)}});
  $$('[data-task]',root).forEach(e=>{e.ondragstart=ev=>{window.__dragging=true;ev.dataTransfer.setData('text/task',e.dataset.task);ev.dataTransfer.effectAllowed='move'};e.ondragend=()=>{window.__dragging=false}});
  $$('.drop[data-day]',root).forEach(z=>{z.ondragover=ev=>{ev.preventDefault();z.classList.add('over')};z.ondragleave=()=>z.classList.remove('over');
    z.ondrop=ev=>{ev.preventDefault();z.classList.remove('over');window.__dragging=false;const id=ev.dataTransfer.getData('text/task');if(!id)return;const d=z.dataset.day||null;
      const t=S.tasks.find(x=>x.id===id);commit(s=>{s.tasks.find(x=>x.id===id).dayId=d},d?'Moved to '+S.days.find(x=>x.id===d).name:'Moved to unscheduled',`moved “${t.title}” to ${d?S.days.find(x=>x.id===d).name:'unscheduled'}`)}});
}
const nodeOptions=sel=>S.nodes.filter(n=>!n.archived).map(n=>`<option value="${n.id}" ${n.id===sel?'selected':''}>${n.parent?'   ↳ ':''}${esc(n.label)}</option>`).join('');
const dayOptions=sel=>`<option value="">Unscheduled</option>${S.days.filter(d=>!d.archived).map(d=>`<option value="${d.id}" ${d.id===sel?'selected':''}>${esc(d.name)}</option>`).join('')}`;

function editTask(id,preset={}){const t=id?S.tasks.find(x=>x.id===id):{title:'',owner:me(),dayId:null,nodeId:'',notes:'',time:'',mode:'',...preset};if(!t)return;
  modal(id?'Task details':'New task / work block',`
   <label class="f" for="tT">Title</label><input id="tT" value="${esc(t.title)}" placeholder="What needs doing?">
   <div class="row"><div style="flex:1;min-width:160px"><label class="f" for="tO">Belongs to</label>${ownerSel('tO',t.owner)}</div>
    <div style="flex:1;min-width:160px"><label class="f" for="tD">Day</label><select id="tD">${dayOptions(t.dayId)}</select></div></div>
   <div class="row"><div style="flex:1;min-width:160px"><label class="f" for="tTm">Time (optional · ${esc(S.tz)})</label><input id="tTm" value="${esc(t.time)}" placeholder="e.g. 3pm (blank if none)"></div>
    <div style="flex:1;min-width:160px"><label class="f" for="tM">Trading mode</label><select id="tM">${['','Simulated','Demo','Live'].map(m=>`<option ${m===t.mode?'selected':''} value="${m}">${m||'— not trading —'}</option>`).join('')}</select></div></div>
   <div class="row"><div style="flex:1;min-width:160px"><label class="f" for="tDu">Due date (optional)</label><input id="tDu" type="date" value="${esc(t.due||'')}"></div><div style="flex:1;min-width:160px"></div></div>
   <label class="f" for="tN">Linked Mind Web idea / project</label><select id="tN"><option value="">— none —</option>${nodeOptions(t.nodeId)}</select>
   <label class="f" for="tNo">Notes</label><textarea id="tNo">${esc(t.notes)}</textarea>
   ${id&&t.u?`<p class="tiny mute">Last updated ${new Date(t.u).toLocaleString()}</p>`:''}`,
   [...(id?[{t:'Delete',c:'d',f:()=>commit(s=>s.tasks=s.tasks.filter(x=>x.id!==id),'Task deleted — Undo available',`deleted task “${t.title}”`)}]:[]),
    ...(id&&t.nodeId?[{t:'Open idea',f:()=>{go('web');selectNode(t.nodeId)}}]:[]),
    {t:'Save',c:'p',f:()=>{const title=val('tT');if(!title){toast('Give it a title');return false}
     const data={title,owner:val('tO'),dayId:val('tD')||null,time:val('tTm'),due:val('tDu'),mode:val('tM'),nodeId:val('tN'),notes:val('tNo')};
     commit(s=>{if(id)Object.assign(s.tasks.find(x=>x.id===id),data);else s.tasks.push({id:uid(),done:false,by:me(),...data})},'Saved',id?`updated task “${title}”`:`added task “${title}”`)}}])}

function editNote(id,preset={}){const n=id?S.notes.find(x=>x.id===id):{title:'',body:'',owner:'both',nodeId:'',dayId:'',...preset};if(!n)return;
  modal(id?'Note':'New note',`<label class="f" for="nT">Title</label><input id="nT" value="${esc(n.title)}">
   <label class="f" for="nB">Note</label><textarea id="nB" style="min-height:140px">${esc(n.body)}</textarea>
   <div class="row"><div style="flex:1;min-width:150px"><label class="f" for="nO">Visible as</label>${ownerSel('nO',n.owner)}</div><div style="flex:1;min-width:150px"><label class="f" for="nD">Workday</label><select id="nD">${dayOptions(n.dayId)}</select></div></div>
   <label class="f" for="nN">Linked idea / project</label><select id="nN"><option value="">— none —</option>${nodeOptions(n.nodeId)}</select>
   <p class="tiny mute">Notes are shared with your partner when sync is on (the “Visible as” label is for organising, not hiding).</p>`,
   [...(id?[{t:'Delete',c:'d',f:()=>commit(s=>s.notes=s.notes.filter(x=>x.id!==id),'Note deleted — Undo available',`deleted note “${n.title}”`)}]:[]),
    {t:'Save',c:'p',f:()=>{const title=val('nT')||val('nB').slice(0,40);if(!title){toast('Write something first');return false}
      const data={title,body:val('nB'),owner:val('nO'),dayId:val('nD'),nodeId:val('nN')};
      commit(s=>{if(id)Object.assign(s.notes.find(x=>x.id===id),data);else s.notes.unshift({id:uid(),by:me(),at:Date.now(),...data})},'Note saved',id?`edited note “${title}”`:`added note “${title}”`)}}])}

function editSuggestion(id,preset={}){const g=id?S.suggestions.find(x=>x.id===id):{text:'',nodeId:'',...preset};if(!g)return;
  if(id){/* detail view */ const mine=g.by===me();
    modal('Suggestion',`<div class="row">${avatar(g.by,32)}<b>${esc(pname(g.by))}</b><span class="tag">${g.status}</span><span class="sp"></span><span class="tiny mute">${new Date(g.at).toLocaleString()}</span></div>
     <p style="white-space:pre-wrap">${esc(g.text)}</p>${g.nodeId&&node(g.nodeId)?`<p class="small">Related: <a href="#" id="sgN">${nodeIcon(node(g.nodeId))} ${esc(node(g.nodeId).label)}</a></p>`:''}
     <div class="feed">${(g.replies||[]).map(r=>`<div class="it">${avatar(r.by,24)}<div><b class="small">${esc(pname(r.by))}</b><div class="small">${esc(r.text)}</div></div></div>`).join('')}</div>
     <label class="f" for="sgR">Reply</label><textarea id="sgR" placeholder="Add your thoughts…"></textarea>`,
     [{t:'Send reply',f:()=>{const r=val('sgR');if(!r)return false;commit(s=>{const x=s.suggestions.find(y=>y.id===id);x.replies=[...(x.replies||[]),{by:me(),text:r,at:Date.now()}]},'Reply sent',`replied to a suggestion`)}},
      ...(g.status==='open'?[{t:'Mark done',c:'p',f:()=>commit(s=>s.suggestions.find(y=>y.id===id).status='done','Marked done',`marked a suggestion done`)},{t:'Dismiss',f:()=>commit(s=>s.suggestions.find(y=>y.id===id).status='dismissed','Dismissed')}]:[{t:'Reopen',f:()=>commit(s=>s.suggestions.find(y=>y.id===id).status='open','Reopened')}]),
      ...(mine?[{t:'Delete',c:'d',f:()=>commit(s=>s.suggestions=s.suggestions.filter(y=>y.id!==id),'Deleted — Undo available')}]:[])],
     {onOpen:d=>{const a=$('#sgN',d);if(a)a.onclick=e=>{e.preventDefault();d.close();go('web');selectNode(g.nodeId)}}});
    if(!mine)commit(s=>{const x=s.suggestions.find(y=>y.id===id);x.seen={...(x.seen||{}),[me()]:Date.now()}});return}
  modal('New suggestion',`<label class="f" for="sgT">Your suggestion for ${esc(pname(partnerId()))}</label><textarea id="sgT" placeholder="e.g. Let's research TikTok Shop affiliate requirements on Tuesday">${esc(g.text)}</textarea>
   <label class="f" for="sgNd">Related idea (optional)</label><select id="sgNd"><option value="">— none —</option>${nodeOptions(g.nodeId)}</select>`,
   [{t:'Send suggestion',c:'p',f:()=>{const text=val('sgT');if(!text){toast('Write a suggestion');return false}
     commit(s=>s.suggestions.unshift({id:uid(),by:me(),text,nodeId:val('sgNd'),status:'open',replies:[],at:Date.now(),seen:{}}),'Suggestion sent',`suggested: “${text.slice(0,60)}”`)}}])}

function editIdea(preset={}){const parents=S.nodes.filter(n=>!n.archived&&n.kind!=='project');
  modal('New idea',`<label class="f" for="iL">Idea name</label><input id="iL" placeholder="e.g. Pet product UGC bundle">
   <label class="f" for="iP">Place it under</label><select id="iP"><option value="">— new top-level branch —</option>${parents.map(p=>`<option value="${p.id}" ${p.id===preset.parent?'selected':''}>${'· '.repeat(nodeAncestors(p.id).length)}${esc(p.label)}</option>`).join('')}</select>
   <div class="row"><div style="flex:1;min-width:150px"><label class="f" for="iS">Status</label><select id="iS">${STATUSES.map(s=>`<option>${s}</option>`).join('')}</select></div><div style="flex:1;min-width:150px"><label class="f" for="iO">Owner</label>${ownerSel('iO','both')}</div></div>
   <label class="f" for="iN">Notes</label><textarea id="iN"></textarea>`,
   [{t:'Add to Mind Web',c:'p',f:()=>{const label=val('iL');if(!label){toast('Name your idea');return false}const parent=val('iP')||null;const id=uid();
     commit(s=>{const c=parent?s.nodes.filter(x=>x.parent===parent).length:0;const a=c*0.8;
       s.nodes.push({id,label,parent,kind:parent?(nodeAncestors(parent).length>=1?'path':'sub'):'category',status:val('iS'),owner:val('iO'),notes:val('iN'),archived:false,collapsed:false,x:(Math.random()-.5)*300,y:(Math.random()-.5)*200,dx:Math.cos(a)*150,dy:Math.sin(a)*95});
       if(parent)s.nodes.find(x=>x.id===parent).collapsed=false},'Idea added',`added idea “${label}”`);if(window.selectNode)selectNode(id,true)}}])}

function quickAdd(kind){({task:()=>editTask(),note:()=>editNote(),idea:()=>editIdea(),suggestion:()=>editSuggestion(),schedule:()=>editTask(null,{owner:'both',dayId:(todayDay()||{}).id||null}),check:()=>{const t=prompt('Checklist item:');if(t)commit(s=>s.checklist.push({id:uid(),text:t,done:false,by:me()}),'Added to checklist',`added checklist item “${t}”`)}})[kind]()}
function todayDay(){const n=new Date().toLocaleDateString('en-US',{weekday:'long'});return S.days.find(d=>d.name===n&&!d.archived)}
/* motion levels match UGC Studio: full | calm | off (older saved values are mapped) */
function normMotion(m){return {expressive:'full',standard:'full',reduced:'calm'}[m]||(['full','calm','off'].includes(m)?m:(matchMedia('(prefers-reduced-motion: reduce)').matches?'calm':'full'))}
