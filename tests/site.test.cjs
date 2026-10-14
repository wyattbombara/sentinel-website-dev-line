const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('all local HTML links, fragments and asset references resolve', () => {
  const failures = [];
  for (const file of fs.readdirSync(root).filter(f => f.endsWith('.html'))) {
    const html = read(file);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `Duplicate IDs in ${file}`);
    for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|data:)/.test(value)) continue;
      const url = new URL(value, `https://test.invalid/${file}`);
      const target = url.pathname.slice(1) || 'index.html';
      if (!fs.existsSync(path.join(root, target))) { failures.push(`${file}: ${value}`); continue; }
      if (url.hash && target.endsWith('.html') && !read(target).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)) failures.push(`${file}: ${value}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('every script parses, including inline scripts', () => {
  for (const file of fs.readdirSync(path.join(root, 'assets/js'), { recursive: true }).filter(f => f.endsWith('.js'))) new vm.Script(read(`assets/js/${file}`), {filename:file});
  for (const file of fs.readdirSync(root).filter(f => f.endsWith('.html'))) {
    for (const [, attrs, script] of read(file).matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (attrs.includes('application/ld+json')) JSON.parse(script); else new vm.Script(script, {filename:file});
    }
  }
});

test('pricing has four distinct plans with the requested monthly prices', () => {
  const cards = [...read('index.html').matchAll(/<article class="plan[^\"]*"[\s\S]*?<\/article>/g)].map(m=>m[0]);
  assert.equal(cards.length, 4);
  for (const [name, price] of [['Free','0'], ['Pro','15'], ['Max','40'], ['Ultimate','100']]) {
    const card = cards.find(c => c.includes(`class="plan__name">${name}<`));
    assert.ok(card?.includes(`<b>$${price}</b>`), name);
  }
  assert.ok(cards[3].includes('Everything in Max'));
  assert.ok(cards[3].includes('500'));
});


test('all nine pages share the accessible shell and honest preview status', () => {
  const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));
  assert.equal(pages.length, 9);
  for (const file of pages) {
    const html = read(file);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
    assert.ok(html.includes('href="#main"'), `${file}: skip link`);
    assert.ok(html.includes('aria-controls="primary-navigation"'), file);
    assert.ok(html.includes('assets/css/afterimage.css'), file);
    assert.ok(html.includes('data-theme-toggle'), file);
    assert.ok(html.includes('<footer'), file);
    assert.ok(!/<script[^>]+(?:intro|cosmos|motion|lux|hover|binary)\.js/.test(html), file);
    assert.ok(!html.includes('Sentinel live'), file);
    assert.ok(!html.includes('user-scalable=no'), file);
  }
});

test('download is disabled in the HTML and cannot activate from a network response', () => {
  const html = read('download.html');
  const anchor = html.match(/<a\b[^>]*data-installer[^>]*>/)[0];
  assert.ok(anchor.includes('aria-disabled="true"'));
  assert.ok(!/\bhref=/.test(anchor));
  let requested = false;
  const attrs = new Map([['href','https://example.invalid/download']]);
  const button = {removeAttribute:key=>attrs.delete(key),setAttribute:(k,v)=>attrs.set(k,v),classList:{add(){}}};
  vm.runInNewContext(read('assets/js/download.js'), {document:{querySelector:()=>button}, fetch:()=>{requested = true;}});
  assert.equal(requested, false);
  assert.equal(attrs.get('aria-disabled'), 'true');
  assert.equal(attrs.has('href'), false);
});

function engine(fetcher) {
  const c = {window:{}, document:{currentScript:{src:'https://sentinel.test/assets/js/engine.js'}},
    URL, Response, Blob, DecompressionStream, TextDecoder, Uint8Array, fetch:fetcher};
  vm.runInNewContext(read('assets/js/engine.js'), c);
  return c.window.SentinelEngine;
}

test('the real local URL engine loads only its bundled word list and finds address warnings', async () => {
  const calls = [];
  const scanner = engine(async url => {
    calls.push(url);
    assert.equal(url, 'https://sentinel.test/assets/data/words.txt.gz');
    return new Response(fs.readFileSync(path.join(root,'assets/data/words.txt.gz')));
  });
  for (const raw of ['https://www.wikipedia.org', 'https://paypal-account-verify.com/login', 'https://files-share.site/Invoice.pdf.exe']) {
    const v = await scanner.scan(raw);
    assert.equal(v.ok,true,raw); assert.equal(v.local,true);
    assert.equal(Boolean(v.partial),false);
    if (raw.includes('pdf.exe')) assert.ok(v.threats.virus.badge);
    if (raw.includes('paypal-account')) assert.ok(v.threats.scam.badge);
    if (raw.includes('wikipedia')) assert.equal(v.overall.badge,null);
  }
  assert.equal(calls.length,1);
});

test('invalid URL schemes are rejected and failed local data loads can recover', async () => {
  let calls = 0;
  const scanner = engine(async () => {
    calls++;
    if (calls === 1) throw new Error('offline');
    return new Response(fs.readFileSync(path.join(root,'assets/data/words.txt.gz')));
  });
  assert.equal((await scanner.scan('javascript:alert(1)')).ok,false);
  assert.equal((await scanner.scan('https://paypal-account-verify.com/login')).ok,true);
  assert.ok(calls >= 2);
});

test('practice has twelve messages with valid clues and correct scoring', () => {
  const practice = require('../assets/js/practice.js');
  assert.equal(practice.MESSAGES.length,12);
  const perfect = Object.fromEntries(practice.MESSAGES.map(m=>[m.id,m.scam?'scam':'real']));
  assert.deepEqual(practice.score(perfect),{right:12,total:12,missed:[]});
  for (const m of practice.MESSAGES) {
    assert.ok(practice.clueOrder(m).length > 0);
    for (const key of practice.clueOrder(m)) assert.ok(m.clues[key]?.why);
  }
  const first = practice.MESSAGES[0];
  const wrong = {[first.id]:first.scam?'real':'scam'};
  assert.equal(practice.score(wrong).right,0);
  assert.deepEqual(practice.score(wrong).missed,[first.id]);
});

test('recovery deduplicates steps, prioritizes immediate action, and filters unrecognized inputs', () => {
  const recovery = require('../assets/js/recover.js');
  const steps = recovery.plan(['password','code','remote','card','remote']);
  assert.equal(new Set(steps.map(s=>s.id)).size,steps.length);
  assert.equal(steps[0].id,'stop');
  assert.ok(steps.find(s=>s.id==='offline'));
  assert.ok(steps.find(s=>s.id==='card'));
  assert.ok(steps.every((s,i)=>i===0 || s.when>=steps[i-1].when));
  assert.deepEqual(recovery.happenedFrom('?happened=password,remote,password,unknown'),['password','remote']);
  assert.deepEqual(recovery.plan([]),[]);
});

test('both theme palettes meet normal text contrast on primary and card surfaces', () => {
  const css = read('assets/css/afterimage.css');
  const blocks = [css.match(/:root\s*{([\s\S]*?)}/)[1],css.match(/:root\[data-theme="light"\]\s*{([\s\S]*?)}/)[1]];
  const lum = hex => {
    if (hex.length===4) hex='#'+hex.slice(1).split('').map(c=>c+c).join('');
    const c = hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return .2126*c[0]+.7152*c[1]+.0722*c[2];
  };
  for (const block of blocks) {
    const values = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{3,6})\s*;/g)].map(m=>[m[1],m[2]]));
    for (const fg of ['text','text-2','muted','gold-400','yellow','orange','red','green']) {
      for (const bg of ['bg','surface']) {
        const a=lum(values[fg]),b=lum(values[bg]);
        assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${fg} on ${bg}`);
      }
    }
    const a=lum(values['gold-400']),b=lum(values['on-gold']);
    assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'CTA text');
  }
});
