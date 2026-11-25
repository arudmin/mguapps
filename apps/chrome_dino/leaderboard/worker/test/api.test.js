import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import worker,{identityHmac,defaultNickname} from '../src/index.js';
const secret='a'.repeat(64),hash='b'.repeat(64);
function env(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../migrations/0001_init.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../migrations/0002_personal_sync.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../migrations/0003_original_nickname.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../migrations/0004_positive_scores.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../migrations/0005_unique_nicknames.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../migrations/0006_player_analytics.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../migrations/0007_remove_analytics.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../migrations/0008_vehicle_groups.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('../migrations/0009_profile_recovery.sql',import.meta.url),'utf8'));
 return {sql,SERVER_SECRET:secret,DB:{batch:async ops=>{sql.exec('BEGIN');try{const r=[];for(const op of ops)r.push(await op.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}},prepare(q){const s=sql.prepare(q);return {bind(...a){return {first:async()=>s.get(...a)||null,all:async()=>({results:s.all(...a)}),run:async()=>({meta:{changes:s.run(...a).changes}})};},first:async()=>s.get()||null};}}};
}
async function call(e,p,method='GET',b,t){const headers={'content-type':'application/json'};if(t)headers.authorization='Bearer '+t;const r=await worker.fetch(new Request('https://test.invalid'+p,{method,headers,body:b===undefined?undefined:JSON.stringify(b)}),e);return [r.status,await r.json()];}
test('HMAC is server keyed, nickname derived from HMAC not input hash',async()=>{
 const expected=createHmac('sha256',secret).update('chrome-dino:vin-sha256:v1:'+hash).digest('hex');
 assert.equal(await identityHmac(hash,secret),expected);assert.equal(defaultNickname(expected),'user_'+expected.slice(0,8));assert.notEqual(expected,hash);
});
test('v1 batch profile and boards',async()=>{const e=env(),token='c'.repeat(64);assert.equal((await call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token}))[0],200);const b={operation_id:'11111111-1111-4111-8111-111111111111',nickname:'Dino_Player',records:{easy:143,normal:35,hard:36,extreme:27}};assert.equal((await call(e,'/v1/sync','POST',b,token))[0],200);assert.equal((await call(e,'/v1/sync','POST',{...b,operation_id:'22222222-2222-4222-8222-222222222222',nickname:'New_Name'},token))[0],200);assert.equal((await call(e,'/v1/sync','POST',b,token))[1].nickname,'New_Name');assert.equal((await call(e,'/v1/sync','POST',{...b,nickname:'Bad'},token))[0],409);const [status,j]=await call(e,'/v1/leaderboard','GET',undefined,token);assert.equal(status,200);assert.equal(j.profile.nickname,'New_Name');assert.equal(j.boards.easy[0].self,true);assert.equal(j.profile.positions.extreme.score,27);assert.equal(Object.keys(j.boards).length,4);e.sql.close();});

test('only current API, consent, retry, authorization and monotonic records',async()=>{const e=env(),token='c'.repeat(64),reg={identity_hash:hash,consent:true,token};assert.equal((await call(e,'/v1/register','POST',{...reg,consent:false}))[0],400);const [status,p]=await call(e,'/v1/register','POST',reg);assert.equal(status,200);assert.deepEqual((await call(e,'/v1/register','POST',reg))[1],p);assert.equal((await call(e,'/v1/register','POST',{...reg,token:'d'.repeat(64)}))[0],409);const b={operation_id:'11111111-1111-4111-8111-111111111111',nickname:null,records:{easy:143,normal:35,hard:36,extreme:27}};assert.equal((await call(e,'/v1/sync','POST',b))[0],401);assert.equal((await call(e,'/v1/sync','POST',b,token))[0],200);assert.equal((await call(e,'/v1/sync','POST',{...b,operation_id:'22222222-2222-4222-8222-222222222222',records:{easy:1,normal:0,hard:0,extreme:0}},token))[0],200);assert.equal((await call(e,'/v1/leaderboard','GET',undefined,token))[1].boards.easy[0].score,143);for(const p of ['/v2/register','/v3/leaderboard','/v1/me','/v1/session','/v1/submit','/v1/profile'])assert.equal((await call(e,p))[0],404);e.sql.close();});

