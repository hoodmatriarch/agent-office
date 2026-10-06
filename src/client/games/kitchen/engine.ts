export type Food = 'coffee' | 'burger' | 'hotdog' | 'soda' | 'sandwich' | 'meal';
export type Role = 'barista' | 'chef';
export const MENU: Record<Food, { icon: string; name: string; price: number; time: number }> = {
  coffee: { icon: '☕', name: 'Coffee', price: 4, time: 4 }, burger: { icon: '🍔', name: 'Burger', price: 9, time: 7 },
  hotdog: { icon: '🌭', name: 'Hotdog', price: 6, time: 5 }, soda: { icon: '🥤', name: 'Soft drink', price: 3, time: 0 },
  sandwich: { icon: '🥪', name: 'Cabinet sandwich', price: 6, time: 0 }, meal: { icon: '🍲', name: 'Fresh cooked meal', price: 12, time: 9 },
};
export interface Customer { id: number; name: string; foods: Food[]; delivered: Food[]; patience: number; maximum: number; ticket: boolean; paid: boolean }
export interface Pan { food: Food | null; time: number; turned: boolean }
const NAMES = ['Alex', 'Robin', 'Sam', 'Jo', 'Drew', 'Morgan', 'Taylor', 'Casey'];
const COOKED: Food[] = ['burger', 'hotdog', 'meal'];
export class Shift {
  elapsed = 0; money = 0; served = 0; lost = 0; waste = 0; level: number; goal: number;
  customers: Customer[] = []; pans: Pan[] = Array.from({ length: 3 }, () => ({ food: null, time: 0, turned: false }));
  plates: Food[] = []; coffee = 0; coffeeReady = 0; paused = false; line = 'Mae: Apron on. Ego off. Let’s feed this place.';
  private clock = 0; private id = 0; private aiClock = 0;
  constructor(readonly role: Role, level = 1, private readonly random = Math.random) { this.level = level; this.goal = 45 + level * 25; this.arrive(); }
  get ended() { return this.elapsed >= 120; }
  get won() { return this.money >= this.goal; }
  tick(dt: number) {
    if (this.ended || this.paused) return;
    dt = Math.max(0, Math.min(dt, 1)); this.elapsed = Math.min(120, this.elapsed + dt); this.clock += dt; this.aiClock += dt;
    const interval = Math.max(6, 13 - this.level * 2);
    if (this.clock >= interval && this.customers.length < 5) { this.clock = 0; this.arrive(); }
    for (const pan of this.pans) if (pan.food) pan.time += dt;
    if (this.coffee > 0) { this.coffee += dt; if (this.coffee >= 5) { this.coffee = 0; this.coffeeReady++; } }
    for (const customer of [...this.customers]) {
      if (customer.paid) continue;
      customer.patience -= dt;
      if (customer.patience <= 0) { this.customers.splice(this.customers.indexOf(customer), 1); this.lost++; this.line = `${customer.name}: My lunch break has become a hunger strike.`; }
    }
    if (this.aiClock >= 1) { this.aiClock = 0; this.assist(); }
  }
  arrive() {
    const foods = Object.keys(MENU) as Food[];
    const first = foods[Math.floor(this.random() * foods.length)];
    const second = foods[Math.floor(this.random() * foods.length)];
    const maximum = Math.max(42, 85 - this.level * 8);
    this.customers.push({ id: ++this.id, name: NAMES[(this.id - 1) % NAMES.length], foods: this.level > 1 && first !== second ? [first, second] : [first], delivered: [], patience: maximum, maximum, ticket: this.role === 'chef', paid: false });
  }
  sendTicket(id: number) { const c = this.customers.find(c => c.id === id); if (c) c.ticket = true; }
  cook(index: number, food: Food): boolean {
    const pan = this.pans[index]; if (!pan || pan.food || !COOKED.includes(food)) return false;
    Object.assign(pan, { food, time: 0, turned: food === 'meal' }); return true;
  }
  ready(index: number) { const p = this.pans[index]; return !!p?.food && p.turned && p.time >= MENU[p.food].time && p.time < MENU[p.food].time + 7; }
  turn(index: number) { const p = this.pans[index]; if (p?.food && p.time >= MENU[p.food].time / 2) p.turned = true; }
  plate(index: number): boolean {
    if (!this.ready(index)) return false;
    const pan = this.pans[index]; this.plates.push(pan.food!); Object.assign(pan, { food: null, time: 0, turned: false }); return true;
  }
  bin(index: number) { const p = this.pans[index]; if (!p?.food) return; Object.assign(p, { food: null, time: 0, turned: false }); this.waste++; this.money = Math.max(0, this.money - 2); }
  brew() { if (this.coffee > 0 || this.coffeeReady >= 3) return false; this.coffee = .01; return true; }
  serve(id: number, food: Food): boolean {
    const c = this.customers.find(c => c.id === id);
    if (!c || c.paid || !c.foods.includes(food) || c.delivered.includes(food)) return false;
    if (food === 'coffee') { if (!this.coffeeReady) return false; this.coffeeReady--; }
    else if (COOKED.includes(food)) { const i = this.plates.indexOf(food); if (i < 0) return false; this.plates.splice(i, 1); }
    c.delivered.push(food);
    if (c.delivered.length === c.foods.length) { c.paid = true; c.patience = Math.ceil(c.patience / c.maximum * 4); this.served++; }
    return true;
  }
  collect(id: number) {
    const c = this.customers.find(c => c.id === id); if (!c?.paid) return false;
    this.money += c.foods.reduce((sum, food) => sum + MENU[food].price, 0) + c.patience;
    this.customers.splice(this.customers.indexOf(c), 1); return true;
  }
  hurry() {
    const lines = this.role === 'barista'
      ? ['Gus: It’s a grill, not a time machine. Try inventing patience.', 'Gus: I can cook it faster if you fancy a burger with a pulse.', 'Gus: You rush me again and your latte gets gravy.']
      : ['Mae: I’ve got two hands and twelve opinions. Which one would you like first?', 'Mae: The customers want coffee, not your dramatic monologue.', 'Mae: Yes, Chef. I’ll just grow a third arm during my break.'];
    this.line = lines[Math.floor(this.random() * lines.length)]; return this.line;
  }
  private assist() {
    if (this.role === 'barista') {
      for (let i = 0; i < this.pans.length; i++) {
        const p = this.pans[i]; if (p.food) { this.turn(i); if (this.ready(i)) this.plate(i); }
      }
      for (const c of this.customers.filter(c => c.ticket && !c.paid)) for (const food of c.foods.filter(food => COOKED.includes(food) && !c.delivered.includes(food))) {
        const available = this.plates.filter(p => p === food).length + this.pans.filter(p => p.food === food).length;
        if (!available) { const empty = this.pans.findIndex(p => !p.food); if (empty >= 0) this.cook(empty, food); }
      }
    } else {
      if (this.customers.some(c => !c.paid && c.foods.includes('coffee') && !c.delivered.includes('coffee'))) this.brew();
      for (const c of [...this.customers]) {
        for (const food of c.foods) this.serve(c.id, food);
        if (c.paid) this.collect(c.id);
      }
    }
  }
}
