import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sanitizeSurprise,validSessionUser} from '../lib/usServer.mjs';
const source=await readFile(new URL('../app/api/us-calendar/route.js',import.meta.url),'utf8');
async function calendar(session,item,accounts={}){
 const kv={get:async key=>key==='us:auth:users'?accounts:session,hget:async()=>item};
 globalThis.__calendarDeps={kv,sanitizeSurprise,validSessionUser};
 const code=source.replace('import {kv} from "@vercel/kv";','const {kv}=globalThis.__calendarDeps;').replace('import {sanitizeSurprise,validSessionUser} from "../../../lib/usServer.mjs";','const {sanitizeSurprise,validSessionUser}=globalThis.__calendarDeps;');
 const {GET}=await import('data:text/javascript;base64,'+Buffer.from(code+'\n// '+Math.random()).toString('base64'));
 return GET({url:'https://us.test/api/us-calendar?id=trip',cookies:{get:()=>({value:'session'})}});
}
const session=user=>({user,createdAt:Date.now()-1000,expiresAt:Date.now()+60000});
const trip={id:'trip',title:'Secret hotel',planDate:'2026-12-01',planTime:'19:00',location:'Private place',planNotes:'Private note',isSurprise:true,surprise:{creator:'Charlie',date:'2026-12-01',time:'19:00',revealAt:'2099-01-01T00:00:00Z'}};
test('locked recipient calendar export cannot reveal hidden data',async()=>{
 const response=await calendar(session('Tayla'),trip);
 assert.equal(response.status,403);assert.equal((await response.text()).includes('Secret hotel'),false);
 assert.match(response.headers.get('cache-control'),/no-store/);
});
test('creator and revealed recipient calendar uses Dubai time and escapes line injection',async()=>{
 const item={...trip,title:'Hotel\r\nATTENDEE:intruder',surprise:{...trip.surprise,revealedAt:new Date().toISOString()}};
 for(const user of ['Charlie','Tayla']){
  const response=await calendar(session(user),item);assert.equal(response.status,200);
  const text=await response.text();assert.match(text,/DTSTART:20261201T150000Z/);assert.equal(text.includes('\r\nATTENDEE:'),false);
 }
});
test('calendar rejects forged, expired and revoked sessions',async()=>{
 assert.equal((await calendar(session('Visitor'),trip)).status,401);
 assert.equal((await calendar({...session('Charlie'),expiresAt:0},trip)).status,401);
 assert.equal((await calendar(session('Charlie'),trip,{Charlie:{sessionsRevokedAt:Date.now()}})).status,401);
});
