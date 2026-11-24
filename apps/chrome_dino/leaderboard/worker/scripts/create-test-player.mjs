import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Leaderboard,identity}=require('../../client/leaderboard.js');
const root='https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_API_TOKEN;
const url='https://chrome-dino-leaderboard-staging.mguapps.workers.dev';
async function cf(path,body){const r=await fetch(root+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!r.ok||!j.success)throw Error('D1 HTTP '+r.status);return j.result;}
const db=(await cf('/d1/database?name=chrome-dino-leaderboard-staging')).find(x=>x.name==='chrome-dino-leaderboard-staging');assert(db);
async function sql(s,params=[]){return (await cf('/d1/database/'+db.uuid+'/query',{sql:s,params}))[0].results;}
function invoke(c,method,...a){return new Promise((ok,no)=>c[method](...a,(e,v)=>e?no(e):ok(v)));}
const health=await fetch(url+'/health');assert.equal(health.status,200);
async function newPlayer(nick,persistent){
 // Synthetic WMI 000: never read or use a real vehicle VIN.
 const fakeVin='000'+randomBytes(7).toString('hex').toUpperCase();
 assert.equal(fakeVin.length,17);
 const hash=identity(fakeVin),c=new Leaderboard(url);
 await assert.rejects(invoke(c,'register',fakeVin,false),/consent required/);
 await assert.rejects(invoke(c,'register','invalid',true),/invalid vehicle identity/);
 const reg=await invoke(c,'register',fakeVin,true);let id=reg.player_id;
 try{
 const p=(await sql('SELECT id,nickname,identity_hash,token_hash FROM players WHERE id=?',[id]))[0];assert(p);
 assert.notEqual(p.identity_hash,hash);assert.equal(p.nickname,'user_'+p.identity_hash.slice(0,8));assert.equal(p.token_hash,createHash('sha256').update(c.token).digest('hex'));
 await invoke(c,'rename',nick);
 const me=await invoke(c,'me');assert.equal(me.player_id,id);assert.equal(me.nickname,nick);
 const restored=new Leaderboard(url,c.token);assert.equal((await invoke(restored,'me')).player_id,id);
 await assert.rejects(invoke(new Leaderboard(url),'register',fakeVin,true),/already_registered/);
 const s=await invoke(restored,'start','extreme');
 await invoke(restored,'submit',s.session_id,'extreme',0,[0],1);
 const rows=await sql('SELECT score,status,ticks FROM submissions WHERE player_id=? AND session_id=?',[id,s.session_id]);assert.deepEqual(rows,[{score:0,status:'pending',ticks:1}]);
 assert.equal((await sql('SELECT COUNT(*) AS n FROM best_scores WHERE player_id=?',[id]))[0].n,0);
 console.log('PASS actual MGU client: consent, synthetic VIN hash, registration, HMAC, token, rename, restart, duplicate rejection, pending Extreme submission: '+nick);
 if(persistent){console.log('Persistent player row: '+JSON.stringify({id,nickname:nick}));return;}
 }finally{if(!persistent){for(const t of ['submissions','best_scores','sessions','players'])await sql('DELETE FROM '+t+' WHERE '+(t==='players'?'id':'player_id')+'=?',[id]);console.log('Temporary new-car test removed');}}
}
const found=await sql('SELECT id,nickname FROM players WHERE nickname=?',['Test_Dino']);
if(found.length===0)await newPlayer('Test_Dino',true);
else{assert.equal(found.length,1);console.log('Persistent player already exists: '+JSON.stringify(found[0]));}
await newPlayer('Test_New_BMW',false);
console.log('Final D1 counts: '+JSON.stringify(await sql('SELECT (SELECT COUNT(*) FROM players) AS players,(SELECT COUNT(*) FROM sessions) AS sessions,(SELECT COUNT(*) FROM submissions) AS submissions,(SELECT COUNT(*) FROM best_scores) AS verified_scores')));
