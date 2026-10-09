import test from 'node:test';
import assert from 'node:assert/strict';
import { dictionaryLookup, dictionaryWord } from '../src/server/studios/dictionary.js';

test('dictionary lookup accepts English words and rejects URLs, control characters and oversized input', () => {
  assert.equal(dictionaryWord('  Mother-in-law  '), 'mother-in-law');
  assert.equal(dictionaryWord("writer's block"), "writer's block");
  for (const value of ['', 'https://example.com', '../config', 'a\nb', 'x'.repeat(81)]) assert.throws(() => dictionaryWord(value));
});
test('dictionary uses one fixed remote host, caches entries and reports missing or malformed responses', async () => {
  const original = globalThis.fetch; let calls = 0;
  const entries = [{ word: 'parchment', meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'A writing material.' }] }] }];
  globalThis.fetch = async (url, init) => { calls++; assert.equal(String(url), 'https://api.dictionaryapi.dev/api/v2/entries/en/parchment'); assert.equal(init?.redirect, 'error'); assert.ok(init?.signal); return new Response(JSON.stringify(entries)); };
  try {
    assert.deepEqual(await dictionaryLookup('parchment'), entries); assert.deepEqual(await dictionaryLookup('PARCHMENT'), entries); assert.equal(calls, 1);
    globalThis.fetch = async () => new Response('{}', { status: 404 }); assert.equal(await dictionaryLookup('unfindable'), null);
    globalThis.fetch = async () => new Response('{}'); await assert.rejects(dictionaryLookup('invalid'), /unreadable/);
    globalThis.fetch = async () => new Response('{}', { status: 503 }); await assert.rejects(dictionaryLookup('unavailable'), /unavailable/);
  } finally { globalThis.fetch = original; }
});
