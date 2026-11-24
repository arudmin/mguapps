const enc=new TextEncoder();
export const VERSION='0.2.4';
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
   if(!exact(b,['identity_hash','consent','token'])||!HEX.test(b.identity_hash||'')||b.consent!==true||!HEX.test(b.token||''))return error('invalid_registration',400);
   const hmac=await identityHmac(b.identity_hash,env.SERVER_SECRET),th=await digest(b.token),id=crypto.randomUUID();
   await db.prepare('INSERT INTO players(id,identity_hash,nickname,token_hash,created_at) VALUES(?,?,?,?,?) ON CONFLICT(identity_hash) DO NOTHING').bind(id,hmac,defaultNickname(hmac),th,Date.now()).run();
   const row=await db.prepare('SELECT id,nickname,token_hash FROM players WHERE identity_hash=?').bind(hmac).first();
   if(!row||row.token_hash!==th)return error('already_registered',409);
   return respond({player_id:row.id,nickname:row.nickname,accepted:true});
 }
 if(p==='/v1/sync'&&req.method==='POST'){
 const me=await player(req,db);if(!me)return error('unauthorized',401);
 const b=await body(req);
 if(!exact(b,['operation_id','records','nickname'])||!uuid.test(b.operation_id||'')||!b.records||Object.keys(b.records).length!==4||!MODES.every(d=>Number.isSafeInteger(b.records[d])&&b.records[d]>=0&&b.records[d]<=1000000)||(b.nickname!==null&&!validNickname(b.nickname)))return error('invalid_sync',400);
 const payload=JSON.stringify([b.nickname,...MODES.map(d=>b.records[d])]);
 const now=Date.now(),ops=[db.prepare('INSERT INTO sync_operations(player_id,operation_id,payload,created_at) VALUES(?,?,?,?) ON CONFLICT(player_id,operation_id) DO NOTHING').bind(me.id,b.operation_id,payload,now)];
 if(b.nickname!==null)ops.push(db.prepare('UPDATE players SET nickname=? WHERE id=? AND changes()=1').bind(b.nickname,me.id));
 for(const d of MODES)ops.push(db.prepare('INSERT INTO personal_scores(player_id,difficulty,score,updated_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM sync_operations WHERE player_id=? AND operation_id=? AND payload=?) ON CONFLICT(player_id,difficulty) DO UPDATE SET score=excluded.score,updated_at=excluded.updated_at WHERE excluded.score>personal_scores.score').bind(me.id,d,b.records[d],now,me.id,b.operation_id,payload));
 await db.batch(ops);
 const prev=await db.prepare('SELECT payload FROM sync_operations WHERE player_id=? AND operation_id=?').bind(me.id,b.operation_id).first();
 if(!prev||prev.payload!==payload)return error('operation_conflict',409);
 const current=await db.prepare('SELECT nickname FROM players WHERE id=?').bind(me.id).first();
 return respond({accepted:true,operation_id:b.operation_id,nickname:current.nickname});
 }
 if(p==='/v1/leaderboard'&&req.method==='GET'){
 const me=await player(req,db);if(req.headers.has('authorization')&&!me)return error('unauthorized',401);
 const boards={},positions={};
 for(const d of MODES){
 const r=await db.prepare('SELECT p.id,p.nickname,s.score FROM personal_scores s JOIN players p ON p.id=s.player_id WHERE s.difficulty=? AND s.score>0 ORDER BY s.score DESC,s.updated_at ASC,s.player_id ASC LIMIT 10').bind(d).all();
 boards[d]=r.results.map((v,i)=>({rank:i+1,nickname:v.nickname,score:v.score,self:!!me&&v.id===me.id}));
 if(me){const own=await db.prepare('SELECT s.score,1+(SELECT COUNT(*) FROM personal_scores t WHERE t.difficulty=s.difficulty AND t.score>0 AND (t.score>s.score OR (t.score=s.score AND (t.updated_at<s.updated_at OR (t.updated_at=s.updated_at AND t.player_id<s.player_id))))) AS rank FROM personal_scores s WHERE s.player_id=? AND s.difficulty=? AND s.score>0').bind(me.id,d).first();positions[d]=own||null;}
 }
 return respond({boards,profile:me?{nickname:me.nickname,positions}:null,generated_at:Date.now(),verification:'unverified'});
 }
 return error('not_found',404);
 }catch(e){return e instanceof HttpError?error(e.message,e.status):error('request_failed',500);}
}
export default {fetch:fetchHandler};
