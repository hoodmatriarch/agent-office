import { MENU, Shift, type Food, type Role } from './engine';
import { el, button } from './dom';
import './style.css';

/** The same game mounts inside the office or in its standalone entry, with no office dependency. */
export function mountKitchen(host: HTMLElement, onScore: (score: { money: number; served: number; lost: number; role: Role; level: number }) => void = () => {}) {
  const root = el('section', '', 'rush'); host.append(root);
  let shift: Shift | null = null, voice = false, finished = false, pressing = false;
  const pressed = () => { pressing = true; };
  const released = () => { pressing = false; };
  root.addEventListener('pointerdown', pressed); window.addEventListener('pointerup', released);
  const status = el('div', '', 'rush-status'), customers = el('div', '', 'rush-customers'), work = el('div', '', 'rush-work'), banter = el('p', '', 'rush-banter');
  const toolbar = el('div', '', 'rush-tools');
  const say = (text: string) => { if (voice && 'speechSynthesis' in window) { const speech = new SpeechSynthesisUtterance(text); speech.volume = .45; speech.rate = 1; window.speechSynthesis.speak(speech); } };
  function start(role: Role, level = 1) { shift = new Shift(role, level); finished = false; render(); }
  function intro() {
    root.replaceChildren(el('span', 'BREAKROOM RUSH · ORIGINAL KITCHEN GAME', 'rush-kicker'), el('h2', 'Small kitchen. Big lunch rush.'),
      el('p', 'Choose a 2-minute volunteer shift. Serve the right order before patience runs out. Faster service earns tips; wasted food costs $2.'),
      el('h3', '☕ Mae · cashier & barista'), el('p', 'Brew coffee, serve cabinet sandwiches and drinks, send hot-food tickets to Gus, deliver his plates, and click the coins to collect payment.'),
      button('Play as barista', () => start('barista')), el('h3', '🍳 Gus · chef'), el('p', 'Read the order line, load three cooking stations, turn burgers and hotdogs halfway through, then plate before food burns. Mae serves your plates and collects payment.'),
      button('Play as chef', () => start('chef')), el('p', 'This is an original time-management game with original staff and dialogue. No outside accounts required.'));
  }
  function render() {
    if (!shift) return intro();
    const game = shift;
    if (game.ended) {
      if (!finished) { finished = true; onScore({ money: game.money, served: game.served, lost: game.lost, role: game.role, level: game.level }); }
      root.replaceChildren(el('h2', game.won ? '🎉 Shift complete — goal reached!' : '☕ Shift complete — try another apron'), el('p', `$${game.money} of $${game.goal} · ${game.served} customers served · ${game.lost} left · ${game.waste} wasted`),
        button(game.won ? 'Next shift' : 'Try again', () => start(game.role, game.won ? game.level + 1 : game.level)), button('Choose another role', () => { shift = null; intro(); })); return;
    }
    root.replaceChildren(el('span', `BREAKROOM RUSH · ${game.role.toUpperCase()} · SHIFT ${game.level}`, 'rush-kicker'), status, toolbar, customers, work, banter);
    status.textContent = `${Math.ceil(120 - game.elapsed)} seconds · $${game.money} / $${game.goal} · Served ${game.served} · Lost ${game.lost}`;
    toolbar.replaceChildren(button(game.paused ? 'Resume shift' : 'Pause shift', () => { game.paused = !game.paused; render(); }), button('Hurry up!', () => { say(game.hurry()); render(); }), button(voice ? 'Banter audio: on' : 'Banter audio: off', () => { voice = !voice; render(); }), button('Leave shift', () => { shift = null; intro(); }));
    banter.textContent = game.line;
    customers.replaceChildren();
    for (const customer of game.customers) {
      const card = el('article', '', 'rush-customer'); card.append(el('h3', `👤 ${customer.name}`));
      const meter = el('progress'); meter.max = customer.maximum; meter.value = customer.paid ? customer.maximum : customer.patience; meter.setAttribute('aria-label', `${customer.name} patience`); card.append(meter);
      if (customer.paid) card.append(button(`🪙 Collect $${customer.foods.reduce((s, f) => s + MENU[f].price, 0) + customer.patience}`, () => { game.collect(customer.id); render(); }));
      else {
        for (const food of customer.foods) {
          const delivered = customer.delivered.includes(food), cooked = ['burger', 'hotdog', 'meal'].includes(food);
          const ready = food === 'coffee' ? game.coffeeReady > 0 : cooked ? game.plates.includes(food) : true;
          card.append(button(`${delivered ? '✓' : MENU[food].icon} ${MENU[food].name}${delivered ? ' served' : ' — serve'}`, () => { game.serve(customer.id, food); render(); }, delivered || !ready || game.role === 'chef'));
        }
        if (game.role === 'barista' && customer.foods.some(f => ['burger', 'hotdog', 'meal'].includes(f))) card.append(button(customer.ticket ? 'Ticket sent to Gus' : 'Send ticket to chef', () => { game.sendTicket(customer.id); render(); }, customer.ticket));
      }
      customers.append(card);
    }
    work.replaceChildren();
    if (game.role === 'barista') {
      const coffee = el('article', '', 'rush-station'); coffee.append(el('h3', '☕ Espresso machine'), el('p', game.coffee > 0 ? `Grinding → brewing → pouring… ${Math.round(game.coffee / 5 * 100)}%` : `${game.coffeeReady} fresh coffees ready`), button('Grind, brew & pour coffee', () => { game.brew(); render(); }, game.coffee > 0 || game.coffeeReady >= 3));
      const pass = el('article', '', 'rush-station'); pass.append(el('h3', '🍽️ Chef’s serving pass'), el('p', game.plates.length ? game.plates.map(f => MENU[f].icon + ' ' + MENU[f].name).join(' · ') : 'Send a hot-food ticket. Gus will cook it.'), el('p', 'Sandwiches and soft drinks are ready in the cabinet. Serve them directly from the customer’s order.')); work.append(coffee, pass);
    } else {
      for (let i = 0; i < game.pans.length; i++) {
        const pan = game.pans[i], card = el('article', '', 'rush-station'); card.append(el('h3', `Cooking station ${i + 1}`));
        if (!pan.food) for (const food of ['burger', 'hotdog', 'meal'] as Food[]) card.append(button(`${MENU[food].icon} Start ${MENU[food].name}`, () => { game.cook(i, food); render(); }));
        else {
          const burnt = pan.time >= MENU[pan.food].time + 7;
          card.append(el('p', `${MENU[pan.food].icon} ${MENU[pan.food].name} · ${burnt ? 'BURNT' : game.ready(i) ? 'READY — plate now!' : 'Cooking'} · ${pan.time.toFixed(1)}s`));
          const meter = el('progress'); meter.max = MENU[pan.food].time + 7; meter.value = pan.time; card.append(meter);
          card.append(button(pan.turned ? 'Turned / stirred ✓' : 'Turn halfway through', () => { game.turn(i); render(); }, pan.turned || pan.time < MENU[pan.food].time / 2 || burnt), button('Assemble & hand to Mae', () => { game.plate(i); render(); }, !game.ready(i)), button('Bin food (−$2)', () => { game.bin(i); render(); }));
        }
        work.append(card);
      }
    }
  }
  const timer = window.setInterval(() => { if (shift && !document.hidden) { shift.tick(.25); if (!pressing) render(); } }, 250);
  intro();
  return () => { clearInterval(timer); window.removeEventListener('pointerup', released); if (voice) window.speechSynthesis?.cancel(); root.remove(); };
}
