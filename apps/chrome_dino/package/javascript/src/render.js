'use strict';
// Dinosaur silhouette traced to a pixel grid from the original Chrome T-Rex image supplied by the user.
// The tile sprite is not used as a game sprite. Renderer uses the BMW MGU GPU command stream.
const {DINO_ROWS}=require('./sprites');
function draw(cv,game,w,h,best,words,update){
 words=words||require('./i18n').words('en');
 const sx=w/game.width,sy=h/720,ink='#535353';
 function rect(x,y,a,b,c){cv.fillRect(x*sx,y*sy,a*sx,b*sy,c);}
 function text(t,x,y,size,c,align){cv.text(t,x*sx,y*sy,size*sy,c,{align:align||'left',font:'bold',literal:true});}
 function pixel(x,y,pts,unit,color){for(const p of pts)rect(x+p[0]*unit,y+p[1]*unit,p[2]*unit,p[3]*unit,color);}
 // Chrome's small cactus and big cactus styles: slender jagged columns and angular arms.
 function cactus(x,floor,large){
  const unit=large?3.15:2.5;
  // Sprite units mimic Chromium cactus silhouettes. They are purposefully narrow, not blocks.
  const pts=[
    [5,1,4,1],[4,2,6,1],[4,3,6,20],[5,23,4,3],
    [2,11,2,1],[1,10,2,1],[1,11,2,6],[2,17,2,2],[3,19,2,1],
    [10,8,2,1],[11,7,2,1],[11,8,2,8],[10,16,2,2],[9,18,2,1]
  ];
  const y=floor-26*unit;
  pixel(x,y,pts,unit,ink);
 }
 function bird(x,y){
  const flap=Math.floor(game.elapsed*7)%2;
  rect(x+5,y-18,43,13,ink);rect(x+43,y-15,17,6,ink);rect(x+17,y-25,18,11,ink);
  if(flap){rect(x+6,y-33,25,9,ink);rect(x,y-37,9,7,ink);}else{rect(x+12,y-4,30,8,ink);rect(x+2,y+3,16,6,ink);}
 }
 rect(0,0,game.width,720,'#f7f7f7');
 game.clouds.forEach(c=>{rect(c.x,c.y+8,55,8,'#d4d4d4');rect(c.x+14,c.y,30,13,'#d4d4d4');});
 rect(0,game.floor+2,game.width,3,'#6e6e6e');
 for(let i=0;i<Math.ceil(game.width/50)+2;i++)rect(i*50-game.distance%50,game.floor+12,25,3,'#b4b4b4');
 game.obstacles.forEach(o=>{
  if(o.type==='bird')bird(o.x,o.y);
  else o.parts.forEach(p=>cactus(o.x+p.x,o.y,p.large));
 });
 // 40-wide x 42-high pixel silhouette: slightly larger than original 1.3.0, but original in form.
 const unit=2.6, x=game.x-60, y=game.y-42*unit;
 // Preserve the T-Rex body, animate the two leg poses at running speed.
 pixel(x,y,DINO_ROWS.filter(p=>p[1]<34),unit,ink);
 const running=game.state==='playing' && game.y>=game.floor-.1;
 const phase=Math.floor(game.distance/27)%2;
 const legsA=[[10,34,5,1],[10,35,3,3],[9,38,3,2],[8,40,5,2],[17,34,4,1],[18,35,3,3],[19,38,3,2],[19,40,5,2]];
 const legsB=[[10,34,5,1],[11,35,3,3],[12,38,3,2],[12,40,5,2],[17,34,4,1],[17,35,3,3],[16,38,3,2],[15,40,5,2]];
 const airborne=[[10,34,5,1],[11,35,5,2],[11,37,6,2],[17,34,4,1],[17,35,4,2],[18,37,5,2]];
 pixel(x,y,running?(phase?legsB:legsA):airborne,unit,ink);
 text(words.title,28,42,24,ink);
 text(words.levels[game.difficulty],game.width/2,42,22,'#858585','center');
 text(String(game.score).padStart(5,'0'),game.width-28,42,30,ink,'right');
 text(words.hi+' '+String(best).padStart(5,'0'),game.width-28,76,22,'#999999','right');
 text(words.jump,game.width/2,698,18,'#858585','center');
 if(update&&update.available&&update.latest)text((words.updateNotice||'UPDATE AVAILABLE')+' '+update.latest,game.width/2,108,25,'#a34734','center');
 if(game.state!=='playing'){
 const cx=game.width/2,pw=Math.min(720,game.width-32);
 rect(cx-pw/2,185,pw,255,'#ededed');rect(cx-pw/2,185,pw,3,'#888888');
 text(game.state==='over'?words.over:words.title,cx,264,42,ink,'center');
 text(game.state==='over'?words.score+' '+game.score+'   '+words.best+' '+best:words.start,cx,331,26,ink,'center');
 text(words.levels[game.difficulty]+'  |  '+words.parkedOnly,cx,392,20,'#858585','center');
 }
 return cv;
}
module.exports={draw,DINO_ROWS};
