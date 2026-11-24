'use strict';
// Independent dashboard look inspired by automotive instrumentation.
// All dinosaur and obstacle drawing is original and uses the existing Chrome Dino model.
// This renderer does not change game physics. The fixed world stays 1920x720 on every layout.
const { DINO_ROWS }=require('./render');
const WORLD_ASPECT=1920/720;
// Fixed 21x21, eight-tooth gear mask. Transparent cells are never painted.
const GEAR_SPRITE=[".........###.........",".........###.........","....#....###....#....","...##..#######..##...","..#################..","....#############....","....#####...#####....","...####.......####...","...####.......####...","######.........######","######.........######","######.........######","...####.......####...","...####.......####...","....#####...#####....","....#############....","..#################..","...##..#######..##...","....#....###....#....",".........###.........",".........###........."];
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
 const gearUnit=2;
 GEAR_SPRITE.forEach((row,y)=>{
   for(let x=0;x<row.length;){
     if(row[x]!== '#'){x++;continue;}
     const start=x;while(x<row.length&&row[x]==='#')x++;
     rect(1499+start*gearUnit,79+y*gearUnit,(x-start)*gearUnit,gearUnit,gearColor);
   }
 });
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
 }else if(opts.editName){
   round(205,64,766,386,11,'#131a24');border(205,64,766,386,11,'#5b87ae');text(words.editName||'Edit name',585,95,25,'#f4f6f8','center');
   round(245,104,680,42,5,'#0d141e');border(245,104,680,42,5,'#78bfff');
   const draft=opts.nameDraft||'',pos=opts.namePos||0;
   // A fixed character grid places the caret exactly between glyph cells.
   draft.split('').forEach((ch,i)=>text(ch,265+i*25,133,25,'#f4f6f8','center'));
   if(opts.nameBlink!==false)rect(252+pos*25,112,3,27,'#78d6ff');
   text(draft.length+'/16',907,133,19,'#9dc9ed','right');
   const labels={SHIFT:'Shift',LEFT:'<',RIGHT:'>',DEL:words.keyDelete||'DEL',RESET:words.keyReset||'Reset',SAVE:words.keySave||'Save',BACK:words.keyBack||'Back'};
   (opts.nameKeys||[]).forEach((k,i)=>{const active=i===opts.nameCursor,disabled=k.id==='RESET'&&!(opts.syncProfile||{}).originalNickname||k.id==='SAVE'&&(draft.length<3||draft.length>16);
     const label=labels[k.id]||(opts.nameShift?k.id:k.id.toLowerCase());
     round(k.x,k.y,k.w,k.h,6,active?'#286da4':k.id==='SAVE'&&!disabled?'#235b46':k.id==='SHIFT'&&opts.nameShift?'#244768':'#293747');
     border(k.x,k.y,k.w,k.h,6,active?'#b5e6ff':'#405269');
     text(label,k.x+k.w/2,k.y+29,labels[k.id]?18:25,disabled?'#657482':'#f0f7ff','center');
   });
 }else if(opts.onboarding){
   const step=opts.onboarding,profile=opts.syncProfile||{},focus=opts.selectedControl;
   round(205,64,766,386,12,'#19212c');border(205,64,766,386,12,'#5b87ae');
   const labels=words.onboard||[];
   text('CHROME DINO',585,103,24,'#9dc9ed','center');
   for(let i=0;i<4;i++)round(507+i*40,116,33,5,2,i<step?'#78c8ff':'#344455');
   text(labels[(step-1)*2]||'Chrome Dino',585,165,32,'#f4f6f8','center');
   text(labels[(step-1)*2+1]||'',585,192,18,'#b9cde0','center');
   if(step===1){for(const p of DINO_ROWS)rect(538+p[0]*2.7,211+p[1]*2.7,p[2]*2.7,2.7,'#eaf5fc');}
   if(step===2){round(340,205,490,65,8,'#132c43');border(340,205,490,65,8,focus==='onEdit'?'#fff':'#78bfff');text(opts.onboardName||profile.nickname||labels[8],585,245,25,'#f4f6f8','center');}
   if(step===3){const palette=['#286c53','#286b99','#996332','#963e47'];words.levels.forEach((v,i)=>{round(245+i*172,210,165,38,5,palette[i]);text(v,327+i*172,236,18,'#fff','center');});text(profile.enabled?labels[9]:labels[10],585,280,17,'#c7e3ff','center');if(!profile.enabled){text(labels[11],585,304,17,'#c7e3ff','center');if(!opts.vinAvailable)text(words.syncVinWait,585,327,16,'#ffc17c','center');}}
   if(step===4){text(labels[12],585,240,22,'#c7e3ff','center');text(labels[13],585,276,20,'#c7e3ff','center');}
   const buttons=[{id:'onNext',x:685,w:245,label:step===4?words.startButton:step===3&&!profile.enabled?labels[14]:labels[15]}];
   if(step>1)buttons.push({id:'onBack',x:245,w:180,label:words.keyBack});
   if(step===3&&!profile.enabled)buttons.push({id:'onSkip',x:435,w:240,label:labels[16]});
   buttons.forEach(b=>{round(b.x,342,b.w,66,8,focus===b.id?'#286b99':'#253446');border(b.x,342,b.w,66,8,focus===b.id?'#a3deff':'#45617b');text(b.label,b.x+b.w/2,383,20,'#fff','center');});
 }else if(opts.consentOpen){
   round(205,138,766,230,11,'#19212c');border(205,138,766,230,11,'#5b87ae');
   text(words.syncTitle,585,181,28,'#f4f6f8','center');text(words.syncConsent1,585,220,19,'#9dc9ed','center');text(words.syncConsent2,585,246,19,'#9dc9ed','center');
   for(const item of [{id:'consentNo',x:242,label:words.cancelExit},{id:'consentYes',x:600,label:opts.vinAvailable?words.syncEnable:words.syncVinWait}]){round(item.x,275,328,62,8,focus===item.id?'#244768':'#1a2939');border(item.x,275,328,62,8,focus===item.id?'#88caff':'#45617b');text(item.label,item.x+164,314,21,'#f0f7ff','center');}
 }else if(opts.rankingOpen){
   round(205,64,766,386,11,'#19212c');border(205,64,766,386,11,'#5b87ae');
   text(words.topPlayers,480,97,24,'#f4f6f8','center');
   const profile=opts.syncProfile||{};
   if(!profile.enabled){round(720,70,245,33,6,focus==='syncProfile'?'#244768':'#1a2939');text(words.syncEnable,842,93,18,'#f0f7ff','center');}
   else{round(720,70,245,33,6,focus==='editName'?'#244768':'#1a2939');text(profile.nickname||words.syncTitle,824,91,18,'#c7e3ff','center');const pen='#b5dfff';for(let j=0;j<9;j++)rect(934+j,86-j,5,5,pen);rect(934,91,4,2,pen);text(profile.error||('SYNC: '+(profile.pending||0)),950,105,12,'#9dc9ed','right');}
   // Four direct-access difficulty tabs, shared cached response.
   words.levels.forEach((label,i)=>{const x=235+i*176,active=i===(opts.rankingMode||0),focused=focus==='rankTab'+i;round(x,113,170,38,7,active?['#286c53','#286b99','#996332','#963e47'][i]:['#203e36','#20394d','#443526','#472d35'][i]);border(x,113,170,38,7,focused?'#ffffff':active?['#75bd9a','#83c9f5','#e2ad72','#dd8992'][i]:'#40566d');text(label,x+85,139,20,active?'#ffffff':'#b8cbdf','center');if(active)rect(x+12,147,146,3,['#75bd9a','#83c9f5','#e2ad72','#dd8992'][i]);});
   const rows=opts.rankingRows||[];
   if(opts.rankingStatus==='loading')text(words.rankLoading,585,264,23,'#9dc9ed','center');
   else if(opts.rankingStatus==='error'){text(words.rankError,585,250,23,'#ffc17c','center');text(opts.rankingError||'NETWORK',585,282,18,'#9dc9ed','center');}
   else if(!rows.length)text(words.rankEmpty,585,264,23,'#9dc9ed','center');
   else {
     const colors=['#ffd16a','#d3e3f1','#e5a46f'],backs=['#523b20','#34485b','#52362a'];
     function cup(x,y,c){round(x+6,y,19,13,4,c);border(x,y+2,10,10,3,c);border(x+21,y+2,10,10,3,c);rect(x+14,y+12,4,6,c);round(x+8,y+18,16,4,2,c);}
     // Ten players fit without hiding any results; podium cards get extra height.
     rows.slice(0,10).forEach((row,i)=>{
       const podium=i<3,y=158+(podium?i*34:102+(i-3)*19),h=podium?31:17,c=colors[i]||'#a4c2df';
       const x=318,w=534;
       round(x,y,w,h,6,row.self?'#174f79':podium?backs[i]:'#263444');
       if(podium||row.self)border(x,y,w,h,6,row.self?'#79cfff':c);
       if(podium){cup(x+10,y+4,c);text('TOP-'+String(row.rank),x+52,y+22,18,c); }
       else{text('#'+String(row.rank),x+22,y+14,16,c);}
       text(row.nickname.slice(0,24),x+128,y+(podium?23:14),podium?23:18,row.self?'#e3f6ff':'#f4f6f8');
       text(String(row.score),x+w-14,y+(podium?24:15),podium?25:19,c,'right','num');
     });
   }
   const own=opts.rankingData&&opts.rankingData.profile&&opts.rankingData.profile.positions[['easy','normal','hard','extreme'][opts.rankingMode||0]];if(own&&own.rank>10)text('#'+own.rank+'  '+profile.nickname+'  '+own.score,585,395,17,'#92ceff','center');
   for(const item of [{id:'refresh',x:300,label:opts.rankingRefreshing?(words.rankRefreshing||'Refreshing...'):words.rankRefresh},{id:'rankDone',x:600,label:words.doneSettings}]){
     round(item.x,398,265,42,7,focus===item.id?'#244768':'#1a2939');border(item.x,398,265,42,7,focus===item.id?'#88caff':'#45617b');text(item.label,item.x+132,426,21,'#f0f7ff','center');
   }
 }else if(opts.settingsOpen&&opts.dropdown){
   round(222,85,733,350,11,'#19212c');border(222,85,733,350,11,'#5b87ae');
   text(opts.dropdown==='mode'?words.difficulty:words.language,585,130,30,'#f4f6f8','center');
   const items=opts.dropdown==='mode'?words.levels:opts.languageItems||[];
   const first=opts.dropdownStart||0;
   items.slice(first,first+6).forEach((label,i)=>{const y=154+i*42,active=first+i===opts.dropdownIndex;round(320,y,530,40,6,active?'#244768':'#1a2939');border(320,y,530,40,6,active?'#88caff':'#45617b');text(label,585,y+27,23,'#f0f7ff','center');});
   if(items.length>6){round(865,154,70,120,6,'#1a2939');round(865,286,70,120,6,'#1a2939');text('^',900,220,28,'#c7e3ff','center');text('v',900,352,28,'#c7e3ff','center');}
 }else if(opts.settingsOpen){
   round(222,126,733,296,11,'#19212c');border(222,126,733,296,11,'#5b87ae');
   text(words.settingsTitle,585,176,32,'#f4f6f8','center');
   for(const item of [{id:'mode',y:200,label:words.difficulty+': '+words.levels[game.difficulty]+'  v'},{id:'language',y:272,label:words.language+': '+String(opts.languageLabel||'Auto (BMW)')+'  v'},{id:'done',y:344,label:words.doneSettings}]){
     round(320,item.y,530,58,8,focus===item.id?'#244768':'#1a2939');border(320,item.y,530,58,8,focus===item.id?'#88caff':'#45617b');text(item.label,585,item.y+38,24,'#f0f7ff','center');
   }
 }else if(game.state==='over'){
   round(222,154,733,208,11,'#19212c');border(222,154,733,208,11,'#5b87ae');
   text(words.over,585,220,36,'#f4f6f8','center');
   text(words.score+' '+game.score+'  '+words.best+' '+best,585,252,23,'#9dc9ed','center');
   for(const item of [{id:'play',x:242,label:words.retryButton},{id:'overMenu',x:600,label:words.exitToMenu}]){
     const active=opts.parked!==false&&focus===item.id;
     round(item.x,275,328,62,8,active?'#244768':'#1a2939');border(item.x,275,328,62,8,active?'#88caff':'#45617b');text(item.label,item.x+164,314,24,opts.parked===false?'#78889a':'#f0f7ff','center');
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
module.exports={drawDashboard,WORLD_ASPECT,GEAR_SPRITE};
