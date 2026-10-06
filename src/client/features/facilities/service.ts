import { h, toast } from '../../ui/dom';
import { MENU, Shift, type Food } from '../../games/kitchen/engine';
import { mountKitchen } from '../../games/kitchen/ui';
import { Collection } from './data';
import { action, panel, closeCleanup } from './panels';
interface Order { id: string; food: Food; readyAt: number; served: boolean; eaten: boolean }
interface Score { money: number; served: number; lost: number; role: string; level: number }
export class FoodService {
  readonly data = new Collection<{ orders: Order[]; scores: Score[] }>('kitchen', { orders: [], scores: [] });
  constructor(private readonly tray: (text: string) => void) {}
  updateTray() { this.tray(this.data.value.orders.filter(order => order.served && !order.eaten).map(order => MENU[order.food].icon + ' ' + MENU[order.food].name).join(', ')); }
  async open(vending = false) {
    await this.data.load(); this.updateTray(); const { body, modal } = panel(vending ? '🥤 Vending machine' : '☕ Mae & Gus · food and drink service', true);
    const queue = h('div.fac-grid');
    const render = () => {
      queue.replaceChildren(...this.data.value.orders.filter(order => !order.eaten).map(order => {
        const ready = Date.now() >= order.readyAt;
        return h('article.fac-card', {}, h('h3', {}, `${MENU[order.food].icon} ${MENU[order.food].name}`), h('p', {}, order.served ? 'On your tray · take a seat to eat' : ready ? 'Ready at the counter' : `${order.food === 'coffee' ? 'Mae is brewing' : 'Gus is cooking'} · ${Math.ceil((order.readyAt - Date.now()) / 1000)} seconds`), action('Pick up order', async () => { order.served = true; await this.data.save(); this.updateTray(); render(); }, false));
      }));
      Array.from(queue.children).forEach((card, i) => { const order = this.data.value.orders.filter(o => !o.eaten)[i]; const button = card.querySelector('button'); if (button) button.disabled = order.served || Date.now() < order.readyAt; });
    };
    body.append(h('p', {}, vending ? 'Ready-made drinks and sandwiches. Take them to a dining table or the lounge.' : 'Mae takes your order and makes coffee; Gus cooks the hot food. These are virtual office meals. The starting menu is ready to expand later.'), h('div.fac-toolbar', {}, ...(Object.keys(MENU) as Food[]).filter(food => !vending || ['soda', 'sandwich'].includes(food)).map(food => action(`${MENU[food].icon} Order ${MENU[food].name}`, async () => {
      if (this.data.value.orders.filter(o => !o.eaten).length >= 12) throw new Error('Enjoy the food on your tray before ordering more.');
      this.data.value.orders.push({ id: crypto.randomUUID(), food, readyAt: Date.now() + (food === 'coffee' ? 5000 : MENU[food].time * 1000), served: false, eaten: false }); await this.data.save(); render();
    }))), queue, action('Ask the kitchen to hurry', () => { const game = new Shift('barista'); toast(game.hurry()); }));
    const interval = window.setInterval(() => { for (const [i, card] of Array.from(queue.children).entries()) { const order = this.data.value.orders.filter(o => !o.eaten)[i]; if (!order || order.served) continue; const p = card.querySelector('p'), button = card.querySelector('button'); const ready = Date.now() >= order.readyAt; if (p) p.textContent = ready ? 'Ready at the counter' : `${order.food === 'coffee' ? 'Mae is brewing' : 'Gus is cooking'} · ${Math.ceil((order.readyAt - Date.now()) / 1000)} seconds`; if (button) button.disabled = !ready; } }, 500);
    closeCleanup(modal, () => clearInterval(interval)); render();
  }
  async eat(read: () => void | Promise<void>) {
    await this.data.load(); const { body } = panel('🛋️ Seated · enjoy your break');
    const food = this.data.value.orders.filter(o => o.served && !o.eaten);
    body.append(h('p', {}, food.length ? `On your tray: ${food.map(o => MENU[o.food].name).join(', ')}` : 'Take a breath. Order food at the counter, bring a book from the library, or enjoy the view.'), action('Eat / drink what’s on my tray', async () => { if (!food.length) return toast('Your tray is empty.'); for (const o of food) o.eaten = true; this.data.value.orders = this.data.value.orders.slice(-60); await this.data.save(); this.updateTray(); toast('Enjoyed your break. Mae will take your dishes.'); }), action('Read the book I’m carrying', read));
  }
  async volunteer() {
    await this.data.load(); const { body, modal } = panel('🍳 Volunteer · Breakroom Rush', true);
    const dispose = mountKitchen(body, score => { this.data.value.scores.unshift(score); this.data.value.scores = this.data.value.scores.slice(0, 40); void this.data.save().catch(error => toast((error as Error).message, 'error')); });
    closeCleanup(modal, dispose);
    if (this.data.value.scores.length) body.append(h('p.fac-note', {}, `Best shift: $${Math.max(...this.data.value.scores.map(s => s.money))} · ${this.data.value.scores.length} saved shifts`));
  }
}
