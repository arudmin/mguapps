'use strict';
// One in-flight operation; durable snapshot and idempotent retry.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const { CODE, readProfile }=require('./recovery');
const MODES=['easy','normal','hard','extreme'];
function uuid(){const b=crypto.randomBytes(16);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=b.toString('hex');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}
class Outbox{
 constructor(dir,client){this.client=client;this.file=dir?path.join(dir,'dino-outbox.json'):null;this.busy=false;this.next=0;this.failures=0;this.error='';this.state=null;this.closed=false;if(this.file){try{this.state=JSON.parse(fs.readFileSync(this.file,'utf8'));if(!this.state||this.state.schema!==1||!Array.isArray(this.state.jobs))throw Error('format');const migrated=JSON.parse(JSON.stringify(this.state));let changed=false;for(const j of migrated.jobs){if(Object.prototype.hasOwnProperty.call(j,'analytics')){delete j.analytics;changed=true;}if(j.kind==='sync'&&!Object.prototype.hasOwnProperty.call(j,'nickname')){j.nickname=null;j.id=uuid();j.sent=false;changed=true;}}if(changed&&!this.save(migrated))throw Error('migration storage');}catch(e){if(e.code!=='ENOENT')this.error='STORAGE';}}}
 save(state){if(!this.file||this.error==='STORAGE')return false;try{const tmp=this.file+'.tmp';const fd=fs.openSync(tmp,'w',0o600);try{fs.fchmodSync(fd,0o600);fs.writeFileSync(fd,JSON.stringify(state));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(tmp,this.file);this.state=state;return true;}catch(e){this.error='STORAGE';return false;}}
 enroll(hash,records,nickname){if((this.state&&!this.state.erased)||!this.file||!/^[a-f0-9]{64}$/.test(hash))return false;const token=crypto.randomBytes(32).toString('hex');const state={schema:1,token,registered:false,nickname:'',jobs:[{kind:'register',hash,installationId:uuid()}],last:null};if(!this.save(state))return false;this.capture(records,nickname||undefined);return true;}
 prepareRecovery(code,hash){
   if((this.state&&!this.state.erased)||!CODE.test(code)||!/^[a-f0-9]{64}$/.test(hash))return false;
   const restore={code,hash,token:crypto.randomBytes(32).toString('hex'),nextCode:crypto.randomBytes(16).toString('hex')};
   if(!this.save({schema:1,token:'',registered:false,jobs:[],last:null,restore}))return false;
   this.recoveryError='';this.failures=0;this.next=0;
   return true;
 }
 tickRecovery(now){
   if(now<this.next||this.error==='STORAGE')return;
   const claim=this.state.restore;
   this.busy=true;
   this.client.claimRecovery(claim,(err,result)=>{
     this.busy=false;
     if(this.closed)return;
     const profile=result&&result.accepted===true&&readProfile(result);
     if(!err&&profile){
       if(this.save({schema:1,token:claim.token,registered:true,nickname:profile.nickname,
         original_nickname:profile.originalNickname,jobs:[],last:null,
         recoveryCode:claim.nextCode,recoveredRecords:profile.records})){
         this.recoveryError='';this.failures=0;this.next=0;
       }
       return;
     }
     if(err&&(err.code==='HTTP_404'||err.code==='HTTP_400')){
       if(this.save({schema:1,token:'',registered:false,jobs:[],last:null,erased:true})){
         this.recoveryError='invalid';this.next=0;this.failures=0;
       }
       return;
     }
     this.recoveryError='offline';
     this.next=Date.now()+Math.min(60000,5000*Math.pow(2,Math.min(4,this.failures++)));
   });
 }
 getRecoveryCode(cb){
   const token=this.token();
   if(!token||this.state.deleting)return cb(Error('unavailable'));
   if(!this.state.recoveryCode){
     const s=Object.assign({},this.state,{recoveryCode:crypto.randomBytes(16).toString('hex')});
     if(!this.save(s))return cb(Error('storage'));
   }
   const code=this.state.recoveryCode;
   this.client.recoveryCode(code,token,(err,result)=>{
     if(this.closed||!this.state||this.state.deleting||this.token()!==token)return;
     cb(err||(!result||result.accepted!==true?Error('invalid response'):null),code);
   });
 }
 recoveredProfile(){
   const s=this.state;
   return s&&s.recoveredRecords?{nickname:s.nickname,records:s.recoveredRecords,code:s.recoveryCode}:null;
 }
 acknowledgeRecovery(){
   const s=Object.assign({},this.state);delete s.recoveredRecords;return this.save(s);
 }
 erase(){if(!this.state||this.state.deleting)return false;const s={schema:1,token:this.state.token,registered:false,deleting:true,jobs:[],last:null};if(!this.save(s))return false;this.error='';this.next=0;this.failures=0;this.nameRejected=null;return true;}
 rename(nickname,values){if(!this.state||!/^[A-Za-z0-9_-]{3,16}$/.test(nickname))return false;return this.capture(values,nickname);}
 capture(values,nickname){if(!this.state||this.state.deleting||this.state.erased||this.state.restore||this.state.recoveredRecords)return;const records={};MODES.forEach((m,i)=>{records[m]=Math.max(0,Math.min(1000000,Math.floor(Number(values[i])||0)));});const signature=JSON.stringify(records);if(signature===this.state.last&&nickname===undefined)return false;const s=JSON.parse(JSON.stringify(this.state));s.last=signature;const job={kind:'sync',id:uuid(),records,nickname:nickname===undefined?null:nickname}; // Only replace a snapshot which has never been sent.
 const tail=s.jobs[s.jobs.length-1];if(tail&&tail.kind==='sync'&&!tail.sent){if(nickname===undefined&&tail.nickname)job.nickname=tail.nickname;s.jobs[s.jobs.length-1]=job;}else s.jobs.push(job);return this.save(s);}
 tick(now){if(this.closed||this.busy||!this.state)return;if(this.state.restore){this.tickRecovery(now);return;}if(this.state.deleting){if(now<this.next||this.error==='STORAGE')return;this.busy=true;this.client.deleteAccount(this.state.token,(err,result)=>{this.busy=false;if(this.closed)return;if(!err&&result&&result.deleted===true){if(this.save({schema:1,token:'',registered:false,jobs:[],last:null,erased:true})){try{fs.unlinkSync(this.file);this.state=null;}catch(e){this.error='STORAGE';} }return;}this.error=err?String(err.code||'NETWORK'):'INVALID_RESPONSE';this.next=Date.now()+Math.min(60000,5000*Math.pow(2,Math.min(4,this.failures++)));});return;}if(!this.state.jobs.length||now<this.next||this.error==='STORAGE'||this.error==='HTTP_409'||this.error==='HTTP_400'||this.error==='HTTP_401')return;const job=this.state.jobs[0];if(!job.sent){const s=JSON.parse(JSON.stringify(this.state));s.jobs[0].sent=true;if(!this.save(s))return;}this.busy=true;const finish=(err,result)=>{this.busy=false;if(this.closed||!this.state||this.state.deleting)return;const valid=!err&&result&&result.accepted===true&&(job.kind==='register'?typeof result.nickname==='string':result.operation_id===job.id);if(!valid){if(err&&err.code==='NICKNAME_TAKEN'&&job.kind==='sync'&&job.nickname){const s=JSON.parse(JSON.stringify(this.state));s.jobs[0].nickname=null;s.jobs[0].id=uuid();s.jobs[0].sent=false;if(this.save(s)){this.nameRejected=job.nickname;this.error='';this.next=0;}return;}this.error=err?String(err.code||'NETWORK'):'INVALID_RESPONSE';this.next=Date.now()+Math.min(60000,5000*Math.pow(2,Math.min(4,this.failures++)));return;}const s=JSON.parse(JSON.stringify(this.state));if(job.kind==='register')s.registered=true;if(typeof result.nickname==='string')s.nickname=result.nickname;if(job.nickname){s.nameAdjusted=result.nickname&&result.nickname!==job.nickname?result.nickname:null;this.nameRejected=null;}if(/^user_[a-f0-9]{8}$/.test(result.original_nickname||''))s.original_nickname=result.original_nickname;s.jobs.shift();if(this.save(s)){this.error='';this.failures=0;this.next=0;}};
 if(job.kind==='register')this.client.enroll(job.hash,this.state.token,finish,job.installationId);else this.client.syncProfile(this.state.token,job.id,job.records,job.nickname,finish);}
 token(){return this.state&&this.state.registered?this.state.token:null;}
 rememberOriginal(name){if(!this.state||this.state.deleting||this.state.erased||this.state.original_nickname||!/^user_[a-f0-9]{8}$/.test(name||''))return;const s=JSON.parse(JSON.stringify(this.state));s.original_nickname=name;this.save(s);}
 status(){return {enabled:!!(this.state&&!this.state.deleting&&!this.state.erased&&!this.state.restore),recoveryPending:!!(this.state&&this.state.restore),recoveryError:this.recoveryError||'',deleting:!!(this.state&&this.state.deleting),registered:!!(this.state&&this.state.registered),nickname:this.state?((this.state.jobs.filter(j=>j.kind==='sync'&&j.nickname).slice(-1)[0]||{}).nickname||this.state.nickname):'',nameAdjusted:this.state&&this.state.nameAdjusted,nameRejected:this.nameRejected||null,namePending:!!(this.state&&this.state.jobs.some(j=>j.kind==='sync'&&j.nickname)),originalNickname:this.state?this.state.original_nickname:null,pending:this.state?this.state.jobs.length:0,error:this.error};}
 stop(){this.closed=true;}
}
module.exports={Outbox};
