'use strict';
/* ===== Master Opportunity Map: category → subcategory → path → project → task → result =====
   Migration is deterministic (ids derived from labels) so two synced devices produce identical nodes and
   the merge de-duplicates them instead of creating copies. Existing branches are re-parented, never duplicated. */
const STATUS_LABEL={idea:'Idea',researching:'Researching',needs_req:'Needs requirements',ready:'Ready to test',testing:'Testing',active:'Active',paused:'Paused',completed:'Completed',declined:'Not pursuing'};
const KIND_LABEL={category:'Category',sub:'Subcategory',path:'Path',project:'Project'};
const PRIORITIES=['','low','medium','high'];
const slugId=s=>'om-'+s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);

/* [label, icon, merge-from existing labels, children]  children: [label, merge-from, paths[]] */
const OPP_MAP=[
 ['Existing Business & Expansion','🏢',[],[['Existing operations'],['Parent company planning'],['Divisions or business lines'],['Business refinement'],['Growth and expansion ideas'],['Current customers or projects'],['Operations and systems'],['Tasks, responsibilities & follow-ups'],['Business ownership & structure research']]],
 ['Research & Business Intelligence','🔬',[],[['Product Research',['Product Research']],['Competitor Research'],['Market Research'],['Business Research'],['Ad & Creative Research']]],
 ['Digital Commerce & Marketplaces','🛒',[],[
   ['TikTok',['TikTok Shop & Creator'],['TikTok Shop affiliate','TikTok Shop seller','TikTok creator opportunities','Product research','Organic content','Paid TikTok advertising','Creator partnerships & UGC']],
   ['Amazon',['Amazon Storefront & Affiliate'],['Amazon Associates (separate eligibility)','Amazon Influencer storefront (separate approval)','Amazon seller','Fulfillment by Amazon research','Fulfillment by merchant research','Product research','UGC for Amazon sellers']],
   ['Walmart',[],['Walmart Creator','Walmart Marketplace seller','Product sourcing','UGC for Walmart sellers','Marketplace research']],
   ['Independent Storefronts',[],['Shopify or other storefront','Product pages & offers','Dropshipping research','Digital product sales','Store analytics','Fulfillment & customer support','Store expense review']],
   ['Other Marketplaces',[],['Etsy','eBay','Digital downloads','Reselling']]]],
 ['Content, UGC & Marketing','🎬',[],[
   ['UGC & Ads',['UGC & Ads'],['Product demonstrations','Unboxings','Product reviews','Short-form ad concepts','UGC for our own products','UGC for affiliate products','Paid UGC for brands','UGC for Amazon, Walmart or TikTok sellers','Content delivery & revisions']],
   ['AI-Assisted Content',[],['Script drafting','Editing assistance','Product imagery','Virtual creators','Caption assistance','Content repurposing']],
   ['Paid Advertising',[],['TikTok ads','Meta ads','Video advertising','Creative testing','Offer testing']],
   ['Affiliate Marketing',[],['Product reviews','Comparison videos','Pinterest content','Blog content','Newsletter content','Approved affiliate links']],
   ['Content Monetization',[],['YouTube creator opportunities','TikTok creator opportunities','Sponsorships','Brand deals','Ambassador programs','Affiliate income','Paid content services']],
   ['Content Licensing',[],['Usage rights','Ad licensing','Content reuse','Client licensing agreements','Recurring content contracts']],
   ['Live Clipping & Content Campaigns',[],['Live-stream clipping','Recorded-stream clipping','Gaming clips','Creator campaigns','Paid clipping opportunities','Client clipping services']],
   ['Faceless Content',['Faceless Marketing & Content']],['Original Content Production',['Original Content Production']],['Local Marketing',['Local Marketing']]]],
 ['Digital Assets & Products','💾',[],[['Digital Products',['Digital Assets & Products']],['Stock Licensing',['Stock Licensing']]]],
 ['Memberships & Communities','🎟',[],[['Memberships',['Membership Programs']]]],
 ['Freelance & Client Services','🤝',[],[['UGC creation for clients'],['Video clipping & editing'],['Freelance Transcription & 1099',['Freelance Transcription & 1099']],['High-Ticket Sales',['High-Ticket Sales']],['Other 1099 / freelance']]],
 ['Local & Property Services','🏡',[],[['Cleaning',['Cleaning Business']],['Landscaping',['Landscaping']],['Handyman & Property Maintenance',['Handyman & Property Maintenance']],['Property Logistics',['Property Logistics']],['Mobile Detailing',['Mobile Detailing']],['Client Scheduling',['Client Scheduling']]]],
 ['Trading & Trading Systems','📈',['Trading'],[['Simulated & live activities']]],
];
const OPP_LINKS=[['Product Research','UGC & Ads'],['UGC & Ads','TikTok'],['Product Research','Amazon'],['Amazon','Affiliate Marketing','Requires program eligibility'],['Product Research','Walmart'],['Walmart','UGC & Ads','Requires creator/affiliate eligibility'],
 ['UGC & Ads','Paid Advertising'],['Paid Advertising','Independent Storefronts'],['UGC & Ads','UGC creation for clients','Requires client usage-rights terms'],['Live Clipping & Content Campaigns','Original Content Production','Requires creator permission & content rights'],
 ['Original Content Production','Creator campaigns'],['Digital Products','Faceless Content'],['Faceless Content','Memberships'],['Original Content Production','Stock Licensing','Requires owning the rights'],
 ['Cleaning','Property Logistics'],['Property Logistics','Handyman & Property Maintenance'],['Landscaping','Handyman & Property Maintenance'],['Landscaping','Property Logistics'],['Mobile Detailing','Local Marketing'],['Local Marketing','Client Scheduling'],
 ['Existing Business & Expansion','Research & Business Intelligence'],['Research & Business Intelligence','Business refinement']];
