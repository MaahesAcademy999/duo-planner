'use strict';
/* ===== Onboarding, profile, themes & settings ===== */
const priv=()=>((LOCAL.private||{})[me()])||{};
const setPriv=patch=>setLocal({private:{...(LOCAL.private||{}),[me()]:{...priv(),...patch}}});

/* ----- profile form (shared by onboarding + profile page) ----- */
function avatarEditor(draft,onChange,root){
  const a=draft.avatar;const kinds=[['char','Character'],['initials','Initials'],['abstract','Abstract'],['photo','Photo']];
  const sw=(key,list)=>`<div class="swatches" role="group" aria-label="${key}">${list.map(c=>`<button type="button" style="background:${c}" aria-pressed="${a[key]===c}" data-sw="${key}" data-c="${c}" aria-label="${key} ${c}"></button>`).join('')}</div>`;
  root.innerHTML=`<div class="row" style="align-items:flex-start;gap:16px"><div style="text-align:center">${avatar(draft.id,96,draft)}<div class="tiny mute" style="margin-top:4px">Preview</div></div>
   <div style="flex:1;min-width:220px"><div class="seg" role="group" aria-label="Avatar type">${kinds.map(([k,l])=>`<button type="button" aria-pressed="${a.kind===k}" data-kind="${k}">${l}</button>`).join('')}</div>
   ${a.kind==='char'?`<label class="f">Character style (visual only)</label><div class="picker">${AV_STYLES.map(([k,l])=>`<button type="button" aria-pressed="${a.style===k}" data-style="${k}">${avatar(draft.id,44,{...draft,avatar:{...a,style:k}})}${l}</button>`).join('')}</div>
     <label class="f">Skin tone</label>${sw('skin',SKINS)}<label class="f">Hair / headwear</label>${sw('hair',HAIRS)}`:''}
   ${a.kind==='photo'?`<label class="f" for="phIn">Profile photo (resized to 128px, stored in the shared workspace)</label><input type="file" id="phIn" accept="image/*">${draft.photo?'<button type="button" class="btn s d" id="phRm" style="margin-top:6px">Remove photo</button>':''}`:''}
   <label class="f">Outfit / accent colour</label>${sw('outfit',COLORS)}<label class="f">Aura / background</label>${sw('aura',COLORS)}</div></div>`;
  $$('[data-kind]',root).forEach(b=>b.onclick=()=>{draft.avatar={...a,kind:b.dataset.kind};onChange()});
  $$('[data-style]',root).forEach(b=>b.onclick=()=>{draft.avatar={...a,style:b.dataset.style};onChange()});
  $$('[data-sw]',root).forEach(b=>b.onclick=()=>{draft.avatar={...a,[b.dataset.sw]:b.dataset.c};onChange()});
  const ph=$('#phIn',root);if(ph)ph.onchange=()=>{const f=ph.files[0];if(!f)return;if(!f.type.startsWith('image/'))return toast('Please choose an image');
    const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=128;const s=Math.min(img.width,img.height);c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,128,128);draft.photo=c.toDataURL('image/jpeg',.8);URL.revokeObjectURL(img.src);onChange()};
    img.onerror=()=>toast('Could not read that image');img.src=URL.createObjectURL(f)};
  const rm=$('#phRm',root);if(rm)rm.onclick=()=>{draft.photo='';draft.avatar={...a,kind:'char'};onChange()};
}
function identityFields(d){const pv=priv();return `
  <div class="row"><div style="flex:1;min-width:180px"><label class="f" for="pfN">Display name <span class="tag">partner sees</span></label><input id="pfN" value="${esc(d.name)}" maxlength="40"></div>
   <div style="flex:1;min-width:160px"><label class="f" for="pfU">Username (optional) <span class="tag">partner sees</span></label><input id="pfU" value="${esc(d.username)}" maxlength="30"></div></div>
  <div class="row"><div style="flex:1;min-width:160px"><label class="f" for="pfG">Gender (optional) <span class="tag">partner sees</span></label><select id="pfG">${['','Woman','Man','Non-binary','Prefer not to say','Custom…'].map(g=>`<option value="${g}" ${g===d.gender||(g==='Custom…'&&d.gender&&!['Woman','Man','Non-binary','Prefer not to say'].includes(d.gender))?'selected':''}>${g||'— skip —'}</option>`).join('')}</select>
    <input id="pfGc" placeholder="Describe your gender" value="${esc(['','Woman','Man','Non-binary','Prefer not to say'].includes(d.gender)?'':d.gender)}" style="margin-top:6px;${['','Woman','Man','Non-binary','Prefer not to say'].includes(d.gender)?'display:none':''}"></div>
   <div style="flex:1;min-width:140px"><label class="f" for="pfP">Pronouns (optional) <span class="tag">partner sees</span></label><input id="pfP" value="${esc(d.pronouns)}" placeholder="e.g. she/her, they/them" list="pronl"><datalist id="pronl"><option>she/her</option><option>he/him</option><option>they/them</option></datalist></div></div>
  <div class="row"><div style="flex:1;min-width:140px"><label class="f" for="pfZ">Zodiac sign (optional) <span class="tag">partner sees</span></label><select id="pfZ"><option value="">— skip —</option>${ZODIAC.map(z=>`<option ${z===d.zodiac?'selected':''}>${z}</option>`).join('')}</select></div>
   <div style="flex:1;min-width:160px"><label class="f" for="pfB">Birthday (optional) <span class="tag">🔒 private by default</span></label><input type="date" id="pfB" value="${esc(pv.birthday||'')}">
    <label class="row tiny" style="margin-top:4px"><input type="checkbox" id="pfBv" ${pv.birthdayVisible?'checked':''}> Show my birthday to my partner</label></div></div>
  <label class="f" for="pfBio">Short bio or personal focus (optional) <span class="tag">partner sees</span></label><textarea id="pfBio" maxlength="280">${esc(d.bio)}</textarea>
  <p class="tiny mute">Profile details are only for display. Nothing in this app assigns traits, abilities or compatibility based on gender, birthday or zodiac sign. 🔒 A private birthday is stored only on this device and is never uploaded.</p>`}
