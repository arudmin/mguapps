'use strict';
/** Chrome Dino standalone packer. Never opens apps/flappy_bird or any sibling. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const args = process.argv.slice(2);
const preview = args.indexOf('--preview-only') >= 0;
const values = args.filter(x => x !== '--preview-only');
const appDir = values[2] ? path.resolve(values[2]) : __dirname;
const tree = path.join(appDir, 'package');
const spec = JSON.parse(fs.readFileSync(path.join(appDir, 'app.json'),'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(tree,'package.json'),'utf8'));
const id = values[0] || spec.id;
const version = values[1] || spec.version;
if (id !== 'chrome_dino') throw new Error('Unexpected application id: ' + id);
if (!/^\d+\.\d+\.\d+$/.test(version) || spec.version !== pkg.version) throw new Error('Version mismatch');
const requires = [
  'package.json','manifest.json','permissions.json',
  'javascript/app.js','javascript/src/game.js','javascript/src/input.js','javascript/src/render.js',
  'javascript/kit/mgu.js','javascript/kit/record.js','javascript/kit/parked.js',
  'javascript/kit/app-spec.json',
  'rhmiData/application.json',
  'rhmiData/uiDescriptions/ID7/application.xml','rhmiData/uiDescriptions/ID8/application.xml',
  'rhmiData/uiDescriptions/ID7/uiDescription.json','rhmiData/uiDescriptions/ID8/uiDescription.json'
];
for (const file of requires) {
  if (!fs.existsSync(path.join(tree,file))) throw new Error('Missing standalone file: ' + file + '. Run: node apps/chrome_dino/vendor_once.js');
}
const appJs = fs.readFileSync(path.join(tree,'javascript/app.js'),'utf8');
const gameJs = fs.readFileSync(path.join(tree,'javascript/src/game.js'),'utf8');
const renderJs = fs.readFileSync(path.join(tree,'javascript/src/render.js'),'utf8');
if (!appJs.includes('Chrome Dino') || !renderJs.includes('CHROME DINO') || !gameJs.includes('cactus')) throw new Error('Dino logic missing; refusing to package Flappy Bird');
const entries=[];
function walk(dir,prefix) {
  for (const name of fs.readdirSync(dir).sort()) {
    if (name==='.DS_Store'||name.startsWith('._')) continue;
    const file=path.join(dir,name), rel=prefix?prefix+'/'+name:name,st=fs.lstatSync(file);
    if (st.isSymbolicLink()) throw Error('Symlink forbidden: '+rel);
    if (st.isDirectory()) {walk(file,rel);continue;}
    if (!st.isFile()) throw Error('Not regular: '+rel);
    if (name==='node_modules'||name==='oap-sdk') throw Error('No bundled BMW SDK');
    let buf=fs.readFileSync(file);
    if (rel==='package.json') {const obj=JSON.parse(buf.toString('utf8'));obj.name=id;obj.version=version;buf=Buffer.from(JSON.stringify(obj,null,2)+'\n');}
    if (rel==='javascript/kit/app-spec.json') {const obj=JSON.parse(buf.toString('utf8'));obj.id=id;obj.version=version;buf=Buffer.from(JSON.stringify(obj,null,2)+'\n');}
    if (rel==='rhmiData/application.json') {const obj=JSON.parse(buf.toString('utf8'));obj.application.version=version;buf=Buffer.from(JSON.stringify(obj,null,2)+'\n');}
    entries.push({name:rel,data:buf});
  }
}
walk(tree,'');
const found=new Set(entries.map(x=>x.name));
for (const e of entries) if (e.name.endsWith('.js')) {
  const code=e.data.toString('utf8');
  const rx=/require\(['"](\.[^'"]+)['"]\)/g;
  let m;while((m=rx.exec(code))){
    const target=path.posix.normalize(path.posix.join(path.posix.dirname(e.name),m[1]));
    if (!found.has(target)&&!found.has(target+'.js')&&!found.has(target+'.json')) throw Error('Unresolved require: '+e.name+' -> '+m[1]);
  }
}
console.log('Chrome Dino Game '+version+': '+entries.length+' source package files, standalone path validated');
if (!preview) {
  const parts=[];
  function octal(n,len){return n.toString(8).padStart(len-1,'0')+'\0';}
  for (const e of entries) {
    if (Buffer.byteLength(e.name)>100) throw Error('Tar path over 100 bytes: '+e.name);
    const h=Buffer.alloc(512);
    h.write(e.name,0,100);h.write(octal(420,8),100);h.write(octal(0,8),108);h.write(octal(0,8),116);
    h.write(octal(e.data.length,12),124);h.write(octal(0,12),136);h.fill(32,148,156);
    h.write('0',156);h.write('ustar\0',257);h.write('00',263);
    let checksum=0;for(let i=0;i<h.length;i++) checksum+=h[i];h.write(octal(checksum,7)+' ',148);
    parts.push(h,e.data);const padding=(512-e.data.length%512)%512;if(padding)parts.push(Buffer.alloc(padding));
  }
  parts.push(Buffer.alloc(1024));
  const zipped=zlib.gzipSync(Buffer.concat(parts),{level:9});zipped[9]=3;
  const outDir=path.resolve(process.env.MGU_OUT||path.join(appDir,'dist'));
  fs.mkdirSync(outDir,{recursive:true});
  const out=path.join(outDir,id+'@'+version+'.tgz');fs.writeFileSync(out,zipped);
  console.log('Built standalone archive: '+out);
}
