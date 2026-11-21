'use strict';
/* ===== Phone reminders (Web Push) =====
   This device subscribes through the service worker; the subscription is saved to the server with duo_push_save.
   The duo-reminders Edge Function sends the reminders on a schedule. No secret keys live in the app. */
const Push=(()=>{
  const FN=()=>SYNC_CFG.url+'/functions/v1/duo-reminders';
  const DEF={digest:true,digestHour:8,timed:true,before:15,checkin:true,checkinHour:20};
  const prefs=()=>({...DEF,...(LOCAL.push||{})});
  const ua=navigator.userAgent||'';
  const isIOS=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const supported=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
  async function rpc(fn,body){const tok=await Auth.token();
    const r=await fetch(`${SYNC_CFG.url}/rest/v1/rpc/${fn}`,{method:'POST',headers:{'Content-Type':'application/json',apikey:SYNC_CFG.key,Authorization:`Bearer ${tok}`},body:JSON.stringify(body)});
    if(!r.ok)throw new Error(r.status===404?'Reminders are not set up on the server yet':`Could not save reminders (${r.status})`);
    const j=await r.json();if(j&&j.error)throw new Error(j.error);return j}
  const keyBytes=b64=>{const p=b64.replace(/-/g,'+').replace(/_/g,'/');const s=atob(p+'==='.slice((p.length+3)%4));return Uint8Array.from(s,c=>c.charCodeAt(0))};
  async function current(){if(!supported())return null;const reg=await navigator.serviceWorker.getRegistration();return reg?reg.pushManager.getSubscription():null}
  async function save(sub){const j=sub.toJSON();
    await rpc('duo_push_save',{p_room:LOCAL.roomId,p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_prefs:prefs()})}
  /* must be called straight from a tap: iPhone only shows the permission prompt for a user gesture */
  async function enable(){
    if(!supported())throw new Error(isIOS&&!standalone()?'On iPhone, add Duo to your Home Screen first, then open it from there':'This browser cannot show notifications');
    if(!LOCAL.roomId)throw new Error('Open a shared workspace first');
    const perm=await Notification.requestPermission();
    if(perm!=='granted')throw new Error(perm==='denied'?'Notifications are blocked for Duo in your phone settings':'Notifications were not allowed');
    const r=await fetch(FN());const k=await r.json().catch(()=>({}));if(!r.ok||!k.publicKey)throw new Error(k.error||'Reminders are not set up on the server yet');
    const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
    if(sub&&LOCAL.pushKey&&LOCAL.pushKey!==k.publicKey){await sub.unsubscribe();sub=null}
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(k.publicKey)});
    await save(sub);setLocal({pushOn:true,pushKey:k.publicKey})}
  async function disable(){const sub=await current();if(sub){try{await rpc('duo_push_delete',{p_endpoint:sub.endpoint})}finally{await sub.unsubscribe()}}setLocal({pushOn:false})}
  async function setPrefs(p){setLocal({push:{...prefs(),...p}});const sub=await current();if(sub)await save(sub)}
  async function test(){const tok=await Auth.token();
    const r=await fetch(FN(),{method:'POST',headers:{'Content-Type':'application/json',apikey:SYNC_CFG.key,Authorization:`Bearer ${tok}`},body:JSON.stringify({test:true})});
    const j=await r.json().catch(()=>({}));if(!r.ok||!j.sent)throw new Error(j.error||'Test did not arrive at any device');return j}
  /* keep the server copy pointed at the open workspace (after switching workspaces or a browser key change) */
  async function resync(){try{if(!LOCAL.pushOn||!Auth.signedIn||!LOCAL.roomId||Notification.permission!=='granted')return;const sub=await current();if(sub)await save(sub);else setLocal({pushOn:false})}catch(e){}}
  async function state(){if(!supported())return isIOS&&!standalone()?'ios-install':'unsupported';if(Notification.permission==='denied')return 'blocked';return (await current())&&LOCAL.pushOn?'on':'off'}
  return {enable,disable,setPrefs,test,resync,state,prefs,isIOS};
})();
window.Push=Push;

