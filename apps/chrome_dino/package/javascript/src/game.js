'use strict';
// Gameplay inspired by Chromium T-Rex Runner: clustered cactus obstacles, birds and distance-based spacing.
// Positions/speeds are in the logical 720-high world, not physical screen pixels.
const MODES = [
 {name:'EASY',start:360,acceleration:3,max:570,gapMin:1.90,gapMax:3.15,postJumpBuffer:1.30,clusterChance:0.12,birdAfter:45},
 {name:'NORMAL',start:400,acceleration:4,max:650,gapMin:1.48,gapMax:2.75,postJumpBuffer:1.18,clusterChance:0.25,birdAfter:35},
 {name:'HARD',start:435,acceleration:5,max:720,gapMin:1.24,gapMax:2.38,postJumpBuffer:1.10,clusterChance:0.46,birdAfter:28},
 {name:'EXTREME',start:460,acceleration:6,max:770,gapMin:1.07,gapMax:2.10,postJumpBuffer:1.03,clusterChance:0.65,birdAfter:22}
];
const GRAVITY=2500, JUMP_VELOCITY=-940, JUMP_TIME=2*940/2500;
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function rectsOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
class Game {
 constructor(options){this.random=options&&options.random||Math.random;this.width=1920;this.height=720;this.difficulty=1;this.reset();}
 resize(aspect){if(!Number.isFinite(aspect)||aspect<=0)return;this.width=720*aspect;this.x=Math.min(260,this.width*0.18);}
 mode(){return MODES[this.difficulty];}
 setDifficulty(index){this.difficulty=((index%MODES.length)+MODES.length)%MODES.length;this.reset();}
 nextDifficulty(){this.setDifficulty(this.difficulty+1);return this.mode().name;}
 reset(){let mode=this.mode();this.state='ready';this.score=0;this.elapsed=0;this.distance=0;this.floor=622;this.x=Math.min(260,this.width*0.18);this.y=this.floor;this.vy=0;this.speed=mode.start;this.obstacles=[];this.clouds=[];this.spawnIn=1.8;this.cloudIn=.5;this.accumulator=0;}
 action(){if(this.state==='over'){this.reset();this.state='playing';this.vy=JUMP_VELOCITY;return;}if(this.state==='ready'){this.state='playing';this.vy=JUMP_VELOCITY;return;}if(this.state==='playing'&&this.y>=this.floor-.1)this.vy=JUMP_VELOCITY;}
 // Width and height in logical game pixels. A group is one obstacle object but each cactus collides separately.
 buildObstacle(){const mode=this.mode(),r=this.random();
  if(this.elapsed>mode.birdAfter&&r<(this.difficulty===3?.15:.12)){
    const low=this.random()<.77;return {type:'bird',x:this.width+70,y:this.floor-(low?88:128),w:66,h:36,parts:[],scored:false};
  }
  let count=1;
  if(this.random()<mode.clusterChance){count=this.random()<(this.difficulty>=2?.62:.72)?2:3;}
  const parts=[];let offset=0;
  for(let k=0;k<count;k++){
   const large=this.random()<(this.difficulty>=2?.58:.38);
   const height=large?84:66, width=large?45:35;
   parts.push({x:offset,w:width,h:height,large:large});
   offset+=width+(k+1<count?5+Math.floor(this.random()*8):0);
  }
  return {type:'cactus',x:this.width+70,y:this.floor,w:offset,h:Math.max.apply(null,parts.map(p=>p.h)),parts:parts,scored:false};
 }
 // Minimum gap is measured from the last cactus to the start of the next group, not between spawn starts.
 // Every mode gets a minimum time to land and jump again; random additional spacing sets real difficulty.
 scheduleNext(obstacle){
  const m=this.mode();
  // Time between the trailing edge of the previous obstacle and the leading edge of the next.
  // A landing/jump recovery buffer prevents unavoidable patterns at all speeds.
  const randomGap=m.gapMin+this.random()*(m.gapMax-m.gapMin)+(this.random()<0.13?0.45+this.random()*0.55:0);
  const safeGap=Math.max(m.postJumpBuffer,JUMP_TIME+0.20);
  let gap=Math.max(randomGap,safeGap);
  if(obstacle.type==='bird')gap=Math.max(gap,JUMP_TIME+0.38);
  this.spawnIn=gap+obstacle.w/this.speed;
 }

 step(seconds){if(this.state!=='playing'||!Number.isFinite(seconds)||seconds<=0)return;
  this.accumulator+=Math.min(.1,seconds);
  while(this.accumulator>=1/120&&this.state==='playing'){this.tick(1/120);this.accumulator-=1/120;}
 }
 tick(dt){this.elapsed+=dt;const mode=this.mode();this.speed=Math.min(mode.max,mode.start+this.elapsed*mode.acceleration);this.distance+=this.speed*dt;
  this.vy+=GRAVITY*dt;this.y+=this.vy*dt;if(this.y>this.floor){this.y=this.floor;this.vy=0;}
  this.cloudIn-=dt;if(this.cloudIn<=0){this.clouds.push({x:this.width+100,y:130+this.random()*175});this.cloudIn=1.6+this.random()*1.8;}
  this.clouds.forEach(c=>c.x-=this.speed*dt*.18);this.clouds=this.clouds.filter(c=>c.x>-100);
  this.spawnIn-=dt;if(this.spawnIn<=0){const o=this.buildObstacle();this.obstacles.push(o);this.scheduleNext(o);}
  // Foreground dinosaur silhouette is ~105x111; hitbox remains slightly inset, as in Chrome.
  const d={x:this.x-59,y:this.y-100,w:90,h:94};
  for(const o of this.obstacles){o.x-=this.speed*dt;
   if(!o.scored&&o.x+o.w<this.x-60){o.scored=true;this.score++;}
   if(o.type==='bird'){
    if(rectsOverlap(d,{x:o.x+5,y:o.y-28,w:o.w-10,h:24}))this.state='over';
   } else for(const p of o.parts){
    const hit={x:o.x+p.x+3,y:o.y-p.h+5,w:p.w-6,h:p.h-7};
    if(rectsOverlap(d,hit))this.state='over';
   }
  }
  this.obstacles=this.obstacles.filter(o=>o.x+o.w>-100);
 }
}
module.exports={Game,MODES,rectsOverlap,JUMP_TIME};
