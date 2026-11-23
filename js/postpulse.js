'use strict';
/* ===== 📤 Posted today — Clip Farmer → Duo =====
   Clip Farmer (on the PC) reports every clip that goes up: Sun taps the platform under the clip in Telegram, or the
   poster bot uploads it. Duo only reads the tally through duo_post_progress (members of this workspace only) and shows
   how many clips are up today against the daily goal, per platform, and the last 7 days. It never posts anything. */
const PP_PLAT=[['tiktok','TikTok','♪'],['youtube','YouTube','▶'],['instagram','Instagram','◎'],['x','X','𝕏']];
const PP={posts:null,at:0,err:'',busy:false};
const ppGoal=()=>Math.max(1,Math.min(10,+((S.meta||{}).postGoal)||2));
const ppTz=()=>(S.workspace&&S.workspace.tz)||Intl.DateTimeFormat().resolvedOptions().timeZone;
function ppDay(t){try{return new Date(t).toLocaleDateString('en-CA',{timeZone:ppTz()})}catch(e){return new Date(t).toISOString().slice(0,10)}}
async function ppLoad(force){
  if(PP.busy||!LOCAL.roomId||!(typeof Auth!=='undefined'&&Auth.signedIn))return;
  if(!force&&PP.posts&&Date.now()-PP.at<60000)return;
  PP.busy=true;
  try{const tok=await Auth.token();
    const r=await fetchT(`${SYNC_CFG.url}/rest/v1/rpc/duo_post_progress`,{method:'POST',
      headers:{'Content-Type':'application/json',apikey:SYNC_CFG.key,Authorization:`Bearer ${tok}`},body:JSON.stringify({p_room:LOCAL.roomId,p_days:14})});
    const j=await r.json().catch(()=>({}));if(!r.ok||j.error)throw new Error(j.error||`Server answered ${r.status}`);
    PP.posts=j.posts||[];PP.err=''}
  catch(e){PP.err=e.message}
  finally{PP.at=Date.now();PP.busy=false;ppPaint()}}
/* tally: a clip counts once a day however many apps it went up on; platforms are counted separately */
function ppStats(){const posts=PP.posts||[],today=ppDay(Date.now()),goal=ppGoal();
  const byDay=new Map();posts.forEach(p=>{const d=ppDay(p.at);if(!byDay.has(d))byDay.set(d,new Set());byDay.get(d).add(p.clip)});
  const todays=posts.filter(p=>ppDay(p.at)===today);const plat={};todays.forEach(p=>plat[p.platform]=(plat[p.platform]||0)+1);
  const week=[];for(let i=6;i>=0;i--){const t=Date.now()-i*864e5;const d=ppDay(t);
    week.push({d,n:(byDay.get(d)||new Set()).size,lbl:new Date(t).toLocaleDateString('en-US',{weekday:'short',timeZone:ppTz()}).slice(0,2)})}
  let streak=0;for(let i=week.length-1;i>=0;i--){if(week[i].n>=goal)streak++;else if(i===week.length-1)continue;else break}
  const last=todays[0]&&new Date(todays[0].at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
  return {n:(byDay.get(today)||new Set()).size,goal,plat,week,streak,last,auto:todays.filter(p=>p.via==='auto').length}}
function ppInner(){
  if(!LOCAL.roomId||!(typeof Auth!=='undefined'&&Auth.signedIn))return `<p class="small mute">Sign in to a shared workspace to see today's posts.</p>`;
  if(!PP.posts)return PP.err?`<p class="small mute">⚠ ${esc(PP.err)}</p><button class="btn s" data-pp-r>↻ Try again</button>`:`<p class="small mute">Loading today's posts…</p>`;
  const s=ppStats(),met=s.n>=s.goal,pct=Math.min(100,Math.round(s.n/s.goal*100));
  return `<div class="pp-top"><div class="pp-num${met?' met':''}"><b>${s.n}</b><span>/${s.goal}</span></div>
     <div class="pp-say"><b>${met?(s.n>s.goal?'Goal beaten':'Goal met')+' for today ✔':s.n?`${s.goal-s.n} more to go today`:'Nothing posted yet today'}</b>
      <div class="tiny mute">${s.n===1?'1 clip':`${s.n} clips`} up${s.last?` · last at ${esc(s.last)}`:''}${s.auto?` · ${s.auto} by the poster bot`:''}</div></div></div>
   <div class="ag-prog pp-prog"><i style="width:${pct}%"></i></div>
   <div class="pp-plat">${PP_PLAT.map(([k,n,ic])=>`<span class="pp-chip${s.plat[k]?' on':''}" title="${n}: ${s.plat[k]||0} today"><i aria-hidden="true">${ic}</i>${n}${s.plat[k]?` <b>${s.plat[k]}</b>`:''}</span>`).join('')}</div>
   <div class="pp-week" aria-label="Last 7 days">${s.week.map((w,i)=>`<div class="pp-day${w.n>=s.goal?' met':w.n?' part':''}${i===6?' now':''}" title="${w.d}: ${w.n}/${s.goal}"><i>${w.n>=s.goal?'✔':w.n||''}</i><span>${w.lbl}</span></div>`).join('')}</div>
   <div class="row small pp-foot">${s.streak?`<span class="tag">🔥 ${s.streak}-day streak</span>`:''}<span class="mute">Daily goal</span>
     <button class="btn s" data-pp-g="-1" aria-label="Lower the daily goal">−</button><b>${s.goal}</b><button class="btn s" data-pp-g="1" aria-label="Raise the daily goal">+</button>
     <span class="sp"></span><button class="btn s" data-pp-r title="Refresh">↻</button></div>`}
function ppCardHTML(){return `<div class="card pp-card" data-pp><h3>📤 Posted today</h3><div data-pp-in>${ppInner()}</div>
  <div class="tiny mute" style="margin-top:6px">From Clip Farmer: tap the app under a clip in Telegram once it's up. Counts each clip once, whatever apps it went to.</div></div>`}
function ppPaint(){$$('[data-pp]').forEach(card=>{const box=$('[data-pp-in]',card);if(!box)return;box.innerHTML=ppInner();
  $$('[data-pp-g]',box).forEach(b=>b.onclick=()=>{const g=Math.max(1,Math.min(10,ppGoal()+(+b.dataset.ppG)));commit(s=>{s.meta=s.meta||{};s.meta.postGoal=g},`Daily posting goal: ${g}`)});
  $$('[data-pp-r]',box).forEach(b=>b.onclick=()=>{PP.posts=PP.posts||null;ppLoad(true)})})}
function ppWire(){ppPaint();ppLoad()}
setInterval(()=>{if(!document.hidden&&document.querySelector('[data-pp]'))ppLoad(true)},60000);
window.addEventListener('focus',()=>{if(document.querySelector('[data-pp]'))ppLoad()});
