// Recovery capability: public scores only, no vehicle-to-profile lookup or credential transfer.
export const MODES=['easy','normal','hard','extreme'];
export function selectPublicRecords(boards,nickname){
 if(typeof nickname!=='string'||!/^[A-Za-z0-9_-]{3,16}$/.test(nickname))throw Error('invalid nickname');
 const records=MODES.map(m=>{const rows=boards&&boards[m];if(!Array.isArray(rows))throw Error('invalid board');const row=rows.slice(0,10).find(r=>r&&typeof r.nickname==='string'&&r.nickname.toLowerCase()===nickname.toLowerCase());if(!row)return 0;if(!Number.isSafeInteger(row.score)||row.score<1||row.score>1000000)throw Error('invalid score');return row.score;});
 return {found:records.some(Boolean),records};
}
// Local-only reference records are distinct from earned, publishable records.
export function mergeLocalRecords(local,reference){
 for(const a of [local,reference])if(!Array.isArray(a)||a.length!==4||a.some(n=>!Number.isSafeInteger(n)||n<0||n>1000000))throw Error('invalid records');
 return local.map((n,i)=>Math.max(n,reference[i]));
}
