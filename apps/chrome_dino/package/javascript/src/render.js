 'use strict';
function draw(cv,game,w,h,best){
 const sx=w/game.width,sy=h/720;const ink='#535353';
 function rect(x,y,a,b,c){cv.fillRect(x*sx,y*sy,a*sx,b*sy,c);}
 function text(t,x,y,size,c,align){cv.text(t,x*sx,y*sy,size*sy,c,{align:align||'left',font:'bold'});}
 function pixel(x,y,pts,unit,color){for(const [a,b,c,d] of pts)rect(x+a*unit,y+b*unit,c*unit,d*unit,color);}
 rect(0,0,game.width,720,'#f7f7f7');
 game.clouds.forEach(c=>{rect(c.x,c.y+8,55,8,'#d4d4d4');rect(c.x+14,c.y,30,13,'#d4d4d4');});
 rect(0,game.floor+2,game.width,3,'#6e6e6e');for(let i=0;i<Math.ceil(game.width/50)+2;i++)rect(i*50-game.distance%50,game.floor+12,25,3,'#b4b4b4');
 game.obstacles.forEach(o=>{if(o.type==='bird'){rect(o.x,o.y-21,39,17,ink);rect(o.x+39,o.y-17,19,7,ink);rect(o.x+14,o.y-31,18,12,ink);}
 else{rect(o.x+7,o.y-o.h,o.w-10,o.h,ink);rect(o.x,o.y-o.h+17,12,10,ink);rect(o.x,o.y-o.h+13,7,28,ink);rect(o.x+o.w-5,o.y-o.h+25,12,8,ink);rect(o.x+o.w+3,o.y-o.h+17,6,23,ink);}});
 // Pixel T-Rex, deliberately scaled larger for the iDrive wide display.
 // 24px sprite drawn with integer blocks for sharp Chrome-style edges.
 const u=4.8,x=game.x-16*u,y=game.y-22*u;
 pixel(x,y,[
 [11,0,10,1],[10,1,12,1],[10,2,13,2],[10,4,13,1],
 [10,5,13,2],[10,7,12,1],[10,8,11,1],[10,9,12,1],
 [11,10,9,1],[10,11,9,1],[9,12,10,1],
 [7,13,12,1],[6,14,12,1],[5,15,12,1],[3,16,14,1],
 [2,15,8,1],[1,14,8,1],[0,12,8,2],[0,11,3,1],
 [14,11,2,3],[16,12,2,2],[18,13,2,1],
 [7,17,10,1],[8,18,8,1],
 [9,19,3,2],[8,21,4,1],[14,19,3,2],[14,21,4,1]
 ],u,ink);
 rect(x+18*u,y+3*u,1.2*u,1.2*u,'#f7f7f7');
 text('CHROME DINO GAME',28,42,24,ink);text(game.mode().name,game.width/2,42,22,'#858585','center');
 text(String(game.score).padStart(5,'0'),game.width-28,42,30,ink,'right');text('HI '+String(best).padStart(5,'0'),game.width-28,76,22,'#999999','right');
 text('PRESS CONTROLLER = JUMP     BACK = MENU',game.width/2,698,18,'#858585','center');
 if(game.state!=='playing'){const cx=game.width/2,pw=Math.min(720,game.width-32);rect(cx-pw/2,185,pw,255,'#ededed');rect(cx-pw/2,185,pw,3,'#888888');text(game.state==='over'?'GAME OVER':'CHROME DINO',cx,264,42,ink,'center');text(game.state==='over'?'SCORE '+game.score+'   BEST '+best:'PRESS CONTROLLER TO START',cx,331,26,ink,'center');text(game.mode().name+'  |  PARKED ONLY',cx,392,20,'#858585','center');}
 return cv;
}
module.exports={draw};
