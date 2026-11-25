'use strict';
// Independent dashboard look inspired by automotive instrumentation.
// All dinosaur and obstacle drawing is original and uses the existing Chrome Dino model.
// This renderer does not change game physics. The fixed world stays 1920x720 on every layout.
const {DINO_ROWS,dino,obstacle}=require('./sprites');
const recoveryUI=require('./recovery');
const WORLD_ASPECT=1920/720;
const LEVEL_COLORS=['#75bd9a','#83c9f5','#e2ad72','#dd8992'];
// Fixed 21x21, eight-tooth gear mask. Transparent cells are never painted.
const GEAR_SPRITE=[".........###.........",".........###.........","....#....###....#....","...##..#######..##...","..#################..","....#############....","....#####...#####....","...####.......####...","...####.......####...","######.........######","######.........######","######.........######","...####.......####...","...####.......####...","....#####...#####....","....#############....","..#################..","...##..#######..##...","....#....###....#....",".........###.........",".........###........."];
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
 cv.clear('#0a0c12');
 // Compact automotive header and racing accent.
 text('CHROME DINO',34,26,23,'#f0f5fa');text(words.levels[game.difficulty],1109,27,19,LEVEL_COLORS[game.difficulty],'right');
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
 for(const o of game.obstacles)for(const p of obstacle(o,game.elapsed))wr(p.x,p.y,p.w,p.h,o.type==='bird'?'#87bfe7':'#3cce8b');
 for(const p of dino(game))wr(p.x,p.y,p.w,p.h,'#eaf5fc');
 cv.noclip();

 // All user settings are in this GPU dashboard, no legacy MAIN menu needed.
 text(words.score||'SCORE',1195,108,22,'#bdc7d5');
 text(String(game.score),1194,168,59,LEVEL_COLORS[game.difficulty],'left','num');
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
 text(words.records,1194,263,20,'#9eadbf');
 words.levels.forEach((label,i)=>{
   const y=270+i*36,active=i===game.difficulty;
   if(active)round(1191,y,363,35,5,'#223c56');
   text(label,1204,y+25,22,active?'#eaf5fc':'#bdc7d5');
   text(String(records[i]||0),1540,y+28,25,'#c7e3ff','right','num');
 });
 const rankEnabled=game.state!=='playing'&&!opts.paused&&!opts.exitDialog;
 const rankFocus=rankEnabled&&(focus==='ranking'||opts.rankingOpen);
 round(1191,190,363,46,7,rankEnabled?(rankFocus?'#167ac4':'#1066a8'):'#1a2939');border(1191,190,363,46,7,rankEnabled?'#8bd6ff':'#45617b');
 for(const x of [1205,1507]){const c=rankEnabled?'#ffd16a':'#78889a';round(x+6,200,19,13,4,c);border(x,202,10,10,3,c);border(x+21,202,10,10,3,c);rect(x+14,212,4,6,c);round(x+8,218,16,4,2,c);}
 text(words.topPlayers,1372,219,20,rankEnabled?'#f0f7ff':'#78889a','center');
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
 }else if(opts.recovery){
   const view=opts.recovery,labels=words.recovery,status=opts.syncProfile||{};
   const screen=view.screen;
   const localized=(label,x,y,size,color)=>text(label,x,y,size,color,'center','dino-recovery');
   round(205,64,766,386,11,'#19212c');border(205,64,766,386,11,'#5b87ae');
   const title=screen==='found'?labels.foundTitle:screen==='code'||screen==='keyboard'?labels.codeTitle:labels.chooseTitle;
   localized(title,585,118,28,'#f4f6f8');
   const message=view.message||(status.recoveryPending?'pending':status.recoveryError);
   if(screen==='keyboard'){
     round(245,134,680,47,5,'#0d141e');border(245,134,680,47,5,'#78bfff');
     view.draft.split('').forEach((ch,i)=>text(ch,275+i*18+Math.floor(i/8)*12,163,22,'#f4f6f8','center'));
     const caret=Math.min(3,Math.floor(view.position/8));
     if(opts.nameBlink!==false)rect(266+view.position*18+caret*12,142,2,25,'#78d6ff');
     const keyLabels={LEFT:'<',RIGHT:'>',DEL:words.keyDelete,SAVE:labels.check,BACK:words.keyBack};
     recoveryUI.keys.forEach((key,index)=>{
       const active=index===view.cursor,disabled=key.id==='SAVE'&&view.draft.length!==32;
       round(key.x,key.y,key.w,key.h,6,active?'#286da4':'#293747');
       border(key.x,key.y,key.w,key.h,6,active?'#b5e6ff':'#405269');
       localized(keyLabels[key.id]||key.id.toLowerCase(),key.x+key.w/2,key.y+32,keyLabels[key.id]?14:23,disabled?'#8293a2':'#f0f7ff');
     });
     if(message)localized(labels[message],585,397,18,'#ffc17c');
   }else{
     if(screen==='found'){
       text(view.profile.nickname,585,164,27,'#9dc9ed','center');
       words.levels.forEach((mode,i)=>{
         const x=245+i*172;
         round(x,209,164,78,7,'#253446');
         localized(mode,x+82,237,17,LEVEL_COLORS[i]);
         text(view.profile.records[i],x+82,270,24,'#f4f6f8','center','num');
       });
     }else if(screen==='code'&&view.code){
       text(view.code.match(/.{8}/g).join('  '),585,235,30,'#f4f6f8','center');
     }else if(!message)localized(labels.chooseHint,585,234,19,'#b9cde0');
     if(message)localized(labels[message],585,309,19,message==='keepCode'?'#9dc9ed':'#ffc17c');
     const buttonLabels={later:labels.later,startNew:labels.startNew,enter:labels.enter,restore:labels.restore,done:words.doneSettings};
     recoveryUI.buttons(screen,status.recoveryPending).forEach(b=>{
       const active=focus===b.id;
       round(b.x,b.y,b.w,b.h,8,active?'#244768':'#1a2939');
       border(b.x,b.y,b.w,b.h,8,active?'#88caff':'#45617b');
       localized(buttonLabels[b.id],b.x+b.w/2,b.y+37,19,'#f0f7ff');
     });
   }
 }else if(opts.editName){
   round(205,64,766,386,11,'#131a24');border(205,64,766,386,11,'#5b87ae');text(words.editName||'Edit name',585,95,25,'#f4f6f8','center');
   round(245,104,680,42,5,'#0d141e');border(245,104,680,42,5,'#78bfff');
   const draft=opts.nameDraft||'',pos=opts.namePos||0;
   const ns=opts.nameCheck||'invalid',nl=words.nameStatus||{};
   text(nl[ns]||'',585,146,16,ns==='free'?'#75bd9a':ns==='taken'?'#dd8992':'#b9cde0','center');
   // A fixed character grid places the caret exactly between glyph cells.
   draft.split('').forEach((ch,i)=>text(ch,265+i*25,133,25,'#f4f6f8','center'));
   if(opts.nameBlink!==false)rect(252+pos*25,112,3,27,'#78d6ff');
   text(draft.length+'/16',907,133,19,'#9dc9ed','right');
   const labels={SHIFT:'Shift',LEFT:'<',RIGHT:'>',DEL:words.keyDelete||'DEL',RESET:words.keyReset||'Reset',SAVE:words.keySave||'Save',BACK:words.keyBack||'Back'};
   (opts.nameKeys||[]).forEach((k,i)=>{const active=i===opts.nameCursor,disabled=k.id==='RESET'&&!(opts.syncProfile||{}).originalNickname||k.id==='SAVE'&&(draft.length<3||draft.length>16||opts.nameCheck==='taken');
     const label=k.label||labels[k.id]||(opts.nameShift?k.id:k.id.toLowerCase());
     round(k.x,k.y,k.w,k.h,6,active?'#286da4':k.id==='SAVE'&&!disabled?'#235b46':k.id==='SHIFT'&&opts.nameShift?'#244768':'#293747');
     border(k.x,k.y,k.w,k.h,6,active?'#b5e6ff':'#405269');
     text(label,k.x+k.w/2,k.y+(k.label?23:29),k.label?12:labels[k.id]?18:25,disabled?'#657482':'#f0f7ff','center');
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
   if(step===3){const palette=['#286c53','#286b99','#996332','#963e47'];words.levels.forEach((v,i)=>{round(245+i*172,210,165,38,5,palette[i]);text(v,327+i*172,236,18,'#fff','center');});text(profile.enabled?labels[9]:labels[10],585,280,17,'#c7e3ff','center');if(!profile.enabled){text(labels[11],585,300,15,'#c7e3ff','center');if(opts.probeBusy||opts.probeError)text(opts.probeBusy?words.syncVinWait:words.probeError,585,327,16,'#ffc17c','center');}}
   if(step===4){text(labels[12],585,240,22,'#c7e3ff','center');text(labels[13],585,276,20,'#c7e3ff','center');}
   const buttons=[{id:'onNext',x:685,w:245,label:step===4?words.startButton:step===3&&!profile.enabled?labels[14]:labels[15]}];
   if(step>1)buttons.push({id:'onBack',x:245,w:180,label:words.keyBack});
   if(step===3&&!profile.enabled)buttons.push({id:'onSkip',x:435,w:240,label:labels[16]});
   buttons.forEach(b=>{round(b.x,342,b.w,66,8,focus===b.id?'#286b99':'#253446');border(b.x,342,b.w,66,8,focus===b.id?'#a3deff':'#45617b');text(b.label,b.x+b.w/2,383,20,'#fff','center');});
 }else if(opts.deleteOpen){
   round(205,138,766,230,11,'#19212c');border(205,138,766,230,11,'#a84a55');text(words.deleteAccount,585,181,28,'#ffb5b5','center');text(words.deleteNote,585,220,17,'#eaf5fc','center');text(words.deleteLocal,585,244,17,'#9dc9ed','center');for(const item of [{id:'deleteNo',x:242,label:words.cancelExit},{id:'deleteYes',x:600,label:words.deleteAccount}]){round(item.x,275,328,62,8,item.id==='deleteYes'?'#71323b':'#244768');border(item.x,275,328,62,8,focus===item.id?'#fff':'#45617b');text(item.label,item.x+164,314,19,'#fff','center');}
 }else if(opts.consentOpen){
   round(205,138,766,230,11,'#19212c');border(205,138,766,230,11,'#5b87ae');
   text(words.syncTitle,585,181,28,'#f4f6f8','center');text(words.syncConsent1,585,220,19,'#9dc9ed','center');text(words.syncConsent2,585,240,17,'#9dc9ed','center');
   for(const item of [{id:'consentNo',x:242,label:words.cancelExit},{id:'consentYes',x:600,label:opts.probeBusy?words.syncVinWait:opts.probeError?words.probeError:words.syncEnable}]){round(item.x,275,328,62,8,focus===item.id?'#244768':'#1a2939');border(item.x,275,328,62,8,focus===item.id?'#88caff':'#45617b');text(item.label,item.x+164,314,21,'#f0f7ff','center');}
 }else if(opts.rankingOpen){
   round(205,64,766,386,11,'#19212c');border(205,64,766,386,11,'#5b87ae');
   text(words.topPlayers,opts.canShowRecoveryCode?590:515,97,opts.canShowRecoveryCode?20:23,'#f4f6f8','center');
   const profile=opts.syncProfile||{};
   if(profile.enabled){round(215,70,130,33,6,focus==='deleteAccount'?'#933947':'#492630');text(words.deleteShort,280,92,15,'#ffb5b5','center');}
   if(opts.canShowRecoveryCode){
     round(353,70,125,33,6,focus==='recoveryCode'?'#244768':'#1a2939');
     text(words.recovery.rankButton,415,92,14,'#c7e3ff','center','dino-recovery');
   }
   if(!profile.enabled){round(720,70,245,33,6,focus==='syncProfile'?'#244768':'#1a2939');text(profile.deleting?words.deletePending:profile.recoveryPending?words.recovery.rankButton:words.syncEnable,842,93,18,'#f0f7ff','center',profile.recoveryPending?'dino-recovery':undefined);}
   else{round(720,70,245,33,6,focus==='editName'?'#244768':'#1a2939');text(profile.nickname||words.syncTitle,824,91,18,'#c7e3ff','center');const pen='#b5dfff';for(let j=0;j<9;j++)rect(934+j,86-j,5,5,pen);rect(934,91,4,2,pen);text(profile.namePending?words.namePending:profile.nameAdjusted?words.nameAdjusted:profile.error||('SYNC: '+(profile.pending||0)),950,105,12,profile.namePending||profile.nameAdjusted?'#e2ad72':'#9dc9ed','right');}
   // Four direct-access difficulty tabs, shared cached response.
   words.levels.forEach((label,i)=>{const x=235+i*176,active=i===(opts.rankingMode||0),focused=focus==='rankTab'+i;round(x,113,170,38,7,active?['#286c53','#286b99','#996332','#963e47'][i]:['#203e36','#20394d','#443526','#472d35'][i]);border(x,113,170,38,7,focused?'#ffffff':active?LEVEL_COLORS[i]:'#40566d');text(label,x+85,139,20,active?'#ffffff':'#b8cbdf','center');if(active)rect(x+12,147,146,3,LEVEL_COLORS[i]);});
   const rows=opts.rankingRows||[];
   if(opts.rankingStatus==='loading')text(words.rankLoading,585,264,23,'#9dc9ed','center');
   else if(opts.rankingStatus==='error'){text(words.rankError,585,250,23,'#ffc17c','center');text(opts.rankingError||'NETWORK',585,282,18,'#9dc9ed','center');}
   else if(!rows.length)text(words.rankEmpty,585,264,23,'#9dc9ed','center');
   else {
     const colors=['#ffd16a','#d3e3f1','#e5a46f'],backs=['#523b20','#34485b','#52362a'];
     function cup(x,y,c){round(x+6,y+2,17,10,3,c);border(x,y+3,9,8,3,c);border(x+21,y+3,9,8,3,c);rect(x+13,y+12,4,4,c);round(x+7,y+16,16,3,1,c);}
     // Equal-height rows, including podium, with space for own rank and buttons.
     rows.slice(0,10).forEach((row,i)=>{
       const podium=i<3,y=155+i*23,h=22,c=colors[i]||'#a4c2df';
       const x=318,w=534;
       round(x,y,w,h,6,row.self?'#174f79':podium?backs[i]:'#263444');
       if(podium||row.self)border(x,y,w,h,6,row.self?'#79cfff':c);
       if(podium){cup(x+10,y,c);text('TOP-'+String(row.rank),x+52,y+16,17,c); }
       else{text('#'+String(row.rank),x+22,y+16,17,c);}
       text(row.nickname.slice(0,24),x+128,y+16,19,row.self?'#e3f6ff':'#f4f6f8');
       text(String(row.score),x+w-14,y+17,20,c,'right','num');
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
