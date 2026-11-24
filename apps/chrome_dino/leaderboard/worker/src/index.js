const enc=new TextEncoder();
export const VERSION='0.2.2';
const MODES=['easy','normal','hard','extreme'];
const HEX=/^[a-f0-9]{64}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const digest=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
const token=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const error=(code,status)=>respond({error:code},status);
class HttpError extends Error{constructor(code,status){super(code);this.status=status;}}
export async function identityHmac(hash,secret){
 if(!HEX.test(hash)||typeof secret!=='string'||secret.length<64)throw new Error('invalid_identity_configuration');
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,enc.encode('chrome-dino:vin-sha256:v1:'+hash)));
}
export function defaultNickname(hmac){return 'user_'+hmac.slice(0,8);}
async function body(req){
 if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))throw new HttpError('json_required',415);
 const reader=req.body&&req.body.getReader();if(!reader)throw new HttpError('invalid_json',400);
 const decoder=new TextDecoder('utf-8',{fatal:true});let n=0,text='';
 try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>16384){await reader.cancel();throw new HttpError('body_too_large',413);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();const b=JSON.parse(text);if(!b||typeof b!=='object'||Array.isArray(b))throw Error();return b;}catch(e){if(e instanceof HttpError)throw e;throw new HttpError('invalid_json',400);}
}
async function player(req,db){const h=req.headers.get('authorization')||'';if(!/^Bearer [a-f0-9]{64}$/.test(h))return null;return db.prepare('SELECT id,nickname FROM players WHERE token_hash=?').bind(await digest(h.slice(7))).first();}
function exact(b,keys){return Object.keys(b).every(k=>keys.includes(k));}
function validMode(d){return MODES.includes(d);}
function validNickname(n){return typeof n==='string'&&/^[\p{L}\p{N}_-]{3,24}$/u.test(n)&&!(/^[A-HJ-NPR-Z0-9]{17}$/i.test(n));}
async function fetchHandler(req,env){
 const u=new URL(req.url),p=u.pathname,db=env.DB;
 try{
 if(p==='/health'&&req.method==='GET'){
   if(!env.SERVER_SECRET||env.SERVER_SECRET.length<64)return error('not_configured',503);
   await db.prepare('SELECT id FROM players LIMIT 1').first();
   return respond({ok:true,version:VERSION,modes:MODES,phase:'staging',verification:'pending_only'});
 }
 if(!env.SERVER_SECRET||env.SERVER_SECRET.length<64)return error('not_configured',503);
 if(p==='/v1/register'&&req.method==='POST'){
   const b=await body(req);
   if(!exact(b,['identity_hash','consent'])||typeof b.identity_hash!=='string'||!HEX.test(b.identity_hash)||b.consent!==true)return error('invalid_identity_or_consent',400);
   const hmac=await identityHmac(b.identity_hash,env.SERVER_SECRET),id=crypto.randomUUID(),secret=token(),nick=defaultNickname(hmac);
   const r=await db.prepare('INSERT INTO players(id,identity_hash,nickname,token_hash,created_at) VALUES(?,?,?,?,?) ON CONFLICT(identity_hash) DO NOTHING').bind(id,hmac,nick,await digest(secret),Date.now()).run();
   if(r.meta.changes!==1)return error('already_registered',409);
   return respond({player_id:id,nickname:nick,token:secret},201);
 }
 // v2 enrollment: client-generated random credential is retained across retries.
 if(p==='/v2/register'&&req.method==='POST'){
   const b=await body(req);
   if(!exact(b,['identity_hash','consent','token'])||!HEX.test(b.identity_hash||'')||b.consent!==true||!HEX.test(b.token||''))return error('invalid_registration',400);
   const hmac=await identityHmac(b.identity_hash,env.SERVER_SECRET),th=await digest(b.token),id=crypto.randomUUID();
   await db.prepare('INSERT INTO players(id,identity_hash,nickname,token_hash,created_at) VALUES(?,?,?,?,?) ON CONFLICT(identity_hash) DO NOTHING').bind(id,hmac,defaultNickname(hmac),th,Date.now()).run();
   const row=await db.prepare('SELECT id,nickname,token_hash FROM players WHERE identity_hash=?').bind(hmac).first();
   if(!row||row.token_hash!==th)return error('already_registered',409);
   return respond({player_id:row.id,nickname:row.nickname,accepted:true});
 }
 if(p==='/v2/sync'&&req.method==='POST'){
   const me=await player(req,db);if(!me)return error('unauthorized',401);
   const b=await body(req);
   if(!exact(b,['operation_id','records'])||!uuid.test(b.operation_id||'')||!b.records||typeof b.records!=='object'||Array.isArray(b.records)||Object.keys(b.records).length!==4||!MODES.every(d=>Number.isSafeInteger(b.records[d])&&b.records[d]>=0&&b.records[d]<=1000000))return error('invalid_sync',400);
   const payload=JSON.stringify(MODES.map(d=>b.records[d]));
   await db.prepare('INSERT INTO sync_operations(player_id,operation_id,payload,created_at) VALUES(?,?,?,?) ON CONFLICT(player_id,operation_id) DO NOTHING').bind(me.id,b.operation_id,payload,Date.now()).run();
   const previous=await db.prepare('SELECT payload FROM sync_operations WHERE player_id=? AND operation_id=?').bind(me.id,b.operation_id).first();
   if(!previous||previous.payload!==payload)return error('operation_conflict',409);
   // Each upsert is monotonic and repeatable: a retry also repairs a partial write.
   for(const d of MODES)await db.prepare('INSERT INTO personal_scores(player_id,difficulty,score,updated_at) VALUES(?,?,?,?) ON CONFLICT(player_id,difficulty) DO UPDATE SET score=excluded.score,updated_at=excluded.updated_at WHERE excluded.score>personal_scores.score').bind(me.id,d,b.records[d],Date.now()).run();
   return respond({accepted:true,operation_id:b.operation_id,verification:'unverified'});
 }
 // Explicitly provisional public leaderboard; only consented synced profiles.
 if(p==='/v2/leaderboard'&&req.method==='GET'){
   const d=u.searchParams.get('difficulty'),limit=u.searchParams.get('limit')||'10';
   if(!validMode(d)||!['10','100'].includes(limit))return error('invalid_query',400);
   const r=await db.prepare('SELECT p.nickname,s.score FROM personal_scores s JOIN players p ON p.id=s.player_id WHERE s.difficulty=? AND s.score>0 ORDER BY s.score DESC,s.updated_at ASC,s.player_id ASC LIMIT ?').bind(d,Number(limit)).all();
   return respond({difficulty:d,entries:r.results.map((v,i)=>({rank:i+1,nickname:v.nickname,score:v.score})),verified_only:false,verification:'unverified'});
 }
 if(p==='/v2/me'&&req.method==='GET'){
   const me=await player(req,db);if(!me)return error('unauthorized',401);
   const r=await db.prepare('SELECT difficulty,score FROM personal_scores WHERE player_id=?').bind(me.id).all();
   return respond({player_id:me.id,nickname:me.nickname,personal_records:r.results,verification:'unverified'});
 }
 if(p==='/v1/leaderboard'&&req.method==='GET'){
   const d=u.searchParams.get('difficulty'),limit=u.searchParams.get('limit')||'10';
   if(!validMode(d)||!['10','100'].includes(limit))return error('invalid_query',400);
   const r=await db.prepare('SELECT p.nickname,s.score FROM best_scores s JOIN players p ON p.id=s.player_id WHERE s.difficulty=? ORDER BY s.score DESC,s.updated_at ASC,s.player_id ASC LIMIT ?').bind(d,Number(limit)).all();
   return respond({difficulty:d,entries:r.results.map((v,i)=>({rank:i+1,nickname:v.nickname,score:v.score})),verified_only:true});
 }
 const routes={'/v1/me':'GET','/v1/profile':'PATCH','/v1/session':'POST','/v1/submit':'POST'};
 if(!Object.hasOwn(routes,p))return error('not_found',404);
 if(routes[p]!==req.method)return error('method_not_allowed',405);
 const me=await player(req,db);if(!me)return error('unauthorized',401);
 if(p==='/v1/profile'){
   const b=await body(req),nick=typeof b.nickname==='string'?b.nickname.trim():'';
   if(!exact(b,['nickname'])||!validNickname(nick))return error('invalid_nickname',400);
   await db.prepare('UPDATE players SET nickname=? WHERE id=?').bind(nick,me.id).run();
   return respond({nickname:nick});
 }
 if(p==='/v1/me'){
   const r=await db.prepare('SELECT s.difficulty,s.score,1+(SELECT COUNT(*) FROM best_scores t WHERE t.difficulty=s.difficulty AND (t.score>s.score OR (t.score=s.score AND (t.updated_at<s.updated_at OR (t.updated_at=s.updated_at AND t.player_id<s.player_id))))) AS rank FROM best_scores s WHERE s.player_id=?').bind(me.id).all();
   return respond({player_id:me.id,nickname:me.nickname,scores:r.results});
 }
 if(p==='/v1/session'){
   const b=await body(req);
   if(!exact(b,['difficulty','game_version'])||!validMode(b.difficulty)||b.game_version!=='1.5.5')return error('invalid_session_request',400);
   const id=crypto.randomUUID(),seed=crypto.getRandomValues(new Uint32Array(1))[0],now=Date.now();
   const r=await db.prepare('INSERT INTO sessions(id,player_id,difficulty,seed,game_version,created_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM sessions WHERE player_id=? AND created_at>=?)<20').bind(id,me.id,b.difficulty,seed,b.game_version,now,me.id,now-3600000).run();
   if(r.meta.changes!==1)return error('rate_limited',429);
   return respond({session_id:id,seed,game_version:b.game_version,verification:'pending_only',expires_at:now+3600000},201);
 }
 if(p==='/v1/submit'){
   const b=await body(req);
   if(!exact(b,['session_id','difficulty','score','events','ticks'])||!validMode(b.difficulty)||typeof b.session_id!=='string'||!uuid.test(b.session_id)||!Number.isSafeInteger(b.score)||b.score<0||b.score>1000000||!Number.isSafeInteger(b.ticks)||b.ticks<1||b.ticks>432000||!Array.isArray(b.events)||b.events.length>2000||b.events.some((x,i)=>!Number.isSafeInteger(x)||x<0||x>=b.ticks||(i>0&&x<=b.events[i-1])))return error('invalid_submission',400);
   const now=Date.now(),s=await db.prepare('SELECT id,created_at FROM sessions WHERE id=? AND player_id=? AND difficulty=?').bind(b.session_id,me.id,b.difficulty).first();
   if(!s)return error('unknown_session',404);
   if(now-s.created_at>3600000)return error('expired_session',410);
   if(b.ticks/120*1000>now-s.created_at+5000)return error('invalid_duration',400);
   const r=await db.prepare("INSERT INTO submissions(id,player_id,session_id,difficulty,score,events,ticks,status,created_at) VALUES(?,?,?,?,?,?,?,'pending',?) ON CONFLICT(session_id) DO NOTHING").bind(crypto.randomUUID(),me.id,s.id,b.difficulty,b.score,JSON.stringify(b.events),b.ticks,now).run();
   if(r.meta.changes!==1)return error('already_submitted',409);
   // No score promotion until the real game replay verifier is implemented and tested.
   return respond({status:'pending'},202);
 }
 return error('not_found',404);
 }catch(e){return e instanceof HttpError?error(e.message,e.status):error('request_failed',500);}
}
export default {fetch:fetchHandler};
