'use strict';
/* ===== Find anything: one search box for pages, tasks, skills, projects, Mind Web ideas, notes and clips.
   Open with the 🔍 Find button, "/" or Ctrl/⌘+K. Arrow keys move, Enter opens. ===== */
function findItems(){const out=[];const add=(t,ic,k,run,extra='')=>{if(t)out.push({t:String(t),ic,k,run,s:(t+' '+extra).toLowerCase()})};
  PAGES.forEach(p=>add(p.l,p.ic,'Page',()=>go(p.k)));
  S.tasks.forEach(t=>add(t.title,t.done?'☑':'✓',t.done?'Done task':'Task',()=>editTask(t.id),t.notes));
  S.skills.forEach(s=>add(s.title,'🌳','Skill',()=>{skSel=s.id;jTab='tree';go('journey');
    if(slideMode()&&!['progress','available'].includes(skState(s,S.skills))){slidePeek=true;render()}},s.notes));
  S.nodes.filter(n=>!n.archived).forEach(n=>add(n.label,nodeIcon(n),n.kind==='project'?'Project':'Mind Web',()=>{go('web');if(window.selectNode)selectNode(n.id)},n.notes));
  S.notes.forEach(n=>add(n.title,'📝','Note',()=>editNote(n.id),n.body));
  (S.clips||[]).forEach(c=>add(c.name,'✂','Campaign',()=>{if(typeof clipSel!=='undefined')clipSel=c.id;go('clips')},c.host));
  return out}
function findSearch(q){const words=q.toLowerCase().split(/\s+/).filter(Boolean);const all=findItems();
  if(!words.length)return all.filter(x=>x.k==='Page');
  const rank=x=>{const t=x.t.toLowerCase();return (t.startsWith(words[0])?0:t.includes(words[0])?1:2)+(x.k==='Page'?-0.5:0)+(x.k==='Done task'?1:0)};
  return all.filter(x=>words.every(w=>x.s.includes(w))).sort((a,b)=>rank(a)-rank(b)).slice(0,14)}
function openFind(){let res=[],sel=0;
  const draw=d=>{const q=$('#fdQ',d).value;res=findSearch(q);sel=Math.min(sel,Math.max(0,res.length-1));
    $('#fdR',d).innerHTML=res.length?res.map((x,i)=>`<button type="button" class="fd-it ${i===sel?'on':''}" role="option" aria-selected="${i===sel}" data-fd="${i}"><span class="fd-ic" aria-hidden="true">${x.ic}</span><span class="fd-t">${esc(x.t)}</span><span class="tag">${x.k}</span></button>`).join('')
      :`<div class="tiny mute" style="padding:10px">Nothing matches “${esc(q)}”.</div>`;
    $$('[data-fd]',d).forEach(b=>b.onclick=()=>pick(d,+b.dataset.fd))};
  const pick=(d,i)=>{const x=res[i];if(!x)return;d.close();x.run()};
  modal('🔍 Find anything',`<input id="fdQ" placeholder="Type a page, task, skill, idea or note" autocomplete="off" aria-label="Search" aria-controls="fdR"><div id="fdR" class="fd-list" role="listbox" aria-label="Results"></div><p class="tiny mute" style="margin-top:6px">↑ ↓ to move · Enter to open · press / or Ctrl+K any time to open this.</p>`,[],{onOpen:d=>{
    const i=$('#fdQ',d);draw(d);i.oninput=()=>{sel=0;draw(d)};
    i.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(res.length-1,sel+1);draw(d)}else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(0,sel-1);draw(d)}else if(e.key==='Enter'){e.preventDefault();pick(d,sel)}}}})}
(function findKeys(){const b=$('#findBtn');if(b)b.onclick=openFind;
  document.addEventListener('keydown',e=>{if($('#dlg').open||document.body.classList.contains('gated'))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openFind()}
    else if(e.key==='/'&&!e.target.matches('input,textarea,select,[contenteditable]')){e.preventDefault();openFind()}})})();
