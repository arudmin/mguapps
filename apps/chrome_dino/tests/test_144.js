'use strict';
const assert = require('assert');
const fs=require('fs');
const path=require('path');
const {Game,MODES,JUMP_TIME}=require('../package/javascript/src/game');
const {tr,langOf,languageChoices}=require('../package/javascript/src/i18n');
assert.strictEqual(MODES.length,4);
assert(languageChoices.includes('auto')&&languageChoices.includes('ru'));
assert.strictEqual(langOf('RUSSISCH'),'ru');
assert.strictEqual(tr('ru').language,'Язык');
assert.strictEqual(tr('de').language,'Sprache');
assert.strictEqual(tr('en').language,'Language');
const app=JSON.parse(fs.readFileSync(path.join(__dirname,'../app.json')));
const menu=app.screens.find(x=>x.name==='MAIN');
assert(menu.items.some(x=>x[1]==='BTN_LANGUAGE'));
assert(app.settings.some(x=>x.key==='language'&&x.default==='auto'&&x.hidden));
for(const mode of [0,1,2,3]) {
 let seed=123456789;
 // deterministic pseudo-random test with broad coverage
 const g=new Game({random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}});
 g.setDifficulty(mode);g.speed=MODES[mode].start;
 const trials=[];
 for(let k=0;k<40;k++){
  const o={w:k%3===0?160:40,type:'cactus'};
  g.scheduleNext(o);
  const trailingGap=g.spawnIn-o.w/g.speed;
  trials.push(trailingGap);
  assert(trailingGap>=JUMP_TIME+.19, 'insufficient landing time');
 }
 assert(new Set(trials.map(v=>v.toFixed(2))).size>=4, 'identical spacings');
 const min=Math.min(...trials), max=Math.max(...trials);
 assert(max-min>.55,'insufficient gap variability');
 console.log(MODES[mode].name+' intervals: '+min.toFixed(2)+'–'+max.toFixed(2)+' s');
}
assert(MODES[0].gapMin>MODES[1].gapMin&&MODES[1].gapMin>MODES[2].gapMin&&MODES[2].gapMin>MODES[3].gapMin);
console.log('1.4.4 menu language, saved default and randomized playable obstacle spacing OK');
