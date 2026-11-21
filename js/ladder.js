'use strict';
/* ===== Easy → hard ladders for every idea =====
   Each idea climbs 4 rungs: a 10–15 minute quick win, an hour-ish first real piece, a bigger push,
   then the result (first client, payout, sale). Recommendations only offer rungs up to your current
   "stage", which rises as you finish ladder steps: two quick wins unlock the next level of difficulty. */

/* rung: [goal, minutes, actions, go?]  {x} {y} {o} {s} {c} are filled from the idea's vars */
const TRACKS={
 clip:[
  ['Find 3 open clipping campaigns',10,['Open the clipping sites or Discords you use','Write down 3 open campaigns and their pay per 1k views','Add the best one in Clipping Campaigns (⚡ Autofill can read pasted page text)'],['✂ Open Clipping Campaigns','clips']],
  ['Cut and post our first clip',45,['Pick one strong 20–40 second moment from the source','Edit it vertical with big captions','Post it and save the link on the campaign'],['✂ Open Clipping Campaigns','clips']],
  ['Post 5 clips for one campaign',240,['Find 5 more strong moments','Post them at different times of day','After 48 hours, note which got the most views']],
  ['Earn first payout from a clipping campaign',10080,['Submit the clips that passed the view minimum','Check the payout date on the campaign','Record the payout under Income when it lands'],['💰 Open Income','journey:money']]],
 service:[
  ['List 5 {x} we could offer {o} to',15,['Search for 5 {x} that post often but could use {o}','Save their names and contact links in Notes','Star the one you like most']],
  ['Make one free sample {s}',60,['Take one piece of their content (or film their place)','Make a short sample {s} for them','Save it somewhere you can share a link']],
  ['Send our offer to 5 {x}',120,['Write 3 lines: what you noticed, your sample link, your price','Send it to all 5','Add a follow-up task for 3 days later']],
  ['Land our first {c} client',10080,['Follow up with anyone who hasn\'t replied','Agree the price and exactly what you deliver','Deliver, then ask for a short testimonial']]],
 ugc:[
  ['Find 5 {x} that use UGC',15,['Search TikTok or Instagram for {k} ads that use real people','Save 5 brands and how they use creators','Pick the 3 you would most like to work with']],
  ['Film one UGC sample video',60,['Grab a product you already own in that niche','Film hook → show it in use → result, under 30 seconds','Edit with captions and save it']],
  ['Pitch 5 {x}',120,['Write 3 lines: who you are, your sample, a simple offer','Send it to your 5 saved brands','Add a follow-up task for 3 days later']],
  ['Land first paid UGC client',10080,['Follow up once with everyone who hasn\'t replied','Agree price, number of videos and usage rights','Deliver on time and ask for a testimonial']]],
 affiliate:[
  ['Shortlist 3 {x} to promote',15,['Open the TikTok Shop affiliate centre or Amazon best sellers','Find 3 {x} with 4★+ reviews and a decent commission','Save them in Notes']],
  ['Film one {y} demo video',60,['Use something you own, or order the cheapest pick','Film the problem, the product, the result','Edit to under 30 seconds with captions']],
  ['Post 5 {y} videos',300,['Make 4 more with different hooks','Add affiliate links where allowed, with a disclosure','After 48 hours, note which got the most views']],
  ['Earn first commission from {y} videos',10080,['Make more of your best-performing style','Request free samples for your top product','Record the commission under Income'],['💰 Open Income','journey:money']]],
 channel:[
  ['Pick a niche and save 5 example channels',15,['Choose one niche you could make 50 videos about','Save 5 faceless channels doing well in it','Note what their best videos have in common']],
  ['Script and make our first short',60,['Write a 30-second script with a strong first line','Make it with voiceover, stock clips or screen recording','Add captions and save it']],
  ['Publish 10 shorts',600,['Batch-write 9 more scripts','Post one a day','Note views after each one']],
  ['Reach 1,000 views on one video',20160,['Remake your best video with a sharper hook','Keep posting daily','Check analytics for where viewers drop off']]],
 digital:[
  ['Check 5 best-selling {x}s like ours',15,['Search Etsy or Gumroad for {x}s in your idea','Note their prices and what reviews praise','Write one way yours will be better']],
  ['Draft the first version of our {x}',120,['Outline the sections or pages','Build a rough first version','Ask your partner for 2 changes']],
  ['List our {x} for sale',90,['Make 3 preview images','Write a short description and price it','Publish the listing']],
  ['Make our first {x} sale',10080,['Share it in 2 places your buyers hang out','Make one short video showing it','Record the sale under Income'],['💰 Open Income','journey:money']]],
 stock:[
  ['Pick our 10 best existing clips',15,['Look through footage you already have','Pick 10 sharp, steady clips with no logos or faces','Put them in one folder']],
  ['Open a contributor account and upload 5',60,['Sign up on one stock site','Upload 5 clips','Add clear titles and keywords']],
  ['Get 25 clips approved',4320,['Upload 20 more','Fix any that were rejected','Note which subjects get approved']],
  ['Make our first stock sale',20160,['Keep uploading weekly','Shoot more of the subjects that sell','Record the sale under Income']]],
 local:[
  ['Price a basic {x} package',15,['Look up 3 local competitors\' prices','Pick one simple package and a price','Write exactly what is included']],
  ['Post our offer in 2 local groups',30,['Take 2 good photos (before/after if you can)','Write a short post with price and how to book','Post it in 2 local groups']],
  ['Book our first {x} job',4320,['Reply to every message within an hour','Confirm the date, address and price','Do the job and take after photos']],
  ['Book 3 paid {x} jobs',10080,['Ask your first customer for a review','Post the before/after photos','Offer a small referral discount']]],
 gig:[
  ['Sign up on one {x} platform',15,['Pick one well-known {x} platform','Create your account','Read the style guide']],
  ['Pass the platform test',60,['Practise with one sample file','Take the test carefully','Note your result']],
  ['Finish our first paid {x} job',240,['Pick a short, clear file','Follow the style guide','Submit and check feedback']],
  ['Get our first {x} payout',10080,['Do a few jobs a day','Keep your accuracy high','Record the payout under Income'],['💰 Open Income','journey:money']]],
};
/* idea id → [track, vars, optional first-rung override] */
const IDEA_LADDER={
 't-ugc-beauty':['ugc',{x:'skincare & beauty brands',k:'skincare'}],
 't-ugc-tiktokshop':['ugc',{x:'TikTok Shop sellers',k:'TikTok Shop'}],
 't-clip-stream':['clip',{}],
 't-clip-podcast':['service',{x:'podcasts',o:'clips',s:'clip',c:'podcast clipping'}],
 't-local-video':['service',{x:'local businesses',o:'short videos',s:'video',c:'local video'}],
 't-ai-content':['service',{x:'creators',o:'edited shorts',s:'edit',c:'editing'}],
 't-amazon-reviews':['affiliate',{x:'products to compare',y:'comparison'}],
 't-faceless':['channel',{}],
 't-templates':['digital',{x:'template'}],
 'p-digital':['digital',{x:'guide'}],
 't-stock':['stock',{}],
 't-detailing':['local',{x:'detailing'}],
 't-transcription':['gig',{x:'transcription'}],
 'p-beauty-minis':['affiliate',{x:'beauty minis',y:'beauty'}],
 'p-kitchen':['affiliate',{x:'kitchen gadgets',y:'kitchen gadget'}],
 'p-home-org':['affiliate',{x:'home organisation products',y:'home organisation'}],
 'p-pets':['affiliate',{x:'pet products',y:'pet product'}],
 'p-phone':['affiliate',{x:'phone & desk accessories',y:'accessory'}],
 'p-fitness':['affiliate',{x:'fitness accessories',y:'fitness gear'}],
 'p-car':['affiliate',{x:'car accessories',y:'car accessory'}],
 'p-decor':['affiliate',{x:'room decor products',y:'room decor'}],
 'p-walmart':['affiliate',{x:'Walmart picks',y:'Walmart pick'},['Check Walmart Creator eligibility',10,['Open the Walmart Creator page','Check the follower and content requirements','Note what you still need, if anything']]],
};
const fillVars=(t,v)=>t.replace(/\{(\w)\}/g,(_,k)=>v[k]||'');
function ladderFor(id){const L=IDEA_LADDER[id];if(!L)return [];const [tr,v,first]=L;
  return TRACKS[tr].map((r,i)=>{const src=i===0&&first?first:r;return {r:i+1,goal:fillVars(src[0],v),mins:src[1],actions:src[2].map(a=>fillVars(a,v)),go:src[3]||r[3]||null}})}
