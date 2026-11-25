'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const repo=path.resolve(__dirname,'../../..'),dir=path.join(repo,'apps/chrome_dino'),app=require('../app.json'),entry=require('../../../mgu-repo.json').components.find(e=>e.id===app.id);
assert(entry);assert.deepStrictEqual(entry.requires,app.requires);assert.deepStrictEqual(entry.mguHmi,app.mguHmi);
const out=fs.mkdtempSync(path.join(os.tmpdir(),'dino-store-'));
try{
 const args=entry.build.args.map(a=>a.replace('{id}',app.id).replace('{version}',app.version).replace('{dir}',dir));
 const build=()=>cp.execFileSync(process.execPath,[path.join(repo,entry.build.node)].concat(args),{cwd:repo,env:Object.assign({},process.env,{MGU_OUT:out}),stdio:'inherit'});
 build();const file=path.join(out,app.id+'@'+app.version+'.tgz'),first=fs.readFileSync(file);
 assert(first.length>0);build();assert(first.equals(fs.readFileSync(file)),'non-deterministic package');
 const list=cp.execFileSync('tar',['-tzf',file],{encoding:'utf8'}).trim().split('\n');
 assert.strictEqual(new Set(list).size,list.length);
 for(const name of list)assert(!name.startsWith('/')&&!name.split('/').includes('..')&&!name.includes('node_modules'));
 for(const name of ['manifest.json','permissions.json','javascript/app.js','javascript/src/dashboard.js','rhmiData/uiDescriptions/ID7/application.xml','rhmiData/uiDescriptions/ID8/application.xml'])assert(list.includes(name),name);
 const read=n=>JSON.parse(cp.execFileSync('tar',['-xOzf',file,n],{encoding:'utf8'}));
 assert.strictEqual(read('package.json').version,app.version);assert.strictEqual(read('javascript/kit/app-spec.json').version,app.version);
 console.log('Store build contract, archive and reproducibility OK; bytes='+first.length+' sha256='+crypto.createHash('sha256').update(first).digest('hex'));
}finally{fs.rmSync(out,{recursive:true,force:true});}