test('original nickname remains immutable; reset and length validation',async()=>{const e=env(),token='c'.repeat(64);const [,p]=await call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token});assert.equal(p.original_nickname,p.nickname);const records={easy:143,normal:35,hard:36,extreme:27};const sync=(nickname)=>call(e,'/v1/sync','POST',{operation_id:crypto.randomUUID(),nickname,records},token);for(const n of ['ab','a'.repeat(17),'Дино'])assert.equal((await sync(n))[0],400);assert.equal((await sync('a'.repeat(16)))[0],200);assert.equal((await sync('Dino_Player'))[0],200);const [,j]=await call(e,'/v1/leaderboard','GET',undefined,token);assert.equal(j.profile.original_nickname,p.nickname);assert.equal(j.profile.nickname,'Dino_Player');assert.equal((await sync(p.nickname))[0],200);const [,k]=await call(e,'/v1/leaderboard','GET',undefined,token);assert.equal(k.profile.nickname,p.nickname);assert.equal(k.profile.positions.easy.score,143);assert.throws(()=>e.sql.prepare('UPDATE players SET original_nickname=?').run('changed'));e.sql.close();});

test('zero scores do not create records',async()=>{const e=env(),token='c'.repeat(64);await call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token});const sync=records=>call(e,'/v1/sync','POST',{operation_id:crypto.randomUUID(),nickname:null,records},token);assert.equal((await sync({easy:0,normal:0,hard:0,extreme:0}))[0],200);assert.equal(e.sql.prepare('SELECT COUNT(*) n FROM personal_scores').get().n,0);assert.equal((await sync({easy:1,normal:0,hard:0,extreme:0}))[0],200);assert.equal(e.sql.prepare('SELECT COUNT(*) n FROM personal_scores').get().n,1);await sync({easy:0,normal:0,hard:0,extreme:0});assert.equal(e.sql.prepare('SELECT score FROM personal_scores').get().score,1);e.sql.close();});

test('case insensitive names and reserved originals',async()=>{const e=env(),a='c'.repeat(64),b='d'.repeat(64);const [,p]=await call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token:a});const [,q]=await call(e,'/v1/register','POST',{identity_hash:'e'.repeat(64),consent:true,token:b});const sync=(t,nickname)=>call(e,'/v1/sync','POST',{operation_id:crypto.randomUUID(),nickname,records:{easy:1,normal:0,hard:0,extreme:0}},t);const check=(n,t)=>call(e,'/v1/name-availability?nickname='+encodeURIComponent(n),'GET',undefined,t);assert.equal((await sync(a,'DinoPlayer'))[0],200);assert.equal((await check('dinoplayer',a))[1].available,true);assert.equal((await check('DINOPLAYER',b))[1].available,false);assert.equal((await sync(b,'DINOPLAYER'))[1].error,'nickname_taken');assert.equal((await sync(b,p.original_nickname))[1].error,'nickname_taken');assert.equal((await sync(a,p.original_nickname))[0],200);assert.equal((await sync(b,'DinoPlayer'))[0],200);assert.equal((await check(q.original_nickname,a))[1].available,false);e.sql.close();});

test('offline name resolution, suggestions and ignored legacy analytics',async()=>{const e=env(),a='c'.repeat(64),b='d'.repeat(64);await call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token:a});await call(e,'/v1/register','POST',{identity_hash:'e'.repeat(64),consent:true,token:b,analytics:{consent:true,version:'1.5.28',language:'ru'}});assert.equal(e.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='player_analytics'").get().n,0);const records={easy:5,normal:0,hard:0,extreme:0};await call(e,'/v1/sync','POST',{operation_id:crypto.randomUUID(),nickname:'DinoPlayer',records},a);const [,avail]=await call(e,'/v1/name-availability?nickname=dinoplayer','GET',undefined,b);assert.equal(avail.available,false);assert.equal(avail.suggestions.length,5);const job={operation_id:crypto.randomUUID(),nickname:'dinoplayer',resolve_name:true,records};const [status,p]=await call(e,'/v1/sync','POST',job,b);assert.equal(status,200);assert.notEqual(p.nickname.toLowerCase(),'dinoplayer');assert.equal((await call(e,'/v1/sync','POST',job,b))[1].nickname,p.nickname);assert.equal((await call(e,'/v1/leaderboard','GET',undefined,b))[1].profile.positions.easy.score,5);e.sql.close();});

test('equal scores rank newest record first, repeat sync does not move timestamp',async()=>{const e=env(),a='c'.repeat(64),b='d'.repeat(64);const [,p]=await call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token:a});const [,q]=await call(e,'/v1/register','POST',{identity_hash:'e'.repeat(64),consent:true,token:b});const records={easy:47,normal:47,hard:47,extreme:47};const sync=t=>call(e,'/v1/sync','POST',{operation_id:crypto.randomUUID(),nickname:null,records},t);await sync(a);await sync(b);e.sql.prepare('UPDATE personal_scores SET updated_at=? WHERE player_id=?').run(100,p.player_id);e.sql.prepare('UPDATE personal_scores SET updated_at=? WHERE player_id=?').run(200,q.player_id);await sync(a);const [,j]=await call(e,'/v1/leaderboard','GET',undefined,a);for(const m of Object.keys(records)){assert.equal(j.boards[m][0].nickname,q.nickname);assert.equal(j.profile.positions[m].rank,2);assert.equal(j.boards[m][0].updated_at,undefined);}e.sql.close();});

