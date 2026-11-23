'use strict';
const assert=require('assert');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'package/rhmiData/variantGroups/Common/texts');
const ui=require('../package/rhmiData/uiDescriptions/ID7/uiDescription.json');
const id8=require('../package/rhmiData/uiDescriptions/ID8/uiDescription.json');
const diff=ui.containers['1'].components['21'];
const lang=ui.containers['1'].components['22'];
assert.strictEqual(diff.type,'dropDownMenu');
assert.strictEqual(lang.type,'dropDownMenu');
assert.strictEqual(diff.cells.HeaderText.type,'StringId');
assert.strictEqual(lang.cells.HeaderText.type,'StringId');
const all=[diff.cells.HeaderText.value,lang.cells.HeaderText.value]
  .concat(diff.rows.map(x=>x.ItemText.value)).concat(lang.rows.map(x=>x.ItemText.value));
assert.strictEqual(new Set(all).size,9);
const locales=fs.readdirSync(dir).filter(x=>x.endsWith('.json'));
assert(locales.length>=33,'missing RHMI locales');
for(const name of locales){
 const j=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
 for(const sid of all)assert(typeof j[sid]==='string'&&j[sid].length>0,name+' missing '+sid);
}
const ru=JSON.parse(fs.readFileSync(path.join(dir,'ru_RU.json'),'utf8'));
assert.strictEqual(ru.SID_CHROME_DINO_DROPDOWN_DIFFICULTY,'Сложность');
assert.strictEqual(ru.SID_CHROME_DINO_DROPDOWN_LANGUAGE,'Язык');
assert.strictEqual(ru.SID_CHROME_DINO_DIFFICULTY_1,'НОРМА');
assert.strictEqual(ru.SID_CHROME_DINO_LANGUAGE_0,'Авто (BMW)');
const app=fs.readFileSync(path.join(root,'package/javascript/app.js'),'utf8');
assert(!app.includes("ui.cells('BTN_DIFFICULTY',0,{HeaderText"));
assert(!app.includes("ui.cells('BTN_LANGUAGE',0,{HeaderText"));
assert.strictEqual(id8.containers['1'].components['21'].type,'button','ID8 dropdown representation changed');
console.log('1.4.11: '+locales.length+' RHMI bundles, nine localized dropdown StringIds, ID7+ID8 OK');