const OPP_WHY={'Product Research>UGC & Ads':'Researched products become UGC subjects','UGC & Ads>TikTok':'UGC can feed TikTok Shop content','UGC & Ads>Paid Advertising':'UGC is the creative for ad tests','Paid Advertising>Independent Storefronts':'Ads send traffic to a storefront','Cleaning>Property Logistics':'Same property clients often need hauling or moving','Mobile Detailing>Local Marketing':'Local service needs local marketing','Local Marketing>Client Scheduling':'Leads need booking & scheduling','Existing Business & Expansion>Research & Business Intelligence':'Research guides refinement and expansion'};

function nodeAncestors(id){const out=[];let n=id&&S.nodes.find(x=>x.id===id);let guard=0;while(n&&n.parent&&guard++<20){out.push(n.parent);n=S.nodes.find(x=>x.id===n.parent)}return out}
window.nodeAncestors=nodeAncestors;
const nodeDepth=n=>nodeAncestors(n.id).length;
const topOf=n=>{const a=nodeAncestors(n.id);return a.length?node(a[a.length-1]):n};

function migrateOpportunityMap(s){if((s.mapV||0)>=1)return s;
  const dep=n=>{let d=0,x=n;while(x&&x.parent&&d<20){x=s.nodes.find(y=>y.id===x.parent);d++}return d};
  /* prefer the shallowest match so a top-level branch wins over a same-named sub-item */
  const byLabel=l=>s.nodes.filter(n=>n.label.toLowerCase()===l.toLowerCase()).sort((a,b)=>dep(a)-dep(b))[0];
  const ensure=(id,label,parent,extra)=>{let n=s.nodes.find(x=>x.id===id);if(!n){n={id,label,parent,kind:'sub',status:'idea',owner:'both',notes:'',archived:false,collapsed:true,sample:true,dx:0,dy:0,x:0,y:0,...extra};s.nodes.push(n)}return n};
  const place=(n,parentPos,ang,dist)=>{if(n.parent){n.dx=Math.round(Math.cos(ang)*dist);n.dy=Math.round(Math.sin(ang)*dist*.72)}else{n.x=Math.round(Math.cos(ang)*dist);n.y=Math.round(Math.sin(ang)*dist*.72)}};
  OPP_MAP.forEach(([label,icon,mergeTop,kids],i)=>{const a=(i/OPP_MAP.length)*Math.PI*2-Math.PI/2;
    let top=mergeTop.map(byLabel).find(Boolean);if(top){top.label=label;top.parent=null;top.kind='category'}else top=ensure(slugId(label),label,null,{kind:'category'});
    top.icon=icon;top.collapsed=true;place(top,null,a,560);
    kids.forEach(([cl,merge=[],paths=[]],j)=>{const b=a+((j-(kids.length-1)/2)*0.42);
      let c=merge.map(byLabel).find(x=>x&&x.id!==top.id);if(c){c.parent=top.id;c.kind='sub';c.label=cl}else c=ensure(slugId(label+'-'+cl),cl,top.id,{kind:'sub'});
      c.collapsed=true;place(c,null,b,200);
      const existing=s.nodes.filter(x=>x.parent===c.id);existing.forEach(x=>{if(x.kind==='sub')x.kind='path'});
      paths.forEach((pl,k)=>{const old=pl==='Walmart Creator'&&byLabel('Walmart Creator');if(old&&old.id!==c.id){old.parent=c.id;old.kind='path'}
        else if(!existing.some(x=>x.label.toLowerCase().replace(/ \(.*\)/,'')===pl.toLowerCase().replace(/ \(.*\)/,'')))ensure(slugId(cl+'-'+pl),pl,c.id,{kind:'path'})});
      s.nodes.filter(x=>x.parent===c.id).forEach((x,k,arr)=>{x.collapsed=true;place(x,null,b+((k-(arr.length-1)/2)*0.3),140)})});
  });
  OPP_LINKS.forEach(([f,t,dep])=>{const A=byLabel(f),B=byLabel(t);if(!A||!B)return;if(s.links.some(l=>(l.from===A.id&&l.to===B.id)))return;
    s.links.push({id:'oml-'+A.id+'-'+B.id,from:A.id,to:B.id,why:OPP_WHY[f+'>'+t]||'Example connection — edit or remove',dep:dep||'',sample:true})});
  const wed=s.days.find(d=>d.name==='Wednesday');const add='Clipping or content production when selected';if(wed&&!wed.focus.includes(add))wed.focus=[...wed.focus,add];
  s.mapV=1;return s}

