'use strict';
/* ===== Guided walkthrough for a skill: Start opens step-by-step help that ends in "Mark done" =====
   Progress lives on the skill itself (skill.guide = {at, pick, checks, note}) so it syncs to the partner
   and picks up where you left off. Step kinds: pick (choose a topic/product from the scanner), checks
   (a short checklist), go (buttons that open the right page), note (write down what you decided). */

/* checklist items are [text, how-to tip]; next = suggested follow-up goals offered when the skill is done */
const GUIDES=[
 {k:'clip',m:/clip/,next:['Post 20 clips across two campaigns','Offer a clipping retainer to 5 podcasts','Reach $100 from clipping'],steps:[
   {k:'go',t:'Pick a campaign',help:'Choose one paid clipping campaign to focus on. Add it in Clipping Campaigns if it isn\'t there yet (⚡ Autofill can read a pasted campaign page).',go:[['✂ Open Clipping Campaigns','clips']]},
   {k:'checks',t:'Make and post clips',items:[['Read the campaign rules','Check clip length, required captions or tags, banned content and which platforms count.'],['Find 5 strong moments in the source','Look for big reactions, funny lines, a surprising result or a clear "how to". The first 2 seconds must hook.'],['Edit and post 5 clips','Vertical 9:16, burned-in captions, cut every pause. Post at different times to see what works.'],['Save the post links in Duo','Add each link to the clip on the campaign board so submitting later is quick.']]},
   {k:'checks',t:'Submit and get paid',items:[['Submit clips that reached the view minimum','Use Post & Submit to see which clips are ready.'],['Check the payout date','Most campaigns pay weekly or at the end of the campaign; note it on the campaign.'],['Record the payout as income when it lands','Skill Tree → Income & milestones → add it. Only money received counts.']]},
   {k:'note',t:'What worked?',prompt:'Which clips got the most views, and what will you do differently next round?'}]},
 {k:'ugc',m:/ugc|client|pitch|brand/,next:['Deliver the first paid UGC order','Get a testimonial from our first client','Land 3 repeat UGC clients'],steps:[
   {k:'pick',t:'Pick your niche',only:['UGC & Ads','Creator partnerships & UGC','Local Marketing','AI-Assisted Content'],help:'Which kind of client will you go after first? The top one is recommended for you.'},
   {k:'checks',t:'Make samples',items:[['Film 3 short sample videos for that niche','Use products you already own. Hook in 2 seconds, show it in use, end with a simple reason to buy.'],['Write a simple rate card','For example: 1 video $50–100, 3-video pack, plus extra for usage rights or raw footage.'],['Put the samples in one shareable link','A Google Drive folder or a simple portfolio page works.']]},
   {k:'checks',t:'Pitch',items:[['List 10 brands or sellers to contact','TikTok Shop sellers, small Amazon brands or local shops that post little video.'],['Send 10 short pitches with your sample link','3 lines: who you are, what you noticed about their content, your offer and link.'],['Follow up after 3 days','One friendly nudge doubles replies. Add a follow-up task so you don\'t forget.']]},
   {k:'note',t:'Who said yes?',prompt:'Note replies, prices agreed and what the client wants.'}]},
 {k:'product',m:/product|tiktok shop|amazon|walmart|sample/,next:['Film videos for our 3 shortlisted products','Earn our first affiliate commission','Test a second product type'],steps:[
   {k:'pick',t:'Pick a product type',kind:'product',help:'Start with one product type. The top one is recommended for you, or scan your own idea.'},
   {k:'checks',t:'Search for products',items:[['Find 10 products in that type with good reviews','TikTok Shop affiliate centre or Amazon best sellers; look for 4★+ and steady sales.'],['Check each one\'s commission or price','Aim for products where one sale pays at least $3–5.'],['Watch what top creators post for them','Note the hooks and angles that got the most views.']]},
   {k:'checks',t:'Shortlist',items:[['Pick your best 3','Choose ones that are easy to demo on camera and that you would really use.'],['Request free samples or order one','Many TikTok Shop sellers send samples to new affiliates.'],['Plan one video idea for each','Problem → product → result, in under 30 seconds.']]},
   {k:'note',t:'Your shortlist',prompt:'Write down the 3 products and why you chose them.'}]},
 {k:'create',m:/film|video|shorts|post \d|publish|test piece|content/,next:['Post 10 more and track views','Turn our best video into a template'],steps:[
   {k:'checks',t:'Plan',items:[['Write 3 hook ideas','The first line or shot must make people stop: a question, a bold claim or a before/after.'],['Pick one simple structure','Hook → problem → show it → result → call to action, under 30 seconds.'],['List the shots you need','Close-up of the product, it in use, the result, your face or hands for trust.']]},
   {k:'checks',t:'Film and edit',items:[['Film in good light, vertical 9:16','Face a window; record a few takes of the hook.'],['Edit tight with captions','Cut every pause, add on-screen captions, keep it under 30 seconds.'],['Check it on a phone before posting','Is the text readable and the hook clear with the sound off?']]},
   {k:'checks',t:'Post',items:[['Post with a clear caption and tags','Say what it is and who it\'s for; add the product link if it\'s affiliate.'],['Note the post link in Duo','Add it to the task or Notes so you can track views.'],['Check views after 48 hours','Compare hooks: keep what worked, change what didn\'t.']]},
   {k:'note',t:'What did you learn?',prompt:'Which video did best and why do you think it worked?'}]},
 {k:'research',m:/research|topic|niche|idea/,next:['Turn our topic into a project','Make our first test piece for this topic','Set this as a weekly research topic'],steps:[
   {k:'pick',t:'Pick a topic',help:'These are scored for you two from the scanner. The top one is recommended. You can also scan your own idea.'},
   {k:'checks',t:'Research it',items:[['Find 5 creators or businesses already doing it','Search TikTok, YouTube and Google for the topic; save the 5 best examples in Notes.'],['Note what they charge or earn','Look at their rate cards, campaign payouts or product commissions.'],['List what it costs you to start','Tools, samples, software and time per week.'],['Spot one gap or angle you could take','Something they all miss, a niche they ignore, or a style you two do better.']]},
   {k:'note',t:'Decide',prompt:'Go or no-go? Write the one next step you will take.'}]},
 {k:'income',m:/income|payout|earn|\$|paid/,next:['Reach $100 recorded income','Get paid two months in a row','Double our best month'],steps:[
   {k:'checks',t:'Get paid',items:[['Finish the work you are being paid for','Check the brief or campaign rules once more before delivering.'],['Send the invoice or submit for payout','Include what was delivered, the amount and how to pay.'],['Confirm the money arrived','Check your account; platform payouts can take a few days.']]},
   {k:'go',t:'Record it',help:'Only money you actually received counts toward milestones.',go:[['💰 Open Income & milestones','journey:money']]}]},
 {k:'task',m:/task/,next:['Finish 5 shared tasks in one week','Plan next week\'s tasks together'],steps:[
   {k:'go',t:'Choose one shared task',help:'Pick a task you both work on, or make a new one.',go:[['✓ Open My Tasks','tasks'],['＋ New task','newtask']]},
   {k:'checks',t:'Finish it',items:[['Agree who does which part','Split it so you can both work at the same time.'],['Do the work','Set a time block on the Schedule if it helps.'],['Tick the task off in Duo','It shows in Activity so your partner sees it.']]}]},
 {k:'project',m:/project/,next:['Finish the first 3 project tasks','Get a first result from the project'],steps:[
   {k:'go',t:'Pick an idea',help:'Open the Mind Web, choose an idea you have researched and use "Make it a project".',go:[['🕸 Open Mind Web','web']]},
   {k:'checks',t:'Set it up',items:[['Give the project a clear goal','A number and a date, like "3 paid clips by Dec 15".'],['Add the first 3 tasks','Small enough to finish in one sitting each.'],['Set who owns what','Use the owner on each task.']]}]},
 {k:'rhythm',m:/rhythm|weekly|week/,next:['Keep the weekly rhythm for 8 weeks','Review what our best week looked like'],steps:[
   {k:'go',t:'Set the week',help:'Check each day\'s theme and pick the Tuesday, Thursday and Friday topics.',go:[['📅 Open Schedule','schedule']]},
   {k:'checks',t:'Keep it going',items:[['Week 1 done','Use Carry forward on the Command Center at the end of each week.'],['Week 2 done',''],['Week 3 done',''],['Week 4 done','']]}]},
 {k:'setup',m:/command center|set up|setup/,next:['Choose our first research topic'],steps:[
   {k:'checks',t:'Set up',items:[['Both partners signed in','Each partner has their own account; join with the invite code.'],['Profiles filled in','Profile → name, photo and theme.'],['Phone reminders turned on','Profile → Phone reminders → turn on, on each phone.']]}]},
];
const GENERIC={k:'generic',next:[],steps:[
  {k:'note',t:'What does done look like?',prompt:'Describe the finished result in one or two sentences.'},
  {k:'checks',t:'Do the steps',items:[],custom:true},
]};
function guideFor(s){const t=s.title.toLowerCase();const g=GUIDES.find(x=>x.m.test(t))||GENERIC;
  const steps=g.steps.map(x=>({...x,items:x.items?x.items.map(i=>Array.isArray(i)?i:[i,'']):undefined}));
  /* a skill added from the scanner carries its first step in the notes: put it first in the first checklist */
  const fs=(s.notes||'').match(/First step:\s*(.+)/);const c=steps.find(x=>x.k==='checks');if(fs&&c&&!c.items.some(i=>i[0]===fs[1].trim()))c.items.unshift([fs[1].trim(),'From the idea you added this goal from.']);
  if(g===GENERIC&&c&&!c.items.length&&!(s.guide&&s.guide.extra&&s.guide.extra.length))c.items.push(['Do the first piece of work','Add your own steps below, then tick them off as you go.']);
  return {k:g.k,next:g.next||[],steps:[...steps,{k:'finish',t:'Finish'}]}}

