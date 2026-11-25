'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../package/javascript');
const { Recorder }=require('../package/javascript/kit/record');
const { Outbox }=require('../package/javascript/src/outbox');
const { identity }=require('../package/javascript/src/leaderboard');
const { readProfile }=require('../package/javascript/src/recovery');
const i18n=require('../package/javascript/src/i18n');
const fonts=require('../package/javascript/kit/fonts');
const program=fs.readFileSync(path.join(root,'app.js'),'utf8');
const code='abcd0123456789ef'.repeat(2);
const vin='WBA12345678901234';
const profile={nickname:'bmw_dino',original_nickname:'user_00112233',records:{easy:15,normal:42,hard:27,extreme:53}};
const flush=()=>new Promise(resolve=>setImmediate(resolve));

function withDir(run){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dino-recovery-'));
 return Promise.resolve().then(()=>run(dir)).finally(()=>fs.rmSync(dir,{recursive:true,force:true}));
}

async function appTest(dir,{id8=false,fresh=false,decline=false}={}){
 const settings={onboardingSchema:fresh?0:1,best_easy:55,difficultySchema:1};
 let clock=10000,tap,draw,shutdown,input,options,readCount=0,speed,interval,previewCount=0,
     attempts=0,registerCount=0,claimed,registration,shownCode;
 class TestClient{
   all(token,cb){cb(null,{boards:{easy:[],normal:[],hard:[],extreme:[]},generated_at:clock});}
   previewRecovery(value,hash,cb){
     assert.equal(value,code);assert.equal(hash,identity(vin));previewCount++;
     if(previewCount===1){cb(Error('offline'));return;}
     cb(null,{profile});
   }
   claimRecovery(claim,cb){
     attempts++;if(claimed)assert.deepStrictEqual(claim,claimed);else claimed=claim;
     if(attempts===1){cb(Error('offline'));return;}
     cb(null,{accepted:true,profile});
   }
   recoveryCode(value,token,cb){assert.equal(token,claimed.token);shownCode=value;cb(null,{accepted:true});}
   enroll(hash,token,cb,installationId){registerCount++;registration={hash,token,installationId};cb(null,{accepted:true,nickname:'user_87654321'});}
   syncProfile(token,id,records,nickname,cb){
     assert.deepStrictEqual(records,{...profile.records,easy:55});
     assert.equal(nickname,null);
     assert.equal(token,decline?registration.token:claimed.token);
     cb(null,{accepted:true,operation_id:id,nickname:decline?'user_87654321':profile.nickname});
   }
 }
 const now=Date.now;
 const ctx={dataDir:dir,ui:{id8,isVisible:()=>true,hasFocus:()=>true,open:()=>Promise.resolve(),onClick(){},onVisible(){},onFocus(){},image(){},text(){},comp(){return null;}},
   log:{info(){},warn(){},error(){}},settings:{get:k=>settings[k],set:(k,v)=>settings[k]=v},
   signals:{watch(s,i,cb){if(cb.statusCarSpeed2)speed=cb.statusCarSpeed2;return Promise.resolve({});}},
   controller:{grab(){},onInput:fn=>input=fn},onTap:fn=>tap=fn,hideButton(){},loop:(n,f,fn)=>draw=fn,
   canvas:(w,h)=>new Recorder(w,h),app:{on:(n,fn)=>shutdown=fn}};
 const sandbox={require:p=>{
   if(p==='./kit/mgu')return {run:o=>o.start(ctx)};
   if(p==='./kit/diag')return {Diag:class{async init(){readCount++;this.p={};return this;}async functional(){return new Map([[1,[0x62,0xf1,0x90,...Buffer.from(vin)]]]);}}};
   if(p==='./src/dashboard'){const dashboard=require(path.resolve(root,p));return {...dashboard,drawDashboard(...args){options=args[7];return dashboard.drawDashboard(...args);}};}
   if(p==='./src/leaderboard')return {...require(path.resolve(root,p)),Leaderboard:TestClient};
   if(p==='./src/update')return {checkUpdate:(v,cb)=>cb({available:false})};
   return require(path.resolve(root,p));
 },Date:{now:()=>clock},process:{on(){},exit(){}},setTimeout:fn=>fn(),setInterval:(fn,ms)=>{if(ms===1000)interval=fn;return ms;},clearInterval(){}};
 vm.runInNewContext(program,sandbox,{filename:'app.js'});
 const parking=()=>speed({speedVehicleCentreOfGravity:0});
 const frame=()=>{clock+=140;parking();draw();};
 const press=()=>{clock+=200;parking();input({frontRotaryEncoderPushButton:1});input({frontRotaryEncoderPushButton:0});};
 parking();
 if(fresh){tap(810,375);tap(810,375);assert.equal(readCount,0);tap(810,375);}
 else {tap(1372,213);tap(842,92);assert.equal(readCount,0);tap(760,300);}
 frame();assert.equal(options.recovery.screen,'choose');assert.equal(readCount,0);
 tap(815,375);frame();assert.equal(options.recovery.screen,'keyboard');
 const keys=require('../package/javascript/src/recovery').keys;
 const key=id=>{const k=keys.find(k=>k.id===id);tap(k.x+10,k.y+10);};
 for(const char of code.toUpperCase())key(char);
 key('SAVE');await flush();frame();assert.equal(options.recovery.message,'offline');
 key('SAVE');await flush();frame();
 assert.equal(readCount,1,'vehicle is read only after consent and reused within the dialog');
 assert.equal(options.recovery.screen,'found');
 assert.deepStrictEqual(options.recovery.profile.records,[15,42,27,53]);
 assert.equal(options.recovery.profile.nickname,'bmw_dino');
 if(decline){
   tap(400,375);await flush();frame();
   interval();
   const outbox=new Outbox(dir,{});
   assert.equal(registerCount,1);
   assert.equal(registration.hash,identity(vin));
   assert.match(registration.installationId,/^[a-f0-9-]{36}$/);
   assert.equal(outbox.status().nickname,'user_87654321');
   assert.equal(attempts,0);
   assert.equal(settings.best_easy,55);
 }else{
   press();frame();assert(options.syncProfile.recoveryPending);assert.equal(settings.best_normal,0);
   try{Date.now=()=>now()+65000;clock=now()+130000;parking();interval();interval();}finally{Date.now=now;}
   frame();
   assert.equal(attempts,2);
   assert.equal(registerCount,0);
   assert.equal(settings.offlineNickname,'bmw_dino');
   assert.deepStrictEqual([settings.best_easy,settings.best_normal,settings.best_hard,settings.best_extreme],[55,42,27,53]);
   assert.equal(options.recovery.screen,'code');
   assert.equal(options.recovery.code,claimed.nextCode);
   tap(585,375);
   if(fresh){tap(815,375);tap(1372,213);}
   tap(415,91);frame();assert.equal(shownCode,claimed.nextCode);
 }
 shutdown();
}