/* ----- research card ----- */
const CARD_FIELDS=[['desc','Short description'],['model','Potential income model'],['audience','Intended customer / audience'],['product','Product or service involved'],['have','What we already have'],['need','What is still needed'],
  ['startup','Startup costs (if known)'],['ongoing','Ongoing costs (if known)'],['reqs','Account, eligibility, supplier or equipment requirements'],['time','Time needed (estimate)'],['risks','Risks & unknowns'],['blockers','Blockers'],['nextAction','Next action']];
const TEMPLATES={
  product:[['problem','Customer problem'],['demand','Demand signals & sources'],['markets','Marketplaces where it appears'],['price','Observed pricing'],['costs','Estimated product & fulfillment cost'],['margin','Potential margin (show assumptions)'],['competitors','Competitors']],
  competitor:[['comp','Competitor name & links'],['stores','Stores & listings'],['offers','Offers & pricing'],['pageStructure','Product-page structure'],['ads','Content & ads'],['useful','What appears useful'],['verify','What needs verification'],['ideas','Our improvement ideas']],
  market:[['needs','Customer needs'],['niche','Niche & audience'],['behavior','Buying behavior & objections'],['demand','Demand signals'],['patterns','Search & content patterns']],
  business:[['models','Potential income models'],['startupReq','Startup requirements'],['rules','Platform rules'],['funding','Costs & funding needs'],['ops','Operational requirements'],['legal','Legal / ownership questions (research — verify, not legal advice)'],['location','Applicable location']],
  ad:[['hooks','Hooks'],['formats','Formats'],['demos','Demonstrations'],['messaging','Messaging & offers'],['cta','Calls to action'],['patternsAd','Creative patterns'],['evidence','Performance evidence (don\'t infer sales from views)']],
  platform:[['earn','Potential way to earn'],['account','Account or program needed'],['eligibility','Eligibility status'],['fees','Costs & fees'],['delivery','Fulfillment / delivery method'],['official','Official rules / source links']],
  local:[['area','Service area'],['equipment','Equipment & vehicle needs'],['pricing','Pricing research'],['insurance','Insurance & licensing questions'],['localRules','Local rules to verify'],['acquisition','Customer acquisition'],['readiness','Requirements reviewed?']],
  business0:[['bizType','Existing verified business / planned division / idea'],['structure','Ownership & structure notes (not assumed)']],
  trading:[['mode','Research / paper / live'],['verified','Verified or unverified'],['risk','Risk management notes']],
};
function templateFor(n){const top=topOf(n);const tl=top.label;const chain=[n,...nodeAncestors(n.id).map(node)].map(x=>x.label);
  if(chain.includes('Product Research'))return 'product';if(chain.includes('Competitor Research'))return 'competitor';if(chain.includes('Market Research'))return 'market';if(chain.includes('Business Research'))return 'business';if(chain.includes('Ad & Creative Research'))return 'ad';
  if(tl==='Digital Commerce & Marketplaces')return 'platform';if(tl==='Local & Property Services')return 'local';if(tl==='Existing Business & Expansion')return 'business0';if(tl==='Trading & Trading Systems')return 'trading';return null}
