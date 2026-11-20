'use strict';
/* ===== Live sync — signed-in accounts only =====
   Every call carries the user's access token; the database checks workspace membership (duo_members) on each request,
   so a workspace is reachable only by its two signed-in partners. Invite codes are single-slot and can be rotated. */
const SYNC_CFG={url:'https://cwtloacfsvyjemywmotl.supabase.co',key:'sb_publishable_FYDw9rFddFv0cUd7-Kqceg_rjBkrZOe'/* public by design; RLS blocks tables, RPCs check membership */};
const Sync=(()=>{
  let rev=0,timer=null,pushT=null,busy=false,status='off',lastOk=0,pending=false;
  const room=()=>LOCAL.roomId||'';
  async function rpc(fn,body){const tok=await Auth.token();
    const r=await fetch(`${SYNC_CFG.url}/rest/v1/rpc/${fn}`,{method:'POST',headers:{'Content-Type':'application/json',apikey:SYNC_CFG.key,Authorization:`Bearer ${tok}`},body:JSON.stringify(body||{})});
    if(r.status===401){await Auth.refresh();return rpc(fn,body)}
    if(!r.ok)throw new Error(`${fn} failed (${r.status})`);return r.json()}
  function set(st,msg){status=st;if(window.onSyncStatus)onSyncStatus(st,msg)}
  const busyUI=()=>{const d=$('#dlg');return (d&&d.open)||window.__dragging};
  function applyRemote(data,r){rev=r;const merged=mergeState(S,migrate(data));const changed=JSON.stringify(merged)!==JSON.stringify(S);S=merged;persist();
    if(changed){if(busyUI())pending=true;else render()}}
  async function pull(){if(!room()||busy||!Auth.signedIn)return;busy=true;
    try{const res=await rpc('duo_get_auth',{p_room:room()});if(res.error){set('err',res.error);return}
      if(res.slot&&LOCAL.me!==res.slot)setLocal({me:res.slot});if(res.rev!==rev)applyRemote(res.data,res.rev);lastOk=Date.now();set('on');if(pending&&!busyUI()){pending=false;render()}}
    catch(e){set('err',e.message)}finally{busy=false}}
  async function push(){if(!room())return;if(busy){schedule();return}busy=true;
    try{for(let i=0;i<3;i++){const res=await rpc('duo_put_auth',{p_room:room(),p_data:S,p_rev:rev});if(res.error){set('err',res.error);return}
        if(res.ok){rev=res.rev;lastOk=Date.now();set('on');republish();return}applyRemote(res.data,res.rev)}set('err','Could not save after 3 tries')}
    catch(e){set('err',e.message)}finally{busy=false}}
  function schedule(){if(!room())return;clearTimeout(pushT);pushT=setTimeout(push,500)}
  function start(){stop();if(!room()){set('off');return}set('connecting');pull();timer=setInterval(()=>{if(!document.hidden)pull()},4000)}
  function stop(){clearInterval(timer);timer=null}
  const myRooms=()=>rpc('duo_my_rooms');
  /* open a workspace: the server copy replaces this device's copy (seed IDs differ per device) */
  async function open(id){const res=await rpc('duo_get_auth',{p_room:id});if(res.error)throw new Error(res.error);
    if(LOCAL.roomId!==id)past.length=0;setLocal({roomId:id,me:res.slot||LOCAL.me});rev=res.rev;S=migrate(res.data);persist();render();start()}
  async function createAuth(name,slot){S.workspace={...S.workspace,name};const res=await rpc('duo_create_auth',{p_name:name,p_data:S,p_slot:slot});if(res.error)throw new Error(res.error);
    setLocal({roomId:res.id,me:slot});rev=res.rev;persist();render();start();return res.code}
  async function joinAuth(code){const res=await rpc('duo_join_auth',{p_code:String(code||'').trim()});if(res.error)throw new Error(res.error);await open(res.id);return res}
  async function invite(){const res=await rpc('duo_invite_code',{p_room:room()});if(res.error)throw new Error(res.error);return res.code}
  async function publish(snap,enabled){if(!room())throw new Error('Open a shared workspace first');const res=await rpc('duo_publish_auth',{p_room:room(),p_enabled:!!enabled,p_data:snap});if(res.error)throw new Error(res.error);return res.slug}
  let pubT=null;function republish(){if(!room()||!S.showcase||!S.showcase.public||typeof showcaseSnapshot!=='function')return;clearTimeout(pubT);pubT=setTimeout(()=>publish(showcaseSnapshot(),true).catch(()=>{}),3000)}
  function close(){stop();setLocal({roomId:''});rev=0;set('off')}
  window.addEventListener('focus',()=>{if(room())pull()});
  return {start,schedule,pull,open,createAuth,joinAuth,invite,publish,myRooms,close,get status(){return status},get room(){return room()},flushPending(){if(pending){pending=false;render()}}};
})();
window.Sync=Sync;
