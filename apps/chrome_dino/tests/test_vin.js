'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {validVin,parseVin,findVin}=require('../package/javascript/src/vin');
const vin='WBA12345678901234';
assert(validVin(vin));
assert(!validVin('WBA1234'));
assert(!validVin('WBA1234567890123I'));
const payload=[0x62,0xF1,0x90].concat([...vin].map(x=>x.charCodeAt(0)));
assert.strictEqual(parseVin(payload),vin);
assert.strictEqual(parseVin([0x7F,0x22,0x31]),null);
assert.strictEqual(findVin(new Map([[0x10,[0x7F,0x22,0x31]],[0x40,payload]])),vin);
const root=path.resolve(__dirname,'..');
const app=require('../app.json');
const manifest=require('../package/manifest.json');
assert(app.signals['com.harman.infotainment.systemfunctions.tasu.tasu.InternalTasu']);
assert(manifest.proxies['com.harman.infotainment.systemfunctions.tasu.tasu.InternalTasu']);
for(const v of ['ID7','ID8']) {
 const ui=require('../package/rhmiData/uiDescriptions/'+v+'/uiDescription.json');
 assert.strictEqual(ui.containers['1'].components['25'].name,'MENU_VIN');
}
const src=fs.readFileSync(path.join(root,'package/javascript/app.js'),'utf8');
assert(src.includes('diag.functional(0x22,[0xF1,0x90]'));
assert(src.includes("ui.text('MENU_VIN'"));
console.log('VIN F190 read-only parsing and ID7/ID8 diagnostic row OK');
