import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
const root='https://api.cloudflare.com/client/v4/accounts/'+account;
const url='https://chrome-dino-leaderboard-staging.mguapps.workers.dev';
async function cf(path,body){const r=await fetch(root+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!r.ok||!j.success)throw Error('D1 API HTTP '+r.status);return j.result;}
const db=(await cf('/d1/database?name=chrome-dino-leaderboard-staging')).find(x=>x.name==='chrome-dino-leaderboard-staging');assert(db,'staging database missing');
async function sql(s,params=[]){return (await cf('/d1/database/'+db.uuid+'/query',{sql:s,params}))[0].results;}
console.log('Existing database counts:',JSON.stringify(await sql('SELECT (SELECT COUNT(*) FROM players) AS players,(SELECT COUNT(*) FROM sessions) AS sessions,(SELECT COUNT(*) FROM submissions) AS submissions,(SELECT COUNT(*) FROM best_scores) AS verified_scores')));
async function call(path,method='GET',data,auth){const h={'content-type':'application/json'};if(auth)h.authorization='Bearer '+auth;const r=await fetch(url+path,{method,headers:h,body:data?JSON.stringify(data):undefined});return {status:r.status,body:await r.json()};}
const health=await call('/health');assert.equal(health.status,200);assert.equal(health.body.ok,true);console.log('Public HTTPS health passed');
const identity=createHash('sha256').update('synthetic-test-'+randomBytes(32).toString('hex')).digest('hex');
let id;
try{
 const reg=await call('/v1/register','POST',{identity_hash:identity,consent:true});assert.equal(reg.status,201);id=reg.body.player_id;const auth=reg.body.token;
 const p=(await sql('SELECT identity_hash,nickname,token_hash FROM players WHERE id=?',[id]))[0];assert(p);assert.notEqual(p.identity_hash,identity);assert.equal(p.nickname,'user_'+p.identity_hash.slice(0,8));assert.equal(p.token_hash,createHash('sha256').update(auth).digest('hex'));console.log('PASS: registration persisted; HMAC and hashed token confirmed');
 assert.equal((await call('/v1/profile','PATCH',{nickname:'Test_Dino'},auth)).status,200);assert.equal((await sql('SELECT nickname FROM players WHERE id=?',[id]))[0].nickname,'Test_Dino');console.log('PASS: nickname persisted');
 const s=await call('/v1/session','POST',{difficulty:'extreme',game_version:'1.5.5'},auth);assert.equal(s.status,201);assert.equal((await sql('SELECT difficulty FROM sessions WHERE id=? AND player_id=?',[s.body.session_id,id]))[0].difficulty,'extreme');console.log('PASS: session persisted');
 const b={session_id:s.body.session_id,difficulty:'extreme',score:0,events:[0],ticks:1};
 assert.equal((await call('/v1/submit','POST',b,auth)).status,202);const row=(await sql('SELECT score,status,ticks FROM submissions WHERE session_id=?',[s.body.session_id]))[0];assert.deepEqual(row,{score:0,status:'pending',ticks:1});assert.equal((await call('/v1/submit','POST',b,auth)).status,409);assert.equal((await sql('SELECT COUNT(*) AS n FROM best_scores WHERE player_id=?',[id]))[0].n,0);console.log('PASS: submission persisted pending; duplicate rejected; no unverified score published');
}finally{if(id){for(const table of ['submissions','best_scores','sessions','players'])await sql('DELETE FROM '+table+' WHERE '+(table==='players'?'id':'player_id')+'=?',[id]);console.log('Temporary test account and rows removed');}}
