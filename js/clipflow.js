'use strict';
/* ===== Clipping 5–8 + Post & Submit =====
   5 rights checklist per clip · 6 hook/caption/format library · 7 import from UGC Studio Clip Lab · 8 earnings feed
   Post & Submit: one clip at a time — copy caption, open the platform, paste the posted link, submit to the campaign, next.
   Nothing is posted or submitted automatically: the app opens pages and copies text; you press post/submit yourself. */
const RIGHTS=[['creator','Creator / campaign permission'],['thirdParty','Game, music & other third-party content'],['platform','Platform rules & disclosure']];
const RIGHT_STATES=[['unchecked','○ Not checked'],['ok','✔ OK'],['issue','⚠ Issue']];
const rightsOK=i=>RIGHTS.every(([k])=>(i.rights||{})[k]==='ok');
const rightsSummary=i=>{const r=i.rights||{};const ok=RIGHTS.filter(([k])=>r[k]==='ok').length,iss=RIGHTS.some(([k])=>r[k]==='issue');return iss?'<span class="tag warn">⚠ rights issue</span>':`<span class="tag ${ok===RIGHTS.length?'':'warn'}">${ok===RIGHTS.length?'✔ rights OK':`rights ${ok}/${RIGHTS.length}`}</span>`};
const PLATFORMS=[['tiktok','TikTok','https://www.tiktok.com/upload',/tiktok\.com/i],['youtube','YouTube Shorts','https://www.youtube.com/upload',/youtu\.?be/i],['instagram','Instagram Reels','https://www.instagram.com/',/instagram\.com/i],['x','X','https://x.com/compose/post',/(?:^|\.)x\.com|twitter\.com/i],['facebook','Facebook Reels','https://www.facebook.com/reels/create',/facebook\.com|fb\.watch/i]];
const detectPlatform=url=>(PLATFORMS.find(p=>p[3].test(url||''))||[])[0]||'';
const CAMPAIGN_HOSTS=['Content Rewards','Whop','Vyro','Clipping agency / Discord','Direct with creator','Other'];

/* ----- 5: rights checklist (rendered inside the clip card) ----- */
function rightsHTML(i){const r=i.rights||{};return `<h3 style="margin:14px 0 4px">Rights checklist</h3><p class="tiny mute">All three must be ✔ before a clip can move to Submitted.</p>
  ${RIGHTS.map(([k,l])=>`<div class="row small"><span style="flex:1">${l}</span><select data-right="${k}" style="width:auto" aria-label="${l}">${RIGHT_STATES.map(([v,t])=>`<option value="${v}" ${(r[k]||'unchecked')===v?'selected':''}>${t}</option>`).join('')}</select></div>`).join('')}`}
const readRights=()=>Object.fromEntries($$('[data-right]').map(s=>[s.dataset.right,s.value]));
function guardSubmit(i,stage){if(['submitted','paid'].includes(stage)&&!rightsOK(i)){modal('Rights check needed',`<p>Before submitting <b>${esc(i.hook||'this clip')}</b>, mark all three rights checks ✔ OK on the clip card:</p><ul class="small">${RIGHTS.map(([k,l])=>`<li>${l}: ${(RIGHT_STATES.find(s=>s[0]===((i.rights||{})[k]||'unchecked'))||[])[1]}</li>`).join('')}</ul>`,[]);return false}return true}

/* ----- 6: library ----- */
const libOf=()=>S.library||[];
function libraryDatalists(){const list=k=>libOf().filter(x=>x.kind===k).map(x=>`<option value="${esc(x.text)}">`).join('');return `<datalist id="libHook">${list('hook')}</datalist><datalist id="libCap">${list('caption')}</datalist><datalist id="libFmt">${list('format')}</datalist>`}
function saveToLibrary(kind,text,creator){text=(text||'').trim();if(!text)return toast('Nothing to save');if(libOf().some(x=>x.kind===kind&&x.text===text))return toast('Already in the library');
  commit(s=>{s.library=[...(s.library||[]),{id:uid(),kind,text,creator:creator||'',tags:'',by:me(),at:Date.now()}]},`Saved ${kind} to library`,`saved a ${kind} to the clip library`)}
