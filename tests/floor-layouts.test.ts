import test from 'node:test';
import assert from 'node:assert/strict';
import { BREAK_SEATS, BREAK_TABLES, BREAK_SOFAS } from '../src/shared/break-layout.js';
import { STUDY_PLAN, STUDY_DESKS, STUDY_READING_DESKS } from '../src/shared/study-plan.js';
import { seatHereOn } from '../src/shared/maps/index.js';
import { builtinFloor, BREAK } from '../src/shared/builtin-floors.js';
import { seatPlace } from '../src/shared/layout.js';

test('all 24 drawn dining chairs and six couch places are valid shared seats facing inward', () => {
  assert.equal(BREAK_TABLES.length, 6);
  assert.equal(BREAK_SEATS.reduce((n, s) => n + s.places.length, 0), 30);
  BREAK_TABLES.forEach((table, i) => {
    for (const side of [-1, 1]) {
      const id = `break-dining-${i}${side === 1 ? '-south' : ''}`;
      for (const place of [0, 1]) {
        const seat = seatHereOn(builtinFloor(BREAK)!.plan, `${id}:${place}`, false)!;
        assert.ok(Math.abs(seat.z - (table.z + side * 1.35)) < 1e-6);
        assert.ok(Math.cos(seat.rotY) * side < 0);
        assert.ok(Math.abs(Math.abs(seat.x - table.x) - .75) < 1e-6);
      }
    }
  });
  BREAK_SOFAS.forEach((s, i) => assert.equal(Math.round(Math.cos(BREAK_SEATS[i].rotY)), s.direction));
});

test('nine classroom desks face the north whiteboard and all four reading desks have matching seats', () => {
  assert.equal(STUDY_DESKS.length, 9);
  assert.equal(STUDY_READING_DESKS.length, 4);
  for (const d of [...STUDY_DESKS, ...STUDY_READING_DESKS]) {
    const seat = seatPlace(STUDY_PLAN.seatingById.get(d.id)!, 0);
    assert.equal(seat.x, d.x);
    assert.ok(seat.z > d.z);
    assert.equal(seat.rotY, Math.PI);
    assert.ok(seatHereOn(STUDY_PLAN, seat.key, false));
  }
  assert.equal(new Set(STUDY_PLAN.seating.map(s => s.id)).size, 13);
});
