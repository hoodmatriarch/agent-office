import type { Ctx } from '../../core/context';
import type { Parts } from '../../core/parts';
import { hintTitle, key, onE } from '../../core/hint';
import { noOutline } from '../../core/outline';
import { store } from '../../state';
import { h, modalOpen, toast } from '../../ui/dom';
import { lessonById, TOUR, type Lesson } from './lessons';
import { GuideHelp, GuideTourCard, type GuideActions } from './ui';
import { GuideWalker } from './walker';
import { GuideBot } from './world';
import { guideAccess } from './access';

declare module '../../world/types' {
  interface InteractKinds {
    guide: true;
  }
}

/** Pip is a local guide, not a coding worker: no subscriptions, API calls, or project edits. */
export function installGuide(ctx: Ctx, deps: Pick<Parts, 'walking'>) {
  const bot = new GuideBot();
  const walker = new GuideWalker();
  ctx.scene.add(bot.root); noOutline(bot.root);
  bot.root.visible = false;
  let tour = -1;
  let arrived = false;
  let waiting = false;
  let roam = 0;
  let pause = 4;
  let floor: string | null = null;
  const available = () => ctx.inOffice() && !ctx.upTop() && !ctx.trip() && !!store.floor;
  const go = (lesson: Lesson) => {
    if (lesson.at) walker.go(ctx.world().nav, lesson.at);
    arrived = false; waiting = false;
    bot.say(`This way: ${lesson.title.split(':')[0]}`);
  };
  const endTour = () => {
    tour = -1; walker.stop(); pause = 6; arrived = false; waiting = false;
    card.update(-1, false);
    bot.say('Ask me anything about this office');
  };
  const actions: GuideActions = {
    canTour: available,
    current: () => tour,
    start: () => {
      if (!available()) return;
      tour = 0; go(lessonById(TOUR[tour])); card.update(tour, false);
      toast('🤖 Follow Pip. Press E near him to learn about each stop, or F2 for help.');
    },
    next: () => {
      if (!available()) return endTour();
      if (++tour >= TOUR.length) { endTour(); toast('🤖 Tour complete! F2 brings me back whenever you need help.'); return; }
      go(lessonById(TOUR[tour])); card.update(tour, false);
    },
    stop: endTour,
    visit: lesson => {
      if (!available() || !lesson.at) return;
      if (tour >= 0 && lesson.id !== TOUR[tour]) endTour();
      go(lesson);
      const path = ctx.world().nav.route(walker.at, lesson.at);
      const at = path[path.length - 1];
      deps.walking.walkThen({ x: at[0], z: at[1] }, lesson.title, () => help.show(lesson.id));
    },
  };
  const help = new GuideHelp(actions);
  const card = new GuideTourCard(actions, id => help.show(id));
  const ask = () => help.show(tour >= 0 ? TOUR[tour] : 'start');
  guideAccess.show = ask;
  const call = h('button.btn.guide-call', { type: 'button', title: 'F2 · Free office guide', 'aria-label': 'Ask Pip, your office guide' }, '🤖 Ask Pip');
  call.onclick = ask; document.body.append(call);
  ctx.usables.add({ usable: () => bot.root.visible ? [bot.interact] : [], pickable: () => bot.root });
  ctx.interactions.define('guide', {
    reach: 3.5,
    hint: () => ({ k: String(tour), parts: [hintTitle('🤖 Pip · office guide'), key('E', 'Explain this office')] }),
    use: onE(ask),
  });
  ctx.keys.bind({ code: 'F2', preventDefault: true, run: ask });
  ctx.ticks.add('others', ({ dt, t }) => {
    const active = available();
    bot.root.visible = active; bot.interact.off = !active;
    if (!active) { if (tour >= 0) endTour(); return; }
    if (floor !== store.floor) {
      floor = store.floor; endTour();
      const at = ctx.world().nav.route([7, -8], [7, -8]).at(-1)!;
      walker.at = [...at];
    }
    const player = ctx.player.pos;
    const distance = Math.hypot(player.x - walker.at[0], player.z - walker.at[1]);
    const near = distance < 2.8 && Math.abs(player.y) < 1;
    const lagging = tour >= 0 && distance > 9;
    if (lagging !== waiting) { waiting = lagging; if (tour >= 0) card.update(tour, arrived, waiting); }
    const paused = modalOpen() || document.hidden || (tour < 0 ? near : lagging);
    if (!paused) {
      if (walker.walking) {
        if (walker.update(dt)) {
          pause = 5;
          if (tour >= 0) { arrived = true; card.update(tour, true); bot.say('Press E: I’ll explain this tool'); }
        }
      } else if (tour < 0) {
        pause -= dt;
        if (pause <= 0) { roam = (roam + 1) % TOUR.length; go(lessonById(TOUR[roam])); }
      }
    }
    const walking = walker.walking && !paused;
    const yaw = near && !walking ? Math.atan2(player.x - walker.at[0], player.z - walker.at[1]) : walker.yaw;
    bot.update(walker.at[0], walker.at[1], yaw, walking, near, t);
  });
}
