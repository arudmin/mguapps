'use strict';
// UDS 22 F190 returns 62 F1 90 followed by the 17 ASCII VIN characters.
// Ignore negative replies and malformed identifiers; never persist or upload VIN.
function validVin(v){return typeof v==='string' && /^[A-HJ-NPR-Z0-9]{17}$/.test(v);}
function parseVin(uds){
 if(!Array.isArray(uds) || uds.length<20 || uds[0]!==0x62 || uds[1]!==0xF1 || uds[2]!==0x90)return null;
 const v=uds.slice(3,20).map(c=>String.fromCharCode(c)).join('');
 return validVin(v)?v:null;
}
function findVin(replies){
 if(!replies || typeof replies.forEach!=='function')return null;
 let found=null;
 replies.forEach(function(reply){if(!found)found=parseVin(reply);});
 return found;
}
module.exports={validVin,parseVin,findVin};
