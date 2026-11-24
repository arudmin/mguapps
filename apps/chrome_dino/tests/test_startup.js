'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../package/javascript'),source=fs.readFileSync(path.join(root,'app.js'),'utf8');
const {Recorder}=require('../package/javascript/kit/record');
async function run(id8){
 let clock=10000,visible='MAIN',tap,draw,shutdown,focus=true,grab=false,frames=0,settings={},watchers={},timers=[],clicks={},input;
 const ctx={ui:{id8,isVisible:n=>n===visible,hasFocus:()=>focus,open:n=>{visible=n;return Promise.resolve();},onClick:(n,fn)=>clicks[n]=fn,onVisible:()=>{},onFocus:()=>{},image:(n,cv)=>{assert.strictEqual(n,'GAME_GFX');assert(cv.words().length>60);frames++;},text(){},comp(){return null;}},log:{info(){},warn(){},error(){}},settings:{get:k=>settings[k],set:(k,v)=>settings[k]=v},signals:{watch:(s,i,cb)=>{Object.assign(watchers,cb);return Promise.resolve({available:true});}},controller:{grab:v=>grab=v,onInput:fn=>input=fn},onTap:fn=>tap=fn,hideButton(){},loop:(n,f,fn)=>{assert.strictEqual(n,'GAME');assert.strictEqual(f,8);draw=fn;},canvas:(w,h)=>new Recorder(w,h),app:{on:(n,fn)=>shutdown=fn}};
 const sandbox={require:p=>p==='./kit/mgu'?{run:o=>o.start(ctx)}:p==='./kit/diag'?{Diag:class{async init(){return {p:null};}}}:p==='./src/update'?{checkUpdate:(v,cb)=>cb({checked:false,available:false})}:require(path.resolve(root,p)),Date:{now:()=>clock},process:{on(){},exit(){}},setTimeout:fn=>{timers.push(fn);},setInterval:fn=>{sandbox.safety=fn;return 1;},clearInterval(){},console};
 vm.runInNewContext(source,sandbox,{filename:'app.js'});
 await Promise.resolve();await Promise.resolve();
 for(const t of timers.splice(0))t();
 assert.strictEqual(visible,'GAME');assert.deepStrictEqual(Object.keys(clicks),['BTN_JUMP']);
 draw();assert(frames>0);assert(!grab);
 tap(1300,260);assert.strictEqual(settings.difficulty,1,'unknown speed must lock input');
 watchers.statusCarSpeed2({speedVehicleCentreOfGravity:0});assert(grab);
 tap(1300,260);assert.strictEqual(settings.difficulty,2);
 tap(1300,370);assert.strictEqual(settings.language,'ru');
 input({frontRotaryEncoderOperation:0});input({frontRotaryEncoderOperation:1});
 clock+=100;input({frontRotaryEncoderPushButton:1});input({frontRotaryEncoderPushButton:0});
 watchers.statusCarSpeed2({speedVehicleCentreOfGravity:64});assert(!grab);
 tap(1300,260);assert.strictEqual(settings.difficulty,2);
 watchers.statusCarSpeed2({speedVehicleCentreOfGravity:0});assert(grab);
 clock+=5001;sandbox.safety();assert(!grab,'stale speed must lock input');
 watchers.statusCarSpeed2({speedVehicleCentreOfGravity:0});focus=false;sandbox.safety();assert(!grab);
 shutdown();draw();assert(!grab);
}
(async()=>{await run(false);await run(true);console.log('ID7/ID8 mocked startup, Dashboard, touch, controller and strict speed gate OK');})().catch(e=>{console.error(e);process.exitCode=1;});
