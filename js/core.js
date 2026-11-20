'use strict';
/* ===== Core: helpers, seed data, state, history, merge ===== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-3);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS_STATE='duo-planner-v1';          // shared workspace data (v1 key kept so old data migrates in place)
const LS_LOCAL='duo-planner-local';       // device-only: who I am, room code, PRIVATE profile fields
const STATUSES=['idea','researching','needs_req','ready','testing','active','paused','completed','declined'];
const STATUS_IC={idea:'💡',researching:'🔎',needs_req:'📋',ready:'🚦',testing:'🧪',active:'▶',paused:'⏸',completed:'✔',declined:'✖'};
const COLLECTIONS=['partners','days','nodes','links','tasks','notes','suggestions','proposals','checklist','activity','skills','income','clips','library'];

const CATS={
 'Trading':['Trading research','Trading plans and reviews','Existing bots and dashboards','Trade journaling','Risk management','Research ideas and systems'],
 'High-Ticket Sales':['Research offers and industries','Sales training and practice','Lead research and qualification','Follow-up workflows','Performance tracking'],
 'UGC & Ads':['UGC concepts and scripts','Product demonstrations','Existing photo and video selection','Video editing','Ad concepts and testing','Brand and client work','Content delivery and review'],
 'Amazon Storefront & Affiliate':['Amazon Associates (separate eligibility)','Amazon Influencer storefront (separate approval)','Product research','Product recommendations','Review and demonstration content','Affiliate links, disclosures, performance'],
 'TikTok Shop & Creator':['TikTok Shop seller','TikTok Shop affiliate','TikTok creator opportunities','Product selection','Short-form and live content','Seller setup and fulfillment','Campaign performance'],
 'Digital Assets & Products':['E-books and written products','Templates and downloads','Digital art and media','Educational resources','Digital product storefronts','Product creation and delivery'],
 'Membership Programs':['Paid communities','Membership content','Recurring resources or services','Pricing and benefits','Member retention and support'],
 'Faceless Marketing & Content':['Faceless short-form videos','Narrated explainers','Educational content','Product demonstrations','Affiliate content','Content repurposing'],
 'Stock Licensing':['Stock photography','Stock video','Original illustrations and media','Licensing research','Portfolio organization','Platform submissions and results'],
 'Freelance Transcription & 1099':['Transcription opportunities','Captioning and related services','Freelance platforms and clients','Proposals and applications','Delivery, invoices, payment tracking'],
 'Cleaning Business':['Commercial cleaning','Residential cleaning','Post-construction cleaning','Vacation rental cleaning'],
 'Landscaping':['Service research','Equipment and supplies','Customer acquisition','Estimates','Work scheduling','Client and job tracking'],
 'Handyman & Property Maintenance':['Painting','Basic building and assembly','General property maintenance','Other construction work (check licensing first)','Requirements: licensing, insurance, scope'],
 'Property Logistics':['Junk removal','Moving help','Hauling','Related property support','Equipment, vehicle, disposal costs & local rules'],
 'Mobile Detailing':['Service packages','Equipment and supplies','Pricing research','Customer acquisition','Booking and work schedule','Client and job tracking'],
};
const CAT_ICON={'Trading':'📈','High-Ticket Sales':'🤝','UGC & Ads':'🎬','Amazon Storefront & Affiliate':'🛒','TikTok Shop & Creator':'🎵','Digital Assets & Products':'💾','Membership Programs':'🎟','Faceless Marketing & Content':'🎙','Stock Licensing':'📷','Freelance Transcription & 1099':'⌨','Cleaning Business':'🧽','Landscaping':'🌿','Handyman & Property Maintenance':'🔨','Property Logistics':'🚚','Mobile Detailing':'🚗','Product Research':'🔬','Walmart Creator':'🏬','Original Content Production':'🎨','Local Marketing':'📍','Client Scheduling':'🗓'};

function defaultProfile(id,name){return {id,name,username:'',photo:'',avatar:{kind:'char',style:'explorer',skin:'#c68e6a',hair:'#2b2b2b',outfit:id==='A'?'#f472b6':'#38bdf8',aura:id==='A'?'#a78bfa':'#34d399'},
  gender:'',pronouns:'',zodiac:'',bio:'',working:'',theme:'emerald',accent:'',motion:'full',simple:false,celebrate:true,onboarded:false,birthdayPublic:''}}

function seed(){
  const nodes=[],links=[],by={};
  const names=Object.keys(CATS);
  const extra=['Product Research','Walmart Creator','Original Content Production','Local Marketing','Client Scheduling'];
  const all=[...names,...extra];
  all.forEach((n,i)=>{const ring=i<names.length?0:1;const cnt=ring?extra.length:names.length;const idx=ring?i-names.length:i;
    const a=(idx/cnt)*Math.PI*2-Math.PI/2+(ring?.3:0);const R=ring?250:470;const id=uid();by[n]=id;
    nodes.push({id,label:n,parent:null,kind:'category',status:'idea',x:Math.cos(a)*R,y:Math.sin(a)*R*.72,notes:'',archived:false,collapsed:true,owner:'both',sample:true});
    (CATS[n]||[]).forEach((s,j,arr)=>{const b=a+((j-(arr.length-1)/2)*0.38);const sid=uid();
      nodes.push({id:sid,label:s,parent:id,kind:'sub',status:'idea',dx:Math.cos(b)*150,dy:Math.sin(b)*95,notes:'',archived:false,owner:'both',sample:true});});
  });
  const L=(a,b,why)=>links.push({id:uid(),from:by[a],to:by[b],why});
  L('Product Research','UGC & Ads','Researched products become UGC subjects');L('UGC & Ads','TikTok Shop & Creator','UGC can feed TikTok Shop content');
  L('Product Research','Amazon Storefront & Affiliate','Researched products → affiliate recommendations');L('Amazon Storefront & Affiliate','Faceless Marketing & Content','Affiliate products as faceless content topics');
  L('Product Research','Walmart Creator','Same research could serve another creator program');L('Walmart Creator','UGC & Ads','Creator program content uses UGC skills');
  L('UGC & Ads','High-Ticket Sales','UGC skills could be offered via outreach / client services');
  L('Digital Assets & Products','Faceless Marketing & Content','Faceless content can promote digital products');L('Faceless Marketing & Content','Membership Programs','Audience could convert to memberships');
  L('Stock Licensing','Original Content Production','Licensing needs original media');
  L('Cleaning Business','Property Logistics','Same property clients often need hauling/moving');L('Property Logistics','Handyman & Property Maintenance','Adjacent property services');
  L('Landscaping','Handyman & Property Maintenance','Outdoor work overlaps general maintenance');L('Landscaping','Property Logistics','Yard debris → hauling');
  L('Mobile Detailing','Local Marketing','Local service needs local marketing');L('Local Marketing','Client Scheduling','Leads need booking & scheduling');
  const day=(name,theme,focus,topicRule,icon)=>({id:uid(),name,theme,icon,focus,topicRule,topics:[],format:'two',time:'',owner:'both',notes:'',recurring:true,archived:false});
  return {v:2,workspace:{id:uid(),name:'Our Workspace'},partners:[defaultProfile('A','Partner A'),defaultProfile('B','Partner B')],
    tz:Intl.DateTimeFormat().resolvedOptions().timeZone,
    days:[day('Monday','Existing Business & Trading',['Work on businesses/projects already in progress','Review tasks, customers, operations, next steps','Review trading plans, open work, performance'],'none','🏢'),
      day('Tuesday','Research & Opportunity Discovery',['Research one idea, income path, product or opportunity','Record sources, findings, costs, risks, next actions'],'one','🔭'),
      day('Wednesday','UGC & Trading',['Create/improve UGC, ads, clips, scripts, product content','Review and work on trading projects'],'none','🎬'),
      day('Thursday','Research & Opportunity Discovery',['Two separate topics, or one topic in greater detail'],'thursday','🧭'),
      day('Friday','One Focused Topic & Trading',['Focused work on one topic/project/opportunity','Trading projects, review or activity'],'one','🎯')],
    nodes,links,tasks:[],notes:[],suggestions:[],proposals:[],checklist:[],activity:[],skills:starterSkills(),income:[],clips:[],library:[],showcase:{public:false,slug:'',showAmounts:false,showNames:true},steps:{},del:{},meta:{}};
}

/* Upgrade older saved data without losing anything */
function migrate(s){
  if(!s||!Array.isArray(s.days))return migrateOpportunityMap(seed());
  const out={...s};
  if(!out.v||out.v<2){
    out.partners=(s.partners||[]).map(p=>({...defaultProfile(p.id,p.name),...p}));
    out.workspace=out.workspace||{id:uid(),name:'Our Workspace'};
    ['notes','suggestions','checklist','activity','proposals','tasks','links'].forEach(k=>out[k]=out[k]||[]);
    out.nodes=(s.nodes||[]).map(n=>({owner:'both',sample:true,...n}));
    const tops=out.nodes.filter(n=>!n.parent);if(tops.length){const cx=tops.reduce((a,n)=>a+n.x,0)/tops.length,cy=tops.reduce((a,n)=>a+n.y,0)/tops.length;tops.forEach(n=>{n.x-=cx;n.y-=cy})}
    out.days=s.days.map(d=>({icon:{Monday:'🏢',Tuesday:'🔭',Wednesday:'🎬',Thursday:'🧭',Friday:'🎯'}[d.name]||'📅',...d}));
    out.proposals=out.proposals.map(p=>({kind:'schedule',...p}));
    out.del={};out.meta={};out.steps=s.steps||{};
    if(s.me){const l=loadLocal();if(!l.me){l.me=s.me;saveLocal(l)}}
    delete out.me;delete out.calendar;out.v=2;
  }
  if(!out.skills)out.skills=starterSkills();if(!out.income)out.income=[];if(!out.clips)out.clips=[];if(!out.library)out.library=[];if(!out.showcase)out.showcase={public:false,slug:'',showAmounts:false,showNames:true};
  out.partners.forEach(p=>{p.avatar={...defaultProfile(p.id,'').avatar,...(p.avatar||{})}});
  migrateOpportunityMap(out);
  return out;
}

