const {chromium}=require('playwright');const fs=require('fs');const S=process.argv[2],O=process.argv[3];
const jobs=[['icon-full.svg',512,'icon-512.png'],['icon-full.svg',192,'icon-192.png'],['icon-full.svg',180,'apple-touch-icon.png'],
['icon-maskable.svg',512,'icon-maskable-512.png'],['icon-maskable.svg',192,'icon-maskable-192.png'],['badge.svg',96,'badge-96.png'],
['favicon.svg',16,'f16.png'],['favicon.svg',32,'f32.png'],['favicon.svg',48,'f48.png']];
(async()=>{const b=await chromium.launch();const p=await b.newPage();
for(const [src,sz,dst] of jobs){await p.setViewportSize({width:sz,height:sz});
 const d='data:image/svg+xml;base64,'+fs.readFileSync(S+'/'+src).toString('base64');
 await p.setContent(`<style>html,body{margin:0;background:transparent}</style><img src="${d}" width=${sz} height=${sz} style="display:block">`);
 await p.waitForTimeout(80);await p.screenshot({path:(dst.startsWith('f')&&dst.length<8?S:O)+'/'+dst,omitBackground:true});}
await b.close()})();
