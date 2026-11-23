'use strict';
const assert=require('assert');const {Game,MODES}=require('./package/javascript/src/game');
assert.strictEqual(MODES.length,4);
for(let diff=0;diff<4;diff++){
 let seed=10;const g=new Game({random:()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}});
 g.setDifficulty(diff);g.action();for(let i=0;i<400;i++){g.spawnIn=0;g.tick(0.005);if(g.state==='over')break;}
 for(const o of g.obstacles){if(o.type==='cactus'){assert(o.parts.length<=3);assert(o.parts.every(p=>p.w>0&&p.h>0));}}
 assert(MODES[diff].gapMin<MODES[diff].gapMax);
}
const a=new Game({random:()=>0.0});a.setDifficulty(3);const o=a.buildObstacle();assert.strictEqual(o.parts.length,2);
console.log('1.4.2: modes and clustered cactus hit boxes OK');