/* ===== Local (device-only) store ===== */
function loadLocal(){try{return JSON.parse(localStorage.getItem(LS_LOCAL))||{}}catch(e){return {}}}
function saveLocal(l){try{localStorage.setItem(LS_LOCAL,JSON.stringify(l))}catch(e){}}
let LOCAL=loadLocal();
const setLocal=patch=>{LOCAL={...LOCAL,...patch};saveLocal(LOCAL)};

/* ===== Shared state + history ===== */
let S;try{S=migrate(JSON.parse(localStorage.getItem(LS_STATE)))}catch(e){S=seed()}
const past=[],future=[];
let storageOK=true;
function persist(){try{localStorage.setItem(LS_STATE,JSON.stringify(S));storageOK=true}catch(e){storageOK=false}if(window.onPersist)onPersist()}
const me=()=>LOCAL.me||'A';
const partnerId=()=>me()==='A'?'B':'A';
const prof=id=>S.partners.find(p=>p.id===id)||defaultProfile(id,id);
const pname=id=>id==='both'?'Both of us':prof(id).name;
const node=id=>S.nodes.find(n=>n.id===id);

/* Stamp changed items with u=now and record deletions as tombstones (used by sync merge) */
function stamp(prev,next){const now=Date.now();
  COLLECTIONS.forEach(k=>{const pm=new Map((prev[k]||[]).map(x=>[x.id,JSON.stringify({...x,u:0})]));
    const nids=new Set();(next[k]||[]).forEach(x=>{nids.add(x.id);if(pm.get(x.id)!==JSON.stringify({...x,u:0}))x.u=now});
    pm.forEach((_,id)=>{if(!nids.has(id))next.del[id]=now});});
  if(JSON.stringify(prev.steps)!==JSON.stringify(next.steps)||prev.tz!==next.tz||JSON.stringify(prev.workspace)!==JSON.stringify(next.workspace)||JSON.stringify(prev.showcase)!==JSON.stringify(next.showcase))next.meta={...next.meta,u:now};
}
function log(s,text){s.activity.unshift({id:uid(),by:me(),text,at:Date.now()});if(s.activity.length>300)s.activity.length=300}
function commit(fn,msg,act){past.push(JSON.stringify(S));if(past.length>80)past.shift();future.length=0;
  const prev=S,next=structuredClone(S);fn(next);if(act)log(next,act);if(window.afterCommit)afterCommit(prev,next);stamp(prev,next);S=next;persist();render();if(msg)toast(msg);if(window.Sync)Sync.schedule()}
