'use strict';
// Dinosaur silhouette traced to a pixel grid from the original Chrome T-Rex image supplied by the user.
// The tile sprite is not used as a game sprite. Renderer uses the BMW MGU GPU command stream.
const DINO_ROWS=[[22,0,16,1],[22,1,16,1],[20,2,20,1],[20,3,4,1],[26,3,14,1],[20,4,4,1],[26,4,14,1],[20,5,4,1],[26,5,14,1],[20,6,20,1],[20,7,20,1],[19,8,21,1],[19,9,21,1],[19,10,21,1],[19,11,11,1],[31,11,8,1],[19,12,11,1],[19,13,11,1],[19,14,16,1],[0,15,2,1],[18,15,10,1],[0,16,2,1],[17,16,10,1],[0,17,2,1],[15,17,12,1],[0,18,2,1],[15,18,12,1],[0,19,4,1],[12,19,16,1],[0,20,4,1],[12,20,19,1],[0,21,6,1],[10,21,17,1],[29,21,2,1],[0,22,6,1],[10,22,17,1],[29,22,2,1],[0,23,27,1],[0,24,27,1],[0,25,27,1],[2,26,25,1],[2,27,25,1],[4,28,21,1],[4,29,21,1],[4,30,21,1],[6,31,17,1],[7,32,16,1],[8,33,13,1],[9,34,6,1],[16,34,5,1],[10,35,5,1],[17,35,4,1],[10,36,3,1],[18,36,3,1],[10,37,3,1],[19,37,2,1],[10,38,1,1],[19,38,2,1],[10,39,1,1],[19,39,2,1],[9,40,4,1],[19,40,3,1],[10,41,3,1],[19,41,4,1]];
function draw(cv,game,w,h,best){
 const sx=w/game.width,sy=h/720,ink='#535353';
 function rect(x,y,a,b,c){cv.fillRect(x*sx,y*sy,a*sx,b*sy,c);}
 function text(t,x,y,size,c,align){cv.text(t,x*sx,y*sy,size*sy,c,{align:align||'left',font:'bold'});}
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
 pixel(x,y,DINO_ROWS,unit,ink);
 text('CHROME DINO GAME',28,42,24,ink);
 text(game.mode().name,game.width/2,42,22,'#858585','center');
 text(String(game.score).padStart(5,'0'),game.width-28,42,30,ink,'right');
 text('HI '+String(best).padStart(5,'0'),game.width-28,76,22,'#999999','right');
 text('PRESS CONTROLLER = JUMP     BACK = MENU',game.width/2,698,18,'#858585','center');
 if(game.state!=='playing'){
 const cx=game.width/2,pw=Math.min(720,game.width-32);
 rect(cx-pw/2,185,pw,255,'#ededed');rect(cx-pw/2,185,pw,3,'#888888');
 text(game.state==='over'?'GAME OVER':'CHROME DINO',cx,264,42,ink,'center');
 text(game.state==='over'?'SCORE '+game.score+'   BEST '+best:'PRESS CONTROLLER TO START',cx,331,26,ink,'center');
 text(game.mode().name+'  |  PARKED ONLY',cx,392,20,'#858585','center');
 }
 return cv;
}
module.exports={draw};
