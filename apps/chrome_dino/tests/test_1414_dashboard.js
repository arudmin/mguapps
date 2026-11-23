'use strict';
const assert=require('assert');
const fs=require('fs'),path=require('path');
const {Game}=require('../package/javascript/src/game');
const {Recorder}=require('../package/javascript/kit/record');
const {drawDashboard,WORLD_ASPECT}=require('../package/javascript/src/dashboard');
const {draw}=require('../package/javascript/src/render');
const i18n=require('../package/javascript/src/i18n');
assert.strictEqual(WORLD_ASPECT,1920/720);
const game=new Game({random:()=>.5});game.resize(WORLD_ASPECT);game.setDifficulty(2);
const origWidth=game.width,origScore=game.score;
const rec=new Recorder(1600,520);
assert.strictEqual(drawDashboard(rec,game,1600,520,12,i18n.words('en'),{}),rec);
assert(rec.words().length>100,'dashboard must draw a complete frame');
assert.strictEqual(game.width,origWidth);assert.strictEqual(game.score,origScore);
const classic=new Recorder(1600,520);
assert.strictEqual(draw(classic,game,1600,520,5,i18n.words('en'),{}),classic);
const ru=new Recorder(1600,520);
assert.strictEqual(drawDashboard(ru,game,1600,520,0,i18n.words('ru'),{}),ru);
for(const lang of ['ru','en','de','fr','es','it','pt','nl','pl','uk','zh','ja']){
 const w=i18n.words(lang);
 for(const k of ['style','styleDashboard','styleClassic','online','onlineInactive','hudJump','hudParked'])assert(w[k],lang+' '+k);
}
const app=require('../app.json');
assert.strictEqual(app.version,'1.4.14');
assert(app.screens.find(x=>x.name==='MAIN').items.some(x=>x[1]==='BTN_THEME'));
const src=fs.readFileSync(path.join(__dirname,'../package/javascript/app.js'),'utf8');
assert(src.includes("ctx.loop('GAME', 8"));
assert(src.includes('1000 / 60'));
assert(src.includes('game.resize(WORLD_ASPECT)'));
assert(src.includes("visualTheme==='dashboard'"));
for(const hmi of ['ID7','ID8']){
 const ui=require('../package/rhmiData/uiDescriptions/'+hmi+'/uiDescription.json');
 assert.strictEqual(ui.containers['1'].components['26'].name,'BTN_THEME');
 const xml=fs.readFileSync(path.join(__dirname,'../package/rhmiData/uiDescriptions/'+hmi+'/application.xml'),'utf8');
 assert(xml.includes('<component id="26" type="button"'));
}
console.log('1.4.14: dashboard render, classic fallback, 12 languages, native theme button, fixed physics and GPU pacing OK');