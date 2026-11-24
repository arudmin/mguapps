'use strict';
// Store approach: use the active uplink lease's DNS, not the system resolver.
// Reference: robertnisipeanu/mgu-store native/mgu-updater/js/fetch.js lookupVia,
// native/mgu-uplink/README.md. Keep normal HTTPS certificate verification.
const fs=require('fs'),dns=require('dns'),net=require('net');
function lookupVia(servers){
 if(!Array.isArray(servers)||!servers.length)throw Object.assign(Error('uplink offline'),{code:'UPLINK_OFFLINE'});
 const resolver=new dns.Resolver();resolver.setServers(servers);
 return (host,options,cb)=>{
  if(typeof options==='function'){cb=options;options={};}
  resolver.resolve4(host,(err,addresses)=>{
   if(err||!addresses||!addresses.length)return cb(err||Object.assign(Error('no address'),{code:'ENOTFOUND'}));
   if(options&&options.all)return cb(null,addresses.map(address=>({address,family:4})));
   cb(null,addresses[0],4);
  });
 };
}
function lookup(){
 const uid=typeof process.getuid==='function'?process.getuid():null;
 const paths=uid===null?[]:['/var/opt/public/oap/oap_'+uid+'/data/uplink.json'];
 paths.push('/run/mgu-uplink/lease.json');
 for(const p of paths){try{const lease=JSON.parse(fs.readFileSync(p,'utf8'));const servers=Array.isArray(lease.dns)?lease.dns.filter(x=>typeof x==='string'&&net.isIP(x)):[];if(servers.length)return lookupVia(servers);}catch(e){}}
 throw Object.assign(Error('uplink offline'),{code:'UPLINK_OFFLINE'});
}
module.exports={lookup,lookupVia};
