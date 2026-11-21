'use strict';
/* ===== Accounts: Supabase Auth over REST (email + password). Session lives only on this device. ===== */
const Auth=(()=>{
  const KEY='duo-auth';let sess=null;try{sess=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  const save=s=>{sess=s;try{s?localStorage.setItem(KEY,JSON.stringify(s)):localStorage.removeItem(KEY)}catch(e){}};
  const base=()=>SYNC_CFG.url+'/auth/v1';
  async function call(path,body,{method='POST',token}={}){const r=await fetchT(base()+path,{method,headers:{'Content-Type':'application/json',apikey:SYNC_CFG.key,...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
    const t=await r.text();let j={};try{j=t?JSON.parse(t):{}}catch(e){}if(!r.ok)throw new Error(friendly(j.msg||j.error_description||j.message||j.error||('Error '+r.status)));return j}
  function friendly(m){if(/invalid login/i.test(m))return 'Email or password is incorrect';if(/not confirmed/i.test(m))return 'Please confirm your email first — check your inbox';if(/already registered/i.test(m))return 'That email already has an account — sign in instead';if(/password should be/i.test(m))return 'Password must be at least 8 characters';return m}
  const keep=j=>{save({access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Math.floor(Date.now()/1000)+(j.expires_in||3600),user:{id:j.user.id,email:j.user.email}});return sess};
  async function signUp(email,password){const j=await call('/signup?redirect_to='+encodeURIComponent(location.href.split('#')[0]),{email,password});if(j.access_token)return {session:keep(j)};return {confirm:true}}
  async function signIn(email,password){return keep(await call('/token?grant_type=password',{email,password}))}
  async function refresh(){if(!sess)return null;try{return keep(await call('/token?grant_type=refresh_token',{refresh_token:sess.refresh_token}))}catch(e){if(!/reach the server|took too long/.test(e.message))save(null);throw e}}
  async function token(){if(!sess)throw new Error('Sign in first');if(sess.expires_at-60<Date.now()/1000)await refresh();return sess.access_token}
  async function signOut(){try{if(sess)await call('/logout',null,{token:sess.access_token})}catch(e){}save(null)}
  const recover=email=>call('/recover?redirect_to='+encodeURIComponent(location.href.split('#')[0]),{email});
  async function setPassword(password){return call('/user',{password},{method:'PUT',token:await token()})}
  /* email links return tokens in the URL hash (#access_token=…&type=signup|recovery) */
  function fromUrl(){const h=new URLSearchParams(location.hash.replace(/^#/,''));if(!h.get('access_token'))return null;
    save({access_token:h.get('access_token'),refresh_token:h.get('refresh_token'),expires_at:+h.get('expires_at')||Math.floor(Date.now()/1000)+3600,user:{id:'',email:''}});
    history.replaceState(null,'',location.pathname+location.search);return h.get('type')||'signup'}
  async function loadUser(){const u=await call('/user',null,{method:'GET',token:await token()});sess.user={id:u.id,email:u.email};save(sess);return sess.user}
  return {signUp,signIn,signOut,recover,setPassword,token,refresh,fromUrl,loadUser,get user(){return sess&&sess.user},get signedIn(){return !!sess}};
})();

/* ----- sign-in gate (blocks the app until signed in and a workspace is chosen) ----- */
function gate(html){const dl=$('#dlg');if(dl&&dl.open)dl.close();let g=$('#gate');if(!g){g=document.createElement('div');g.id='gate';document.body.appendChild(g)}g.innerHTML=`<div class="gate-box card glow"><div class="brand" style="justify-content:center;margin-bottom:10px"><span class="logo"></span>DUO</div>${html}</div>`;document.body.classList.add('gated');return g}
function ungate(){const g=$('#gate');if(g)g.remove();document.body.classList.remove('gated');render()}
function authScreen(mode='in',msg=''){const g=gate(`<h2 style="justify-content:center">${mode==='up'?'Create your account':mode==='reset'?'Reset password':'Sign in'}</h2>
  <p class="tiny mute" style="text-align:center">Each partner has their own account. Works on any computer, laptop, Android or iPhone.</p>${msg?`<div class="banner">${msg}</div>`:''}
  <form id="af" class="col"><label class="f" for="aE">Email</label><input id="aE" type="email" autocomplete="email" required>
   ${mode!=='reset'?`<label class="f" for="aP">Password</label><input id="aP" type="password" minlength="8" autocomplete="${mode==='up'?'new-password':'current-password'}" required>`:''}
   ${mode==='up'?'<label class="f" for="aP2">Confirm password</label><input id="aP2" type="password" minlength="8" autocomplete="new-password" required>':''}
   <button class="btn p" style="justify-content:center;margin-top:12px" id="aGo">${mode==='up'?'Create account':mode==='reset'?'Send reset link':'Sign in'}</button></form>
  <div class="row small" style="justify-content:center;margin-top:10px">${mode!=='in'?'<a href="#" data-am="in">Sign in</a>':''}${mode!=='up'?'<a href="#" data-am="up">Create account</a>':''}${mode!=='reset'?'<a href="#" data-am="reset">Forgot password?</a>':''}</div>`);
  $$('[data-am]',g).forEach(a=>a.onclick=e=>{e.preventDefault();authScreen(a.dataset.am)});$('#aE',g).focus();
  $('#af',g).onsubmit=async e=>{e.preventDefault();const b=$('#aGo',g);b.disabled=true;const email=val('aE'),pw=val('aP');
    try{if(mode==='up'){if(pw!==val('aP2'))throw new Error('Passwords do not match');const r=await Auth.signUp(email,pw);if(r.confirm)return authScreen('in','Check your email to confirm your account, then sign in here.');}
      else if(mode==='reset'){await Auth.recover(email);return authScreen('in','If that email has an account, a reset link is on its way.')}
      else await Auth.signIn(email,pw);await afterSignIn()}
    catch(err){b.disabled=false;toast(err.message);const m=$('.banner',g)||document.createElement('div');m.className='banner';m.textContent=err.message;$('#af',g).before(m)}}}
function newPasswordScreen(){const g=gate(`<h2 style="justify-content:center">Choose a new password</h2><form id="npf" class="col"><label class="f" for="np1">New password</label><input id="np1" type="password" minlength="8" autocomplete="new-password" required><label class="f" for="np2">Confirm</label><input id="np2" type="password" minlength="8" autocomplete="new-password" required><button class="btn p" style="justify-content:center;margin-top:12px">Save password</button></form>`);
  $('#npf',g).onsubmit=async e=>{e.preventDefault();if(val('np1')!==val('np2'))return toast('Passwords do not match');try{await Auth.setPassword(val('np1'));toast('Password updated');await afterSignIn()}catch(err){toast(err.message)}}}
async function afterSignIn(){let rooms=[];try{if(!Auth.user||!Auth.user.id)await Auth.loadUser();rooms=await Sync.myRooms()}
  catch(e){/* slow or offline but still signed in with a workspace on this device: keep showing local data, sync retries in the background */
    if(Auth.signedIn&&LOCAL.roomId){Sync.start();return}toast(e.message);return authScreen('in',e.message)}
  const saved=rooms.find(r=>r.id===LOCAL.roomId);if(saved){try{await Sync.open(saved.id)}catch(e){Sync.start()}return ungate()}if(rooms.length===1){await Sync.open(rooms[0].id);return ungate()}workspaceScreen(rooms)}
function workspaceScreen(rooms){const g=gate(`<h2 style="justify-content:center">Choose a workspace</h2><p class="tiny mute" style="text-align:center">Signed in as ${esc(Auth.user&&Auth.user.email)}</p>
  ${rooms.map(r=>`<button class="btn" style="width:100%;justify-content:space-between;margin:4px 0" data-room="${r.id}"><span>${esc(r.name)}</span><span class="tiny mute">you are partner ${r.slot}</span></button>`).join('')}
  <h3 style="margin-top:14px">Join your partner</h3><form id="jf" class="row"><input id="jc" placeholder="Invite code DUO-…" style="flex:1;font-family:monospace" aria-label="Invite code"><button class="btn">Join</button></form>
  <h3 style="margin-top:14px">Start a new workspace</h3><p class="tiny mute">Uses what's on this device now (your current plan, Mind Web, tasks). You'll get an invite code for your partner.</p>
  <div class="row"><input id="wn" value="${esc(S.workspace.name)}" style="flex:1" aria-label="Workspace name"><select id="ws" style="width:auto" aria-label="Your partner slot"><option value="A">I'm partner A</option><option value="B">I'm partner B</option></select><button class="btn p" id="wc">Create</button></div>
  <div class="row small" style="justify-content:center;margin-top:12px"><a href="#" id="so">Sign out</a></div>`);
  $$('[data-room]',g).forEach(b=>b.onclick=async()=>{await Sync.open(b.dataset.room);ungate()});
  $('#jf',g).onsubmit=async e=>{e.preventDefault();try{await Sync.joinAuth(val('jc'));ungate();toast('Joined! You are now syncing')}catch(err){toast(err.message)}};
  $('#wc',g).onclick=async()=>{try{const c=await Sync.createAuth(val('wn')||'Our Workspace',val('ws'));ungate();modal('Workspace created',`<p>Send this invite code to your partner. They sign in with their own account and enter it once.</p><input readonly value="${esc(c)}" style="font-family:monospace" onclick="this.select()"><p class="tiny mute">The code works once for the open partner slot. You can make a new one anytime in Themes & Settings.</p>`,[])}catch(err){toast(err.message)}};
  $('#so',g).onclick=async e=>{e.preventDefault();await Auth.signOut();authScreen('in')}}
async function bootAuth(){const t=Auth.fromUrl();if(t==='recovery')return newPasswordScreen();if(!Auth.signedIn)return authScreen('in',t==='signup'?'Email confirmed — sign in to continue.':'');
  try{await afterSignIn()}catch(e){authScreen('in',e.message)}}
