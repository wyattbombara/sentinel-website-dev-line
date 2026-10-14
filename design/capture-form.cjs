/* Export an authored study frame from a running local preview; never changes runtime assets. */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({...(process.env.SENTINEL_CHROMIUM?{executablePath:process.env.SENTINEL_CHROMIUM}:{}),args:['--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  await page.goto((process.env.SENTINEL_BASE_URL||'http://127.0.0.1:8765')+'/index.html?motion=on&capture-scene=1');
  await page.waitForFunction(()=>document.querySelector('[data-kinetic-hero]').dataset.renderer==='webgl');
  const data=await page.evaluate(()=>window.SentinelStage.capture(0));
  const folder=path.join(__dirname,'study-renders');fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'afterimage-form.png'),Buffer.from(data.split(',')[1],'base64'));
  console.log('Captured design/study-renders/afterimage-form.png');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
