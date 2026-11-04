import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('service worker caches public assets only and never handles private API responses',async()=>{
 const source=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
 const handlers={},writes=[],network=[];
 const context={self:{location:{origin:'https://us.test'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},URL,Promise,caches:{open:async()=>({addAll:async urls=>writes.push(...urls)}),keys:async()=>['us-old'],delete:async()=>true,match:async()=>null},fetch:async(req,opts)=>{network.push({req,opts});throw Error('offline');}};
 vm.runInNewContext(source,context);
 await new Promise((resolve,reject)=>handlers.install({waitUntil:p=>p.then(resolve,reject)}));
 assert.ok(writes.includes('/offline.html'));
 assert.equal(writes.some(url=>url==='/'||url.startsWith('/api')||url==='/memories'),false);
 let handled=false;
 handlers.fetch({request:{url:'https://us.test/api/us',method:'GET',mode:'cors'},respondWith:()=>handled=true});
 assert.equal(handled,false);
 let response;
 handlers.fetch({request:{url:'https://us.test/memories',method:'GET',mode:'navigate'},respondWith:p=>response=p});
 await response;
 assert.equal(network[0].opts.cache,'no-store');
});
test('install icons have their advertised PNG dimensions',async()=>{
 for(const [name,size] of [['icon-192.png',192],['icon-512.png',512],['apple-touch-icon.png',180]]){
  const data=await readFile(new URL('../public/'+name,import.meta.url));
  assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(data.readUInt32BE(16),size);assert.equal(data.readUInt32BE(20),size);
 }
});
