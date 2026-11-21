'use strict';
/* ===== Mind Web: visual map + list view ===== */
let selId=null,linkSrc=null,view=null,webMode='map',showArchived=false,webQ='';
function selectNode(id,openParent){selId=id;let changed=false;nodeAncestors(id).forEach(a=>{const p=node(a);if(p&&p.collapsed){p.collapsed=false;changed=true}});if(changed)persist();if(page==='web')render();openNode(id)}
const posOf=(n,g=0)=>{if(n.parent&&g<20){const p=node(n.parent);if(p){const q=posOf(p,g+1);return {x:q.x+(n.dx||0),y:q.y+(n.dy||0)}}}return {x:n.x||0,y:n.y||0}};
function visibleNode(n){if(n.archived&&!showArchived)return false;if(!n.parent)return true;if(nodeAncestors(n.id).some(a=>{const x=node(a);return !x||x.collapsed||(x.archived&&!showArchived)}))return false;const p=node(n.parent);return p&&!p.collapsed&&(!p.archived||showArchived)}

function vWeb(el){
  el.innerHTML=hdr('🕸 Mind Web','A living map of the areas you\'re exploring. Branches are <b>ideas to explore</b> — not existing businesses, accounts, or income unless you record that.',
   `<div class="seg" role="group" aria-label="View"><button aria-pressed="${webMode==='map'}" data-wm="map">🕸 Map</button><button aria-pressed="${webMode==='list'}" data-wm="list">☰ List</button></div><button class="btn p" data-qa="idea">+ Idea</button>`)+
  `<div>${webMode==='map'?mapHTML():listHTML()}</div>${webStats()}`;
  $$('[data-wm]',el).forEach(b=>b.onclick=()=>{webMode=b.dataset.wm;render()});
  if(webMode==='map')wireMap();else wireList();
}
function webStats(){const counts=STATUSES.map(s=>[s,S.nodes.filter(x=>x.status===s&&!x.archived).length]).filter(([,c])=>c);
  return `<div class="card web-stats"><div class="row small">${counts.map(([s,c])=>`${stPill(s)}<b>${c}</b>`).join('<span class="tiny mute">·</span>')}</div>
   <p class="tiny mute" style="margin:6px 0 0">${S.nodes.filter(x=>!x.parent&&!x.archived).length} branches · ${S.links.length} connections · ${S.tasks.filter(t=>t.nodeId).length} linked tasks · <span class="sample">sample</span> starting branches are suggestions to explore, not active businesses.</p></div>`}
function mapHTML(){return `<div class="canvas" id="cv"><svg id="svg" role="application" aria-label="Mind Web map. Use Tab to move between ideas and Enter to open."><g id="vp"></g></svg>
  <div class="tools"><input id="wq" placeholder="🔍 Find…" value="${esc(webQ)}" style="width:150px" aria-label="Find idea"><button class="btn s" id="expAll">Expand all</button><button class="btn s" id="colAll">Collapse all</button>
   <label class="btn s" style="cursor:pointer"><input type="checkbox" id="shA" ${showArchived?'checked':''}> Archived</label></div>
  ${linkSrc?`<div class="banner" style="position:absolute;bottom:10px;left:10px;margin:0">🔗 Tap another idea to connect to <b>${esc(node(linkSrc).label)}</b> · <a href="#" id="cxl">Cancel</a></div>`:''}
  <div class="zoom sk-tools" role="toolbar" aria-label="Zoom the map"><button type="button" id="zout" aria-label="Zoom out" title="Zoom out">−</button><button type="button" id="zin" aria-label="Zoom in" title="Zoom in">+</button><button type="button" class="sk-fit" id="zfit" aria-label="Fit to screen" title="Fit everything"><span aria-hidden="true">⤢</span> Fit</button></div></div>
  <p class="tiny mute">Drag ideas to arrange · drag empty space to pan · scroll or ＋/－ to zoom · double-click a branch to expand · tap a glowing line to explain the connection.</p>`}
