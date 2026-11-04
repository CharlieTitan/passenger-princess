import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSyncGuard} from '../lib/syncGuard.mjs';
const source=await readFile(new URL('../app/components/useSharedSync.js',import.meta.url),'utf8');
async function loadWrapper(){
 globalThis.__createSyncGuard=createSyncGuard;
 const code=source.replace('import {useCallback,useEffect,useRef} from "react";','const useCallback=f=>f,useEffect=()=>{},useRef=value=>({current:value});').replace('import {createSyncGuard} from "../../lib/syncGuard.mjs";','const createSyncGuard=globalThis.__createSyncGuard;')+'\nexport const testGuard=guard;\n// '+Math.random();
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
test('writes remain guarded while response body streams and release after JSON consumption',async()=>{
 const original=globalThis.fetch;
 try{
  let stream;
  globalThis.fetch=async()=>new Response(new ReadableStream({start(controller){stream=controller;}}));
  const {sharedFetch,testGuard}=await loadWrapper();
  const request=sharedFetch('/api/us',{method:'PATCH',body:'{}'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(testGuard.busy(),true);
  stream.enqueue(new TextEncoder().encode('{"ok":true}'));stream.close();
  const response=await request;
  assert.equal(testGuard.busy(),true);
  assert.deepEqual(await response.json(),{ok:true});assert.equal(testGuard.busy(),false);
 }finally{globalThis.fetch=original;}
});
test('logout invalidates JSON from a response received in the old session',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>Response.json({items:[{title:'Private'}]});
  const {sharedFetch,useSharedSync}=await loadWrapper();
  const response=await sharedFetch('/api/us');
  useSharedSync({user:null,onData:()=>{},onExpired:()=>{}}).reset();
  await assert.rejects(()=>response.json(),{name:'AbortError'});
 }finally{globalThis.fetch=original;}
});