const timeLabel=m=>m<60?`${m} min`:m<=240?`~${Math.round(m/60)} hr${m>=90?'s':''}`:m<=1440?'about a day':m<=4320?'a few days':m<=10080?'1–2 weeks':'2+ weeks';
const LEVEL_NAME=['','Quick win','First real step','Bigger push','Result'];
/* how far each idea has climbed, from skills tagged with ladder info (or matching titles) */
function ladderState(id){const rungs=ladderFor(id);const low=t=>String(t||'').toLowerCase();
  const sk=r=>S.skills.find(s=>(s.ladder&&s.ladder.idea===id&&s.ladder.r===r.r)||low(s.title)===low(r.goal));
  const marks=rungs.map(r=>{const s=sk(r);return {...r,skill:s||null,done:!!(s&&s.status==='done')}});
  const next=marks.find(m=>!m.done)||null;return {rungs:marks,next,doneCount:marks.filter(m=>m.done).length}}
/* stage = highest rung you are ready for: 1 at first, +1 for every 2 ladder steps finished */
function ladderStage(){const n=S.skills.filter(s=>s.ladder&&s.status==='done').length;return {stage:Math.min(4,1+Math.floor(n/2)),done:n,toNext:n>=6?0:2-(n%2)}}
function rungMeta(id,r){const x=ladderFor(id)[r-1];return x?{idea:id,r}:null}
