'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const spec=require('../package/javascript/kit/app-spec.json');
const i18n=require('../package/javascript/src/i18n');
assert.strictEqual(i18n.langOf('ru_RU'),'ru');
assert.strictEqual(i18n.langOf('en_US'),'en');
assert.strictEqual(i18n.words('ru').play,'Играть');
const names=spec.screens.find(x=>x.name==='MAIN').items.map(x=>x[1]);
['BTN_PLAY','BTN_DIFFICULTY','BTN_LANGUAGE','MENU_INFO','MENU_BEST','MENU_HELP'].forEach(name=>assert(names.includes(name),'missing '+name));
assert.strictEqual(new Set(names).size,names.length);
for(const level of ['ID7','ID8']){
 const dir=path.join(root,'package/rhmiData/uiDescriptions',level);
 const ui=JSON.parse(fs.readFileSync(path.join(dir,'uiDescription.json'),'utf8'));
 const xml=fs.readFileSync(path.join(dir,'application.xml'),'utf8');
 for(const [id,name] of [['22','BTN_LANGUAGE'],['23','MENU_BEST']]){
  assert.strictEqual(ui.containers['1'].components[id].name,name,level+' component '+id);
  assert(xml.includes('id="'+id+'"'),level+' XML missing '+id);
 }
}
const app=fs.readFileSync(path.join(root,'package/javascript/app.js'),'utf8');
assert(app.includes("require('./src/i18n')"),'required localization module missing');
assert(app.includes("ui.text('MENU_INFO'"),'separate version row missing');
assert(app.includes("ui.text('MENU_BEST'"),'separate best row missing');
assert(app.includes("ui.text('MENU_HELP'"),'separate help row missing');
const render=fs.readFileSync(path.join(root,'package/javascript/src/render.js'),'utf8');
assert(render.includes('const legsA=')&&render.includes('const legsB='),'leg animation missing');
console.log('1.4.8 layout, RU/EN localization, sprites and ID7/ID8 checks OK');
