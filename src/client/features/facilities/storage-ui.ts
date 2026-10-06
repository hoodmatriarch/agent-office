import { h, toast } from '../../ui/dom';
import { Collection, upload, assetUrl, type Asset } from './data';
import { action, input, panel, chooseFile } from './panels';
interface RecordFile { id: string; name: string; job: string; personal: string; reviews: string; complaints: string; documents: Asset[] }
export class StorageRoom {
  readonly records = new Collection<RecordFile[]>('records', []);
  readonly supplies = new Collection<Record<string, number>>('supplies', { Pens: 60, Paper: 500, 'Toilet paper': 40, Soap: 12, 'Coffee beans': 30, 'Milk cartons': 20, 'Cleaning cloths': 24, 'Light bulbs': 16 });
  readonly locker = new Collection<{ coats: string; items: string; documents: Asset[] }>('locker', { coats: '', items: '', documents: [] });
  async files() {
    await this.records.load(); const { body } = panel('🗄️ Employee files', true);
    body.append(h('p.fac-note', {}, 'Saved under your office sign-in. Shared-password visitors share the same cabinet. Coding workers on this Windows account can access local storage; this is not a restricted HR system.'));
    const list = h('div.fac-grid');
    const edit = (record?: RecordFile) => {
      const p = panel(record ? record.name : 'New employee file');
      const fields = { name: input('Employee name', record?.name), job: input('Role', record?.job), personal: input('Personal information', record?.personal, true), reviews: input('Performance reviews', record?.reviews, true), complaints: input('Complaints history', record?.complaints, true) };
      for (const field of Object.values(fields)) p.body.append(field.row);
      p.body.append(action('Save employee file', async () => { if (!fields.name.field.value.trim()) throw new Error('Enter an employee name.'); const value = { id: record?.id ?? crypto.randomUUID(), name: fields.name.field.value.slice(0, 100), job: fields.job.field.value.slice(0, 100), personal: fields.personal.field.value.slice(0, 8000), reviews: fields.reviews.field.value.slice(0, 8000), complaints: fields.complaints.field.value.slice(0, 8000), documents: record?.documents ?? [] }; if (record) Object.assign(record, value); else this.records.value.push(value); await this.records.save(); p.modal.close(); render(); }, true));
      if (record) p.body.append(h('h3', {}, 'Attached documents'), ...record.documents.map(file => h('a.btn', { href: assetUrl(file, true), download: file.name }, file.name)), chooseFile('*', async file => { record.documents.push(await upload(file)); await this.records.save(); toast('Document attached.'); }));
    };
    const render = () => list.replaceChildren(...this.records.value.map(record => h('article.fac-card', {}, h('h3', {}, record.name), h('p', {}, record.job), action('Open employee file', () => edit(record)))));
    body.append(action('Add employee file', () => edit()), list); render();
  }
  async inventory() {
    await this.supplies.load(); const { body } = panel('📦 Office supplies');
    body.append(h('p', {}, 'Track your office stock. Restocking here updates the saved inventory.'));
    for (const [name, quantity] of Object.entries(this.supplies.value)) {
      const amount = h('input', { type: 'number', min: 0, max: 100000, value: quantity, 'aria-label': name });
      body.append(h('label', {}, name, amount)); amount.onchange = () => { this.supplies.value[name] = Math.max(0, Math.min(100000, Math.floor(Number(amount.value)) || 0)); };
    }
    body.append(action('Save stock levels', async () => { await this.supplies.save(); toast('Inventory saved.'); }, true));
  }
  async coatLocker() {
    await this.locker.load(); const { body } = panel('🧥 Your coat & personal locker');
    const coat = input('Coats and clothing', this.locker.value.coats, true), items = input('Personal items', this.locker.value.items, true);
    body.append(h('p', {}, 'Keep a saved list of the items in your locker, plus personal files. Each individual office account has its own locker; shared-password sign-ins use the shared locker.'), coat.row, items.row,
      action('Save locker', async () => { this.locker.value.coats = coat.field.value.slice(0, 4000); this.locker.value.items = items.field.value.slice(0, 4000); await this.locker.save(); toast('Locker saved.'); }, true),
      ...this.locker.value.documents.map(asset => h('a.btn', { href: assetUrl(asset, true), download: asset.name }, asset.name)), chooseFile('*', async file => { this.locker.value.documents.push(await upload(file)); await this.locker.save(); body.append(h('p', {}, `${file.name} saved in your locker.`)); }));
  }
}
