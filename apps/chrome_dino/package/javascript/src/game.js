'use strict';
const {collides}=require('./sprites');
const MODES=[
 {name:'EASY',start:430,acceleration:6,max:740,gapMin:1.12,gapMax:2.25,clusterChance:.38,birdChance:.12,birdAfter:16,gravity:2500,jumpVelocity:-940,tripleStart:.28,tripleEnd:.28,tripleFrom:0,tripleRamp:1,spacingScale:0,largeChance:.38},
 {name:'NORMAL',start:864,acceleration:60.8,max:1824,gapMin:.5625,gapMax:1.5,clusterChance:.6368,birdChance:.2752,birdAfter:4.21875,gravity:8500,jumpVelocity:-1665.08,tripleStart:.096,tripleEnd:.4992,tripleFrom:12.5,tripleRamp:28.125,spacingScale:1.875,largeChance:.75},
 {name:'HARD',start:1080,acceleration:76,max:2280,gapMin:.375,gapMax:1,clusterChance:.796,birdChance:.344,birdAfter:3.375,gravity:8500,jumpVelocity:-1520,tripleStart:.12,tripleEnd:.624,tripleFrom:10,tripleRamp:22.5,spacingScale:1.25,largeChance:.75},
 {name:'EXTREME',start:1350,acceleration:95,max:2850,gapMin:.30,gapMax:.80,clusterChance:.995,birdChance:.43,birdAfter:2.7,gravity:8500,jumpVelocity:-1520,tripleStart:.15,tripleEnd:.78,tripleFrom:8,tripleRamp:18,spacingScale:1,largeChance:.85}
];
const JUMP_TIME=2*940/2500;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function rectsOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
class Game {
 constructor(opts){this.random=opts&&opts.random||Math.random;this.width=1920;this.height=720;this.difficulty=1;this.reset();}
 resize(aspect){if(!Number.isFinite(aspect)||aspect<=0)return;this.width=720*aspect;this.x=Math.min(260,this.width*.18);}
 mode(){return MODES[this.difficulty];}
 setDifficulty(i){this.difficulty=((i%MODES.length)+MODES.length)%MODES.length;this.reset();}
 nextDifficulty(){this.setDifficulty(this.difficulty+1);return this.mode().name;}
 reset(){const m=this.mode();this.state='ready';this.score=0;this.elapsed=0;this.distance=0;this.floor=622;this.x=Math.min(260,this.width*.18);this.y=this.floor;this.vy=0;this.speed=m.start;this.obstacles=[];this.clouds=[];this.spawnIn=1.05;this.cloudIn=.5;this.accumulator=0;this.jumpBuffer=0;this.previousDelay=1;this.previousType='';this.lastGap=0;this.lastGapBand='—';}
 action(){const m=this.mode();if(this.state==='over')this.reset();if(this.state==='ready'){this.state='playing';this.vy=m.jumpVelocity;return;}if(this.state==='playing'){if(this.y>=this.floor-.1){this.vy=m.jumpVelocity;this.jumpBuffer=0;}else if(this.difficulty!==0)this.jumpBuffer=.12;}}
 buildObstacle(){
  const m=this.mode(),r=this.random();
  if(this.elapsed>m.birdAfter&&r<m.birdChance){let low=this.random()<(this.difficulty===0?.77:.65);if(this.difficulty!==0&&!low&&this.previousDelay<.47&&this.previousType!=='high')low=true;return {type:'bird',low,x:this.width+70,y:this.floor-(low?88:(this.difficulty===0?128:178))*(this.difficulty===2?.85:1),w:66,h:36,parts:[],scored:false};}
  let count=1;if(this.random()<m.clusterChance){if(this.difficulty===0)count=this.random()<.72?2:3;else{const triple=m.tripleStart+(m.tripleEnd-m.tripleStart)*clamp((this.elapsed-m.tripleFrom)/m.tripleRamp,0,1);count=this.random()<triple?3:2;}}
  const parts=[];let offset=0;for(let k=0;k<count;k++){const large=this.random()<m.largeChance,w=large?36:27,h=large?84:60;parts.push({x:offset,w,h,large});offset+=w+(k+1<count?5+Math.floor(this.random()*8):0);}
  return {type:'cactus',x:this.width+70,y:this.floor,w:offset,h:Math.max.apply(null,parts.map(p=>p.h)),parts,scored:false};
 }
 scheduleNext(o){
  const m=this.mode();let gap,band;
  if(this.difficulty===0){gap=m.gapMin+(m.gapMax-m.gapMin)*Math.pow(this.random(),.78);if(this.random()<.17)gap+=.35+this.random()*.8;if(o.type==='bird')gap=Math.max(gap,1.072);band='LONG';}
  else{const p=this.random(),s=m.spacingScale;if(p<.46){gap=(.30+this.random()*.14)*s;band='SHORT';}else if(p<.85){gap=(.45+this.random()*.16)*s;band='MEDIUM';}else{gap=(.62+this.random()*.18)*s;band='LONG';}}
  this.previousDelay=gap;this.previousType=o.type==='bird'?(o.low?'low':'high'):'cactus';this.spawnIn=gap;this.lastGap=gap;this.lastGapBand=band;
 }
 step(seconds){if(this.state!=='playing'||!Number.isFinite(seconds)||seconds<=0)return;this.accumulator+=Math.min(.1,seconds);while(this.accumulator>=1/120&&this.state==='playing'){this.tick(1/120);this.accumulator-=1/120;}}
 tick(dt){
  if(this.state!=='playing')return;const oldY=this.y,m=this.mode();this.elapsed+=dt;this.speed=Math.min(m.max,m.start+this.elapsed*m.acceleration);this.distance+=this.speed*dt;this.vy+=m.gravity*dt;this.y+=this.vy*dt;
  if(this.y>=this.floor){this.y=this.floor;this.vy=0;if(this.jumpBuffer>0){this.vy=m.jumpVelocity;this.jumpBuffer=0;}}
  this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);this.cloudIn-=dt;
  if(this.cloudIn<=0){this.clouds.push({x:this.width+100,y:120+this.random()*175});this.cloudIn=1.6+this.random()*1.8;}
  this.clouds.forEach(c=>c.x-=this.speed*dt*.18);this.clouds=this.clouds.filter(c=>c.x>-100);
  this.spawnIn-=dt;if(this.spawnIn<=0){const o=this.buildObstacle();this.obstacles.push(o);this.scheduleNext(o);this.spawnIn+=o.w/this.speed;}
  for(const o of this.obstacles){const oldX=o.x;o.x-=this.speed*dt;if(collides(this,o,oldX,oldY)){this.state='over';break;}if(!o.scored&&o.x+o.w<this.x-60){o.scored=true;this.score++;}}
  this.obstacles=this.obstacles.filter(o=>o.x+o.w>-100);
 }
}
module.exports={Game,MODES,rectsOverlap,JUMP_TIME};
