import {writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
if(!account||!token)throw Error('Required GitHub secrets are missing');
const name='chrome-dino-leaderboard-staging';
const base='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(account);
async function api(path,method='GET',body,allow404=false){
 const res=await fetch(base+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 if(allow404&&res.status===404)return null;
 const j=await res.json();if(!res.ok||!j.success)throw Error('Cloudflare '+method+' '+path.split('?')[0]+' failed: HTTP '+res.status+' codes '+(j.errors||[]).map(e=>e.code).join(','));
 return j.result;
}
const dbs=await api('/d1/database?name='+encodeURIComponent(name)+'&per_page=100');
let db=dbs.find(x=>x.name===name);
if(!db&&process.env.REQUIRE_EXISTING_RESOURCES==='true')throw Error('Existing staging D1 database required');
if(!db){db=await api('/d1/database','POST',{name});console.log('Created staging D1 database');}else console.log('Reusing staging D1 database');
if(!db.uuid)throw Error('D1 database UUID missing');
await writeFile('wrangler.toml','name = "'+name+'"\nmain = "src/index.js"\ncompatibility_date = "2026-11-01"\nworkers_dev = true\nkeep_vars = true\n[observability]\nenabled = false\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "'+name+'"\ndatabase_id = "'+db.uuid+'"\n');
const existing=await api('/workers/scripts/'+name+'/secrets','GET',undefined,true);
if(!existing||!existing.some(s=>s.name==='SERVER_SECRET')){
 if(process.env.REQUIRE_EXISTING_RESOURCES==='true')throw Error('Existing Worker SERVER_SECRET required');
 const key=randomBytes(32).toString('hex');
 console.log('::add-mask::'+key);
 await writeFile('.deploy-secrets.json',JSON.stringify({SERVER_SECRET:key}),{mode:0o600});
 console.log('Generated initial server HMAC secret');
}else console.log('Existing HMAC secret will be preserved');
const sub=await api('/workers/subdomain','GET',undefined,true);
if(!sub||!sub.subdomain)throw Error('Enable the free workers.dev subdomain in Cloudflare Dashboard first');
await writeFile('.deploy-url','https://'+name+'.'+sub.subdomain+'.workers.dev');
console.log('Cloudflare credentials and D1 access verified');
