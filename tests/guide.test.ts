import test from 'node:test';
import assert from 'node:assert/strict';
import { officeNav } from '../src/shared/nav.js';
import { findLessons, lessonById, LESSONS, TOUR } from '../src/client/features/guide/lessons.js';
import { GuideWalker } from '../src/client/features/guide/walker.js';

test('Pip understands everyday searches and gives a useful first explanation', () => {
  assert.equal(findLessons('what is a pull request?')[0].id, 'pulls');
  assert.equal(findLessons('first task')[0].id, 'start');
  assert.equal(findLessons('explain an error')[0].id, 'terminal');
  assert.equal(findLessons('')[0].id, 'start');
  assert.equal(findLessons('banana spaceship').length, 0);
  assert.equal(lessonById('unknown').id, 'start');
  assert.equal(new Set(LESSONS.map(lesson => lesson.id)).size, LESSONS.length);
});

test('every tour stop is reachable around furniture, without teleporting the guide', () => {
  const nav = officeNav(0);
  const walker = new GuideWalker();
  for (const id of TOUR) {
    const target = lessonById(id).at!;
    const expected = nav.route(walker.at, target).at(-1)!;
    walker.go(nav, target);
    let ticks = 0;
    while (walker.walking && ticks++ < 4000) {
      const before = [...walker.at];
      walker.update(0.1);
      assert.ok(Math.hypot(walker.at[0] - before[0], walker.at[1] - before[1]) <= 0.141);
      assert.ok(nav.walkable(...walker.at), `${id}: stepped into furniture at ${walker.at}`);
    }
    assert.ok(ticks < 4000, `${id} never reached its stop`);
    assert.deepEqual(walker.at, expected);
  }
});

test('ending a tour stops motion without moving the guide to another point', () => {
  const walker = new GuideWalker();
  walker.go(officeNav(0), [-11.7, -10]); walker.update(0.1);
  const at = [...walker.at]; walker.stop();
  assert.equal(walker.walking, false);
  walker.update(0.1); assert.deepEqual(walker.at, at);
});