function readIdentity(d){const g=val('pfG');return {...d,name:val('pfN')||d.name,username:val('pfU'),gender:g==='Custom…'?val('pfGc'):g,pronouns:val('pfP'),zodiac:val('pfZ'),bio:val('pfBio')}}
function savePrivateBirthday(){const b=val('pfB'),v=$('#pfBv')&&$('#pfBv').checked;setPriv({birthday:b,birthdayVisible:!!v});return v&&b?b:''}
function wireGender(root){const g=$('#pfG',root);if(g)g.onchange=()=>{$('#pfGc',root).style.display=g.value==='Custom…'?'':'none'}}

/* ----- onboarding wizard ----- */
function onboarding(){
  let step=0;let d=structuredClone(prof(me()));
  const steps=['Welcome','You','Avatar','Look & feel','Preview'];
  const show=()=>{const dots=`<div class="wizard-dots">${steps.map((_,i)=>`<i class="${i===step?'on':''}"></i>`).join('')}</div>`;
    let body='';
    if(step===0)body=`<div style="text-align:center">${avatar('A',64)} ${avatar('B',64)}<h2 style="margin:12px 0 4px">Welcome to your shared command center</h2>
      <p class="mute">A quick setup — every step except your name is optional, and you can change everything later in Profile.</p>
      ${Sync.room?'':`<label class="f" style="text-align:left">Which partner are you on this device?</label>`}<div class="seg" ${Sync.room?'hidden':''}>${['A','B'].map(id=>`<button type="button" data-who="${id}" aria-pressed="${me()===id}">${esc(prof(id).name)}${prof(id).onboarded?' ✓':''}</button>`).join('')}</div></div>`;
    if(step===1)body=identityFields(d);
    if(step===2)body=`<div id="avEd"></div>`;
    if(step===3)body=themeFields(d);
    if(step===4)body=profileCard(d,true);
    modal(`Set up your profile · ${steps[step]}`,body+dots,[
      ...(step>0?[{t:'← Back',keep:true,f:()=>{capture();step--;show()}}]:[]),
      ...(step>0&&step<4?[{t:'Skip',keep:true,f:()=>{step++;show()}}]:[]),
      step<4?{t:'Next →',c:'p',keep:true,f:()=>{if(step===1&&!val('pfN')){toast('Add a display name');return}capture();step++;show()}}
            :{t:'Save profile',c:'p',f:()=>{const pub=d.__bday||'';delete d.__bday;commit(s=>{const i=s.partners.findIndex(p=>p.id===me());s.partners[i]={...d,birthdayPublic:pub,onboarded:true}},`Welcome, ${d.name}!`,'set up their profile');celebrate(true)}}],
      {noCancel:true,onOpen:root=>{
        $$('[data-who]',root).forEach(b=>b.onclick=()=>{setLocal({me:b.dataset.who});d=structuredClone(prof(me()));applyTheme();show()});
        wireGender(root);if(step===2)avatarEditor(d,()=>show(),$('#avEd',root));if(step===3)wireThemeFields(d,root,()=>{applyTheme(d);show()});}});
  };
  const capture=()=>{if(step===1){d=readIdentity(d);d.__bday=savePrivateBirthday()}};
  show();$('#dlg').addEventListener('close',()=>applyTheme(),{once:true});
}

