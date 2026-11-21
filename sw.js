/* Service worker: makes Duo installable, keeps the app shell available offline, and shows phone reminders.
   Fast start: versioned files (css/js ?v=…) never change once published, so they come straight from the cache
   and only hit the network the first time. Everything else (index.html, icons, manifest) tries the network for
   up to 3 seconds, then falls back to the cached copy and refreshes it in the background, so a slow or flaky
   connection can no longer hold the loading screen. Never caches Supabase API calls. */
const CACHE='duo-shell-v7';
const NET_WAIT=3000;
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&!k.startsWith('duo-shell-')).map(k=>caches.delete(k))))
  /* carry the old shell over so the first start after this update is still instant, then drop the old caches */
  .then(()=>caches.keys()).then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(async k=>{const old=await caches.open(k),cur=await caches.open(CACHE);
    for(const req of await old.keys()){if(!(await cur.match(req))){const r=await old.match(req);if(r)await cur.put(req,r)}}await caches.delete(k)})))
  .catch(()=>{}).then(()=>self.clients.claim()))});
function save(req,r){if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{})}return r}
self.addEventListener('fetch',e=>{const req=e.request,u=new URL(req.url);
  if(req.method!=='GET'||u.origin!==location.origin)return; /* API & other sites: straight to network */
  if(u.searchParams.has('v')){ /* versioned asset: cache first */
    e.respondWith(caches.match(req).then(m=>m||fetch(req).then(r=>save(req,r))));return}
  /* network first, but give up waiting after NET_WAIT and use the cache (the network answer still refreshes it) */
  const net=fetch(req).then(r=>save(req,r));
  e.respondWith(new Promise(resolve=>{let done=false;const fin=r=>{if(!done&&r){done=true;resolve(r)}};
    const fallback=()=>caches.match(req).then(m=>m||(req.mode==='navigate'?caches.match('./index.html').then(x=>x||caches.match('./')):null));
    const t=setTimeout(()=>fallback().then(fin),NET_WAIT);
    net.then(r=>{clearTimeout(t);fin(r)},()=>{clearTimeout(t);fallback().then(m=>fin(m||Response.error()))});}));
  e.waitUntil(net.catch(()=>{}))});

/* ----- phone reminders (sent by the duo-reminders Edge Function) ----- */
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(err){d={body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'Duo',{body:d.body||'',icon:'icon-192.png',badge:'badge-96.png',tag:d.tag||undefined,renotify:!!d.tag,data:{url:d.url||'./#/dash'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=new URL((e.notification.data&&e.notification.data.url)||'./#/dash',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{const c=list.find(w=>w.url.startsWith(self.registration.scope));
    if(c){return c.focus().then(w=>(w||c).navigate?(w||c).navigate(url):null).catch(()=>self.clients.openWindow(url))}return self.clients.openWindow(url)}))});
