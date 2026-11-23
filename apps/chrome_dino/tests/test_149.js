'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const i18n=require('../package/javascript/src/i18n');
const app=require('../app.json');
const manifest=require('../package/manifest.json');
const catalog=require('../../../mgu-repo.json');
const entry=catalog.components.find(x=>x.id==='chrome_dino');
assert(/^1\.4\.\d+$/.test(app.version));
for(const [raw,lang] of [['RUSSISCH','ru'],['ENGLISCH__UK','en'],['ENGLISCH__US','en'],['DEUTSCH','de'],['FRANZOESISCH','fr'],['SPANISCH','es'],['ITALIENISCH','it'],['ru_RU','ru']]){
 assert.strictEqual(i18n.langOf(raw),lang,raw);
}
assert.strictEqual(i18n.raw({value:'RUSSISCH'}),'RUSSISCH');
assert.strictEqual(i18n.words('ru').over,'КОНЕЦ ИГРЫ');
assert(manifest.proxies['de.bmw.infotainment.hmi.hmicontext.HMIContext']);
assert(app.signals['de.bmw.infotainment.hmi.hmicontext.HMIContext']);
assert(entry.texts.ru && entry.texts.ru.title==='Игра Chrome Dino');
assert(entry.texts.de && entry.texts.de.description.length>30);
const dir='package/rhmiData/variantGroups/Common/texts';
const ru=JSON.parse(fs.readFileSync(path.join(root,dir,'ru_RU.json')));
const en=JSON.parse(fs.readFileSync(path.join(root,dir,'en_GB.json')));
assert.strictEqual(ru.SID_CHROME_DINO_TITLE,'Игра Chrome Dino');
assert.strictEqual(en.SID_CHROME_DINO_TITLE,'Chrome Dino Game');
const src=fs.readFileSync(path.join(root,'package/javascript/app.js'),'utf8');
assert(src.includes("ui.text('MENU_BMW'"));
assert(src.includes('headLanguageRaw=raw'));
assert(src.includes("draw(screenRecorder, game, w, h, best, t(), updateState)"));
console.log('1.4.9 BMW language enums, manifest, catalog locales, RHMI title and game text OK');
