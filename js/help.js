'use strict';
/* ===== Easy mode + help =====
   Easy mode (per person, saved on your profile): shows a short "How this works" card at the top of every page.
   The ? Help button works any time, easy mode or not, and has a search box for questions. */
const HELP={
 dash:{t:'Command Center',what:'Your home screen. It shows what matters today for both of you.',
  steps:['Press ▶ Start in “Today\'s agenda” to jump straight to the first thing still to do today. Tap any line to open it, tick the box when a task is done.','Look at “What should we work on next?” — it picks the next thing from your real tasks and schedule.','Check “Needs attention” for anything waiting on you (suggestions, schedule changes, clip deadlines).','Tap “Set my current focus” so your partner knows what you\'re doing.'],
  tips:['Nothing here is made up — it only shows what you two have added.','Tick the weekly planning checklist as you go; press “Carry forward” to start a fresh week.']},
 web:{t:'Mind Web',what:'A map of every idea and business you\'re exploring, connected like a web.',
  steps:['Tap a bubble to open its details in a pop-up. Tap outside it, press Esc or swipe it down to close.','Double-tap a big bubble to open or close what\'s inside it.','Press “📇 Research card” to write down what you know, what you need, and your decision.'],
  tips:['Prefer a simple list? Press “☰ List”.','Use 🔗 Connect to link two ideas and say why they go together.','Use ＋ / － / Fit to zoom. Drag empty space to move around.']},
 journey:{t:'Skill Tree & Milestones',what:'Shows how far you\'ve come — skills you\'ve finished and money goals you\'ve reached.',
  steps:['Tap any skill to open it in a pop-up, then “Start” or “Mark done”. Tap outside the box to close it.','A 🔒 locked skill is view-only: it shows what to finish first, with a button to jump to it.','After finishing one, add the next step — the tree keeps growing.','Record money you actually received under “Income & milestones”.'],
  tips:['Money goals double: $10 → $20 → $40 … → $100, then start again. 🏆 marks big ones.','Only real income counts. Estimates are always labelled as estimates.','“Public showcase” lets you share your progress with a link (amounts hidden unless you choose).']},
 schedule:{t:'Schedule',what:'Your weekly rhythm — one card per workday.',
  steps:['Drag tasks onto a day (or open a task and pick the day).','Choose Tuesday\'s research topic and Friday\'s focus from the dropdowns.','Press ✎ Edit on a day to change it — or “Propose change” so your partner can accept first.'],
  tips:['No times are set unless you add them.','Use the My work / Partner\'s / Shared buttons to filter.']},
 projects:{t:'Projects',what:'Specific things you\'ve decided to work on. Progress comes from their tasks.',
  steps:['Create one with “+ New project” or from an idea in the Mind Web (“Make project”).','Add tasks to it — the progress bar fills as tasks get done.'],tips:['Open a project in the Mind Web to see its research card and results.']},
 tasks:{t:'Tasks',what:'Every to-do in one place.',steps:['Tap a task to edit it, tick the box when it\'s done.','Use the search box to find one fast.'],tips:['“My work” shows only yours. “Shared” shows things you both own.']},
 post:{t:'Post & Submit',what:'The fast lane: post a finished clip and submit it to the campaign in a few taps.',
  steps:['Tap “Open export” to get the video, then “Copy caption + hashtags”.','Tap the platform (TikTok, YouTube…) — post it there.','Copy the post\'s link, come back, tap “📋 Paste any link”.','Tap “Copy link & open submit page”, paste it there and submit.','Tap “✔ Done — next clip”.'],
  tips:['Only clips marked ✔ Approved show up here.','On Android, after installing Duo, you can use Share → Duo from TikTok to send the link straight in.','Duo never posts for you — you always press post and submit yourself.']},
 clips:{t:'Clipping Campaigns',what:'Everything for clipping jobs — like Content Rewards campaigns — from finding a moment to getting paid.',
  steps:['“+ New campaign”: add the campaign page and submit page links.','“+ Clip” (or “⬇ Import clips” from UGC Studio) to add clips.','Drag clips across the board: Moment → Editing → Review → Approved → Submitted → Paid.','📤 Posted today counts the clips Clip Farmer reports from Telegram against your daily goal.','When a clip is ✔ Approved, go to 🚀 Post & Submit.'],
  tips:['Tick all 3 rights checks on a clip before it can be submitted.','Save hooks and captions that work with ★ — reuse them later.','When a clip is Paid, the money is added to your income automatically.']},
 checklist:{t:'Shared Checklist',what:'A simple list you both can tick — supplies, setup steps, errands.',steps:['Type an item and press Enter.','Tick it when done. “Clear completed” tidies up.'],tips:[]},
 research:{t:'Research Split',what:'Study one topic together: split it into parts, each research your own parts, check in every day and compare notes.',steps:['“+ Split a new topic”: pick a topic, then choose who researches each part (starter parts are filled in).','Each day tap “✍ Today\'s check-in”: what you learned, links, questions and your next step.','Open “Compare notes” to see both check-ins side by side. Tap 💡 on anything you learned from your partner and write one takeaway.'],tips:['It also shows in Today\'s agenda until you check in, and phone reminders can nudge you in the evening.','After 5 days where you both check in, finish the research to complete its skill in the Skill Tree.']},
 notes:{t:'Notes',what:'Write things down — research, ideas, meeting notes.',steps:['“+ Note”, give it a title, write.','Link it to an idea or a workday so it shows up there too.'],tips:['Search finds words inside notes.']},
 suggest:{t:'Suggestions',what:'Ideas for each other, plus requests to change the schedule.',
  steps:['“+ Suggestion” to send an idea to your partner.','Open one to reply, mark it done, or dismiss it.','Schedule change requests appear on the right — accept or decline them.'],tips:['A proposed change never replaces the schedule until it\'s accepted.']},
 activity:{t:'Activity',what:'A history of who changed what.',steps:['Scroll to see recent updates from both of you.'],tips:[]},
 profile:{t:'Profile',what:'How you appear to your partner.',steps:['Change your name, avatar, pronouns or bio, then “Save profile”.'],tips:['🔒 Your birthday stays private on your device unless you choose to share it.']},
 settings:{t:'Themes & Settings',what:'Make Duo look and feel how you like, and manage your account.',
  steps:['Tap a theme to preview it, then “Apply theme”.','Turn Easy mode on or off here.','“Invite partner” makes a new code for your partner to join.'],tips:['Your theme only changes your view, not your partner\'s.','Motion: Full, Calm or Off — pick Off if animations bother you.']},
};
const FAQ=[
 ['How do I add my partner?','Themes & Settings → “Invite partner (new code)”. Send them the code. They create their own account, sign in, and type the code once.','settings'],
 ['Why don\'t I see my partner\'s changes?','Look at the dot at the top: green “Synced” means it\'s working. Changes arrive within about 5 seconds. If it says “Sync issue”, check your internet and reload.',null],
 ['How do I get reminders on my phone?','Themes & Settings → “📱 Phone reminders” → “Turn on reminders”. iPhone: add Duo to your Home Screen first (Safari → Share → Add to Home Screen) and open it from that icon. Android: works in Chrome, installed or not. Give a task a time (like 3pm) or a due date to be reminded.','settings'],
 ['How do I put Duo on my phone like an app?','Android (Chrome): menu ⋮ → “Install app”. iPhone (Safari): Share → “Add to Home Screen”.',null],
 ['Does Duo post to TikTok or submit to Content Rewards for me?','No. It opens the right page and copies the text and links for you — you press post and submit yourself.','post'],
 ['How do clips get to Post & Submit?','Move a clip to “✔ Approved” on its campaign board, with all 3 rights checks ticked.','clips'],
 ['How do the money goals work?','They double: $10, $20, $40, $80, then $100. From $100 they double again to $1,000, and so on. 🏆 marks big milestones like $1k, $5k and $10k.','journey'],
 ['Does trading count toward our money goals?','Not unless you tick “Count live trading results”. Trading is kept separate from business income.','journey'],
 ['I forgot my password','On the sign-in screen tap “Forgot password?” and follow the email link.',null],
 ['How do we split research between us?','Research Split → “+ Split a new topic”. Pick a topic, choose who researches each part, then both check in daily and compare notes.','research'],
 ['How do I undo something?','Press ↶ Undo at the top (or Ctrl+Z on a computer).',null],
 ['How do I make the animations stop?','Themes & Settings → Motion → “Off” (or “Calm” for fewer).','settings'],
 ['What does “Not verified” mean?','Nobody has checked that information yet. Mark a source as verified once you\'ve confirmed it.','web'],
 ['How do I share our progress publicly?','Skill Tree & Milestones → “Public showcase” → turn it on and copy the link.','journey'],
 ['Where do I record money we made?','Skill Tree & Milestones → “Income & milestones” → “Record a result or cost”.','journey'],
 ['How do I import clips from UGC Studio?','Open a campaign → “⬇ Import clips” → paste or drop the Clip Lab file.','clips'],
];
const easyOn=()=>prof(me()).easy!==false; /* on unless you turn it off */
const tipHidden=k=>((LOCAL.tipsHidden||{})[me()]||[]).includes(k);
function tipCard(k){const h=HELP[k];if(!h||!easyOn()||tipHidden(k))return '';
  return `<div class="card tipcard" role="note"><div class="row"><b>💡 How this works</b><span class="sp"></span><button class="btn s ghost" data-tipx="${k}" aria-label="Hide this tip">Got it ✕</button></div>
   <p class="small" style="margin:6px 0">${esc(h.what)}</p><ol class="small" style="margin:0;padding-left:20px">${h.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
   ${h.tips.length?`<div class="tiny mute" style="margin-top:6px">${h.tips.map(t=>'• '+esc(t)).join('<br>')}</div>`:''}</div>`}
