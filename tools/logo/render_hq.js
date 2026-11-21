// Supersampled render: draw each SVG at 4x (min 1024px) then downscale with Lanczos in Python.
const {chromium}=require('playwright');const fs=require('fs');const S=process.argv[2],O=process.argv[3];
const jobs=[['icon-full.svg',1024,'icon-1024.png'],['icon-full.svg',512,'icon-512.png'],['icon-full.svg',192,'icon-192.png'],['icon-full.svg',180,'apple-touch-icon.png'],
['icon-maskable.svg',1024,'icon-maskable-1024.png'],['icon-maskable.svg',512,'icon-maskable-512.png'],['icon-maskable.svg',192,'icon-maskable-192.png'],['badge.svg',96,'badge-96.png'],
['favicon.svg',16,'f16.png'],['favicon.svg',32,'f32.png'],['favicon.svg',48,'f48.png'],['favicon.svg',64,'f64.png']];
(async()=>{const b=await chromium.launch();const p=await b.newPage();const plan=[];
for(const [src,sz,dst] of jobs){const big=Math.max(sz*4,2048);await p.setViewportSize({width:big,height:big});
 const d='data:image/svg+xml;base64,'+fs.readFileSync(S+'/'+src).toString('base64');
 await p.setContent(`<style>html,body{margin:0;background:transparent}</style><img src="${d}" width=${big} height=${big} style="display:block">`);
 await p.waitForTimeout(150);const raw=`${S}/raw_${dst}`;await p.screenshot({path:raw,omitBackground:true});
 plan.push([raw,sz,(/^f\d+\.png$/.test(dst)?S:O)+'/'+dst]);}
fs.writeFileSync(S+'/plan.json',JSON.stringify(plan));await b.close()})();
