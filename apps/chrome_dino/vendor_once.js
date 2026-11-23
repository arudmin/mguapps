'use strict';
/** One-time vendoring from your own repository's Flappy source. Once committed,
 * Chrome Dino has no references to Flappy at build/install/run time.
 * This runs LOCALLY or in GitHub Actions, never in MGU Store. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const here=__dirname, dst=path.join(here,'package');
const marker=path.join(dst,'.vendor-complete.json');
if (fs.existsSync(marker)) { console.log('Standalone shell already vendored; no changes'); process.exit(0); }
const donor=path.resolve(here,'../flappy_bird/package');
if (!fs.existsSync(path.join(donor,'javascript/kit/mgu.js'))) {
  throw Error('One-time donor files unavailable: apps/flappy_bird/package. Provide the full flappy_bird source checkout.');
}
function copyMissing(from,to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to,{recursive:true});
  for (const name of fs.readdirSync(from)) {
    const a=path.join(from,name),b=path.join(to,name),stat=fs.lstatSync(a);
    if(stat.isSymbolicLink()) throw Error('No symlinks: '+a);
    if(stat.isDirectory()) copyMissing(a,b);
    else if(stat.isFile()&&!fs.existsSync(b)) fs.copyFileSync(a,b);
  }
}
copyMissing(donor,dst);
const ownApp=JSON.parse(fs.readFileSync(path.join(here,'app.json'),'utf8'));
function setJson(p,obj){fs.writeFileSync(p,JSON.stringify(obj,null,2)+'\n');}
const pack=path.join(dst,'package.json');let pkg=JSON.parse(fs.readFileSync(pack,'utf8'));
pkg.name=ownApp.id;pkg.version=ownApp.version;pkg.description=ownApp.description;
if(pkg.oapAppSettings)pkg.oapAppSettings.loggingId=ownApp.loggingId;
setJson(pack,pkg);
const appSpec=path.join(dst,'javascript/kit/app-spec.json');setJson(appSpec,ownApp);
const rhmiFile=path.join(dst,'rhmiData/application.json');let rhmi=JSON.parse(fs.readFileSync(rhmiFile,'utf8'));
const uuids=new Map();
function remap(s){
 return s.replace(/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/gi,function(u){
   if(!uuids.has(u)){
    const b=crypto.createHash('sha1').update('Chrome-Dino-Game:1.2.0:'+u).digest().slice(0,16);
    b[6]=(b[6]&15)|80;b[8]=(b[8]&63)|128;
    const h=b.toString('hex');uuids.set(u,h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20));
   }return uuids.get(u);
 });
}
// Remap exactly once. Preexisting Dino application JSON already contains unique IDs.
// Use the original donor's app UUIDs to keep all linked RHMI resources consistent.
const donorRhmi=JSON.parse(fs.readFileSync(path.join(donor,'rhmiData/application.json'),'utf8'));
function replaceText(s) {
  return s.replace(/flappy_bird/g,'chrome_dino')
    .replace(/FLAPPY_BIRD/g,'CHROME_DINO')
    .replace(/Flappy Bird/g,'Chrome Dino Game')
    .replace(/Flappy MGU/g,'Chrome Dino Game')
    .replace(/Flappy/g,'Dino')
    .replace(/BTN_FLAP/g,'BTN_FLAP')
    .replace(/flappy_bird_icon\.png/g,'chrome_dino_icon.png');
}
// Any UUID emitted by the donor is mapped to its own Dino UUID consistently across files.
// Derive independent deterministic UUIDs for ALL donor RHMI resources and entry points.
// Reusing their originals would collide with installed Flappy Bird.
function rewrite(dir){
 for(const name of fs.readdirSync(dir)){
  const file=path.join(dir,name),st=fs.lstatSync(file);
  if(st.isDirectory()){rewrite(file);continue;}
  const rel=path.relative(dst,file).replace(/\\/g,'/');
  if(rel==='javascript/app.js'||rel.startsWith('javascript/src/')||rel==='javascript/kit/app-spec.json'||rel==='package.json'||rel==='rhmiData/application.json')continue;
  if(!/\.(js|json|xml|txt|md|properties)$/.test(rel))continue;
  let s=fs.readFileSync(file,'utf8');
  s=replaceText(remap(s));
  fs.writeFileSync(file,s);
 }
}
// Use fresh copied RHMI donor application description, then give it distinct Dino identities.
rhmi=JSON.parse(replaceText(remap(JSON.stringify(donorRhmi))));
rhmi.application.name='chrome_dino';rhmi.application.version=ownApp.version;rhmi.application.vendor=ownApp.vendor;
if(rhmi.application.entryPoints[0]){
  const entry=rhmi.application.entryPoints[0];entry.name='CHROME_DINO_ENTRY';entry.textId='SID_CHROME_DINO_TITLE';entry.icon='chrome_dino_icon.png';
}
setJson(rhmiFile,rhmi);
rewrite(dst);
// Never retain donor artwork under a duplicate name.
const oldIcon=path.join(dst,'rhmiData/variantGroups/Common/images/flappy_bird_icon.png');
if(fs.existsSync(oldIcon))fs.unlinkSync(oldIcon);
setJson(marker,{schema:1,app:'chrome_dino',version:ownApp.version});
console.log('Vendored standalone OAP/RHMI files. Commit apps/chrome_dino/package to GitHub.');