function undo(){if(!past.length)return toast('Nothing to undo');future.push(JSON.stringify(S));const prev=S;S=JSON.parse(past.pop());stamp(prev,S);persist();render();toast('Undone');if(window.Sync)Sync.schedule()}
function redo(){if(!future.length)return toast('Nothing to redo');past.push(JSON.stringify(S));const prev=S;S=JSON.parse(future.pop());stamp(prev,S);persist();render();toast('Redone');if(window.Sync)Sync.schedule()}

/* Merge two copies of the workspace: newest edit per item wins; deletions respected */
function mergeState(a,b){const out={...a,del:{...b.del}};
  Object.entries(a.del||{}).forEach(([id,t])=>{out.del[id]=Math.max(t,out.del[id]||0)});
  COLLECTIONS.forEach(k=>{const m=new Map();
    [...(b[k]||[]),...(a[k]||[])].forEach(x=>{const cur=m.get(x.id);if(!cur||(x.u||0)>=(cur.u||0))m.set(x.id,x)});
    const order=[...(a[k]||[]).map(x=>x.id),...(b[k]||[]).map(x=>x.id)];
    out[k]=[...new Set(order)].map(id=>m.get(id)).filter(x=>!(out.del[x.id]&&out.del[x.id]>=(x.u||0)));});
  out.activity.sort((x,y)=>y.at-x.at);if(out.activity.length>300)out.activity.length=300;
  if(((b.meta||{}).u||0)>((a.meta||{}).u||0)){out.steps=b.steps;out.tz=b.tz;out.workspace=b.workspace;out.showcase=b.showcase;out.meta=b.meta}
  const cut=Date.now()-1000*60*60*24*60;Object.keys(out.del).forEach(id=>{if(out.del[id]<cut)delete out.del[id]});
  return out;
}

/* Starter goals for the skill tree — goals to unlock, NOT accomplishments (status 'available', nothing marked done) */
function starterSkills(){const r=uid(),a=uid(),b=uid(),c=uid(),d=uid(),e=uid();const k=(id,title,parents,xp,branch)=>({id,title,parents,status:'available',owner:'both',xp,branch:branch||'',notes:'',doneAt:0,starter:true});
  return [k(r,'Set up our shared command center',[],10),k(a,'Choose our first research topic',[r],10),k(b,'Complete our first shared task',[r],10),
    k(c,'Turn an idea into a project',[a],25),k(d,'Record our first income',[c,b],50),k(e,'Keep a full weekly rhythm for 4 weeks',[b],50)]}