function fitView(){const cv=$('#cv');if(!cv)return;const vis=S.nodes.filter(visibleNode);const pts=[{x:0,y:0},...vis.map(posOf)];
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);const w=Math.max(...xs)-Math.min(...xs)+260,h=Math.max(...ys)-Math.min(...ys)+140;
  const k=Math.min(1.6,Math.max(.2,Math.min(cv.clientWidth/w,cv.clientHeight/h)));
  view={k,x:cv.clientWidth/2-((Math.max(...xs)+Math.min(...xs))/2)*k,y:cv.clientHeight/2-((Math.max(...ys)+Math.min(...ys))/2)*k}}
function zoomBy(f,cx,cy){const cv=$('#cv');cx??=cv.clientWidth/2;cy??=cv.clientHeight/2;const k=Math.min(2.5,Math.max(.2,view.k*f));view.x=cx-(cx-view.x)*k/view.k;view.y=cy-(cy-view.y)*k/view.k;view.k=k;draw()}
function draw(){const vp=$('#vp');if(!vp)return;vp.setAttribute('transform',`translate(${view.x},${view.y}) scale(${view.k})`);
  const vis=S.nodes.filter(visibleNode);const vid=new Set(vis.map(n=>n.id));const q=webQ.toLowerCase();let h='';
  vis.filter(n=>!n.parent).forEach(n=>{h+=`<line class="spoke" x1="0" y1="0" x2="${n.x}" y2="${n.y}"/>`});
  vis.filter(n=>n.parent&&vid.has(n.parent)).forEach(n=>{const a=posOf(node(n.parent)),b=posOf(n);h+=`<path class="tree" d="M${a.x},${a.y} L${b.x},${b.y}"/>`});
  S.links.forEach(l=>{if(!vid.has(l.from)||!vid.has(l.to))return;const a=posOf(node(l.from)),b=posOf(node(l.to));const mx=(a.x+b.x)/2+(b.y-a.y)*.12,my=(a.y+b.y)/2-(b.x-a.x)*.12;
    h+=`<path class="lk" data-link="${l.id}" d="M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}" marker-end="url(#arr)"><title>${esc(node(l.from).label)} → ${esc(node(l.to).label)}: ${esc(l.why||'tap to explain')}</title></path>`});
  h+=`<g transform="translate(-58,-34)"><foreignObject width="116" height="68"><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;justify-content:center;gap:4px">${avatar('A',52)}${avatar('B',52)}</div></foreignObject></g>
      <text x="0" y="50" text-anchor="middle" style="font-size:11px;fill:var(--mute)">${esc(prof('A').name)} &amp; ${esc(prof('B').name)}</text>`;
  vis.forEach(n=>{const p=posOf(n),isTop=!n.parent;const label=n.label.length>38?n.label.slice(0,37).trimEnd()+'…':n.label;const w=Math.min(290,Math.max(96,label.length*6.7+(isTop?44:34))),hh=isTop?42:28;
    const isCat=nodeAncestors(n.id).length<=1;const dim=q&&!n.label.toLowerCase().includes(q);const kids=S.nodes.filter(c=>c.parent===n.id&&!c.archived).length;const cls=`n ${isTop?'cat':''} ${n.kind==='project'?'proj':''} ${selId===n.id?'sel':''} ${linkSrc===n.id?'src':''}`;
    h+=`<g class="${cls}" data-n="${n.id}" tabindex="0" role="button" aria-label="${esc(n.label)}, ${n.status}${kids?`, ${kids} sub-branches`:''}" transform="translate(${p.x},${p.y})" opacity="${dim?.2:n.archived?.45:1}">
     <rect x="${-w/2}" y="${-hh/2}" width="${w}" height="${hh}" rx="${isTop?12:9}"/>
     <text x="${-w/2+10}" y="${isTop?-3:4}">${isTop?esc(nodeIcon(n))+' ':''}${esc(label)}</text>
     ${isTop?`<text x="${-w/2+10}" y="13" style="font-size:10px;fill:var(--mute)">${STATUS_IC[n.status]||''} ${STATUS_LABEL[n.status]||n.status}${kids?` · ${kids} ${n.collapsed?'▸':'▾'}`:''}</text>`:`<text x="${w/2-14}" y="4" style="font-size:10px">${STATUS_IC[n.status]}</text>`}</g>`});
  vp.innerHTML=`<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--acc2)"/></marker></defs>`+h;
  $$('[data-link]',vp).forEach(e=>e.onclick=ev=>{ev.stopPropagation();editLink(e.dataset.link)});
  $$('[data-n]',vp).forEach(g=>g.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();tapNode(g.dataset.n)}});
}
function wireMap(){if(!view)setTimeout(()=>{fitView();draw()});else draw();
  const svg=$('#svg');let drag=null;
  svg.onpointerdown=e=>{const g=e.target.closest('[data-n]');const pt={x:e.clientX,y:e.clientY};
    if(g){const n=node(g.dataset.n);drag={type:'node',id:n.id,start:pt,orig:n.parent?{x:n.dx,y:n.dy}:{x:n.x,y:n.y},moved:false}}else drag={type:'pan',start:pt,orig:{x:view.x,y:view.y}};
    svg.setPointerCapture(e.pointerId);window.__dragging=true};
  svg.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.start.x,dy=e.clientY-drag.start.y;if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;if(!drag.moved)return;
    if(drag.type==='pan'){view.x=drag.orig.x+dx;view.y=drag.orig.y+dy}else{const n=node(drag.id);if(!drag.snap)drag.snap=structuredClone(S);
      if(n.parent){n.dx=drag.orig.x+dx/view.k;n.dy=drag.orig.y+dy/view.k}else{n.x=drag.orig.x+dx/view.k;n.y=drag.orig.y+dy/view.k}}draw()};
  svg.onpointerup=()=>{window.__dragging=false;if(!drag)return;const d=drag;drag=null;
    if(d.type==='node'){if(d.moved){past.push(JSON.stringify(d.snap));future.length=0;stamp(d.snap,S);persist();Sync.schedule()}else tapNode(d.id)}
    else if(!d.moved&&selId){selId=null;draw();shell()}Sync.flushPending()};
  svg.ondblclick=e=>{const g=e.target.closest('[data-n]');if(!g)return;const n=node(g.dataset.n);if(S.nodes.some(c=>c.parent===n.id))commit(s=>{const m=s.nodes.find(x=>x.id===n.id);m.collapsed=!m.collapsed})};
  svg.onwheel=e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoomBy(e.deltaY<0?1.1:.9,e.clientX-r.left,e.clientY-r.top)};
  $('#zin').onclick=()=>zoomBy(1.2);$('#zout').onclick=()=>zoomBy(.83);$('#zfit').onclick=()=>{fitView();draw()};
  $('#expAll').onclick=()=>{commit(s=>s.nodes.forEach(n=>{n.collapsed=false}));fitView();draw()};$('#colAll').onclick=()=>{commit(s=>s.nodes.forEach(n=>{n.collapsed=true}));fitView();draw()};
  $('#shA').onchange=e=>{showArchived=e.target.checked;render()};$('#wq').oninput=e=>{webQ=e.target.value;draw()};
  if($('#cxl'))$('#cxl').onclick=e=>{e.preventDefault();linkSrc=null;render()};
}
function tapNode(id){if(linkSrc&&linkSrc!==id){const a=linkSrc;linkSrc=null;if(S.links.some(l=>(l.from===a&&l.to===id)||(l.from===id&&l.to===a))){toast('Already connected');render();return}
    modal(`Connect ${node(a).label} → ${node(id).label}`,`<label class="f" for="lw">Why are these connected? (an opportunity to explore — not a claim of an existing partnership or revenue)</label><textarea id="lw"></textarea>`,
     [{t:'Connect',c:'p',f:()=>commit(s=>s.links.push({id:uid(),from:a,to:id,why:val('lw')}),'Connected',`connected “${node(a).label}” → “${node(id).label}”`)}]);return}
  openNode(id)}