test('new installation has independent account, one vehicle per mode',async()=>{const e=env(),a='c'.repeat(64),b='d'.repeat(64);const reg=(t,id)=>call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token:t,...(id?{installation_id:id}:{})});const [,p]=await reg(a);const id=crypto.randomUUID();const [status,q]=await reg(b,id);assert.equal(status,200);assert.notEqual(p.player_id,q.player_id);assert.equal((await reg(b,id))[1].player_id,q.player_id);assert.equal((await reg(a,id))[0],409);const sync=(t,easy,normal)=>call(e,'/v1/sync','POST',{operation_id:crypto.randomUUID(),nickname:null,records:{easy,normal,hard:0,extreme:0}},t);await sync(a,20,40);await sync(b,30,10);const [,j]=await call(e,'/v1/leaderboard','GET',undefined,a);assert.equal(j.boards.easy.length,1);assert.equal(j.boards.easy[0].nickname,q.nickname);assert.equal(j.boards.normal[0].nickname,p.nickname);assert.equal(j.profile.positions.easy,null);assert.equal(j.profile.positions.normal.rank,1);e.sql.close();});

test('delete account is authenticated, idempotent, removes dependent records only',async()=>{const e=env(),a='c'.repeat(64),b='d'.repeat(64);const [,p]=await call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token:a});await call(e,'/v1/register','POST',{identity_hash:'e'.repeat(64),consent:true,token:b});await call(e,'/v1/sync','POST',{operation_id:crypto.randomUUID(),nickname:'DeleteMe',records:{easy:50,normal:1,hard:0,extreme:0}},a);assert.equal((await call(e,'/v1/account','DELETE'))[0],401);assert.equal((await call(e,'/v1/account','DELETE',undefined,a))[1].deleted,true);assert.equal((await call(e,'/v1/account','DELETE',undefined,a))[1].deleted,true);for(const t of ['personal_scores','sync_operations','sessions','submissions','best_scores'])assert.equal(e.sql.prepare('SELECT COUNT(*) n FROM '+t+' WHERE player_id=?').get(p.player_id).n,0);assert.equal(e.sql.prepare('SELECT COUNT(*) n FROM players').get().n,1);assert.equal((await call(e,'/v1/leaderboard','GET',undefined,a))[0],401);e.sql.close();});

test('region metadata is read only for a confirmed nickname conflict',async()=>{const e=env(),a='c'.repeat(64);await call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token:a});await call(e,'/v1/sync','POST',{operation_id:crypto.randomUUID(),nickname:'TakenName',records:{easy:1,normal:0,hard:0,extreme:0}},a);let reads=0;async function check(n){const req=new Request('https://test.invalid/v1/name-availability?nickname='+n);Object.defineProperty(req,'cf',{get(){reads++;return {country:'RU',city:'Moscow'};}});return (await worker.fetch(req,e)).json();}assert.equal((await check('FreeName')).available,true);assert.equal(reads,0);assert.equal((await check('TakenName')).available,false);assert.equal(reads,1);e.sql.close();});

