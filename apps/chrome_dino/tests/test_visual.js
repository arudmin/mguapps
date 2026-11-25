'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {Game}=require('../package/javascript/src/game'),{drawDashboard,GEAR_SPRITE}=require('../package/javascript/src/dashboard'),i18n=require('../package/javascript/src/i18n');
const out=path.resolve(process.env.CI_VISUAL_DIR||path.join(__dirname,'../dist/visual'));fs.mkdirSync(out,{recursive:true});
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
for(const [w,h] of [[1600,520],[1920,720]])for(let mode=0;mode<4;mode++){
 const parts=[],texts=[],rects=[];let clipped=false;
 const rect=(x,y,a,b,c,r=0,stroke=false)=>{assert([x,y,a,b].every(Number.isFinite));rects.push({x,y,a,b,c});parts.push('<rect x="'+x+'" y="'+y+'" width="'+a+'" height="'+b+'" rx="'+r+'" '+(stroke?'fill="none" stroke="':'fill="')+c+'"/>');};
 const cv={clear:c=>rect(0,0,w,h,c),fillRect:rect,roundRect:(x,y,a,b,r,c)=>rect(x,y,a,b,c,r),strokeRoundRect:(x,y,a,b,r,t,c)=>rect(x,y,a,b,c,r,true),clip:(x,y,a,b)=>{assert(!clipped);clipped=true;parts.push('<defs><clipPath id="field"><rect x="'+x+'" y="'+y+'" width="'+a+'" height="'+b+'"/></clipPath></defs><g clip-path="url(#field)">');},noclip:()=>{assert(clipped);clipped=false;parts.push('</g>');},text:(s,x,y,size,c,opt)=>{texts.push({s:String(s),x,y});parts.push('<text x="'+x+'" y="'+y+'" font-family="sans-serif" font-size="'+size+'" fill="'+c+'" text-anchor="'+({right:'end',center:'middle'}[opt.align]||'start')+'">'+esc(s)+'</text>');}};
 const game=new Game({random:()=>.5});game.setDifficulty(mode);game.action();game.obstacles=[{type:'cactus',x:900,y:622,parts:[{x:0,large:true}]}];
 drawDashboard(cv,game,w,h,42,i18n.words('en'),{}, {parked:true,selectedControl:'mode',languageLabel:'English',bestModes:[143,34,36,9],fps:60});
 assert(!clipped);assert(texts.some(t=>t.s==='PERSONAL BESTS'&&t.x>w*.72));for(const label of i18n.words('en').levels)assert(texts.some(t=>t.s===label&&t.x>w*.72));assert(texts.some(t=>t.s.includes('FPS 60')&&t.x>w*.72));assert(texts.some(t=>t.s.includes(i18n.words('en').levels[mode])&&t.x>w*.72));
 assert(rects.filter(r=>r.c==='#eaf5fc'&&r.x<w*.72).length>30,'dinosaur silhouette');assert(rects.some(r=>r.c==='#3cce8b'&&r.x<w*.72),'cactus');
 fs.writeFileSync(path.join(out,w+'x'+h+'-mode'+mode+'.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+parts.join('')+'</svg>');
}
console.log('Dashboard geometry and 8 SVG diagnostic previews OK');

assert.strictEqual(GEAR_SPRITE.length,21);
for(let y=0;y<21;y++){assert.strictEqual(GEAR_SPRITE[y].length,21);assert.strictEqual(GEAR_SPRITE[y],GEAR_SPRITE[20-y]);for(let x=0;x<21;x++){assert.strictEqual(GEAR_SPRITE[y][x],GEAR_SPRITE[y][20-x]);assert.strictEqual(GEAR_SPRITE[y][x],GEAR_SPRITE[x][y]);}}
assert.strictEqual(GEAR_SPRITE[10][10],'.');assert.strictEqual(GEAR_SPRITE[10][0],'#');assert.strictEqual(GEAR_SPRITE[0][10],'#');
console.log('Gear sprite symmetry and transparent center OK');