function editLink(id){const l=S.links.find(x=>x.id===id);if(!l)return;modal(`${node(l.from).label} → ${node(l.to).label}`,`<label class="f" for="lw">Why are these connected?</label><textarea id="lw">${esc(l.why)}</textarea><p class="tiny mute">Connections are opportunities to explore, not claims that an integration, partnership or revenue stream exists.</p>`,
  [{t:'Remove',c:'d',f:()=>commit(s=>s.links=s.links.filter(x=>x.id!==id),'Connection removed — Undo available','removed a connection')},{t:'Reverse direction',f:()=>commit(s=>{const m=s.links.find(x=>x.id===id);[m.from,m.to]=[m.to,m.from]})},{t:'Save',c:'p',f:()=>commit(s=>s.links.find(x=>x.id===id).why=val('lw'),'Saved','explained a connection')}])}

/* ----- list view (works great on phones) ----- */
function listHTML(){const tops=S.nodes.filter(n=>!n.parent&&(showArchived||!n.archived));const q=webQ.toLowerCase();
  const kids=id=>S.nodes.filter(c=>c.parent===id&&(showArchived||!c.archived));
  const match=n=>!q||n.label.toLowerCase().includes(q)||kids(n.id).some(match);
  const item=(n,d)=>{const ks=kids(n.id).filter(match);const head=`<span aria-hidden="true">${d===0?nodeIcon(n):n.kind==='project'?'🚀':d===1?'▸':'◦'}</span><a href="#" data-pick="${n.id}">${d<2?'<b>':''}${esc(n.label)}${d<2?'</b>':''}</a>${n.priority?`<span class="tag">⚑ ${n.priority}</span>`:''}${n.archived?'<span class="tag">archived</span>':''}<span class="sp"></span>${stPill(n.status)}${ks.length?`<span class="tiny mute">${ks.length}</span>`:''}`;
    return ks.length?`<details class="cat" ${q||!n.collapsed?'open':''} style="${d?'margin:4px 0;background:none':''}"><summary>${head}</summary><div class="kids">${ks.map(k=>item(k,d+1)).join('')}</div></details>`:`<div class="row small" style="padding:3px 0 3px ${d?0:12}px">${head}</div>`};
  return `<div class="row" style="margin-bottom:10px"><input id="wq" placeholder="🔍 Find an idea…" value="${esc(webQ)}" style="flex:1;max-width:320px" aria-label="Find idea"><label class="small row"><input type="checkbox" id="shA" ${showArchived?'checked':''}> Show archived</label></div>
  <div class="listview">${tops.filter(match).map(t=>item(t,0)).join('')}</div>`}
