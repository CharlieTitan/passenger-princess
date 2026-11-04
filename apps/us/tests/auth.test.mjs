import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import crypto from 'node:crypto';
const source=await readFile(new URL('../app/api/us-auth/route.js',import.meta.url),'utf8');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
async function setup(accounts={Charlie:{passwordHash:hash('existing-password'),recoveryHash:hash('recovery-code')},Tayla:{passwordHash:hash('other-password'),recoveryHash:hash('other-code')}}){
 const values=new Map([['us:auth:users',JSON.stringify(accounts)]]);let beforeEval=null;
 const kv={get:async k=>values.get(k),set:async(k,v,opts)=>{if(!opts?.nx||!values.has(k))values.set(k,v);},del:async k=>values.delete(k),incr:async k=>{const n=(values.get(k)||0)+1;values.set(k,n);return n;},expire:async()=>{},eval:async(s,[k],[old,next])=>{if(beforeEval){const f=beforeEval;beforeEval=null;await f();}if(values.get(k)!==old)return 0;values.set(k,next);return 1;}};
 globalThis.__authKV=kv;
 const code=source.replace('import { kv } from "@vercel/kv";','const kv=globalThis.__authKV;');
 const {POST}=await import('data:text/javascript;base64,'+Buffer.from(code+'\n// '+Math.random()).toString('base64'));
 const call=(body,sid,origin='https://us.test')=>POST({url:'https://us.test/api/us-auth',headers:new Headers({origin}),cookies:{get:()=>sid?{value:sid}:null},json:async()=>body});
 return {values,call,concurrent:f=>beforeEval=f};
}
test('existing accounts keep working, unknown users fail and logout revokes the session',async()=>{
 const {call,values}=await setup();const r=await call({action:'login',username:'Charlie',password:'existing-password'});assert.equal(r.status,200);
 const sid=r.headers.get('set-cookie').match(/us_session=([^;]+)/)[1];assert.ok(values.has('us:session:'+sid));
 assert.equal((await call({action:'login',username:'Visitor',password:'existing-password'})).status,401);
 assert.equal((await call({action:'logout'},sid)).status,200);assert.equal(values.has('us:session:'+sid),false);
 assert.equal((await call({action:'login',username:'Charlie',password:'existing-password'},null,'https://attacker.test')).status,403);
});
test('recovery uses strong hashing, revokes old sessions and retains concurrent account updates',async()=>{
 const {call,values,concurrent}=await setup();
 concurrent(async()=>{const a=JSON.parse(values.get('us:auth:users'));a.Tayla.passwordHash=hash('concurrently-recovered');a.Tayla.sessionsRevokedAt=100;values.set('us:auth:users',JSON.stringify(a));});
 const r=await call({action:'recover',username:'Charlie',recoveryCode:'recovery-code',newPassword:'new-long-password'});assert.equal(r.status,200);
 const a=JSON.parse(values.get('us:auth:users'));assert.match(a.Charlie.passwordHash,/^scrypt:/);assert.ok(a.Charlie.sessionsRevokedAt);assert.equal(a.Tayla.passwordHash,hash('concurrently-recovered'));assert.equal(a.Tayla.sessionsRevokedAt,100);
 assert.equal((await call({action:'login',username:'Charlie',password:'existing-password'})).status,401);
 assert.equal((await call({action:'login',username:'Charlie',password:'new-long-password'})).status,200);
});
test('login attempts are limited',async()=>{const {call}=await setup();for(let i=0;i<20;i++)assert.equal((await call({action:'login',username:'Tayla',password:'wrong'})).status,401);assert.equal((await call({action:'login',username:'Tayla',password:'wrong'})).status,429);});