/* ----- theme fields (preview applies live; Cancel restores) ----- */
function themeFields(d){return `<p class="small mute">🎨 <b>Personal theme</b> — changes only your view. Your partner keeps their own.</p>
  ${[...new Set(THEMES.map(t=>t.g))].map(g=>`<div class="navgrp" style="margin:12px 0 6px">${g}</div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">${THEMES.filter(t=>t.g===g).map(t=>`<button type="button" class="themecard" data-theme-pick="${t.id}" aria-pressed="${d.theme===t.id}" title="${t.d}"><div class="pv" style="background:radial-gradient(circle at 85% 15%,${t.sw[2]}55,transparent 55%),linear-gradient(135deg,${t.sw[3]},${t.sw[0]} 70%)">${t.sw.slice(1,3).map((c,i)=>`<i style="background:${c};width:${[40,26][i]}px;box-shadow:0 0 10px ${c}"></i>`).join('')}</div><div class="nm">${t.name}<div class="tiny mute" style="font-weight:400">${t.d}</div></div></button>`).join('')}</div>`).join('')}
  <label class="f">Accent colour</label><div class="swatches">${ACCENTS.map(c=>`<button type="button" data-acc="${c}" aria-pressed="${(d.accent||'')===c}" style="background:${c||'conic-gradient(var(--acc),var(--acc2),var(--acc3))'}" aria-label="${c||'Theme default'}" title="${c||'Theme default'}"></button>`).join('')}</div>
  <label class="f">Motion</label><div class="seg">${[['full','✦ Full'],['calm','◐ Calm'],['off','○ Off']].map(([k,l])=>`<button type="button" data-motion-pick="${k}" aria-pressed="${normMotion(d.motion)===k}">${l}</button>`).join('')}</div>
  <label class="row small" style="margin-top:10px"><input type="checkbox" id="simpleM" ${d.simple?'checked':''}> Simple mode — fewer glows, blurs and background effects</label>
  <label class="row small"><input type="checkbox" id="celebM" ${d.celebrate?'checked':''}> Celebrations when tasks & milestones are completed</label>`}
function wireThemeFields(d,root,onChange){
  $$('[data-theme-pick]',root).forEach(b=>b.onclick=()=>{d.theme=b.dataset.themePick;onChange()});
  $$('[data-acc]',root).forEach(b=>b.onclick=()=>{d.accent=b.dataset.acc;onChange()});
  $$('[data-motion-pick]',root).forEach(b=>b.onclick=()=>{d.motion=b.dataset.motionPick;onChange()});
  const sm=$('#simpleM',root);if(sm)sm.onchange=()=>{d.simple=sm.checked;onChange()};
  const ce=$('#celebM',root);if(ce)ce.onchange=()=>{d.celebrate=ce.checked};
}

/* ----- profile card ----- */
function profileCard(p,preview){const isMe=p.id===me();const bday=isMe?priv().birthday:'';const shownB=p.birthdayPublic;
  return `<div class="card ${preview?'glow':''}" style="text-align:center">${preview?'<div class="tiny mute" style="margin-bottom:8px">This is how your partner will see you</div>':''}${avatar(p.id,88,p)}
   <h2 style="justify-content:center;margin:10px 0 0">${esc(p.name)}</h2>${p.username?`<div class="small mute">@${esc(p.username)}</div>`:''}
   <div class="row" style="justify-content:center;margin:6px 0">${p.pronouns?`<span class="tag">${esc(p.pronouns)}</span>`:''}${p.gender?`<span class="tag">${esc(p.gender)}</span>`:''}${p.zodiac?`<span class="tag">✦ ${esc(p.zodiac)}</span>`:''}${shownB?`<span class="tag">🎂 ${esc(shownB)}</span>`:''}</div>
   ${p.bio?`<p class="small" style="white-space:pre-wrap">${esc(p.bio)}</p>`:''}${p.working?`<div class="small">🛰 Working on <b>${esc(p.working)}</b></div>`:''}
   ${isMe&&bday&&!shownB?`<div class="tiny mute" style="margin-top:6px">🔒 Your birthday (${esc(bday)}) is private — only on this device</div>`:''}</div>`}

/* ----- Profile page ----- */
function vProfile(el){const p=prof(me()),q=prof(partnerId());
  el.innerHTML=hdr('👤 Profile','Edit how you appear. Fields tagged “partner sees” are shared; 🔒 private ones stay on this device.')+
  `<div class="grid g2"><div class="card"><h3>Your profile</h3><div id="avEdP"></div><div id="idF">${identityFields(p)}</div>
     <div class="row" style="margin-top:12px"><button class="btn p" id="pfSave">Save profile</button><button class="btn" id="pfClear">Remove optional info</button><button class="btn" id="pfWiz">Re-run setup</button></div></div>
   <div class="col"><div>${profileCard(p,true)}</div><div class="card"><h3>Your partner</h3>${profileCard(q)}</div></div></div>`;
  const draft=structuredClone(p);const redrawAv=()=>{avatarEditor(draft,redrawAv,$('#avEdP'))};redrawAv();wireGender(el);
  $('#pfSave').onclick=()=>{if(!val('pfN'))return toast('Display name is required');const pub=savePrivateBirthday();const nd=readIdentity(draft);
    commit(s=>{const i=s.partners.findIndex(x=>x.id===me());s.partners[i]={...s.partners[i],...nd,avatar:draft.avatar,photo:draft.photo,birthdayPublic:pub}},'Profile saved','updated their profile')};
  $('#pfClear').onclick=()=>modal('Remove optional information?','<p>Clears username, gender, pronouns, zodiac, bio, birthday and photo. Your name and avatar stay.</p>',[{t:'Remove',c:'d',f:()=>{setPriv({birthday:'',birthdayVisible:false});commit(s=>{const x=s.partners.find(y=>y.id===me());Object.assign(x,{username:'',gender:'',pronouns:'',zodiac:'',bio:'',photo:'',birthdayPublic:''});if(x.avatar.kind==='photo')x.avatar.kind='char'},'Optional info removed')}}]);
  $('#pfWiz').onclick=()=>onboarding();
}

/* ----- Themes & Settings ----- */
function vSettings(el){const p=prof(me());const d=structuredClone(p);
  el.innerHTML=hdr('🎨 Themes & Settings')+
  `<div class="grid g2"><div class="card"><h3>Theme Center</h3><div id="thF">${themeFields(d)}</div>
     <div class="row" style="margin-top:12px"><button class="btn p" id="thApply">Apply theme</button><button class="btn" id="thCancel">Cancel preview</button><button class="btn" id="thReset">Restore default</button></div>
     <p class="tiny mute">Clicking a theme previews it instantly. “Apply” saves it to your profile (it follows you on any device in this workspace).</p></div>
   <div class="col"><div class="card"><h3>🔐 Account & sync</h3>
     <div class="small">Signed in as <b>${esc((Auth.user||{}).email||'')}</b> · you are partner ${esc(me())}</div>
     <div class="sync ${Sync.status==='on'?'on':Sync.status==='err'?'err':''}" style="margin:6px 0"><span class="dot"></span>${Sync.status==='on'?'Synced — only you and your partner can open this workspace':Sync.status==='err'?'Connection problem — will keep retrying':'Connecting…'}</div>
     <div class="row"><button class="btn s" id="invNew">👥 Invite partner (new code)</button><button class="btn s" id="wsSwitch">⇄ Switch / join workspace</button></div>
     <div id="invOut"></div>
     <label class="f">Change password</label><form id="pwF" class="row"><input id="pw1" type="password" minlength="8" placeholder="New password (8+ characters)" autocomplete="new-password" style="flex:1" aria-label="New password"><button class="btn s">Update</button></form>
     <div class="row" style="margin-top:10px"><button class="btn s d" id="signOut">Sign out on this device</button></div>
     <p class="tiny mute">Access is checked by the server on every request. Invite codes let one person claim the open partner slot; making a new code cancels the old one.</p></div>
    <div class="card"><h3>Workspace</h3><label class="f" for="wsN">Workspace name</label><input id="wsN" value="${esc(S.workspace.name)}">
     <label class="f" for="tzI">Timezone for times</label><input id="tzI" value="${esc(S.tz)}">
     <p class="tiny mute">Calendar: app-only. External calendar sync is not connected. Multiple workspaces: data is already isolated per workspace code — switching between several codes on one device is planned.</p>
     <button class="btn s" id="wsSave" style="margin-top:8px">Save workspace</button></div>
    <div class="card"><h3>Data</h3><div class="row"><button class="btn s" id="exp">⬇ Save backup file</button><button class="btn s" id="imp">⬆ Load backup file</button><button class="btn s d" id="rst">Reset to starting template</button></div>
     <p class="tiny mute">You can also drag a backup .json file onto the page.</p></div></div></div>`;
  const thRoot=$('#thF');const redraw=()=>{applyTheme(d);thRoot.innerHTML=themeFields(d);wireThemeFields(d,thRoot,redraw)};wireThemeFields(d,thRoot,redraw);
  $('#thApply').onclick=()=>commit(s=>{Object.assign(s.partners.find(x=>x.id===me()),{theme:d.theme,accent:d.accent,motion:d.motion,simple:d.simple,celebrate:d.celebrate})},'Theme applied');
  $('#thCancel').onclick=()=>render();
  $('#thReset').onclick=()=>commit(s=>{Object.assign(s.partners.find(x=>x.id===me()),{theme:'emerald',accent:'',motion:'full',simple:false})},'Default theme restored');
  $('#wsSave').onclick=()=>commit(s=>{s.workspace={...s.workspace,name:val('wsN')||s.workspace.name};s.tz=val('tzI')||s.tz},'Workspace saved');
  $('#exp').onclick=exportFile;$('#imp').onclick=()=>$('#file').click();
  $('#rst').onclick=()=>modal('Reset everything?','<p>Replaces all days, tasks, notes, Mind Web edits and proposals with the starting template — for both partners if sync is on. Save a backup first. Undo is available right after.</p>',[{t:'Reset',c:'d',f:()=>commit(s=>{const keep=s.partners;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,seed(),{partners:keep})},'Reset','reset the workspace')}]);
  $('#invNew').onclick=async()=>{try{const c=await Sync.invite();$('#invOut').innerHTML=`<label class="f">Invite code — share only with your partner</label><div class="row"><input id="rc" readonly value="${esc(c)}" style="flex:1;font-family:monospace"><button class="btn s" id="rcCopy">Copy</button></div>`;$('#rcCopy').onclick=()=>navigator.clipboard.writeText(c).then(()=>toast('Code copied'),()=>{$('#rc').select();toast('Press Ctrl+C to copy')})}catch(e){toast(e.message)}};
  $('#wsSwitch').onclick=async()=>{try{workspaceScreen(await Sync.myRooms())}catch(e){toast(e.message)}};
  $('#pwF').onsubmit=async e=>{e.preventDefault();const pw=val('pw1');if(pw.length<8)return toast('Use at least 8 characters');try{await Auth.setPassword(pw);toast('Password updated');$('#pw1').value=''}catch(err){toast(err.message)}};
  $('#signOut').onclick=()=>modal('Sign out?','<p>This device stops syncing until you sign in again. Your workspace stays safe on the server.</p>',[{t:'Sign out',c:'d',f:async()=>{Sync.close();await Auth.signOut();authScreen('in')}}]);
}
function exportFile(){const b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`duo-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Backup saved')}