function wireList(){$$('[data-pick]').forEach(a=>a.onclick=e=>{e.preventDefault();tapNode(a.dataset.pick)});
  $('#shA').onchange=e=>{showArchived=e.target.checked;render()};const i=$('#wq');i.oninput=()=>{webQ=i.value;const p=i.selectionStart;render();const j=$('#wq');j.focus();j.setSelectionRange(p,p)};
  $$('details.cat').forEach(d=>d.ontoggle=()=>{})}

/* ----- idea / project details: shared pop-up (opens from the map, the list, or any link) ----- */
function webMark(){if(page!=='web')return;if($('#vp'))draw();shell()}
function openNode(id){const n=node(id);if(!n)return;selId=id;webMark();
  const conns=S.links.filter(l=>l.from===n.id||l.to===n.id);const tasks=S.tasks.filter(t=>t.nodeId===n.id);const notes=S.notes.filter(x=>x.nodeId===n.id);
  const kids=S.nodes.filter(c=>c.parent===n.id&&(!c.archived||showArchived));const sched=S.days.filter(d=>d.topics.includes(n.label));
  const par=n.parent&&node(n.parent);
  const html=`${par?`<button type="button" class="sk-chip" id="dUp" style="margin-bottom:8px"><span class="sk-chip-t">↑ Part of ${esc(nodeIcon(par))} ${esc(par.label)}</span><span aria-hidden="true">›</span></button>`:''}
   <div class="row">${stPill(n.status)}${ownerPill(n.owner||'both')}<span class="tag">${KIND_LABEL[n.kind]||'Item'}</span>${n.priority?`<span class="tag">⚑ ${n.priority}</span>`:''}${n.card&&n.card.decision?`<span class="tag">Decision: ${n.card.decision}</span>`:''}${n.sample&&n.status==='idea'?'<span class="sample">sample idea</span>':''}</div>
   <label class="f" for="dL">Name</label><input id="dL" value="${esc(n.label)}">
   <div class="row"><div style="flex:1;min-width:120px"><label class="f" for="dS">Status</label><select id="dS" data-nodirty>${STATUSES.map(s=>`<option value="${s}" ${s===n.status?'selected':''}>${STATUS_IC[s]} ${STATUS_LABEL[s]}</option>`).join('')}</select></div>
    <div style="flex:1;min-width:120px"><label class="f" for="dO">Assigned to</label>${ownerSel('dO',n.owner||'both')}</div></div>
   ${n.card&&n.card.nextAction?`<div class="small" style="margin-top:8px">➡ <b>Next:</b> ${esc(n.card.nextAction)}</div>`:''}${n.card&&n.card.blockers?`<div class="small warn">⛔ ${esc(n.card.blockers)}</div>`:''}${n.lastReviewed?`<div class="tiny mute">Last reviewed ${esc(n.lastReviewed)}</div>`:''}
   <label class="f" for="dN">Notes · research · pricing · requirements</label><textarea id="dN" style="min-height:90px">${esc(n.notes)}</textarea>
   <div class="row web-acts" style="margin-top:8px"><button class="btn s p" id="dSave">Save</button>${page!=='web'?'<button class="btn s" id="dMap">🕸 Show on map</button>':''}<button class="btn s" id="dCard">📇 Research card</button><button class="btn s" id="dLink">🔗 Connect</button><button class="btn s" id="dTask">+ Task / schedule</button><button class="btn s" id="dNote">+ Note</button>
    <button class="btn s" id="dKid">+ Sub-idea</button>${n.kind!=='project'?'<button class="btn s" id="dProj">🚀 Make project</button>':''}<button class="btn s ${n.archived?'':'d'}" id="dArc">${n.archived?'Restore':'Archive'}</button>${n.parent?'<button class="btn s d" id="dDel">Delete</button>':''}</div>
   ${sched.length?`<label class="f">On the schedule</label>${sched.map(d=>`<span class="tag">📅 ${esc(d.name)}</span>`).join('')}`:''}
   ${kids.length?`<label class="f">Sub-branches (${kids.length})</label>${kids.map(k=>`<div class="row small" style="padding:2px 0"><a href="#" data-pick="${k.id}">${k.kind==='project'?'🚀 ':''}${esc(k.label)}</a><span class="sp"></span>${stPill(k.status)}</div>`).join('')}`:''}
   <label class="f">Connections (${conns.length})</label>${conns.map(l=>{const o=node(l.from===n.id?l.to:l.from);return o?`<div class="small" style="padding:3px 0">${l.from===n.id?'→':'←'} <a href="#" data-pick="${o.id}">${esc(o.label)}</a> <a href="#" data-lk="${l.id}" class="tiny">✎ explain</a><div class="tiny mute" style="margin-left:14px">${esc(l.why||'No explanation yet')}</div></div>`:''}).join('')||'<div class="tiny mute">None yet — use 🔗 Connect.</div>'}
   <label class="f">Tasks (${tasks.length})</label><div class="drop">${tasks.map(taskHTML).join('')||'<div class="tiny mute">None</div>'}</div>
   ${notes.length?`<label class="f">Notes (${notes.length})</label>${notes.map(x=>`<div class="small">📝 <a href="#" data-nt="${x.id}">${esc(x.title)}</a></div>`).join('')}`:''}`;
  modal(`${nodeIcon(n)} ${n.label}`,html,[],{noCancel:true,cls:'dlg-detail',reopen:()=>openNode(id),onOpen:el=>wireNode(el,n)})}
