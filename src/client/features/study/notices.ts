import { h, toast } from '../../ui/dom';
import { Collection } from '../facilities/data';
import { action, input, panel } from '../facilities/panels';
export interface StudyNotice { id: string; title: string; text: string; kind: string }
/** The south-wall noticeboard uses its own saved collection, separate from classwork. */
export class StudyNotices {
  private data = new Collection<StudyNotice[]>('study-notices', []);
  constructor(private paint: (items: StudyNotice[]) => void) {}
  async refresh() { await this.data.load(); this.paint(this.data.value); }
  async open() {
    await this.refresh();
    const p = panel('📌 Notes, schedules & awards'), list = h('div.fac-grid');
    const title = input('Notice title'), text = input('Notice details', '', true), kind = h('select', { 'aria-label': 'Notice type' });
    for (const name of ['Note / post-it', 'Class schedule', 'Award']) kind.append(h('option', {}, name));
    const render = () => {
      this.paint(this.data.value);
      list.replaceChildren(...this.data.value.map(item => h('article.fac-card', {}, h('small', {}, item.kind), h('h3', {}, item.title), h('p', { style: 'white-space:pre-wrap' }, item.text), action('Remove notice', async () => {
        this.data.value = this.data.value.filter(n => n.id !== item.id); await this.data.save(); render();
      }))));
    };
    p.body.append(h('p', {}, 'Post your study reminders, class schedules and awards. They stay on this wall after you leave.'), list, title.row, h('label', {}, 'Notice type', kind), text.row, action('Pin to wall', async () => {
      if (!title.field.value.trim()) throw new Error('Give your notice a title.');
      if (this.data.value.length >= 100) throw new Error('The board holds 100 notices. Remove one to make space.');
      this.data.value.push({ id: crypto.randomUUID(), title: title.field.value.trim().slice(0, 160), text: text.field.value.slice(0, 4000), kind: kind.value });
      await this.data.save(); render(); title.field.value = ''; text.field.value = ''; toast('Pinned to the wall.');
    })); render();
  }
}