function injectTip(el,k){const html=tipCard(k);if(!html)return;el.insertAdjacentHTML('afterbegin',html);
  const b=$('[data-tipx]',el);if(b)b.onclick=()=>{const all={...(LOCAL.tipsHidden||{})};all[me()]=[...(all[me()]||[]),k];setLocal({tipsHidden:all});$('.tipcard',el).remove();toast('Tip hidden — find it again with the ? Help button')}}
function openHelp(k=page){const h=HELP[k]||HELP.dash;
  modal(`Help · ${h.t}`,`<p>${esc(h.what)}</p><h3>How to use it</h3><ol class="small" style="padding-left:20px">${h.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
   ${h.tips.length?`<h3>Tips</h3><ul class="small" style="padding-left:20px">${h.tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}
   <h3 style="margin-top:14px">Have a question?</h3><input id="faqQ" placeholder="Type a question, e.g. “add partner”, “undo”, “phone”" aria-label="Search help"><div id="faqA" style="margin-top:8px"></div>
   <label class="row small" style="margin-top:14px"><input type="checkbox" id="easyT" ${easyOn()?'checked':''}> Easy mode — show a “How this works” card on every page</label>
   ${((LOCAL.tipsHidden||{})[me()]||[]).length?'<button class="btn s" id="tipsReset" style="margin-top:6px">Show hidden tips again</button>':''}`,[],{onOpen:d=>{
     const q=$('#faqQ',d),out=$('#faqA',d);const draw=()=>{const words=q.value.toLowerCase().split(/\s+/).filter(w=>w.length>1);
       const hits=FAQ.map(f=>({f,s:words.reduce((a,w)=>a+((f[0]+' '+f[1]).toLowerCase().includes(w)?1:0),0)+(!words.length&&f[2]===k?1:0)})).filter(x=>x.s>0||!words.length&&x.f[2]===k).sort((a,b)=>b.s-a.s).slice(0,5);
       out.innerHTML=hits.length?hits.map(({f})=>`<details class="card" style="padding:8px 12px;margin-bottom:6px"><summary style="cursor:pointer"><b>${esc(f[0])}</b></summary><p class="small" style="margin:6px 0 0">${esc(f[1])}</p>${f[2]&&f[2]!==k?`<button class="btn s" data-faqgo="${f[2]}" style="margin-top:6px">Take me there →</button>`:''}</details>`).join(''):(words.length?'<div class="tiny mute">No match — try different words, or leave your partner a suggestion.</div>':'')
       $$('[data-faqgo]',out).forEach(b=>b.onclick=()=>{d.close();go(b.dataset.faqgo)})};
     q.oninput=draw;draw();
     $('#easyT',d).onchange=e=>commit(s=>{s.partners.find(p=>p.id===me()).easy=e.target.checked},e.target.checked?'Easy mode on':'Easy mode off');
     const r=$('#tipsReset',d);if(r)r.onclick=()=>{const all={...(LOCAL.tipsHidden||{})};all[me()]=[];setLocal({tipsHidden:all});d.close();render();toast('Tips are back')}}})}
