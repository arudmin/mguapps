'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const spec=require('../package/javascript/kit/app-spec.json');
const read=(s)=>fs.readFileSync(path.join(root,s),'utf8');
const seven=JSON.parse(read('package/rhmiData/uiDescriptions/ID7/uiDescription.json'));
const eight=JSON.parse(read('package/rhmiData/uiDescriptions/ID8/uiDescription.json'));
const xml7=read('package/rhmiData/uiDescriptions/ID7/application.xml');
const xml8=read('package/rhmiData/uiDescriptions/ID8/application.xml');
for(const [id,count] of [['21',4],['22',3]]){
 const c=seven.containers['1'].components[id];
 assert.strictEqual(c.type,'dropDownMenu','ID7 '+id);
 assert.strictEqual(c.rows.length,count);
 assert(c.cells.HeaderText&&c.cells.SelectedItem);
 assert(xml7.includes('id="'+id+'" type="dropDownMenu" widget="LT_DropDownMenu_1Row_2Col3070"'));
}
for(const [id,num] of [['30',4],['40',3]]){
 const page=eight.containers[id];assert(page&&page.type==='state');
 const buttons=Object.values(page.components).filter(x=>x.type==='button');
 assert.strictEqual(buttons.length,num);
 assert(xml8.includes('<container id="'+id+'" type="state"'));
 assert.strictEqual(page.properties.ParentState.value,1);
 const layoutIds=[...xml8.matchAll(/<layoutGroup id="(\\d+)"/g)].map(v=>v[1]);
 const componentIds=[...xml8.matchAll(/<component id="(\\d+)"/g)].map(v=>v[1]);
 assert(!layoutIds.some(x=>componentIds.includes(x)), 'ID8 layout group and component IDs must not overlap');
}
const app=read('package/javascript/app.js');
assert(!app.includes("ui.cells('BTN_DIFFICULTY'"),'ID7 must use localized RHMI StringIds');
assert.strictEqual(seven.containers['1'].components['21'].cells.HeaderText.type,'StringId');
assert.strictEqual(seven.containers['1'].components['22'].cells.HeaderText.type,'StringId');
assert(!app.includes("ui.open('SELECT_DIFFICULTY')"));
assert(!app.includes("ui.open('SELECT_LANGUAGE')"));
assert(!app.includes("chooseDifficulty(Number(ev.row))"));
assert(!app.includes("chooseLanguage(Number(ev.row))"));
assert.strictEqual(spec.version,require('../app.json').version);
console.log('Chrome Dino ID7 RHMI dropDownMenu + ID8 native list selectors OK');
