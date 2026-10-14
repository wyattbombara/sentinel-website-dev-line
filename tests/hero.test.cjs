const {test}=require('node:test');
const assert=require('node:assert/strict');
const {presets,choose}=require('../assets/js/copy.js');

test('hero copy has twelve coordinated presets and every preset is reachable',()=>{
 assert.equal(presets.length,12);
 assert.equal(new Set(presets.map(p=>p.first+' / '+p.second)).size,12);
 const reached=new Set();
 for(let i=0;i<presets.length;i++){
  reached.add(choose(null,()=>((i+.5)/presets.length)));
  assert.ok(presets[i].first&&presets[i].second&&presets[i].eyebrow&&presets[i].description);
 }
 assert.equal(reached.size,12);
});
test('a refresh never immediately repeats a valid previous preset',()=>{
 for(let previous=0;previous<presets.length;previous++){
  const reached=new Set();
  for(let bucket=0;bucket<presets.length-1;bucket++){
   const index=choose(previous,()=>((bucket+.5)/(presets.length-1)));
   assert.notEqual(index,previous);reached.add(index);
  }
  assert.equal(reached.size,11);
 }
 for(const previous of [null,NaN,-1,12,'5'])assert.ok(choose(previous,()=>.999)<12);
});
