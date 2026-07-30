import { test } from 'node:test';
import assert from 'node:assert';
import { SessionPersistence } from '../../js/engine/05-session-persistence.js';

test('session-persistence-save-and-load', () => {
  const sp = new SessionPersistence('TEST_PERSIST_');
  const state = { hero: { gold: 100, level: 2 } };
  sp.save(state);
  const loaded = sp.load();
  assert.deepStrictEqual(loaded, state);
  sp.clear();
  assert.strictEqual(sp.load(), null);
});
