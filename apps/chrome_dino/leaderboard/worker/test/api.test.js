import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import worker,{identityHmac,defaultNickname} from '../src/index.js';
const secret='a'.repeat(64),hash='b'.repeat(64);
function env(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../migrations/0001_init.sql',import.meta.url),'utf8'));
 return {sql,SERVER_SECRET:secret,DB:{prepare(q){const s=sql.prepare(q);return {bind(...a){return {first:async()=>s.get(...a)||null,all:async()=>({results:s.all(...a)}),run:async()=>({meta:{changes:s.run(...a).changes}})};},first:async()=>s.get()||null};}}};
}
async function call(e,p,method='GET',b,t){const headers={'content-type':'application/json'};if(t)headers.authorization='Bearer '+t;const r=await worker.fetch(new Request('https://test.invalid'+p,{method,headers,body:b===undefined?undefined:JSON.stringify(b)}),e);return [r.status,await r.json()];}
test('HMAC is server keyed, nickname derived from HMAC not input hash',async()=>{
 const expected=createHmac('sha256',secret).update('chrome-dino:vin-sha256:v1:'+hash).digest('hex');
 assert.equal(await identityHmac(hash,secret),expected);assert.equal(defaultNickname(expected),'user_'+expected.slice(0,8));assert.notEqual(expected,hash);
});
test('registration, authorization, rename, four isolated boards, single use submission',async()=>{
 const e=env();
 assert.equal((await call(e,'/health'))[0],200);
 assert.equal((await call(e,'/v1/register','POST',{identity_hash:hash}))[0],400);
 const [status,p]=await call(e,'/v1/register','POST',{identity_hash:hash,consent:true});assert.equal(status,201);
 const db=e.sql.prepare('SELECT * FROM players').get();assert.equal(db.identity_hash,await identityHmac(hash,secret));assert.notEqual(db.token_hash,p.token);assert.equal(p.nickname,defaultNickname(db.identity_hash));
 assert.equal((await call(e,'/v1/register','POST',{identity_hash:hash,consent:true}))[0],409);
 assert.equal((await call(e,'/v1/me','GET',undefined,hash))[0],401);
 assert.equal((await call(e,'/v1/profile','PATCH',{nickname:'Дино_1'},p.token))[0],200);
 assert.equal((await call(e,'/v1/me','GET',undefined,p.token))[1].nickname,'Дино_1');
 for(const mode of ['easy','normal','hard','extreme']){
   const [s,j]=await call(e,'/v1/session','POST',{difficulty:mode,game_version:'1.5.5'},p.token);assert.equal(s,201);
   const b={session_id:j.session_id,difficulty:mode,score:1,events:[0],ticks:120};
   assert.equal((await call(e,'/v1/submit','POST',b,p.token))[0],202);
   assert.equal((await call(e,'/v1/submit','POST',b,p.token))[0],409);
   assert.deepEqual((await call(e,'/v1/leaderboard?difficulty='+mode))[1].entries,[]);
 }
 assert.equal(e.sql.prepare('SELECT COUNT(*) AS n FROM submissions').get().n,4);
 assert.equal(e.sql.prepare('SELECT COUNT(*) AS n FROM best_scores').get().n,0);
 e.sql.prepare('INSERT INTO best_scores VALUES(?,?,?,?)').run(p.player_id,'extreme',42,1);
 assert.equal((await call(e,'/v1/leaderboard?difficulty=extreme&limit=100'))[1].entries[0].score,42);
 assert.equal((await call(e,'/v1/me','GET',undefined,p.token))[1].scores[0].rank,1);
 assert.deepEqual((await call(e,'/v1/leaderboard?difficulty=easy'))[1].entries,[]);
 e.sql.close();
});
test('configuration fails closed and malformed data rejected',async()=>{
 const e=env();assert.equal((await call({...e,SERVER_SECRET:''},'/health'))[0],503);
 assert.equal((await call(e,'/v1/register','POST',{vin:'WBA12345678901234',consent:true}))[0],400);
 assert.equal((await call(e,'/v1/leaderboard?difficulty=invalid'))[0],400);e.sql.close();
});
