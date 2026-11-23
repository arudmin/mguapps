'use strict';
// Original monochrome pixel-art, uses existing recorder canvas API.
function draw(cv, game, w, h, best) {
  const sx = w / game.width, sy = h / 720;
  function rect(x,y,a,b,c) { cv.fillRect(x*sx,y*sy,a*sx,b*sy,c); }
  function text(t,x,y,size,c,align) { cv.text(t,x*sx,y*sy,size*sy,c,{align:align||'left',font:'bold'}); }
  const ink = '#505050';
  rect(0,0,game.width,720,'#f7f7f7');
  game.clouds.forEach(c => { rect(c.x,c.y+8,55,8,'#d4d4d4'); rect(c.x+14,c.y,30,13,'#d4d4d4'); });
  rect(0,game.floor+2,game.width,3,'#6e6e6e');
  for (let i=0;i<Math.ceil(game.width/50)+2;i++) rect(i*50-game.distance%50, game.floor+12,25,3,'#b4b4b4');
  game.obstacles.forEach(o => {
    if (o.type === 'bird') { rect(o.x,o.y-21,39,17,ink); rect(o.x+39,o.y-17,19,7,ink); rect(o.x+14,o.y-31,18,12,ink); }
    else { rect(o.x+7,o.y-o.h,o.w-10,o.h,ink); rect(o.x,o.y-o.h+17,12,10,ink); rect(o.x,o.y-o.h+13,7,28,ink); rect(o.x+o.w-5,o.y-o.h+25,12,8,ink); rect(o.x+o.w+3,o.y-o.h+17,6,23,ink); }
  });
  const x=game.x, y=game.y;
  rect(x-13,y-49,38,27,ink); rect(x+23,y-35,13,8,ink);
  rect(x-11,y-24,27,25,ink); rect(x-25,y-17,15,8,ink);
  rect(x+13,y-3,8,10,ink); rect(x-5,y-3,8,10,ink);
  rect(x+8,y-41,5,5,'#ffffff'); rect(x+10,y-39,2,2,'#1b1b1b');
  text('CHROME DINO GAME',28,42,24,ink);
  text(String(game.score).padStart(5,'0'),game.width-28,42,30,ink,'right');
  text('HI '+String(best).padStart(5,'0'),game.width-28,76,22,'#999999','right');
  text('PRESS CONTROLLER = JUMP     BACK = MENU',game.width/2,698,18,'#858585','center');
  if (game.state !== 'playing') {
    const cx=game.width/2, pw=Math.min(720,game.width-32);
    rect(cx-pw/2,185,pw,255,'#ededed'); rect(cx-pw/2,185,pw,3,'#888888');
    text(game.state==='over'?'GAME OVER':'CHROME DINO',cx,264,42,ink,'center');
    text(game.state==='over'?'SCORE '+game.score+'   BEST '+best:'PRESS CONTROLLER TO START',cx,331,26,ink,'center');
    text('PARKED ONLY',cx,392,20,'#858585','center');
  }
  return cv;
}
module.exports = { draw };
