/* Rendered QA, intended for local review or the private dev repository's CI.
 * No deployment, external requests, backend, credentials or production mutation. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
const output = path.join(root,'test-results');
const pages=['index','pricing','download','practice','recover','privacy','terms','refunds','404'];
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.gz':'application/octet-stream'};

(async()=>{
  fs.mkdirSync(output,{recursive:true});
  let server, browser;
  try {
    let base=process.env.SENTINEL_BASE_URL;
    if(!base) {
      server=http.createServer((req,res)=>{
        const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
        const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
        if(!file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
        fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});
      });
      await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
      base=`http://127.0.0.1:${server.address().port}`;
    }
    browser=await chromium.launch({...process.env.SENTINEL_CHROMIUM?{executablePath:process.env.SENTINEL_CHROMIUM}:{},args:['--use-angle=swiftshader']});
    const failures=[],network=[],results=[];
    // Both themes, all pages, small phone through wide desktop plus landscape.
    for(const width of [375,768,1024,1440,812]) {
      for(const theme of ['dark','light']) {
        const context=await browser.newContext({viewport:{width,height:width===812?375:900},colorScheme:theme,reducedMotion:'reduce'});
        await context.route('**/*',route=>{
          if(!route.request().url().startsWith(base)) {network.push(route.request().url());return route.abort();}
          return route.continue();
        });
        const page=await context.newPage();
        page.on('pageerror',error=>failures.push(error.message));
        for(const name of pages) {
          await page.goto(`${base}/${name}.html`);await page.evaluate(()=>document.fonts.ready);
          if(name==='index') {
            await page.waitForFunction(()=>document.querySelector('[data-scene] img').complete&&document.querySelector('[data-scene] img').naturalWidth>0);
            const art=await page.locator('[data-scene] img').evaluate(el=>el.currentSrc);
            assert.ok(art.includes(`sentinel-${theme}-${width<=800?'portrait':'desktop'}.webp`),`${width}px ${theme} selects the matching scene`);
            assert.equal(await page.locator('script[src$="/hero-scene.js"]').count(),0,'reduced motion does not download the 3D bundle');
          }
          assert.equal(await page.locator('h1').count(),1,`${name}: heading`);
          const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
          assert.equal(overflow,false,`${name}: ${width}px ${theme} horizontal overflow`);
          const hidden=await page.evaluate(()=>[...document.querySelectorAll('h1,h2')].filter(el=>getComputedStyle(el).opacity==='0').map(el=>el.textContent));
          assert.deepEqual(hidden,[],`${name}: hidden headings`);
          if(name==='index'||name==='pricing'||name==='practice'||name==='recover') await page.screenshot({path:path.join(output,`${name}-${width}-${theme}.png`),fullPage:true});
          results.push({page:name,width,theme,overflow:false});
        }
        await context.close();
      }
    }
    const context=await browser.newContext({viewport:{width:375,height:812},colorScheme:'dark',reducedMotion:'reduce'});
    const page=await context.newPage();page.on('pageerror',error=>failures.push(error.message));
    await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
    await page.goto(`${base}/index.html`);
    const menu=page.locator('[data-nav-toggle]');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
    await page.locator('[data-theme-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.waitForFunction(()=>document.querySelector('[data-scene] img').currentSrc.includes('sentinel-light-portrait.webp'));
    await page.locator('[data-theme-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.waitForFunction(()=>document.querySelector('[data-scene] img').currentSrc.includes('sentinel-dark-portrait.webp'));
    await page.mouse.move(100,200);
    assert.equal(await page.locator('[data-scene]').evaluate(el=>getComputedStyle(el).transform),'none','reduced motion freezes the scene');
    await page.setViewportSize({width:1440,height:900});
    await page.locator('a[href="#stage-demo"]').click();
    await page.locator('[data-serp] .res[role="button"]').first().waitFor();
    await page.locator('[data-query="crypto"]').click();await page.locator('[data-serp] .res').first().click();
    assert.ok((await page.locator('[data-v-host]').innerText()).includes('coinbase'));
    await page.locator('[data-replay]').click();
    const mask=page.locator('[data-trio]').first();await mask.locator('[data-sev="yellow"]').click();assert.equal(await mask.locator('[data-sev="yellow"]').getAttribute('aria-pressed'),'true');
    assert.equal(await mask.locator('img[data-tint="yellow"]').isVisible(),true);
    await page.locator('[data-try-form] input').fill('https://www.wikipedia.org');await page.locator('[data-try-form] button').click();
    await page.getByRole('heading',{name:'No warning signs in the address'}).waitFor();
    assert.ok((await page.locator('[data-try-out]').innerText()).includes('Threat lists were not checked'));
    await page.locator('[data-try-form] input').fill('javascript:alert(1)');await page.locator('[data-try-form] button').click();
    await page.locator('[data-try-form] input[aria-invalid="true"]').waitFor();
    await page.goto(`${base}/pricing.html`);await page.locator('[data-f-live="no"]').click();assert.equal(await page.locator('.plan.is-recommended').getAttribute('data-plan-card'),'free');
    await page.locator('[data-f-email="yes"]').click();assert.equal(await page.locator('.plan.is-recommended').getAttribute('data-plan-card'),'max');
    await page.setViewportSize({width:375,height:812});
    await page.goto(`${base}/index.html#game`);
    for(let i=0;i<6;i++){await page.locator('[data-answer="0"]').click();await page.locator('[data-next]').click();}
    await page.locator('[data-again]').click();assert.equal(await page.locator('[data-answer]').count(),4);
    await page.goto(`${base}/practice.html`);
    for(let i=0;i<12;i++){await page.locator('[data-pick="scam"]').click();await page.locator('[data-practice-next]').click();}
    assert.ok((await page.locator('[data-practice-end]').innerText()).includes('of 12'));await page.locator('[data-practice-again]').click();
    await page.goto(`${base}/recover.html`);await page.locator('[data-recover-picks] input[value="card"]').check();await page.locator('[data-step="card"]').check();
    assert.ok((await page.locator('[data-recover-progress]').innerText()).startsWith('1 of'));
    await page.locator('[data-recover-country]').selectOption('ca');assert.ok((await page.locator('[data-recover-report]').innerText()).includes('Canadian Anti-Fraud'));
    await page.locator('[data-recover-reset]').click();assert.equal(await page.locator('[data-step]').count(),0);
    await page.goto(`${base}/download.html`);assert.equal(await page.locator('[data-installer]').getAttribute('href'),null);
    await context.close();
    const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812},colorScheme:'light'});
    const plain=await noJS.newPage();await plain.goto(`${base}/index.html`);assert.equal(await plain.locator('h1').isVisible(),true);assert.ok((await plain.locator('main').innerText()).includes('needs JavaScript'));
    assert.ok((await plain.locator('[data-scene] img').evaluate(el=>el.currentSrc)).includes('sentinel-light-portrait.webp'),'light poster works without JavaScript');await noJS.close();
    const motion=await browser.newContext({viewport:{width:1440,height:900},colorScheme:'dark',reducedMotion:'no-preference'});
    const moving=await motion.newPage();moving.on('pageerror',error=>failures.push(error.message));
    await motion.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
    await moving.goto(`${base}/index.html`);
    await moving.waitForFunction(()=>document.querySelector('.hero--reveal').dataset.renderer==='ready');
    assert.equal(await moving.locator('.hero--reveal').getAttribute('data-motion'),'running');
    await moving.locator('[data-motion-toggle]').click();
    assert.equal(await moving.locator('.hero--reveal').getAttribute('data-motion'),'paused');
    await moving.locator('#stage-demo').scrollIntoViewIfNeeded();
    await moving.locator('#top').scrollIntoViewIfNeeded();
    assert.equal(await moving.locator('.hero--reveal').getAttribute('data-motion'),'paused','manual pause survives leaving the hero');
    await moving.locator('[data-motion-toggle]').click();
    await moving.waitForFunction(()=>document.querySelector('.hero--reveal').dataset.motion==='running');
    await moving.mouse.move(1200,400);
    const offset=await moving.locator('[data-scene]').evaluate(el=>parseFloat(el.style.getPropertyValue('--scene-x')));
    assert.ok(Number.isFinite(offset)&&Math.abs(offset)<=6,'pointer offset is bounded');
    await moving.mouse.move(10,10);
    assert.equal(await moving.locator('[data-scene]').evaluate(el=>el.style.getPropertyValue('--scene-x')),'0px','pointer leave resets the scene');
    await moving.locator('#stage-demo').scrollIntoViewIfNeeded();
    await moving.waitForFunction(()=>document.querySelector('.hero--reveal').dataset.motion==='resting');
    await moving.locator('#top').scrollIntoViewIfNeeded();
    await moving.emulateMedia({reducedMotion:'reduce'});
    await moving.waitForFunction(()=>document.querySelector('.hero--reveal').dataset.motion==='reduced');
    assert.equal(await moving.locator('[data-motion-toggle]').isVisible(),false);
    await motion.close();
    const copies=await browser.newContext({viewport:{width:375,height:812},colorScheme:'dark',reducedMotion:'reduce'});
    const copyPage=await copies.newPage();
    await copyPage.addInitScript(()=>{sessionStorage.removeItem('sentinel:hero-preset');const i=Number(new URLSearchParams(location.search).get('copy-test'));Math.random=()=>(i+.5)/12;});
    for(let index=0;index<12;index++){
      await copyPage.goto(`${base}/index.html?copy-test=${index}`);
      assert.equal(Number(await copyPage.locator('.hero--reveal').getAttribute('data-copy-preset')),index);
      assert.equal(await copyPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`copy preset ${index} fits phone width`);
      const heading=await copyPage.locator('h1').boundingBox();
      assert.ok(heading.height<150,`copy preset ${index} stays on two lines`);
      const action=await copyPage.locator('.hero--reveal .hero__cta a[href="#try"]').boundingBox();
      assert.ok(action.y+action.height<=813,`copy preset ${index} keeps the checker action in the first phone view`);
    }
    await copies.close();
    const refresh=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
    const refreshed=await refresh.newPage();await refreshed.goto(`${base}/index.html`);
    let previous=await refreshed.locator('.hero--reveal').getAttribute('data-copy-preset');
    for(let i=0;i<5;i++){
      await refreshed.reload();const next=await refreshed.locator('.hero--reveal').getAttribute('data-copy-preset');
      assert.notEqual(next,previous,'refresh picks a different preset');previous=next;
    }
    await refresh.close();
    const noGL=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'no-preference'});
    await noGL.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args);};});
    const staticHero=await noGL.newPage();await staticHero.goto(`${base}/index.html`);
    await staticHero.waitForFunction(()=>document.querySelector('.hero--reveal').dataset.renderer==='fallback');
    assert.equal(await staticHero.locator('[data-scene] img').isVisible(),true,'poster replaces unavailable WebGL');
    assert.equal(await staticHero.locator('h1').isVisible(),true);await noGL.close();
    const failedArt=await browser.newContext({viewport:{width:375,height:812},colorScheme:'dark'});
    await failedArt.route('**/assets/img/scene/**',route=>route.abort());
    const fallback=await failedArt.newPage();await fallback.goto(`${base}/index.html`);
    assert.equal(await fallback.locator('h1').isVisible(),true,'headline survives failed poster');
    assert.equal(await fallback.locator('.hero--reveal .hero__cta a[href="#try"]').isVisible(),true,'checker action survives failed poster');
    await failedArt.close();
    assert.deepEqual(failures,[],'page runtime errors');assert.deepEqual(network,[],'no external requests in preview');
    fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify({status:'passed',views:results,interactions:'passed'},null,2));
    console.log(`Passed ${results.length} page/theme/viewport checks and browser interactions.`);
  } finally { if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