function libraryHTML(){const groups=[['hook','🎣 Hooks'],['caption','💬 Captions'],['format','🎞 Formats']];const perf=libPerformance();
  return `<div class="grid g3">${groups.map(([k,l])=>`<div class="card"><h3>${l}</h3>${libOf().filter(x=>x.kind===k).map(x=>{const p=perf.get(k+'|'+x.text);return `<div class="task" style="cursor:default"><div class="t-body" style="cursor:default"><div class="t-title" style="white-space:pre-wrap">${esc(x.text)}</div><div class="row tiny" style="gap:4px">${x.creator?`<span class="tag">${esc(x.creator)}</span>`:''}${p?`<span class="tag">${p.n} clip${p.n>1?'s':''} · ${p.views.toLocaleString()} views${p.paid?` · ${fmt$(p.paid)}`:''}</span>`:'<span class="tiny mute">not used yet</span>'}</div></div><button class="btn s ghost" data-libcopy="${x.id}" aria-label="Copy">⧉</button><button class="btn s ghost d" data-libdel="${x.id}" aria-label="Delete">✕</button></div>`}).join('')||'<div class="tiny mute">Save from any clip card, or add below.</div>'}
   <form class="row libF" data-kind="${k}" style="margin-top:6px"><input placeholder="Add a ${k}…" style="flex:1" aria-label="New ${k}"><button class="btn s">Add</button></form></div>`).join('')}</div>`}
function libPerformance(){const m=new Map();clipsOf().forEach(c=>(c.items||[]).forEach(i=>{[['hook',i.hook],['caption',i.caption],['format',i.format]].forEach(([k,t])=>{if(!t)return;const key=k+'|'+t;const v=m.get(key)||{n:0,views:0,paid:0};v.n++;v.views+=+i.views||0;v.paid+=+i.paid||0;m.set(key,v)})}));return m}
function wireLibrary(el){$$('[data-libcopy]',el).forEach(b=>b.onclick=()=>copyText(libOf().find(x=>x.id===b.dataset.libcopy).text));
  $$('[data-libdel]',el).forEach(b=>b.onclick=()=>commit(s=>s.library=s.library.filter(x=>x.id!==b.dataset.libdel),'Removed — Undo available'));
  $$('.libF',el).forEach(f=>f.onsubmit=e=>{e.preventDefault();saveToLibrary(f.dataset.kind,$('input',f).value)})}

/* ----- 7: import from UGC Studio Clip Lab (or any list of timestamps) ----- */
function importClips(cid){modal('Import clips',`<p class="small">Paste or drop any of these:</p><ul class="small"><li>A UGC Studio Clip Lab analysis (the JSON with <code>suggested_clips</code>)</li><li>A list of clips — one per line: <code>1:23-1:58 Hook text</code></li><li>Export links, one per line</li></ul>
   <textarea id="imT" rows="8" placeholder='{"suggested_clips":[{"start":83,"end":118,"hook":"…"}]}'></textarea><input type="file" id="imF" accept=".json,.txt" style="margin-top:6px">
   <p class="tiny mute">Imported clips start in “💡 Moment found” so you can review them.</p>`,
  [{t:'Import',c:'p',f:()=>{const items=parseImport(val('imT'));if(!items.length){toast('Nothing recognised to import');return false}
    commit(s=>{const c=s.clips.find(x=>x.id===cid);c.items=[...(c.items||[]),...items.map(i=>({id:uid(),stage:'moment',owner:me(),notes:[],rights:{},by:me(),...i}))]},`${items.length} clips imported`,`imported ${items.length} clips into ${clipsOf().find(x=>x.id===cid).name}`)}}],
  {onOpen:d=>{const f=$('#imF',d);f.onchange=()=>{const file=f.files[0];if(file)file.text().then(t=>{$('#imT',d).value=t})}}})}