function wireNode(el,n){DLG.onDone=()=>{selId=null;webMark()};
  wireTasks(el);wireLinks(el);
  $$('[data-done]',el).forEach(c=>c.addEventListener('change',()=>setTimeout(dlgRefresh)));
  $$('[data-pick]',el).forEach(a=>a.onclick=e=>{e.preventDefault();selectNode(a.dataset.pick)});
  if($('#dUp',el))$('#dUp',el).onclick=()=>openNode(n.parent);
  if($('#dMap',el))$('#dMap',el).onclick=()=>{el.close();selId=n.id;go('web')};
  $$('[data-lk]',el).forEach(a=>a.onclick=e=>{e.preventDefault();editLink(a.dataset.lk)});
  $('#dCard').onclick=()=>openCard(n.id);$('#dSave').onclick=()=>{const l=val('dL');if(!l)return toast('Name required');commit(s=>Object.assign(s.nodes.find(x=>x.id===n.id),{label:l,status:val('dS'),owner:val('dO'),notes:val('dN'),sample:false}),'Saved',`updated idea “${l}”`);dlgRefresh()};
  $('#dS').onchange=()=>commit(s=>Object.assign(s.nodes.find(x=>x.id===n.id),{status:val('dS'),sample:false}),'Status: '+val('dS'),`set “${n.label}” to ${val('dS')}`);
  $('#dLink').onclick=()=>{el.close();linkSrc=n.id;if(webMode!=='map')webMode='map';if(page!=='web')go('web');else render();toast('Now tap the idea to connect to')};
  $('#dTask').onclick=()=>editTask(null,{nodeId:n.id,owner:n.owner||me()});$('#dNote').onclick=()=>editNote(null,{nodeId:n.id});
  $('#dKid').onclick=()=>editIdea({parent:n.id});
  if($('#dProj'))$('#dProj').onclick=()=>ask('Make it a project','Project name','Project: '+n.label,l=>{const root=n.parent||n.id;const id=uid();
    commit(s=>{s.nodes.push({id,label:l,parent:root,kind:'project',status:'researching',owner:n.owner||'both',dx:(Math.random()-.5)*80,dy:130,notes:'Created from idea: '+n.label,archived:false});s.nodes.find(x=>x.id===root).collapsed=false;if(n.parent)s.links.push({id:uid(),from:n.id,to:id,why:'Project created from this idea'})},'Project created 🚀',`created project “${l}”`);selectNode(id);return false},{ok:'Create project'});
  $('#dArc').onclick=()=>{commit(s=>{const m=s.nodes.find(x=>x.id===n.id);m.archived=!m.archived},n.archived?'Restored':'Archived — tick “Archived” to see it',`${n.archived?'restored':'archived'} “${n.label}”`);dlgRefresh()};
  if($('#dDel'))$('#dDel').onclick=()=>{commit(s=>{s.nodes=s.nodes.filter(x=>x.id!==n.id);s.links=s.links.filter(l=>l.from!==n.id&&l.to!==n.id);s.tasks.forEach(t=>{if(t.nodeId===n.id)t.nodeId=''})},'Deleted — Undo available',`deleted “${n.label}”`);el.close()};
}
