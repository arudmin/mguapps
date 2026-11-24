'use strict';
// Best-effort check against the public repository. No VIN or user data is sent.
// Never block the game if network access is unavailable on MGU.
const https=require('https'),uplink=require('./uplink');
const URL='https://raw.githubusercontent.com/arudmin/mguapps/main/apps/chrome_dino/app.json';
function compare(a,b){const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return d;}return 0;}
function checkUpdate(current,callback){
 let done=false;
 function finish(result){if(done)return;done=true;callback(result);}
 try{
  const req=https.get(URL,{timeout:4000,lookup:uplink.lookup(),headers:{'User-Agent':'chrome-dino-update-check','Accept':'application/json'}},res=>{
   if(res.statusCode!==200){res.resume();return finish({checked:false,available:false});}
   let body='';
   res.on('data',c=>{body+=c;if(body.length>32768)req.destroy();});
   res.on('end',()=>{try{const j=JSON.parse(body);const latest=j.version;if(!/^\d+\.\d+\.\d+$/.test(latest))throw Error('version');finish({checked:true,latest,available:compare(latest,current)>0});}catch(e){finish({checked:false,available:false});}});
   res.on('error',()=>finish({checked:false,available:false}));
  });
  req.on('timeout',()=>req.destroy());
  req.on('error',()=>finish({checked:false,available:false}));
 }catch(e){finish({checked:false,available:false});}
}
module.exports={compare,checkUpdate};
