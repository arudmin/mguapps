 'use strict';
const MODES = [
 {name:'EASY', start:355, acceleration:5, max:690, gap:1.85, minGap:1.10, birdAfter:24},
 {name:'NORMAL', start:440, acceleration:9, max:890, gap:1.50, minGap:0.78, birdAfter:13},
 {name:'HARD', start:540, acceleration:13, max:1050, gap:1.25, minGap:0.67, birdAfter:8},
 {name:'EXTREME', start:620, acceleration:19, max:1220, gap:1.15, minGap:0.58, birdAfter:5}
];
class Game {
 constructor(options) { this.random=options&&options.random||Math.random; this.width=1920;this.height=720;this.difficulty=1;this.reset(); }
 resize(aspect){if(!Number.isFinite(aspect)||aspect<=0)return;this.width=720*aspect;this.x=Math.min(260,this.width*0.18);}
 setDifficulty(index){this.difficulty=((index%MODES.length)+MODES.length)%MODES.length;this.reset();}
 nextDifficulty(){this.setDifficulty(this.difficulty+1);return this.mode().name;}
 mode(){return MODES[this.difficulty];}
 reset(){const mode=this.mode();this.state='ready';this.score=0;this.elapsed=0;this.distance=0;this.floor=622;this.x=Math.min(260,this.width*0.18);this.y=this.floor;this.vy=0;this.speed=mode.start;this.obstacles=[];this.clouds=[];this.spawnIn=1.3;this.cloudIn=.5;this.accumulator=0;}
 action(){if(this.state==='over'){this.reset();this.state='playing';return;}if(this.state==='ready'){this.state='playing';return;}if(this.state==='playing'&&this.y>=this.floor-.1)this.vy=-940;}
 step(seconds){if(this.state!=='playing'||!Number.isFinite(seconds)||seconds<=0)return;this.accumulator+=Math.min(.1,seconds);while(this.accumulator>=1/120&&this.state==='playing'){this.tick(1/120);this.accumulator-=1/120;}}
 tick(dt){this.elapsed+=dt;const mode=this.mode();this.speed=Math.min(mode.max,mode.start+this.elapsed*mode.acceleration);this.distance+=this.speed*dt;this.vy+=2500*dt;this.y+=this.vy*dt;if(this.y>this.floor){this.y=this.floor;this.vy=0;}
 this.cloudIn-=dt;if(this.cloudIn<=0){this.clouds.push({x:this.width+100,y:130+this.random()*175});this.cloudIn=1.5+this.random()*1.7;}
 this.clouds.forEach(c=>c.x-=this.speed*dt*.18);this.clouds=this.clouds.filter(c=>c.x>-100);
 this.spawnIn-=dt;if(this.spawnIn<=0){const bird=this.elapsed>mode.birdAfter&&this.random()<(this.difficulty>=2?.30:.24);const height=bird?34:(this.random()<.5?58:78);const offset=bird?(this.random()<.5?48:104):0;const w=bird?62:(height>65?34:28);this.obstacles.push({x:this.width+60,y:this.floor-offset,w,h:height,type:bird?'bird':'cactus',scored:false});this.spawnIn=Math.max(mode.minGap,mode.gap-this.elapsed*.010)+this.random()*.50;}
 const d={x:this.x-67,y:this.y-98,w:90,h:94};for(const o of this.obstacles){o.x-=this.speed*dt;if(!o.scored&&o.x+o.w<this.x-26){o.scored=true;this.score++;}if(rectsOverlap(d,{x:o.x+4,y:o.y-o.h+4,w:o.w-8,h:o.h-5}))this.state='over';}
 this.obstacles=this.obstacles.filter(o=>o.x>-100);
 }
}
function rectsOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
module.exports={Game,rectsOverlap,MODES};