const gState=s=>({at:0,pick:null,checks:{},note:'',extra:[],...(s.guide||{})});
function saveGuide(id,patch){commit(x=>{const k=x.skills.find(y=>y.id===id);if(k)k.guide={...gState(k),...patch}},null)}

function startGuide(id){const s=S.skills.find(x=>x.id===id);if(!s)return;
  if(s.status!=='progress'&&s.status!=='done')commit(x=>x.skills.find(y=>y.id===id).status='progress',null,`started “${s.title}”`);
  openGuide(id)}

function openGuide(id,scan){const s=S.skills.find(x=>x.id===id);if(!s)return;const G=guideFor(s);const g=gState(s);const at=Math.min(g.at,G.steps.length-1);const st=G.steps[at];
  const dots=`<ol class="gd-dots" aria-label="Step ${at+1} of ${G.steps.length}">${G.steps.map((x,i)=>`<li class="${i<at?'done':i===at?'on':''}"><button type="button" data-gs="${i}" aria-label="Step ${i+1}: ${esc(x.t)}">${i<at?'✓':i+1}</button><span>${esc(x.t)}</span></li>`).join('')}</ol>`;
  let body='';const items=st.k==='checks'?[...(st.items||[]),...(st.custom?g.extra.map(t=>[t,'']):[])]:[];
  if(st.k==='pick'){let list=scoredIdeas().filter(i=>(!st.kind||i.kind===st.kind)&&(!st.only||[i.branch,...(i.alt||[])].some(b=>st.only.includes(b))));
    const rec=list.find(i=>i.fit>1)||list[0];list=[rec,...list.filter(i=>i!==rec)].filter(Boolean).slice(0,6);
    if(g.pick&&!list.some(i=>i.title===g.pick.title))list.push({...g.pick,id:'picked',fitWhy:[],why:g.pick.why||'Your own idea'});
    if(scan&&!list.some(i=>i.title===scan.title))list.unshift({...scan,id:'scan'});
    body=`<p class="small mute">${esc(st.help)}</p><div class="gd-picks" role="radiogroup" aria-label="${esc(st.t)}">${list.map(i=>`<button type="button" role="radio" aria-checked="${g.pick&&g.pick.title===i.title}" class="gd-pick ${g.pick&&g.pick.title===i.title?'on':''}" data-pick="${esc(i.id)}">
       ${ring(i.score)}<span style="flex:1;min-width:0"><span class="tiny" style="color:var(--acc);font-weight:700">${i===rec?'✨ Recommended':i.id==='scan'?'🔎 Your scan':''}</span><b>${esc(i.title)}</b><span class="tiny mute">${esc(i.why||'')}</span></span></button>`).join('')}</div>
     <form class="row" id="gdScanF" style="margin-top:10px"><input id="gdScan" placeholder="Or scan your own topic or product" style="flex:1 1 200px;width:auto;min-width:0"><button class="btn s" type="submit">🔎 Scan</button></form>`;
    openGuide._list=list}
  else if(st.k==='checks'){const ch=g.checks[at]||[];
    body=`${st.help?`<p class="small mute">${esc(st.help)}</p>`:''}${g.pick&&at>0?`<p class="small">Working on: <b>${esc(g.pick.title)}</b></p>`:''}
     <div class="col gd-checks">${items.map(([t,tip],i)=>`<div class="gd-item"><label class="row small"><input type="checkbox" data-ck="${i}" ${ch[i]?'checked':''}> <span>${esc(t)}</span></label>${tip?`<details class="gd-tip"><summary>How?</summary><div class="tiny">${esc(tip)}</div></details>`:''}</div>`).join('')}</div>
     ${st.custom?`<form class="row" id="gdAddF" style="margin-top:8px"><input id="gdAdd" placeholder="Add a step" style="flex:1 1 200px;width:auto;min-width:0"><button class="btn s" type="submit">＋ Add</button></form>`:''}
     <p class="tiny mute" style="margin-top:8px">${ch.filter(Boolean).length} of ${items.length} ticked. You can move on any time; ticks are saved for you both.</p>`}
  else if(st.k==='go'){body=`<p class="small">${esc(st.help)}</p><div class="row">${st.go.map(([l,a])=>`<button type="button" class="btn" data-goto="${a}">${l}</button>`).join('')}</div>
     <p class="tiny mute" style="margin-top:8px">Come back with ▶ Continue walkthrough on this skill when you're ready.</p>`}
  else if(st.k==='note'){body=`<label class="f" for="gdNote">${esc(st.prompt)}</label><textarea id="gdNote" rows="4">${esc(g.note)}</textarea>`}
  else {const done=Object.entries(g.checks).reduce((a,[,v])=>a+v.filter(Boolean).length,0);
    body=`<p class="small">That's the walkthrough for <b>${esc(s.title)}</b>.</p><ul class="small">${g.pick?`<li>Picked: <b>${esc(g.pick.title)}</b> (${g.pick.score}/100)</li>`:''}<li>${done} checklist step${done===1?'':'s'} ticked</li>${g.note?`<li>Note: ${esc(g.note)}</li>`:''}</ul>
     ${g.pick&&!findNode(g.pick.title)?'<p class="tiny mute">Marking done also adds your pick to the Mind Web as “researching”.</p>':''}
     ${s.status==='done'?'<p class="small">✔ Already done.</p>':skState(s,S.skills)==='locked'?'<p class="small warn">Finish the steps before this one first.</p>':''}`}
  const last=at===G.steps.length-1;
  const btns=[...(at>0?[{t:'← Back',keep:true,f:()=>{keepNote();saveGuide(id,{at:at-1});openGuide(id)}}]:[]),
    last?(s.status==='done'||skState(s,S.skills)==='locked'?{t:'Close',c:'p'}:{t:`✔ Mark done (+${s.xp||10} XP)`,c:'p',keep:true,f:()=>finishGuide(id)})
        :{t:'Next →',c:'p',keep:true,f:()=>{if(st.k==='pick'&&!gState(S.skills.find(x=>x.id===id)).pick){toast('Pick one to continue');return}keepNote();saveGuide(id,{at:at+1});openGuide(id)}}];
  function keepNote(){if(st.k==='note')saveGuide(id,{note:val('gdNote')})}
  modal(`▶ ${s.title}`,`${dots}<h3 class="gd-h">Step ${at+1} of ${G.steps.length}: ${esc(st.t)}</h3>${body}`,btns,{noFocus:true,noCancel:true,onOpen:d=>{
    d.onclose=()=>{if(st.k==='note'&&$('#gdNote',d))saveGuide(id,{note:val('gdNote')});if(window.Sync)Sync.flushPending()};
    $$('[data-gs]',d).forEach(b=>b.onclick=()=>{keepNote();saveGuide(id,{at:+b.dataset.gs});openGuide(id)});
    $$('[data-pick]',d).forEach(b=>b.onclick=()=>{const i=openGuide._list.find(x=>x.id===b.dataset.pick);if(!i)return;
      saveGuide(id,{pick:{title:i.title,score:i.score,branch:i.branch||'',why:i.why||'',goal:i.goal||'',kind:i.kind||''}});openGuide(id,scan&&scan.title===i.title?scan:null)});
    const sf=$('#gdScanF',d);if(sf)sf.onsubmit=e=>{e.preventDefault();const q=val('gdScan');if(!q)return;openGuide(id,scanText(q,st.kind||''))};
    $$('[data-ck]',d).forEach(c=>c.onchange=()=>{const cur=gState(S.skills.find(x=>x.id===id));const arr=[...(cur.checks[at]||[])];arr[+c.dataset.ck]=c.checked;saveGuide(id,{checks:{...cur.checks,[at]:arr}});
      const p=$('.gd-checks',d).parentElement.querySelector('p.tiny');if(p)p.textContent=`${arr.filter(Boolean).length} of ${items.length} ticked. You can move on any time; ticks are saved for you both.`});
    const af=$('#gdAddF',d);if(af)af.onsubmit=e=>{e.preventDefault();const t=val('gdAdd');if(!t)return;saveGuide(id,{extra:[...gState(S.skills.find(x=>x.id===id)).extra,t]});openGuide(id)};
    $$('[data-goto]',d).forEach(b=>b.onclick=()=>{const a=b.dataset.goto;d.close();
      if(a==='newtask')return editTask(null,{title:s.title,owner:s.owner,nodeId:s.branch});
      const [pg,tab]=a.split(':');if(tab)jTab=tab;go(pg)});
  }})}