const BASIS=[['open','❓ Open question'],['user','✍ User-entered'],['estimate','≈ Estimate / assumption'],['verified','✔ Verified']];
const DECISIONS=['','research','test','pause','pursue','decline'];

function openCard(id){const n=node(id);if(!n)return;const c={sources:[],basis:{},extra:{},...(n.card||{})};const tpl=templateFor(n);const tf=tpl?TEMPLATES[tpl]:[];
  const field=(k,l,v,store)=>`<div class="cardf"><div class="row"><label class="f" for="cf_${k}" style="flex:1">${l}</label><select class="tiny" data-basis-of="${k}" aria-label="${l} basis" style="width:auto">${BASIS.map(([b,bl])=>`<option value="${b}" ${(c.basis[k]||(v?'user':'open'))===b?'selected':''}>${bl}</option>`).join('')}</select></div><textarea id="cf_${k}" data-store="${store}" rows="2">${esc(v||'')}</textarea></div>`;
  const anc=nodeAncestors(n.id).map(node).reverse().map(x=>x.label).join(' › ');
  const tasks=S.tasks.filter(t=>t.nodeId===n.id),notes=S.notes.filter(x=>x.nodeId===n.id),sugg=S.suggestions.filter(x=>x.nodeId===n.id);
  modal(`Research card · ${n.label}`,`<div class="tiny mute">${esc(anc||'Top-level category')} · ${KIND_LABEL[n.kind]||'Item'}${n.sample?' · <span class="sample">example — edit freely</span>':''}</div>
   <div class="row" style="margin-top:6px">${stPill(n.status)}${ownerPill(n.owner||'both')}${n.priority?`<span class="tag">⚑ ${n.priority}</span>`:''}${c.decision?`<span class="tag">Decision: ${c.decision}</span>`:''}<span class="tag">Last verified: ${c.lastVerified?esc(c.lastVerified):'Not verified'}</span></div>
   <div class="row"><div style="flex:1;min-width:140px"><label class="f" for="cfKind">Type</label><select id="cfKind">${Object.entries(KIND_LABEL).map(([k,l])=>`<option value="${k}" ${n.kind===k?'selected':''}>${l}</option>`).join('')}</select></div>
    <div style="flex:1;min-width:140px"><label class="f" for="cfPri">Priority</label><select id="cfPri">${PRIORITIES.map(p=>`<option value="${p}" ${n.priority===p?'selected':''}>${p||'—'}</option>`).join('')}</select></div>
    <div style="flex:1;min-width:140px"><label class="f" for="cfDec">Decision</label><select id="cfDec">${DECISIONS.map(d=>`<option value="${d}" ${c.decision===d?'selected':''}>${d||'— not decided —'}</option>`).join('')}</select></div></div>
   <p class="tiny mute">Each field shows where it came from: ✔ verified · ✍ user-entered · ≈ estimate · ❓ open question. Anything not checked is “Not verified”.</p>
   ${CARD_FIELDS.map(([k,l])=>field(k,l,c[k],'c')).join('')}
   ${tf.length?`<h3 style="margin:14px 0 4px">${{product:'Product research',competitor:'Competitor research',market:'Market research',business:'Business research',ad:'Ad & creative research',platform:'Platform details',local:'Local service details',business0:'Business status',trading:'Trading (kept separate from business income)'}[tpl]}</h3>${tf.map(([k,l])=>field('x_'+k,l,c.extra[k],'x')).join('')}`:''}
   <h3 style="margin:14px 0 4px">Sources & evidence</h3><div id="srcList">${c.sources.map((s2,i)=>srcRow(s2,i)).join('')}</div><button type="button" class="btn s" id="srcAdd">+ Source link</button>
   <label class="f" for="cfLV">Last verified date</label><input type="date" id="cfLV" value="${esc(c.lastVerified||'')}">
   <h3 style="margin:14px 0 4px">Work on it together</h3><div class="row"><button type="button" class="btn s" id="wfSplit">⇄ Split work A / B / Both</button><button type="button" class="btn s" id="wfNote">📝 Note</button><button type="button" class="btn s" id="wfSug">💬 Suggestion</button><button type="button" class="btn s" id="wfRev">📅 Schedule review</button><button type="button" class="btn s" id="wfRes">💵 Record result/cost</button></div>
   <div class="small" style="margin-top:6px">${tasks.length} tasks · ${notes.length} notes · ${sugg.length} suggestions</div>${resultsHTML(n)}`,
   [{t:'Save card',c:'p',f:()=>{saveCard(n.id,c)}}],{noFocus:true,onOpen:d=>{
     $('#srcAdd',d).onclick=()=>{c.sources=[...collectSources(d),{url:'',label:'',verified:false,date:''}];$('#srcList',d).innerHTML=c.sources.map((s2,i)=>srcRow(s2,i)).join('')};
     const keep=()=>{saveCard(n.id,c,true)};
     $('#wfSplit',d).onclick=()=>{keep();d.close();splitWork(n.id)};$('#wfNote',d).onclick=()=>{keep();editNote(null,{nodeId:n.id,title:n.label+' — '})};
     $('#wfSug',d).onclick=()=>{keep();editSuggestion(null,{nodeId:n.id})};$('#wfRes',d).onclick=()=>{keep();d.close();go('journey');jTab='money';render();setTimeout(()=>{const s3=$('#incB');if(s3)s3.value=n.id},50)};
     $('#wfRev',d).onclick=()=>{keep();editTask(null,{title:'Review & decide: '+n.label,owner:'both',nodeId:n.id})}}})}
