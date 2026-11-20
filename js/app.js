'use strict';
/* ===== Boot: global controls, keyboard, file import, sync status ===== */
(function boot(){
  page=pageOf(location.hash.replace('#/','')).k;
  $('#menu').onclick=()=>$('#side').classList.toggle('open');
  $('#undo').onclick=undo;$('#redo').onclick=redo;
  const qaB=$('#qaBtn'),qaM=$('#qaMenu');
  const closeQA=()=>{qaM.hidden=true;qaB.setAttribute('aria-expanded','false')};
  qaB.onclick=e=>{e.stopPropagation();qaM.hidden=!qaM.hidden;qaB.setAttribute('aria-expanded',String(!qaM.hidden));if(!qaM.hidden)$('button',qaM).focus()};
  $$('[data-qk]',qaM).forEach(b=>b.onclick=()=>{closeQA();quickAdd(b.dataset.qk)});
  qaM.onkeydown=e=>{const items=$$('button',qaM);const i=items.indexOf(document.activeElement);if(e.key==='ArrowDown'){e.preventDefault();items[(i+1)%items.length].focus()}if(e.key==='ArrowUp'){e.preventDefault();items[(i-1+items.length)%items.length].focus()}if(e.key==='Escape'){closeQA();qaB.focus()}};
  document.addEventListener('click',e=>{if(!qaM.hidden&&!qaM.contains(e.target))closeQA();if(innerWidth<=860&&$('#side').classList.contains('open')&&!$('#side').contains(e.target)&&e.target!==$('#menu'))$('#side').classList.remove('open')});
  document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||$('#dlg').open)return;const mod=e.ctrlKey||e.metaKey;
    if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo()}
    else if(e.key==='n'&&!mod){e.preventDefault();qaB.click()}else if(e.key==='Escape'&&selId&&page==='web'){selId=null;render()}});
  /* backup import: button or drag a .json onto the page */
  const importFile=f=>f.text().then(t=>{let d;try{d=JSON.parse(t)}catch(err){return toast("That file isn't valid JSON")}
    if(!d||!Array.isArray(d.days)||!Array.isArray(d.nodes))return toast('Not a Duo backup file');
    modal('Load backup?',`<p>Replace the current workspace with <b>${esc(f.name)}</b>? ${Sync.room?'This also updates your partner\'s copy because sync is on.':''} Undo is available.</p>`,[{t:'Load',c:'p',f:()=>commit(s=>{Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,migrate(d))},'Loaded '+f.name,'loaded a backup file')}])});
  $('#file').onchange=e=>{const f=e.target.files[0];if(f)importFile(f);e.target.value=''};
  document.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault()});
  document.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f&&/\.json$/i.test(f.name)){e.preventDefault();importFile(f)}});
  /* status line */
  window.onSyncStatus=(st,msg)=>{const el=$('#sync');el.className='sync '+(st==='on'?'on':st==='err'?'err':'');
    el.innerHTML=`<span class="dot" aria-hidden="true"></span><span class="hide-m">${st==='on'?'Synced':st==='err'?'Sync issue':st==='connecting'?'Connecting…':storageOK?'Saved on this device':'⚠ Not saved'}</span>`;el.title=msg||(st==='off'?'Sync is off — Themes & Settings → Live sync':'')};
  window.onPersist=()=>{if(Sync.status==='off')onSyncStatus('off')};
  window.onRemoteChange=()=>{};
  persist();render();bootAuth();consumeShare();setTimeout(()=>FX.bootOut(),1100);onSyncStatus(Sync.status);
})();
