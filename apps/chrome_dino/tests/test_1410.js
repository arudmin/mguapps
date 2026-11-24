'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const s of [require('../package/javascript/kit/app-spec.json'),require('../app.json')])assert.deepStrictEqual(s.screens.map(x=>x.name),['GAME']);
for(const h of ['ID7','ID8']){
 const base='package/rhmiData/uiDescriptions/'+h+'/';
 const j=JSON.parse(read(base+'uiDescription.json')),x=read(base+'application.xml');
 assert.deepStrictEqual(Object.keys(j.containers),['9']);
 assert.deepStrictEqual(Array.from(x.matchAll(/<container id="(\d+)"/g),m=>m[1]),['9']);
 assert(!j.containers['9'].properties||!j.containers['9'].properties.ParentState);
 assert.strictEqual(j.containers['9'].components['10'].name,'GAME_GFX');
 if(h==='ID8')assert.strictEqual(j.containers['9'].components['990'].name,'KIT_HMI_ID8');
}
const src=read('package/javascript/app.js');
assert(!/\bMAIN\b|BTN_THEME|MENU_INFO|BTN_DIFFICULTY|BTN_LANGUAGE/.test(src));
assert(src.includes('backAction'));assert(src.includes("ui.close('GAME')"));
console.log('Single Dashboard entry, no legacy RHMI menu or handlers');