const srcRow=(s,i)=>`<div class="row src" data-i="${i}" style="margin:4px 0"><input class="sU" placeholder="https://… or source name" value="${esc(s.url)}" style="flex:2;min-width:160px" aria-label="Source"><input class="sD" type="date" value="${esc(s.date||'')}" style="flex:1;min-width:120px" aria-label="Date checked"><label class="row tiny"><input type="checkbox" class="sV" ${s.verified?'checked':''}> verified</label></div>`;
function collectSources(d){return $$('.src',d).map(r=>({url:$('.sU',r).value.trim(),date:$('.sD',r).value,verified:$('.sV',r).checked})).filter(x=>x.url)}
function saveCard(id,c,quiet){const d=$('#dlg');const card={...c,basis:{...c.basis},extra:{...c.extra}};
  $$('[data-store]',d).forEach(t=>{const k=t.id.slice(3);if(t.dataset.store==='x')card.extra[k.slice(2)]=t.value.trim();else card[k]=t.value.trim()});
  $$('[data-basis-of]',d).forEach(s=>{card.basis[s.dataset.basisOf]=s.value});card.sources=collectSources(d);card.lastVerified=val('cfLV');const dec=val('cfDec');const prev=(node(id).card||{}).decision;card.decision=dec;
  commit(s=>{const n=s.nodes.find(x=>x.id===id);Object.assign(n,{card,kind:val('cfKind')||n.kind,priority:val('cfPri'),sample:false,lastReviewed:new Date().toISOString().slice(0,10)})},quiet?null:'Research card saved',dec&&dec!==prev?`decided to ${dec} “${node(id).label}”`:`updated the research card for “${node(id).label}”`)}
