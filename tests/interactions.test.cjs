/* DOM interaction checks run the shipped scripts against the actual HTML with LinkeDOM.
 * These verify behavior and state, not browser layout or rendering. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');
const root = path.resolve(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const flush = async () => { for(let i=0;i<8;i++) await new Promise(resolve=>setImmediate(resolve)); };
const settled = async element => {
  const deadline=Date.now()+10000;
  while(element.hasAttribute('aria-busy')&&Date.now()<deadline) await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(element.hasAttribute('aria-busy'),false,'the local check completes');
};

function mount(file='index.html', {reduced=true, blockedStorage=false}={}) {
  const {window,document} = parseHTML(read(file));
  const intervals=new Map(), observers=[], requests=[], storage=new Map();
  let timer=0, focus=document.body;
  Object.defineProperty(document,'activeElement',{get:()=>focus});
  Object.defineProperty(document,'hidden',{value:false,writable:true});
  Object.defineProperty(window.HTMLInputElement.prototype,'checked',{configurable:true,get(){return this.hasAttribute('checked');},set(value){if(value)this.setAttribute('checked','');else this.removeAttribute('checked');}});
  window.HTMLElement.prototype.focus=function(){focus=this;};
  window.HTMLElement.prototype.getBoundingClientRect=function(){return {top:120,bottom:220,left:0,right:300,width:300,height:100};};
  Object.defineProperty(window.HTMLElement.prototype,'offsetHeight',{get:()=>120,configurable:true});
  Object.defineProperty(window.HTMLElement.prototype,'offsetWidth',{get:()=>300,configurable:true});
  Object.defineProperty(window.HTMLElement.prototype,'clientWidth',{get:()=>300,configurable:true});
  for(const form of document.querySelectorAll('form')) Object.defineProperty(form,'elements',{value:Object.fromEntries([...form.querySelectorAll('[name]')].map(el=>[el.name,el]))});
  for(const select of document.querySelectorAll('select')) {
    let selected='us'; Object.defineProperty(select,'value',{get:()=>selected,set:v=>{selected=v;}});
  }
  const localStorage={getItem:k=>{if(blockedStorage)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(blockedStorage)throw Error('blocked');storage.set(k,v);},removeItem:k=>{if(blockedStorage)throw Error('blocked');storage.delete(k);}};
  class Observer { constructor(cb){this.cb=cb;observers.push(this);} observe(target){this.target=target;this.cb([{target,isIntersecting:true}],this);} disconnect(){} unobserve(){} }
  const c={window,document,location:{pathname:'/'+file,protocol:'https:',hostname:'sentinel.test',search:''},navigator:{language:'en-US',platform:'Linux',userAgent:'DOM Test'},
    localStorage,sessionStorage:localStorage,URL,URLSearchParams,AbortController,Response,Blob,DecompressionStream,TextDecoder,Uint8Array,
    matchMedia:()=>({matches:reduced,addEventListener(){}}),IntersectionObserver:Observer,
    setTimeout:fn=>{queueMicrotask(fn);return ++timer;},clearTimeout(){},
    setInterval:fn=>{const id=++timer;intervals.set(id,fn);return id;},clearInterval:id=>intervals.delete(id),
    requestAnimationFrame:fn=>{queueMicrotask(fn);},scrollTo(){},scrollY:0,innerHeight:900,
    getComputedStyle:()=>({scrollMarginTop:'96px'}),addEventListener:document.addEventListener.bind(document),
    fetch:async url=>{requests.push(url);throw Error('Unexpected network call '+url);}};
  window.IntersectionObserver=Observer; window.print=()=>{};
  vm.createContext(c);
  const run=script=>{vm.runInContext(read('assets/js/'+script),c,{filename:script});c.Site=window.Site;};
  run('static.js');run('boot.js');run('masks.js');window.SentinelMasks=c.SentinelMasks;run('site.js');
  if(file==='index.html')run('home.js');
  if(file==='practice.html')run('practice.js');
  if(file==='recover.html'){run('steps.js');run('recover.js');}
  const click=el=>el.dispatchEvent(new window.Event('click',{bubbles:true}));
  const event=(el,type,values={})=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,values);el.dispatchEvent(e);return e;};
  return {window,document,c,run,click,event,intervals,observers,requests,storage};
}

test('theme cycles Auto → Light → Dark → Auto, including blocked local storage', async () => {
  for(const blockedStorage of [false,true]) {
    const {document,click}=mount('pricing.html',{blockedStorage});
    const button=document.querySelector('[data-theme-toggle]');
    for(const mode of ['light','dark','auto']) {
      click(button);
      assert.equal(document.documentElement.dataset.theme,mode==='auto'?undefined:mode);
      assert.equal(button.dataset.mode,mode);
      assert.ok(button.getAttribute('aria-label').toLowerCase().includes(mode==='auto'?'automatic':mode));
    }
    await flush();
  }
});

test('menu state, Escape focus return, link close and current-page indication', async () => {
  const {document,click,event}=mount('pricing.html');
  const toggle=document.querySelector('[data-nav-toggle]'),nav=document.querySelector('[data-nav]');
  click(toggle);assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.ok(nav.classList.contains('is-open'));
  event(document,'keydown',{key:'Escape'});assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(document.activeElement,toggle);
  click(toggle);click(document.querySelector('.nav__links a'));assert.equal(toggle.getAttribute('aria-expanded'),'false');
  assert.equal(document.querySelector('.nav__links a[href="pricing.html"]').getAttribute('aria-current'),'page');
  await flush();
});

test('plan finder selects Free, Pro and Max from user choices with keyboard radio navigation', async () => {
  const {document,click,event}=mount('pricing.html');
  const recommended=()=>document.querySelector('.plan.is-recommended').dataset.planCard;
  assert.equal(recommended(),'pro');
  click(document.querySelector('[data-f-live="no"]'));assert.equal(recommended(),'free');
  assert.equal(document.querySelector('[data-f-hours]').disabled,true);
  click(document.querySelector('[data-f-email="yes"]'));assert.equal(recommended(),'max');
  event(document.querySelector('[data-f-email="yes"]'),'keydown',{key:'ArrowRight'});assert.equal(recommended(),'free');
  click(document.querySelector('[data-f-live="yes"]'));
  const hours=document.querySelector('[data-f-hours]');hours.value='40';event(hours,'input');assert.equal(recommended(),'max');
  assert.equal(document.querySelector('[data-f-hours-out]').textContent,'40 h');
  assert.equal(document.querySelectorAll('.plan__pick').length,1);
  await flush();
});

test('example tabs, replay and result selection work without a backend', async () => {
  const {document,click,event,requests}=mount();await flush();
  assert.equal(document.querySelectorAll('[data-serp] .res').length,5);
  assert.ok(document.querySelector('[data-v-why]').textContent.length>20);
  const crypto=document.querySelector('[data-query="crypto"]');click(crypto);await flush();
  assert.equal(crypto.getAttribute('aria-selected'),'true');
  assert.ok(document.querySelector('[data-query-text]').textContent.toLowerCase().includes('coinbase'));
  const first=document.querySelector('[data-serp] .res');event(first,'keydown',{key:'Enter'});
  assert.equal(first.getAttribute('aria-pressed'),'true');
  assert.ok(document.querySelector('[data-v-host]').textContent.includes('coinbase'));
  click(document.querySelector('[data-replay]'));await flush();
  assert.ok(document.querySelector('[data-serp] .res.is-selected'));
  assert.deepEqual(requests,[]);
});

test('all severity selections change the displayed example and use manual, paused cycling', async () => {
  const {document,click,event,intervals}=mount('index.html',{reduced:false});await flush();
  assert.equal(intervals.size,0,'no autoplay');
  const card=document.querySelector('[data-trio]');
  const yellow=card.querySelector('[data-sev="yellow"]');click(yellow);await flush();
  assert.equal(yellow.getAttribute('aria-pressed'),'true');
  assert.ok(card.querySelector('[data-example]').textContent.length>20);
  assert.ok(card.querySelector('img[data-tint="yellow"]').classList.contains('is-on'));
  event(yellow,'keydown',{key:'ArrowRight'});await flush();
  assert.equal(card.querySelector('[data-sev="orange"]').getAttribute('aria-pressed'),'true');
  click(card.querySelector('.severity-cycle'));assert.equal(intervals.size,1);
  [...intervals.values()][0]();await flush();
  assert.equal(card.querySelector('[data-sev="red"]').getAttribute('aria-pressed'),'true');
  document.hidden=true;event(document,'visibilitychange');assert.equal(intervals.size,0);
  assert.equal(card.querySelector('.severity-cycle').textContent,'Play stages');
});

test('local form shows an honest clean result, inline invalid feedback, and recovers', async () => {
  const {document,window,event}=mount();await flush();
  const form=document.querySelector('[data-try-form]'),input=form.elements.url,out=document.querySelector('[data-try-out]');
  // Use the actual engine and bundled word list, with no visited-site request.
  const words=fs.readFileSync(path.join(root,'assets/data/words.txt.gz'));
  const engineContext={window:{},document:{currentScript:{src:'https://sentinel.test/assets/js/engine.js'}},URL,Response,Blob,DecompressionStream,TextDecoder,Uint8Array,
    fetch:async url=>{assert.equal(url,'https://sentinel.test/assets/data/words.txt.gz');return new Response(words);}};
  vm.runInNewContext(read('assets/js/engine.js'),engineContext);
  window.SentinelEngine=engineContext.window.SentinelEngine;
  const append=document.head.appendChild.bind(document.head);
  document.head.appendChild=el=>{const added=append(el);if(el.tagName==='SCRIPT')queueMicrotask(()=>el.onload());return added;};
  input.value='https://www.wikipedia.org';event(form,'submit');await settled(out);await flush();
  assert.ok(out.textContent.includes('No warning signs in the address'));
  assert.ok(out.textContent.includes('Threat lists were not checked'));
  assert.equal(out.hasAttribute('aria-busy'),false);
  input.value='javascript:alert(1)';event(form,'submit');await flush();assert.equal(input.getAttribute('aria-invalid'),'true');
  input.value='https://paypal-account-verify.com/login';event(form,'submit');await settled(out);await flush();
  assert.equal(input.hasAttribute('aria-invalid'),false);assert.ok(out.textContent.includes('Scam'));
  assert.equal(form.querySelector('button').disabled,false);
});

test('the six-round game reveals evidence, ends and restarts', async () => {
  const {document,click}=mount();await flush();
  for(let i=0;i<6;i++) {
    click(document.querySelector('[data-answer="0"]'));
    assert.ok(document.querySelector('[data-game-reveal]').textContent.length>30);
    const next=document.querySelector('[data-next]');assert.ok(next);click(next);
  }
  assert.ok(document.querySelector('.game__end').textContent.includes('/ 600'));
  click(document.querySelector('[data-again]'));await flush();assert.equal(document.querySelectorAll('[data-answer]').length,4);
});

test('practice inbox advances all twelve messages, scores and resets', async () => {
  const {document,click}=mount('practice.html');
  for(let i=0;i<12;i++) {
    click(document.querySelector('[data-pick="scam"]'));
    assert.ok(document.querySelector('[data-practice-verdict]'));
    assert.equal(document.querySelector('[data-pick="real"]').disabled,true);
    click(document.querySelector('[data-practice-next]'));
  }
  assert.ok(document.querySelector('[data-practice-end]').textContent.includes('of 12'));
  click(document.querySelector('[data-practice-again]'));
  assert.equal(document.querySelector('[data-practice-count]').textContent,'Message 1 of 12');
  assert.ok(document.querySelector('[data-pick="real"]'));
  await flush();
});

test('recovery selection renders prioritized steps, tracks completion, changes country and clears local data', async () => {
  const {document,event,click,storage}=mount('recover.html');
  const pick=document.querySelector('[data-recover-picks] input[value="card"]');pick.checked=true;event(pick,'change');
  const step=document.querySelector('[data-step="card"]');assert.ok(step);
  assert.ok(document.querySelector('[data-recover-plan]').textContent.includes('Right now'));
  step.checked=true;event(step,'change');assert.ok(document.querySelector('[data-recover-progress]').textContent.startsWith('1 of'));
  const country=document.querySelector('[data-recover-country]');country.value='ca';event(country,'change');
  assert.ok(document.querySelector('[data-recover-report]').textContent.includes('Canadian Anti-Fraud'));
  assert.ok(storage.has('sentinel:recover'));
  click(document.querySelector('[data-recover-reset]'));assert.equal(storage.has('sentinel:recover'),false);
  assert.equal(document.querySelectorAll('[data-recover-picks] input:checked').length,0);
  assert.ok(document.querySelector('.recover__empty'));
  await flush();
});
