import test from 'node:test';import assert from 'node:assert/strict';import {selectPublicRecords,mergeLocalRecords} from './recovery.mjs';
const boards={easy:[{nickname:'bmw_dino',score:143}],normal:[{nickname:'BMW_DINO',score:35}],hard:[],extreme:[]};
test('find public records for explicit nickname',()=>assert.deepEqual(selectPublicRecords(boards,'bmw_dino'),{found:true,records:[143,35,0,0]}));
test('unknown profile',()=>assert.deepEqual(selectPublicRecords(boards,'other'),{found:false,records:[0,0,0,0]}));
test('preserve higher local scores',()=>assert.deepEqual(mergeLocalRecords([200,0,5,0],[143,35,0,0]),[200,35,5,0]));
test('reject malformed inputs',()=>{assert.throws(()=>selectPublicRecords(boards,'x'));assert.throws(()=>selectPublicRecords({},'bmw_dino'));assert.throws(()=>mergeLocalRecords([1,2,3,4],[1,2,-1,4]));});
test('fresh decision does not mutate old records',()=>{const old=[143,35,0,0],fresh=mergeLocalRecords([0,0,0,0],[0,0,0,0]);assert.deepEqual(fresh,[0,0,0,0]);assert.deepEqual(old,[143,35,0,0]);});