const fmtTs=s=>{s=Math.max(0,Math.round(+s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
function parseImport(text){text=(text||'').trim();if(!text)return [];
  try{const j=JSON.parse(text);const arr=Array.isArray(j)?j:(j.suggested_clips||(j.analysis&&j.analysis.suggested_clips)||j.clips||[]);const src=j.url||(j.meta&&j.meta.url)||'';
    return arr.filter(x=>x&&(x.start!=null||x.hook)).slice(0,100).map(x=>({start:typeof x.start==='number'?fmtTs(x.start):String(x.start||''),end:typeof x.end==='number'?fmtTs(x.end):String(x.end||''),hook:String(x.hook||x.opener||x.title||'').slice(0,140),notes:x.score!=null?[{by:me(),text:`Clip Lab score ${x.score}${x.reasons?' — '+[].concat(x.reasons).join(', '):''}`,at:Date.now()}]:[],source:src}))}catch(e){}
  return text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).slice(0,100).map(l=>{if(/^https?:\/\//i.test(l))return {hook:'Imported clip',export:l};
    const m=l.match(/^(\d{1,2}(?::\d{2}){1,2})\s*[-–]\s*(\d{1,2}(?::\d{2}){1,2})?\s*(.*)$/);return m?{start:m[1],end:m[2]||'',hook:m[3]||''}:{hook:l.slice(0,140)}})}

/* ----- 8: earnings feed — paid clips become income + skill-tree achievements ----- */
const CLIP_ACH=[['firstApproved','✔ First approved clip',s=>s.approved>=1,25],['tenApproved','🎬 10 approved clips',s=>s.approved>=10,50],['fiftyApproved','🎬 50 approved clips',s=>s.approved>=50,100],['firstPaid','💵 First paid clip',s=>s.paid>=1,50],['tenPaid','💵 10 paid clips',s=>s.paid>=10,100]];
function clipStats(){let approved=0,paid=0;clipsOf().forEach(c=>(c.items||[]).forEach(i=>{if(['approved','submitted','paid'].includes(i.stage))approved++;if(i.stage==='paid')paid++}));return {approved,paid}}
function clipAfter(cid,iid){const c=clipsOf().find(x=>x.id===cid);const i=c&&(c.items||[]).find(x=>x.id===iid);if(!i)return;
  if(i.stage==='paid'&&+i.paid>0&&!i.recorded){commit(s=>{s.clips.find(x=>x.id===cid).items.find(x=>x.id===iid).recorded=true});recordResult({amount:+i.paid,kind:'business',branch:c.nodeId||'',owner:i.owner,note:`Clipping payout · ${c.name} · ${i.hook||'clip'}`})}
  const st=clipStats();const fresh=CLIP_ACH.filter(([k,,test])=>test(st)&&!S.skills.some(s=>s.fromClip===k));if(!fresh.length)return;
  commit(s=>{let root=s.skills.find(x=>x.fromClip==='root');if(!root){root={id:uid(),title:'✂ Start clipping',parents:[],status:'done',owner:'both',xp:10,branch:c.nodeId||'',notes:'Added automatically',doneAt:Date.now(),fromClip:'root'};s.skills.push(root)}
    let parent=root;fresh.forEach(([k,t,,xp])=>{const sk={id:uid(),title:t,parents:[s.skills.filter(x=>x.fromClip&&x.fromClip!=='root').slice(-1)[0]?.id||parent.id],status:'done',owner:'both',xp,branch:c.nodeId||'',notes:'Added automatically from Clipping Campaigns',doneAt:Date.now(),fromClip:k};s.skills.push(sk)})},
    '🌳 '+fresh.map(f=>f[1]).join(', '),`unlocked ${fresh.map(f=>f[1]).join(', ')}`);celebrate(true)}

/* ----- Post & Submit: the fast lane ----- */
let postIdx=0;
function postQueue(){const q=[];clipsOf().forEach(c=>(c.items||[]).forEach(i=>{if(i.stage==='approved'||(i.stage==='submitted'&&!Object.values(i.posts||{}).some(Boolean)))q.push({c,i})}));return q}
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Copied')}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();toast('Copied')}}
function vPost(el){const q=postQueue();if(postIdx>=q.length)postIdx=0;const cur=q[postIdx];const shared=sessionStorage.getItem('duo-shared')||'';
  el.innerHTML=hdr('🚀 Post & Submit','One clip at a time: copy → post → paste the link → submit → next. You press “post” and “submit” yourself — nothing is published automatically.',q.length?`<span class="tag">${postIdx+1} of ${q.length}</span>`:'')+
  (shared?`<div class="banner">📥 Shared link received: <b>${esc(shared)}</b> — ${cur?'it has been added to the clip below.':'open a clip to attach it.'}</div>`:'')+
  (!cur?empty('Nothing waiting to post. Clips appear here once they reach ✔ Approved on a campaign board.')+'<div class="row" style="justify-content:center;margin-top:10px"><button class="btn" data-go="clips">Open clipping campaigns</button></div>':postCard(cur.c,cur.i));
  if(cur)wirePost(cur.c,cur.i,el,q.length)}
function postCard(c,i){const posts=i.posts||{};const caption=[i.caption,i.tags].filter(Boolean).join('\n\n');const step=Object.values(posts).some(Boolean)?3:2;
  return `<div class="grid g2"><div class="card glow"><div class="tiny mute">${esc(c.name)}${c.host?` · ${esc(c.host)}`:''}</div><h2 style="margin:4px 0 8px">${esc(i.hook||'Untitled clip')}</h2>
    <div class="row">${ownerPill(i.owner)}${rightsSummary(i)}${i.platform?`<span class="tag">${esc(i.platform)}</span>`:''}${i.start?`<span class="tag">${esc(i.start)}${i.end?'–'+esc(i.end):''}</span>`:''}</div>
    <h3 style="margin-top:14px">① Get the clip</h3><div class="row">${i.export?`<a class="btn" href="${esc(i.export)}" target="_blank" rel="noopener">⬇ Open export / download</a>`:'<span class="tiny warn">No export link on this clip — add one on the clip card.</span>'}<button class="btn s" data-copy="hook">⧉ Copy hook</button></div>
    <h3 style="margin-top:14px">② Caption</h3><textarea readonly rows="4" style="font-size:13px">${esc(caption||'(no caption yet)')}</textarea><div class="row" style="margin-top:6px"><button class="btn p" data-copy="caption">⧉ Copy caption + hashtags</button></div>
    <h3 style="margin-top:14px">③ Post it</h3><div class="row">${PLATFORMS.map(([k,l,u])=>`<a class="btn s" href="${u}" target="_blank" rel="noopener" data-plat="${k}">${posts[k]?'✔ ':''}${l} ↗</a>`).join('')}</div>
    <p class="tiny mute">Opens the platform's upload page in a new tab (or its app on your phone). Post there, then copy the post link.</p></div>
   <div class="card"><h3>④ Paste the post links</h3>${PLATFORMS.map(([k,l])=>`<label class="f" for="pl_${k}">${l}</label><div class="row"><input id="pl_${k}" data-postlink="${k}" value="${esc(posts[k]||'')}" placeholder="https://…" style="flex:1"><button class="btn s" data-paste="${k}" aria-label="Paste ${l} link">📋 Paste</button></div>`).join('')}
    <button class="btn s" id="pasteAny" style="margin-top:8px">📋 Paste any link (auto-detect platform)</button>
    <h3 style="margin-top:14px">⑤ Submit to the campaign</h3>${c.submitUrl||c.campaignUrl?`<button class="btn p" id="submitGo">⧉ Copy link & open ${esc(c.host||'campaign')} submit page ↗</button>`:'<span class="tiny warn">Add the campaign\'s submit page URL (✎ Edit campaign) for a one-click jump.</span>'}
    <div class="row" style="margin-top:16px"><button class="btn" id="postSkip">Skip</button><span class="sp"></span><button class="btn p" id="postDone">✔ Done — next clip</button></div>
    <p class="tiny mute">“Done” moves the clip to 📤 Submitted and records each posted link as a submission.</p></div></div>`}
function wirePost(c,i,el,total){const save=(patch,msg,act)=>commit(s=>Object.assign(s.clips.find(x=>x.id===c.id).items.find(x=>x.id===i.id),patch),msg,act);
  const links=()=>Object.fromEntries($$('[data-postlink]',el).map(x=>[x.dataset.postlink,x.value.trim()]));
  $$('[data-copy]',el).forEach(b=>b.onclick=()=>copyText(b.dataset.copy==='hook'?(i.hook||''):[i.caption,i.tags].filter(Boolean).join('\n\n')));
  $$('[data-postlink]',el).forEach(x=>x.onchange=()=>save({posts:links()},'Link saved'));
  $$('[data-paste]',el).forEach(b=>b.onclick=async()=>{try{const t=(await navigator.clipboard.readText()).trim();$(`#pl_${b.dataset.paste}`,el).value=t;save({posts:links()},'Pasted')}catch(e){toast('Tap the field and paste (your browser blocked clipboard access)')}});
  $('#pasteAny',el).onclick=async()=>{try{const t=(await navigator.clipboard.readText()).trim();const p=detectPlatform(t);if(!p)return toast('That doesn\'t look like a TikTok, YouTube, Instagram, X or Facebook link');$(`#pl_${p}`,el).value=t;save({posts:links()},'Added '+p+' link')}catch(e){toast('Paste into the matching field instead')}};
  if($('#submitGo',el))$('#submitGo',el).onclick=()=>{const l=Object.values(links()).filter(Boolean);if(l.length)copyText(l.join('\n'));window.open(c.submitUrl||c.campaignUrl,'_blank','noopener')};
  $('#postSkip',el).onclick=()=>{postIdx=(postIdx+1)%Math.max(1,total);render()};
  $('#postDone',el).onclick=()=>{const l=links();const posted=Object.entries(l).filter(([,v])=>v);if(!posted.length)return toast('Paste at least one post link first');if(!guardSubmit(i,'submitted'))return;
    commit(s=>{const cc=s.clips.find(x=>x.id===c.id);const it=cc.items.find(x=>x.id===i.id);it.posts=l;it.stage='submitted';posted.forEach(([p,u])=>{if(!(cc.subs||[]).some(x=>x.link===u))cc.subs=[...(cc.subs||[]),{link:u,platform:p,views:'',est:'',confirmed:'',paid:'',by:me(),item:it.id}]})},
      `Submitted ✔ ${posted.length} link${posted.length>1?'s':''}`,`posted “${i.hook||'a clip'}” to ${posted.map(p=>p[0]).join(', ')}`);sessionStorage.removeItem('duo-shared');celebrate(false);render()}}

/* Android share sheet → Duo (installed app): ?share_url / ?share_text land here */
function consumeShare(){const u=new URLSearchParams(location.search);const raw=u.get('share_url')||u.get('share_text')||'';const m=raw.match(/https?:\/\/\S+/);if(!m)return;
  history.replaceState(null,'',location.pathname+'#/post');sessionStorage.setItem('duo-shared',m[0]);
  const attach=()=>{const q=postQueue();const cur=q[postIdx];if(cur){const p=detectPlatform(m[0])||'tiktok';commit(s=>{const it=s.clips.find(x=>x.id===cur.c.id).items.find(x=>x.id===cur.i.id);it.posts={...(it.posts||{}),[p]:m[0]}},'Shared link added to '+(cur.i.hook||'clip'))}go('post')};
  const wait=setInterval(()=>{if(!document.body.classList.contains('gated')&&Sync.room){clearInterval(wait);attach()}},500)}