/* suggested division of work — roles are editable afterwards */
function splitWork(id){const n=node(id);const A=pname('A'),B=pname('B');
  modal(`Split work · ${n.label}`,`<p class="small">Creates these tasks linked to this opportunity. Edit or reassign any of them later.</p>
   <div class="col small"><b>${esc(A)}</b><label class="row"><input type="checkbox" class="sw" data-o="A" value="Research ${esc(n.label)} & save sources and requirements" checked> Research & save sources/requirements</label><label class="row"><input type="checkbox" class="sw" data-o="A" value="Estimate costs & list blockers for ${esc(n.label)}" checked> Estimate costs & identify blockers</label>
    <b style="margin-top:6px">${esc(B)}</b><label class="row"><input type="checkbox" class="sw" data-o="B" value="Draft the creative / service plan for ${esc(n.label)}" checked> Develop creative, service plan or workflow</label><label class="row"><input type="checkbox" class="sw" data-o="B" value="Review available assets & draft next steps for ${esc(n.label)}" checked> Review assets & create drafts</label>
    <b style="margin-top:6px">Both</b><label class="row"><input type="checkbox" class="sw" data-o="both" value="Review findings & decide whether to test ${esc(n.label)}" checked> Review findings & decide</label></div>`,
   [{t:'Create tasks',c:'p',f:()=>{const picks=$$('.sw:checked').map(c=>({title:c.value,owner:c.dataset.o}));if(!picks.length)return;
     commit(s=>{picks.forEach(p=>s.tasks.push({id:uid(),done:false,by:me(),dayId:null,time:'',mode:'',notes:'',nodeId:id,...p}));const m=s.nodes.find(x=>x.id===id);if(m.status==='idea')m.status='researching'},`${picks.length} tasks created`,`split work on “${n.label}”`)}}])}
function resultsHTML(n){const ids=new Set([n.id,...S.nodes.filter(x=>nodeAncestors(x.id).includes(n.id)).map(x=>x.id)]);const rows=S.income.filter(r=>ids.has(r.branch));if(!rows.length)return '<div class="tiny mute" style="margin-top:6px">No results recorded yet.</div>';
  const sum=k=>rows.filter(r=>k(r)).reduce((a,r)=>a+(+r.amount||0),0);const trading=sum(r=>r.kind==='trading');const inc=sum(r=>!isCost(r)&&r.kind!=='trading'&&r.kind!=='invoiced');const cost=sum(isCost);const inv=sum(r=>r.kind==='invoiced');
  return `<h3 style="margin:14px 0 4px">Results (recorded)</h3><div class="small">Money in: <b>${fmt$(inc)}</b> · Costs: <b>${fmt$(cost)}</b>${inv?` · Invoiced, unpaid: ${fmt$(inv)}`:''}</div>
   <div class="small">${cost?`Profit: <b>${fmt$(inc-cost)}</b> <span class="tiny mute">(from entered costs only)</span>`:'<span class="warn">Costs missing — profit not shown</span>'}</div>${trading?`<div class="small">Trading P&L (separate): ${fmt$(trading)}</div>`:''}`}
