'use strict';
const assert=require('assert');
const {Game}=require('../package/javascript/src/game');
const {drawDashboard}=require('../package/javascript/src/dashboard');
const words=require('../package/javascript/src/i18n').words('en');
for(let mode=0;mode<4;mode++){
 for(const low of [true,false]){
  const seq=[0,low?0:.99];const game=new Game({random:()=>seq.shift()});game.setDifficulty(mode);game.elapsed=20;
  const bird=game.buildObstacle();assert.strictEqual(bird.type,'bird');assert(Math.abs(game.floor-bird.y-(low?88:mode===0?128:178)*(mode===2?.85:1))<1e-8);
 }
 const game=new Game();game.setDifficulty(mode);const calls=[];const cv={clear(){},clip(){},noclip(){},fillRect(){},strokeRoundRect(){},roundRect(...a){calls.push(['rect',...a]);},text(...a){calls.push(['text',...a]);}};
 drawDashboard(cv,game,1600,520,0,words,{}, {rankingOpen:true,rankingRows:Array.from({length:10},(_,i)=>({rank:i+1,nickname:'Player'+i,score:100-i})),rankingMode:mode});
 const rows=calls.filter(a=>a[0]==='rect'&&a[1]===318&&a[3]===534);assert.strictEqual(rows.length,10);assert(rows.every(a=>a[4]===22));assert(rows[9][2]+rows[9][4]<398);
 const palette=['#75bd9a','#83c9f5','#e2ad72','#dd8992'];assert(calls.some(a=>a[0]==='text'&&a[2]===1109&&a[5]===palette[mode]));assert(calls.some(a=>a[0]==='text'&&a[2]===1194&&a[3]===168&&a[5]===palette[mode]));
}
console.log('Uniform ranking rows, difficulty colors and Hard bird heights OK');