/* Settings card */
async function pushCardHTML(){const st=await Push.state();const p=Push.prefs();
  const hours=Array.from({length:24},(_,h)=>`<option value="${h}" ${h===p.digestHour?'selected':''}>${h%12||12}:00 ${h<12?'AM':'PM'}</option>`).join('');
  const hours2=Array.from({length:24},(_,h)=>`<option value="${h}" ${h===p.checkinHour?'selected':''}>${h%12||12}:00 ${h<12?'AM':'PM'}</option>`).join('');
  const mins=[5,10,15,30,60].map(m=>`<option value="${m}" ${m===p.before?'selected':''}>${m} min before</option>`).join('');
  const msg={on:'✅ Reminders are on for this device.',off:'Get a notification on this phone or computer for today\'s tasks and coming deadlines, even when Duo is closed.',
    blocked:'🚫 Notifications are blocked for Duo. Allow them in your phone or browser settings for this site, then come back here.',
    'ios-install':'📱 On iPhone, reminders only work from the Home Screen app: in Safari tap Share → “Add to Home Screen”, open Duo from that icon, then come back here.',
    unsupported:'This browser can\'t show notifications. Try Chrome on Android, Safari on iPhone (from the Home Screen), or a desktop browser.'}[st];
  return `<div class="small">${msg}</div>
   ${st==='on'?`<div class="row" style="margin-top:8px"><button class="btn s" id="puTest">Send a test</button><button class="btn s d" id="puOff">Turn off on this device</button></div>
    <label class="row small" style="margin-top:10px"><input type="checkbox" id="puDig" ${p.digest?'checked':''}> Morning summary at <select id="puHr" style="width:auto" aria-label="Summary time">${hours}</select></label>
    <label class="row small"><input type="checkbox" id="puTm" ${p.timed?'checked':''}> Remind me <select id="puBf" style="width:auto" aria-label="How early">${mins}</select> a task with a time</label>
    <label class="row small"><input type="checkbox" id="puCi" ${p.checkin?'checked':''}> 🧩 Research check-in nudge at <select id="puCh" style="width:auto" aria-label="Check-in nudge time">${hours2}</select> if I haven't checked in</label>
    <p class="tiny mute">Times use the workspace timezone (${esc(S.tz)}). A task reminds you when it is on today's workday or has today's due date. The summary also lists clip and campaign deadlines for today, tomorrow and anything overdue. Only your own and shared items are included.</p>`
   :st==='off'?`<div class="row" style="margin-top:8px"><button class="btn s p" id="puOn">🔔 Turn on reminders</button></div>`:''}`}
async function wirePushCard(){const box=$('#pushCard');if(!box)return;box.innerHTML=await pushCardHTML();
  const run=async(b,fn,ok)=>{if(b)b.disabled=true;try{await fn();if(ok)toast(ok)}catch(e){toast(e.message)}wirePushCard()};
  const on=$('#puOn',box),off=$('#puOff',box),tst=$('#puTest',box);
  if(on)on.onclick=()=>run(on,Push.enable,'Reminders are on');
  if(off)off.onclick=()=>run(off,Push.disable,'Reminders turned off');
  if(tst)tst.onclick=()=>run(tst,Push.test,'Test sent — check your notifications');
  const sp=()=>Push.setPrefs({digest:$('#puDig',box).checked,digestHour:+$('#puHr',box).value,timed:$('#puTm',box).checked,before:+$('#puBf',box).value,checkin:$('#puCi',box).checked,checkinHour:+$('#puCh',box).value}).then(()=>toast('Reminder settings saved'),e=>toast(e.message));
  ['#puDig','#puHr','#puTm','#puBf','#puCi','#puCh'].forEach(s=>{const e=$(s,box);if(e)e.onchange=sp})}