test('recovery requires vehicle and code; claim rotates only the recovery code and preserves all account history',async()=>{
 const e=env(),token='c'.repeat(64),nextToken='d'.repeat(64),otherToken='e'.repeat(64);
 const code='a1'.repeat(16),nextCode='b2'.repeat(16),otherCode='c3'.repeat(16);
 const [,p]=await call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token});
 const [,q]=await call(e,'/v1/register','POST',{identity_hash:hash,consent:true,token:otherToken,installation_id:crypto.randomUUID()});
 const records={easy:30,normal:20,hard:50,extreme:10};
 const op={operation_id:crypto.randomUUID(),nickname:'bmw_dino',records};
 await call(e,'/v1/sync','POST',op,token);
 assert.equal((await call(e,'/v1/sync','POST',{...op,nickname:null,records:{...records,easy:40,normal:0}},otherToken))[0],200);
 const data={code,identity_hash:hash,consent:true},preview=(data)=>call(e,'/v1/recovery/preview','POST',data);
 assert.equal((await preview(data))[0],404,'legacy accounts require permission');
 assert.equal((await call(e,'/v1/recovery/code','PUT',{code}))[0],401);
 assert.equal((await call(e,'/v1/recovery/code','PUT',{code},token))[0],200);
 assert.equal((await call(e,'/v1/recovery/code','PUT',{code},token))[0],200);
 assert.equal((await call(e,'/v1/recovery/code','PUT',{code},otherToken))[0],409);
 assert.equal((await preview({identity_hash:hash,consent:true}))[0],400);
 for(const input of [{...data,identity_hash:'1'.repeat(64)}, {...data,code:otherCode}])assert.equal((await preview(input))[0],404);
 assert.equal((await preview({...data,consent:false}))[0],400);
 assert.equal((await preview({...data,code:[code]}))[0],400);
 const [found,matching]=await preview(data);
 assert.equal(found,200);
 assert.deepEqual(matching.profile,{nickname:'bmw_dino',original_nickname:p.original_nickname,records});
 const claim=(input)=>call(e,'/v1/recovery/claim','POST',input);
 const request={...data,token:nextToken,next_code:nextCode};
 assert.equal((await claim({...request,token:otherToken}))[0],404);
 assert.equal((await claim({...request,identity_hash:'1'.repeat(64)}))[0],404);
 const recovered=await claim(request);
 assert.deepEqual(recovered,[200,{accepted:true,profile:matching.profile}]);
 assert.deepEqual(await claim(request),recovered);
 assert.equal((await claim({...request,token:'f'.repeat(64)}))[0],404);
 assert.equal((await preview(data))[0],404);
 assert.deepEqual((await preview({...data,code:nextCode}))[1],matching);
 assert.equal((await call(e,'/v1/recovery/code','PUT',{code},token))[0],409);
 assert.equal((await call(e,'/v1/recovery/code','PUT',{code:nextCode},nextToken))[0],200);
 assert.equal((await call(e,'/v1/sync','POST',op,token))[0],200,'old queued operation still works');
 assert.equal((await call(e,'/v1/register','POST',{identity_hash:hash,token:nextToken,consent:true,installation_id:crypto.randomUUID()}))[0],409);
 const [,after]=await call(e,'/v1/leaderboard','GET',undefined,nextToken);
 assert.equal(after.profile.nickname,'bmw_dino');
 assert.equal(after.boards.easy.length,1);
 assert.equal(after.boards.easy[0].nickname,q.nickname);
 assert.equal(after.boards.normal[0].nickname,'bmw_dino');
 assert.equal(e.sql.prepare('SELECT COUNT(*) n FROM players').get().n,2);
 assert.equal(e.sql.prepare('SELECT COUNT(*) n FROM sync_operations').get().n,2);
 await call(e,'/v1/account','DELETE',undefined,nextToken);
 assert.equal((await call(e,'/v1/leaderboard','GET',undefined,token))[0],401);
 for(const table of ['profile_recovery','recovery_sessions'])assert.equal(e.sql.prepare('SELECT COUNT(*) n FROM '+table).get().n,0);
 assert.equal((await call(e,'/v1/leaderboard','GET',undefined,otherToken))[0],200);
 e.sql.close();
});

test('migration is additive and account-specific legacy grant expires and converts to a normal code',async()=>{
 const e=env(),token='a'.repeat(64),newToken='b'.repeat(64),code='c1'.repeat(16),nextCode='d2'.repeat(16);
 e.sql.exec('DROP TABLE recovery_sessions; DROP TABLE profile_recovery;');
 const id=crypto.randomUUID(),identity=await identityHmac(hash,secret);
 const hashValue=async s=>Buffer.from(await crypto.subtle.digest('SHA-256',Buffer.from(s))).toString('hex');
 e.sql.prepare('INSERT INTO players VALUES(?,?,?,?,?,?,?)').run(id,identity,'bmw_dino',await hashValue(token),1,defaultNickname(identity),identity);
 e.sql.prepare('INSERT INTO personal_scores VALUES(?,?,?,?)').run(id,'extreme',51,1);
 e.sql.exec(readFileSync(new URL('../migrations/0009_profile_recovery.sql',import.meta.url),'utf8'));
 assert.equal(e.sql.prepare('SELECT nickname FROM players WHERE id=?').get(id).nickname,'bmw_dino');
 const codeHash=await hashValue('chrome-dino:recovery:v1:'+code);
 e.sql.prepare('INSERT INTO profile_recovery VALUES(?,?,?)').run(id,codeHash,Date.now()-1);
 const data={identity_hash:hash,consent:true,code};
 assert.equal((await call(e,'/v1/recovery/preview','POST',data))[0],404);
 assert.equal((await call(e,'/v1/recovery/claim','POST',{...data,token:newToken,next_code:nextCode}))[0],404);
 e.sql.prepare('UPDATE profile_recovery SET expires_at=?').run(Date.now()+60000);
 assert.equal((await call(e,'/v1/recovery/code','PUT',{code},token))[0],409);
 const [,recovered]=await call(e,'/v1/recovery/claim','POST',{...data,token:newToken,next_code:nextCode});
 assert.deepEqual(recovered.profile.records,{easy:0,normal:0,hard:0,extreme:51});
 assert.equal(e.sql.prepare('SELECT expires_at FROM profile_recovery').get().expires_at,null);
 e.sql.close();
});
