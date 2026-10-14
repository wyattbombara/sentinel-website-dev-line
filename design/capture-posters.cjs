/* Generate fallback artwork from the exact runtime scene. Run a local static server first. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({...(process.env.SENTINEL_CHROMIUM?{executablePath:process.env.SENTINEL_CHROMIUM}:{}),args:['--use-angle=swiftshader']});
 try {
  for(const theme of ['dark','light'])for(const portrait of [false,true]){
   const width=portrait?900:1600,height=portrait?1200:1000;
   const context=await browser.newContext({viewport:{width:portrait?600:1600,height:1200},colorScheme:theme,reducedMotion:'reduce',deviceScaleFactor:1});
   const page=await context.newPage();
   await page.goto((process.env.SENTINEL_BASE_URL||'http://127.0.0.1:8765')+'/index.html?capture-scene=1');
   await page.waitForFunction(()=>typeof window.SentinelSceneCapture==='function');
   await page.evaluate(({width,height})=>{
     const host=document.querySelector('[data-scene]');
     Object.assign(host.style,{width:width+'px',height:height+'px',inset:'0',transform:'none'});
   },{width,height});
   await page.waitForFunction(({width,height})=>{const c=document.querySelector('[data-scene] canvas');return c.width===width&&c.height===height;},{width,height});
   const data=await page.evaluate(()=>window.SentinelSceneCapture());
   const name=`sentinel-${theme}-${portrait?'portrait':'desktop'}.png`;
   fs.writeFileSync(path.join(root,'assets/img/scene',name),Buffer.from(data.split(',')[1],'base64'));
   console.log('Captured',name);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
