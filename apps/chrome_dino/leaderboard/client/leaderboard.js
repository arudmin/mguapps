'use strict';
const https=require('https'),crypto=require('crypto');
const MODES=['easy','normal','hard','extreme'];
function identity(vin){if(typeof vin!=='string'||!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))throw Error('invalid vehicle identity');return crypto.createHash('sha256').update(vin,'utf8').digest('hex');}
function request(base,path,method,token,payload,cb){
 let done=false;function finish(e,v){if(!done){done=true;cb(e,v);}}
 try{
 const u=new URL(path,base);if(u.protocol!=='https:')return finish(Error('HTTPS required'));
 const data=payload?JSON.stringify(payload):null,headers={accept:'application/json'};
 if(token)headers.authorization='Bearer '+token;if(data){headers['content-type']='application/json';headers['content-length']=Buffer.byteLength(data);}
 const req=https.request(u,{method,timeout:5000,headers},res=>{let s='';res.setEncoding('utf8');res.on('data',x=>{s+=x;if(s.length>65536)req.destroy();});res.on('error',finish);res.on('end',()=>{try{const j=JSON.parse(s);if(res.statusCode>=400)return finish(Error(j.error||'request_failed'));finish(null,j);}catch(e){finish(e);}});});
 req.on('timeout',()=>req.destroy(Error('timeout')));req.on('error',finish);req.end(data||undefined);
 }catch(e){finish(e);}
}
class Leaderboard{
 constructor(base,token){this.base=base;this.token=token||null;}
 register(vin,consent,cb){if(consent!==true)return cb(Error('consent required'));let hash;try{hash=identity(vin);}catch(e){return cb(e);}request(this.base,'/v1/register','POST',null,{identity_hash:hash,consent:true},(e,v)=>{if(!e)this.token=v.token;cb(e,v);});}
 top(d,cb){if(!MODES.includes(d))return cb(Error('invalid difficulty'));request(this.base,'/v1/leaderboard?difficulty='+d,'GET',null,null,cb);}
 me(cb){request(this.base,'/v1/me','GET',this.token,null,cb);}
 rename(n,cb){request(this.base,'/v1/profile','PATCH',this.token,{nickname:n},cb);}
 start(d,cb){request(this.base,'/v1/session','POST',this.token,{difficulty:d,game_version:'1.5.5'},cb);}
 submit(s,d,score,events,ticks,cb){request(this.base,'/v1/submit','POST',this.token,{session_id:s,difficulty:d,score,events,ticks},cb);}
}
module.exports={Leaderboard,identity,MODES};
