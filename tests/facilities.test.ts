import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Facilities } from '../src/server/facilities.js';
import { Shift } from '../src/client/games/kitchen/engine.js';
import { findLessons } from '../src/client/features/guide/lessons.js';
import { View } from '../src/client/core/registry.js';

test('a separate facility view skips hidden rendering while feature updates still run', () => {
  const view = new View(); let updates = 0, renders = 0, open = true;
  const off = view.add({ suspendsScene: () => open, update: () => updates++ });
  view.update(); view.draw({} as never, () => renders++);
  assert.equal(updates, 1); assert.equal(renders, 0);
  open = false; view.draw({} as never, () => renders++);
  assert.equal(renders, 1); off(); assert.equal(view.suspended(), false);
});

test('facility files persist, stay inside the vault, and are isolated per sign-in', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'office-facilities-'));
  try {
    const first = new Facilities(dir, 'first'), second = new Facilities(dir, 'second');
    const asset = first.upload('../../notes.txt', Buffer.from('My book'));
    assert.equal(asset.name, 'notes.txt');
    assert.equal(new Facilities(dir, 'first').file(asset.id)?.body.toString(), 'My book');
    assert.equal(second.file(asset.id), null);
    assert.equal(first.file('../../config'), null);
    assert.equal(first.put('locker', 0, { items: 'coat' })?.revision, 1);
    assert.equal(first.put('locker', 0, { items: 'stale overwrite' }), null);
    assert.deepEqual(new Facilities(dir, 'first').get('locker'), { revision: 1, value: { items: 'coat' } });
    assert.deepEqual(second.get('locker'), { revision: 0, value: null });
    assert.throws(() => first.upload('bad.pdf', Buffer.from('not a PDF')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('chef cannot plate raw, unturned or burnt food, and barista takes valid tickets', () => {
  const chef = new Shift('chef', 1, () => .2);
  assert.ok(chef.cook(0, 'burger')); assert.equal(chef.plate(0), false);
  for (let i = 0; i < 7; i++) chef.tick(1);
  assert.equal(chef.ready(0), false); chef.turn(0); assert.equal(chef.ready(0), true); assert.ok(chef.plate(0));
  chef.cook(1, 'hotdog'); for (let i = 0; i < 13; i++) chef.tick(1); chef.turn(1); assert.equal(chef.plate(1), false); chef.bin(1); assert.equal(chef.waste, 1);
  const barista = new Shift('barista', 1, () => .2), customer = barista.customers[0];
  assert.equal(customer.foods[0], 'burger'); assert.equal(barista.serve(customer.id, 'burger'), false);
  barista.sendTicket(customer.id); for (let i = 0; i < 12; i++) barista.tick(1);
  assert.ok(barista.plates.includes('burger')); assert.ok(barista.serve(customer.id, 'burger')); assert.ok(barista.collect(customer.id)); assert.ok(barista.money >= 9);
  assert.equal(barista.collect(customer.id), false);
});
test('shifts pause, expire, award fast-service tips and answer hurry requests', () => {
  const shift = new Shift('barista', 1, () => .55); const customer = shift.customers[0];
  assert.equal(customer.foods[0], 'soda'); assert.ok(shift.serve(customer.id, 'soda')); shift.collect(customer.id); assert.equal(shift.money, 7);
  shift.paused = true; shift.tick(1); assert.equal(shift.elapsed, 0); shift.paused = false;
  for (let i = 0; i < 125; i++) shift.tick(1); assert.equal(shift.elapsed, 120); assert.ok(shift.ended); assert.ok(shift.lost > 0);
  assert.match(shift.hurry(), /Gus:/);
});
test('Pip teaches GitHub and recognizes questions about the new facilities', () => {
  assert.equal(findLessons('what is github')[0].id, 'git-start');
  assert.equal(findLessons('how do I upload books')[0].id, 'library');
  assert.equal(findLessons('how do I save a drawing')[0].id, 'studio');
  assert.equal(findLessons('banana spaceship').length, 0);
});
