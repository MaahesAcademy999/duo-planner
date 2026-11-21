/* Service worker: makes Duo installable, keeps the app shell available offline, and shows phone reminders.
   Network-first for everything (so updates show immediately); never caches Supabase API calls. */
const CACHE='duo-shell-v5';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return; /* API & other sites: straight to network */
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('./index.html'))))});

/* ----- phone reminders (sent by the duo-reminders Edge Function) ----- */
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(err){d={body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'Duo',{body:d.body||'',icon:'icon-192.png',badge:'badge-96.png',tag:d.tag||undefined,renotify:!!d.tag,data:{url:d.url||'./#/dash'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=new URL((e.notification.data&&e.notification.data.url)||'./#/dash',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{const c=list.find(w=>w.url.startsWith(self.registration.scope));
    if(c){return c.focus().then(w=>(w||c).navigate?(w||c).navigate(url):null).catch(()=>self.clients.openWindow(url))}return self.clients.openWindow(url)}))});
