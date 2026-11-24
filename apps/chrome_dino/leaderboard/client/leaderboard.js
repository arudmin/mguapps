'use strict';
const https=require('https'),crypto=require('crypto'),URL=require('url').URL;
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
 constructor(base){this.base=base;}
 enroll(hash,token,cb){request(this.base,'/v1/register','POST',null,{identity_hash:hash,consent:true,token},cb);}
 syncProfile(token,id,records,nickname,cb){request(this.base,'/v1/sync','POST',token,{operation_id:id,records,nickname},cb);}
 all(token,cb){request(this.base,'/v1/leaderboard','GET',token,null,cb);}
}
module.exports={Leaderboard,identity,MODES};
