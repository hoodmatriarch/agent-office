import { h, toast } from '../../ui/dom';
import { Collection, upload, assetUrl, type Asset } from './data';
import { action, chooseFile, input, panel } from './panels';
interface Item { id: string; title: string; folder: string; tags: string; note: string; asset?: Asset; url?: string }
export class Organizer {
  readonly data = new Collection<Item[]>('organizer', []);
  async open() {
    await this.data.load(); const { body } = panel('🗂️ Documents, designs & mood boards', true);
    const search = input('Find by name, folder, or tag'), title = input('Name'), folder = input('Folder / project', 'My creative work'), tags = input('Tags', 'ideas'), url = input('Google Docs, Sheets, Canva, or other https link'), note = input('Notes', '', true);
    const list = h('div.fac-grid'); let mood = false;
    const render = () => {
      const q = search.field.value.toLowerCase(); list.replaceChildren(); list.classList.toggle('mood-board', mood);
      for (const item of this.data.value.filter(item => `${item.title} ${item.folder} ${item.tags} ${item.note}`.toLowerCase().includes(q))) {
        const card = h('article.fac-card', {}, h('span.fac-kicker', {}, item.folder), h('h3', {}, item.title), h('small', {}, item.tags), h('p', {}, item.note));
        if (item.asset?.type.startsWith('image/')) card.prepend(h('img', { src: assetUrl(item.asset), alt: item.title }));
        if (item.url) card.append(h('a.btn', { href: item.url, target: '_blank', rel: 'noopener noreferrer' }, 'Open in its app'));
        if (item.asset) { card.append(h('a.btn', { href: assetUrl(item.asset, true), download: item.asset.name }, 'Download file')); if (item.asset.type === 'application/pdf') card.append(action('View PDF', () => { const preview = panel(item.title, true); preview.body.append(h('iframe.fac-pdf', { src: assetUrl(item.asset!), title: item.title })); })); }
        card.append(action('Edit details', () => { const edit = panel('Edit item'); const n = input('Name', item.title), f = input('Folder / project', item.folder), t = input('Tags', item.tags), memo = input('Notes', item.note, true); edit.body.append(n.row, f.row, t.row, memo.row, action('Save changes', async () => { Object.assign(item, { title: n.field.value, folder: f.field.value, tags: t.field.value, note: memo.field.value }); await this.data.save(); edit.modal.close(); render(); })); }));
        card.append(action('Remove from organizer', async () => { if (!confirm('Remove this entry from the organizer? Its original file is retained.')) return; this.data.value = this.data.value.filter(i => i.id !== item.id); await this.data.save(); render(); })); list.append(card);
      }
      if (!list.children.length) list.append(h('p.fac-note', {}, 'No items here yet. Add a file or a link below.'));
    };
    const fields = () => ({ id: crypto.randomUUID(), title: title.field.value.trim(), folder: folder.field.value.trim().slice(0, 100), tags: tags.field.value.slice(0, 300), note: note.field.value.slice(0, 4000) });
    const file = chooseFile('*', async file => { const asset = await upload(file); this.data.value.unshift({ ...fields(), title: title.field.value.trim() || file.name, asset }); await this.data.save(); render(); toast('File saved locally.'); });
    search.field.oninput = render;
    body.append(h('p', {}, 'A home for work that does not need GitHub. Files upload to this office’s local storage; links open the original app. Google and Canva links do not grant the office account access or automatic syncing.'),
      h('div.fac-toolbar', {}, h('a.btn', { href: 'https://docs.google.com/document/', target: '_blank', rel: 'noopener noreferrer' }, 'Google Docs'), h('a.btn', { href: 'https://docs.google.com/spreadsheets/', target: '_blank', rel: 'noopener noreferrer' }, 'Google Sheets'), h('a.btn', { href: 'https://www.canva.com/', target: '_blank', rel: 'noopener noreferrer' }, 'Canva'), action('Switch list / mood board', () => { mood = !mood; render(); })), search.row, list,
      h('h3', {}, 'Add a file or a link'), title.row, folder.row, tags.row, note.row, url.row, action('Save link', async () => { const link = new URL(url.field.value); if (link.protocol !== 'https:') throw new Error('Use an https link.'); const item = fields(); if (!item.title) throw new Error('Give this item a name.'); this.data.value.unshift({ ...item, url: link.href }); await this.data.save(); render(); }, true), h('p', {}, 'Or upload a local file (up to 80 MB):'), file);
    render();
  }
}
