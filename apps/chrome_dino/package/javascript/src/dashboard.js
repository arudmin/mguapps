'use strict';
// Independent dashboard look inspired by automotive instrumentation.
// All dinosaur and obstacle drawing is original and uses the existing Chrome Dino model.
// This renderer does not change game physics. The fixed world stays 1920x720 on every layout.
const { DINO_ROWS }=require('./render');
const WORLD_ASPECT=1920/720;
const CACTUS=[[5,1,4,1],[4,2,6,1],[4,3,6,20],[5,23,4,3],[2,11,2,1],[1,10,2,1],[1,11,2,6],[2,17,2,2],[3,19,2,1],[10,8,2,1],[11,7,2,1],[11,8,2,8],[10,16,2,2],[9,18,2,1]];
const A=[[10,34,5,1],[10,35,3,3],[9,38,3,2],[8,40,5,2],[17,34,4,1],[18,35,3,3],[19,38,3,2],[18,40,5,2]];
const B=[[10,34,5,1],[11,35,3,3],[12,38,3,2],[12,40,5,2],[17,34,4,1],[17,35,3,3],[16,38,3,2],[15,40,5,2]];
const AIR=[[10,34,5,1],[11,35,5,2],[11,37,6,2],[17,34,4,1],[17,35,4,2],[18,37,5,2]];
function drawDashboard(cv,game,w,h,best,words,update,options){
 const opts=options||{};
 words=words||require('./i18n').words('en');
 const kx=w/1600,ky=h/520;
 const rect=(x,y,rw,rh,c)=>cv.fillRect(x*kx,y*ky,rw*kx,rh*ky,c);
 const round=(x,y,rw,rh,r,c)=>cv.roundRect(x*kx,y*ky,rw*kx,rh*ky,r*Math.min(kx,ky),c);
 const border=(x,y,rw,rh,r,c)=>cv.strokeRoundRect(x*kx,y*ky,rw*kx,rh*ky,r*Math.min(kx,ky),Math.max(1,Math.min(kx,ky)),c);
 const text=(s,x,y,size,c,align,font)=>cv.text(String(s),x*kx,y*ky,size*ky,c,{literal:true,align:align||'left',font:font||'bold'});
 const pf={x:22,y:52,w:1132,h:421},side={x:1172,y:52,w:404,h:421};
 const f={x:34,y:86,w:1108,h:360};
 const wx=x=>f.x+x*f.w/game.width, wy=y=>f.y+y*f.h/720;
 const wr=(x,y,rw,rh,c)=>rect(wx(x),wy(y),rw*f.w/game.width,rh*f.h/720,c);
 const pixel=(x,y,pts,unit,c)=>{for(const a of pts)wr(x+a[0]*unit,y+a[1]*unit,a[2]*unit,a[3]*unit,c)};
 cv.clear('#0a0c12');
 // Compact automotive header and racing accent.
 text('CHROME DINO',34,26,23,'#f0f5fa');text(words.levels[game.difficulty],1109,27,19,'#b6c5d6','right');
 round(pf.x,pf.y,pf.w,pf.h,12,'#11161e');border(pf.x,pf.y,pf.w,pf.h,12,'#314052');
 round(side.x,side.y,side.w,side.h,9,'#10141b');border(side.x,side.y,side.w,side.h,9,'#344454');
 // The game viewport is clipped independently of the score panel.
 cv.clip(f.x*kx,f.y*ky,f.w*kx,f.h*ky);
 rect(f.x,f.y,f.w,f.h,'#0c1119');
 for(let i=0;i<43;i++){const x=(i*227+53)%1100, y=(i*139+31)%276;rect(f.x+x,f.y+y,(i%4===0?3:2),(i%3===0?2:1),i%6===0?'#425d78':'#344052')}
 // Slow moving sky decoration and original pixel obstacles.
 for(const c of game.clouds){wr(c.x,c.y+8,55,8,'#20303e');wr(c.x+14,c.y,30,13,'#233444')}
 wr(0,game.floor+3,game.width,4,'#627789');
 const distance=game.distance%66;for(let x=-distance;x<game.width;x+=66)wr(x,game.floor+15,29,3,'#314252');
 for(const o of game.obstacles){
   if(o.type==='bird'){
     const fl=Math.floor(game.elapsed*7)%2;
     wr(o.x+5,o.y-18,43,13,'#87bfe7');wr(o.x+43,o.y-15,17,6,'#87bfe7');
     wr(o.x+17,o.y-25,18,11,'#87bfe7');
     if(fl){wr(o.x+6,o.y-33,25,9,'#87bfe7');wr(o.x,o.y-37,9,7,'#87bfe7')}
     else{wr(o.x+12,o.y-4,30,8,'#87bfe7');wr(o.x+2,o.y+3,16,6,'#87bfe7')}
   }else for(const p of o.parts){const u=p.large?3.15:2.5;pixel(o.x+p.x,o.y-26*u,CACTUS,u,'#3cce8b')}
 }
 const u=2.6, dx=game.x-60,dy=game.y-42*u;
 pixel(dx,dy,DINO_ROWS.filter(p=>p[1]<34),u,'#eaf5fc');
 const running=game.state==='playing'&&!opts.paused&&game.y>=game.floor-.1;
 pixel(dx,dy,running?(Math.floor(game.distance/27)%2?B:A):AIR,u,'#eaf5fc');
 cv.noclip();

 // All user settings are in this GPU dashboard, no legacy MAIN menu needed.
 text(words.score||'SCORE',1195,108,22,'#bdc7d5');
 text(String(game.score),1194,168,59,'#87c3ff','left','num');
 const focus=opts.selectedControl||'play';
 const records=opts.bestModes||words.levels.map((_,i)=>i===game.difficulty?best:0);
 const gearEnabled=game.state!=='playing'&&!opts.paused&&!opts.exitDialog;
 const gearFocus=gearEnabled&&(focus==='settings'||opts.settingsOpen);
 round(1480,65,80,70,8,gearFocus?'#244768':'#1a2939');
 border(1480,65,80,70,8,gearFocus?'#88caff':'#45617b');
 // Gear drawn with primitives; no unsupported Unicode font glyphs.
 const gearColor=gearEnabled?'#c7e3ff':'#647589';
 for(let n=0;n<8;n++){const angle=n*Math.PI/4;rect(1516+Math.cos(angle)*19-4,100+Math.sin(angle)*19-4,8,8,gearColor);}
 round(1502,82,36,36,12,gearColor);round(1511,91,18,18,8,'#1a2939');
 rect(1193,180,359,1,'#344455');
 text(words.records,1194,207,20,'#9eadbf');
 words.levels.forEach((label,i)=>{
   const y=216+i*39,active=i===game.difficulty;
   if(active)round(1191,y,363,35,5,'#223c56');
   text(label,1204,y+25,22,active?'#eaf5fc':'#bdc7d5');
   text(String(records[i]||0),1540,y+28,25,'#c7e3ff','right','num');
 });
 const rankEnabled=game.state!=='playing'&&!opts.paused&&!opts.exitDialog;
 const rankFocus=rankEnabled&&(focus==='ranking'||opts.rankingOpen);
 round(1191,376,363,46,7,rankFocus?'#244768':'#1a2939');border(1191,376,363,46,7,rankFocus?'#88caff':'#45617b');
 text(words.topPlayers,1372,405,22,rankEnabled?'#f0f7ff':'#78889a','center');
 rect(1193,429,359,1,'#344455');
 text('FPS '+String(opts.fps===undefined?'-':opts.fps)+' / 60',1194,453,18,'#92ceff');
 // Versioned in-game update notices remain independent of network leaderboard.
 if(update&&update.available&&update.latest)text((words.updateNotice||'UPDATE AVAILABLE')+' '+update.latest,1100,72,18,'#e9ad6f','right');
 // Overlay in the playfield while ready/over; preserves the controller-to-start UX.
 if(opts.exitDialog){
   round(222,154,733,208,11,'#19212c');border(222,154,733,208,11,'#5b87ae');
   text(words.exitTitle,585,220,36,'#f4f6f8','center');
   text(words.exitNote,585,252,20,'#9dc9ed','center');
   for(const item of [{id:'cancel',x:242,label:words.cancelExit},{id:'exit',x:600,label:words.confirmExit}]){
     round(item.x,275,328,62,8,focus===item.id?'#244768':item.id==='exit'?'#38232b':'#1a2939');border(item.x,275,328,62,8,focus===item.id?'#88caff':'#45617b');text(item.label,item.x+164,314,24,'#f0f7ff','center');
   }
 }else if(opts.paused){
   round(222,154,733,208,11,'#19212c');border(222,154,733,208,11,'#5b87ae');
   text(words.pauseTitle,585,220,36,'#f4f6f8','center');
   text((words.score||'SCORE')+' '+game.score,585,252,23,'#9dc9ed','center');
   for(const item of [{id:'resume',x:242,label:words.continue_},{id:'menu',x:600,label:words.exitToMenu}]){
     round(item.x,275,328,62,8,focus===item.id?'#244768':'#1a2939');border(item.x,275,328,62,8,focus===item.id?'#88caff':'#45617b');text(item.label,item.x+164,314,24,'#f0f7ff','center');
   }
 }else if(opts.rankingOpen){
   round(205,64,766,386,11,'#19212c');border(205,64,766,386,11,'#5b87ae');
   text(words.topPlayers,585,97,26,'#f4f6f8','center');
   round(300,108,550,42,7,focus==='rankMode'?'#244768':'#1a2939');border(300,108,550,42,7,focus==='rankMode'?'#88caff':'#45617b');
   text('< '+words.levels[opts.rankingMode||0]+' >',575,136,22,'#f0f7ff','center');
   const rows=opts.rankingRows||[];
   if(opts.rankingStatus==='loading')text(words.rankLoading,585,264,23,'#9dc9ed','center');
   else if(opts.rankingStatus==='error')text(words.rankError,585,264,23,'#ffc17c','center');
   else if(!rows.length)text(words.rankEmpty,585,264,23,'#9dc9ed','center');
   else rows.slice(0,10).forEach((row,i)=>{const y=174+i*21;text(String(row.rank),260,y,18,'#9dc9ed');text(row.nickname,315,y,18,'#f0f7ff');text(String(row.score),916,y,18,'#c7e3ff','right','num');});
   for(const item of [{id:'refresh',x:300,label:words.rankRefresh},{id:'rankDone',x:600,label:words.doneSettings}]){
     round(item.x,398,265,42,7,focus===item.id?'#244768':'#1a2939');border(item.x,398,265,42,7,focus===item.id?'#88caff':'#45617b');text(item.label,item.x+132,426,21,'#f0f7ff','center');
   }
 }else if(opts.settingsOpen){
   round(222,126,733,296,11,'#19212c');border(222,126,733,296,11,'#5b87ae');
   text(words.settingsTitle,585,176,32,'#f4f6f8','center');
   for(const item of [{id:'mode',y:200,label:words.difficulty+': < '+words.levels[game.difficulty]+' >'},{id:'language',y:272,label:words.language+': < '+String(opts.languageLabel||'Auto (BMW)')+' >'},{id:'done',y:344,label:words.doneSettings}]){
     round(320,item.y,530,58,8,focus===item.id?'#244768':'#1a2939');border(320,item.y,530,58,8,focus===item.id?'#88caff':'#45617b');text(item.label,585,item.y+38,24,'#f0f7ff','center');
   }
 }else if(game.state!=='playing'){
   round(222,176,733,171,11,'#19212c');border(222,176,733,171,11,'#5b87ae');
   text(game.state==='over'?words.over:words.title,585,237,36,'#f4f6f8','center');
   const enabled=opts.parked!==false, active=enabled&&focus==='play';
   round(345,252,480,60,8,active?'#244768':'#1a2939');
   border(345,252,480,60,8,active?'#88caff':'#45617b');
   text(game.state==='over'?words.retryButton:words.startButton,585,291,26,enabled?'#f0f7ff':'#78889a','center');
   text(!enabled?(words.parkedOnly||'PARKED ONLY'):game.state==='over'?(words.score+' '+game.score+'  '+words.best+' '+best):words.start,585,334,17,!enabled?'#ffc17c':'#9aabbf','center');
 }
 rect(0,489,1600,31,'#0a0c12');
 text(words.hudJump||'CONTROLLER: JUMP',38,509,18,'#8fa0b5');
 round(890,489,260,30,5,'#1a2939');text(words.hudBack||'BACK',1020,509,18,'#c6d9ed','center');
 text('v'+require('../kit/app-spec.json').version,1548,509,16,'#70859a','right');
 return cv;
}
module.exports={drawDashboard,WORLD_ASPECT};
