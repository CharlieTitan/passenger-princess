import test from 'node:test';
import assert from 'node:assert/strict';
import {createSyncGuard} from '../lib/syncGuard.mjs';
test('a read begun before a mutation cannot replace the saved value',()=>{
  const guard=createSyncGuard();const old=guard.beginRead();const finish=guard.beginMutation();
  assert.equal(guard.accepts(old),false);finish();assert.equal(guard.accepts(old),false);
  assert.equal(guard.accepts(guard.beginRead()),true);
});
test('concurrent writes keep reads paused until all have completed',()=>{
  const guard=createSyncGuard();const a=guard.beginMutation(),b=guard.beginMutation();a();
  assert.equal(guard.busy(),true);assert.equal(guard.accepts(guard.beginRead()),false);
  b();assert.equal(guard.busy(),false);assert.equal(guard.accepts(guard.beginRead()),true);
});
test('logout and newer reads invalidate all earlier responses',()=>{
  const guard=createSyncGuard();const earlier=guard.beginRead();const latest=guard.beginRead();
  assert.equal(guard.accepts(earlier),false);assert.equal(guard.accepts(latest),true);
  guard.reset();assert.equal(guard.accepts(latest),false);
});
