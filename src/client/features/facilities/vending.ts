import { h, toast } from '../../ui/dom';
import { Collection } from './data';
import { action, panel } from './panels';
export const VENDING_ITEMS = [
  { code: 'A1', name: 'Bottled water', icon: '💧', price: 2 },
  { code: 'A2', name: 'Cola can', icon: '🥤', price: 3 },
  { code: 'A3', name: 'Sparkling water', icon: '🫧', price: 3 },
  { code: 'B1', name: 'Potato chips', icon: '🥔', price: 3 },
  { code: 'B2', name: 'Chocolate bar', icon: '🍫', price: 3 },
  { code: 'B3', name: 'Trail mix', icon: '🥜', price: 4 },
] as const;
interface Stock { stock: Record<string, number>; collected: string[] }
export class VendingMachine {
  private data = new Collection<Stock>('vending', { stock: Object.fromEntries(VENDING_ITEMS.map(i => [i.code, 8])), collected: [] });
  async open() {
    await this.data.load(); const { body } = panel('🥤 Vending machine');
    const display = h('p', {}, 'Select a code. Prices are pretend office credits; no real payments.'), list = h('div.fac-grid');
    const render = () => list.replaceChildren(...VENDING_ITEMS.map(item => {
      const count = this.data.value.stock[item.code] ?? 0;
      const button = action(`${item.code} · ${item.icon} ${item.name} · ${item.price} credits`, async () => {
        if (!this.data.value.stock[item.code]) throw new Error('Sold out. Ask Leon to restock.');
        this.data.value.stock[item.code]--; this.data.value.collected.push(item.name); await this.data.save();
        display.textContent = `${item.icon} ${item.name} drops into the collection tray.`; render();
      }); button.disabled = count === 0;
      return h('article.fac-card', {}, button, h('small', {}, `${count} left`));
    }));
    body.append(display, list, action('Collect from vending tray', async () => {
      if (!this.data.value.collected.length) return toast('The collection tray is empty.');
      toast(`Collected: ${this.data.value.collected.join(', ')}. Enjoy your snack!`);
      this.data.value.collected = []; await this.data.save(); display.textContent = 'Collection tray empty.';
    }), action('Ask Leon to restock', async () => { for (const item of VENDING_ITEMS) this.data.value.stock[item.code] = 8; await this.data.save(); render(); toast('Leon: Eight of everything. Try not to call that a balanced diet.'); })); render();
  }
}