async function journalTest(dir){
 let first;
 const record=new Outbox(dir,{claimRecovery(claim,cb){first=claim;cb(Object.assign(Error('offline'),{code:'ETIMEDOUT'}));}});
 const hash=identity(vin);
 assert(record.prepareRecovery(code,hash));
 record.capture([20,30,40,50]);
 assert.equal(record.state.jobs.length,0);
 record.tick(Date.now());
 record.stop();
 const resumed=new Outbox(dir,{claimRecovery(claim,cb){assert.deepStrictEqual(claim,first);cb(null,{accepted:true,profile});}});
 assert(resumed.status().recoveryPending);
 assert(!resumed.enroll(hash,[0,0,0,0]));
 resumed.tick(Date.now());
 assert.equal(resumed.token(),first.token);
 const afterCrash=new Outbox(dir,{});
 assert.deepStrictEqual(afterCrash.recoveredProfile(),{nickname:'bmw_dino',records:[15,42,27,53],code:first.nextCode});
 assert(afterCrash.acknowledgeRecovery());
 assert(afterCrash.capture([20,42,27,53]));
 assert.equal(afterCrash.state.jobs[0].nickname,null);
 assert.equal(fs.statSync(afterCrash.file).mode&0o777,0o600);
 assert.equal(readProfile({profile:{...profile,records:{...profile.records,hard:-1}}}),null);
}

function translations(){
 const langs=Object.keys(i18n.languageNames);
 assert.equal(langs.length,12);
 for(const lang of langs){
   const words=i18n.words(lang);
   for(const [key,label] of Object.entries(words.recovery)){
     assert(label);
     if(lang!=='en')assert.notEqual(label,i18n.words('en').recovery[key],lang+' '+key);
     const atlas=fonts.get('dino-recovery',19,label);
     for(const char of label)assert(atlas.glyphs[char.codePointAt(0)],lang+' '+char);
     assert(fonts.measure(atlas,label)*19/atlas.size<700,lang+' '+key+' width');
   }
 }
}

(async()=>{
 translations();
 await withDir(journalTest);
 await withDir(dir=>appTest(dir));
 await withDir(dir=>appTest(dir,{id8:true,fresh:true}));
 await withDir(dir=>appTest(dir,{id8:true,decline:true}));
 console.log('ID7/ID8 recovery: consent, touch, rotary claim, offline retry, restart, four records, decline and 12 languages OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