function finishGuide(id){const s=S.skills.find(x=>x.id===id);const g=gState(s);
  commit(x=>{const k=x.skills.find(y=>y.id===id);const add=[g.pick?`Picked: ${g.pick.title} (${g.pick.score}/100)`:'',g.note].filter(Boolean).join('\n');
    if(add&&!(k.notes||'').includes(add))k.notes=[k.notes,add].filter(Boolean).join('\n');
    if(g.pick&&!x.nodes.some(n=>!n.archived&&n.label.toLowerCase()===g.pick.title.toLowerCase())){const p=x.nodes.find(n=>!n.archived&&n.label.toLowerCase()===String(g.pick.branch).toLowerCase());const a=Math.random()*Math.PI*2;
      x.nodes.push({id:uid(),label:g.pick.title,parent:p?p.id:null,kind:p?(nodeAncestors(p.id).length>=1?'path':'sub'):'category',status:'researching',owner:k.owner||'both',notes:`Picked in the walkthrough for “${k.title}” (${g.pick.score}/100).`,archived:false,collapsed:false,x:(Math.random()-.5)*300,y:(Math.random()-.5)*200,dx:Math.cos(a)*150,dy:Math.sin(a)*95})}},null);
  completeSkill(id);}

/* after a skill is done: pick the next step from suggestions (or type one), then add it or add it and start its walkthrough */
function nextStepModal(id,unlocked){const s=S.skills.find(x=>x.id===id);const g=gState(s);const G=guideFor(s);
  const have=new Set(S.skills.map(x=>x.title.toLowerCase()));
  const sug=[...new Set([g.pick&&g.pick.goal,...G.next,...(recommended()?[recommended().goal]:[])].filter(Boolean))].filter(t=>!have.has(t.toLowerCase())).slice(0,4);
  const add=(start)=>{const t=val('nx');if(!t){toast('Pick or type a next step');return false}const nid=uid();
    commit(x=>x.skills.push({id:nid,title:t,parents:[id],status:'available',owner:s.owner,xp:10,branch:s.branch||'',notes:g.pick&&t===g.pick.goal?`From the walkthrough pick: ${g.pick.title}`:'',doneAt:0}),'Added to tree',`added next step “${t}”`);
    skSel=nid;if(start){startGuide(nid);return false}};
  modal('Nice — what comes next?',`${unlocked.length?`<p class="small">Unlocked and ready:</p><div class="col">${unlocked.map(u=>`<div class="row small"><b style="flex:1">${esc(u.title)}</b><button type="button" class="btn s p" data-ust="${u.id}">▶ Start</button></div>`).join('')}</div>`:''}
    ${sug.length?`<p class="small" style="margin-top:10px">Suggested next steps:</p><div class="gd-picks">${sug.map(t=>`<button type="button" class="gd-pick" data-sug="${esc(t)}"><span style="flex:1"><b>${esc(t)}</b></span></button>`).join('')}</div>`:''}
    <label class="f" for="nx">Next step</label><input id="nx" placeholder="Pick one above or type your own">`,
    [{t:'Add',f:()=>add(false)},{t:'▶ Add & start walkthrough',c:'p',keep:true,f:()=>add(true)}],{noFocus:true,onOpen:d=>{
      $$('[data-sug]',d).forEach(b=>b.onclick=()=>{$('#nx',d).value=b.dataset.sug;$$('[data-sug]',d).forEach(x=>x.classList.toggle('on',x===b))});
      $$('[data-ust]',d).forEach(b=>b.onclick=()=>{skSel=b.dataset.ust;startGuide(b.dataset.ust)})}})}
