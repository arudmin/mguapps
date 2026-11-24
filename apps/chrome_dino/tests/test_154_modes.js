'use strict';
const assert=require('assert');
const {Game,MODES}=require('../package/javascript/src/game');
const {migrateDifficulty}=require('../package/javascript/src/difficulty');
const {DINO_ROWS}=require('../package/javascript/src/render');
assert.deepStrictEqual(MODES.map(m=>m.name),['EASY','NORMAL','HARD','EXTREME']);
assert.strictEqual(DINO_ROWS[0][0],22,'original T-Rex retained');
for(let i=0;i<4;i++){
 const game=new Game({random:()=>.5});game.setDifficulty(i);game.action();
 assert.strictEqual(game.state,'playing');const v=game.vy;game.action();assert.strictEqual(game.vy,v);
 for(let j=0;j<40;j++)game.tick(1/120);
 assert(Number.isFinite(game.y)&&game.y<=game.floor);
}
const peak=m=>m.jumpVelocity*m.jumpVelocity/(2*m.gravity);
assert(Math.abs(peak(MODES[1])/peak(MODES[2])-1.2)<.001,'Normal jump +20%');
for(const [a,b] of [[1,2],[2,3]]){
 assert(Math.abs(MODES[a].start/MODES[b].start-.8)<1e-9,'start speed 20%');
 assert(Math.abs(MODES[a].max/MODES[b].max-.8)<1e-9,'max speed 20%');
 assert(Math.abs(MODES[a].acceleration/MODES[b].acceleration-.8)<1e-9,'acceleration 20%');
}
assert(Math.abs(MODES[1].spacingScale/1.5625-1.2)<1e-9,'Normal gaps +20%');
function stub(values){let d=Object.assign({},values);return {get:k=>d[k],set:(k,v)=>d[k]=v,all:d};}
const old=stub({difficulty:0,difficultySchema:0,bestSchema:1,best_normal:42,best_hard:12,best_extreme:7,best:42});
const migrated=migrateDifficulty(old);
assert.strictEqual(migrated.index,0);assert.deepStrictEqual(migrated.bestModes,[42,0,12,7]);
assert.strictEqual(old.all.best_easy,42);
assert.deepStrictEqual(migrateDifficulty(old).bestModes,[42,0,12,7],'idempotent migration');
assert.strictEqual(migrateDifficulty(stub({difficulty:2,bestSchema:1,best_extreme:31,best:31})).index,3);
assert.strictEqual(migrateDifficulty(stub({difficulty:1,best:0,bestSchema:0,difficultySchema:0})).index,1);
const app=require('../app.json'),spec=require('../package/javascript/kit/app-spec.json');
assert.strictEqual(app.version,'1.5.5');assert.strictEqual(spec.version,'1.5.5');
for(const data of [app,spec]){assert.strictEqual(data.settings.find(x=>x.key==='difficulty').default,1);assert(data.settings.some(x=>x.key==='best_easy'));}
const i18n=require('../package/javascript/src/i18n');
for(const l of ['ru','en','de','fr','es','it','pt','nl','pl','uk','zh','ja'])assert.strictEqual(i18n.words(l).levels.length,4,l);
const {Recorder}=require('../package/javascript/kit/record');
const {drawDashboard}=require('../package/javascript/src/dashboard');
const game=new Game({random:()=>.5}),cv=new Recorder(1600,520);
drawDashboard(cv,game,1600,520,6,i18n.words('ru'),{}, {parked:true,selectedControl:'mode',languageLabel:'Русский',fps:60});
assert(cv.words().length>60,'right panel and original dinosaur rendered');
const source=require('fs').readFileSync(require('path').join(__dirname,'../package/javascript/app.js'),'utf8');
assert(source.includes('frontRotaryEncoderOperation'),'BMW rotary counter selection');
assert(source.includes("ctx.onTap"),'touch settings');
assert(source.includes("ui.open('GAME')"),'Dashboard direct entry');
assert(!source.includes("draw(screenRecorder"),'Classic disabled');
assert(source.includes('fps:actualFPS'),'actual measured FPS');
console.log('1.5.5 four levels, upgraded scores, T-Rex, sidebar settings and FPS diagnostics OK');
