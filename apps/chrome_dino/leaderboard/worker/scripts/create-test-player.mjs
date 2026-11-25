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
async function newPlayer(){
 const fakeVin='000'+randomBytes(7).toString('hex').toUpperCase(),hash=identity(fakeVin),c=new Leaderboard(url),credential=randomBytes(32).toString('hex');
 const reg=await invoke(c,'enroll',hash,credential),id=reg.player_id;
 try{
 const row=(await sql('SELECT * FROM players WHERE id=?',[id]))[0];assert.notEqual(row.identity_hash,hash);assert.equal(row.token_hash,createHash('sha256').update(credential).digest('hex'));
 assert.equal((await invoke(c,'enroll',hash,credential)).player_id,id);
 await assert.rejects(invoke(c,'enroll',hash,randomBytes(32).toString('hex')),/already_registered/);
 const op=crypto.randomUUID(),records={easy:1,normal:2,hard:3,extreme:4};
 await invoke(c,'syncProfile',credential,op,records,'Test_New_BMW');await invoke(c,'syncProfile',credential,op,records,'Test_New_BMW');
 const board=await invoke(c,'all',credential);assert.equal(board.profile.nickname,'Test_New_BMW');assert.equal(board.profile.positions.extreme.score,4);assert.equal(Object.keys(board.boards).length,4);
 console.log('PASS current API enrollment, retry, token, batch sync and ranking');
 }finally{for(const t of ['sync_operations','personal_scores','submissions','best_scores','sessions','players'])await sql('DELETE FROM '+t+' WHERE '+(t==='players'?'id':'player_id')+'=?',[id]);}
}
await newPlayer();
