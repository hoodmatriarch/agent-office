import { h } from '../../ui/dom';
import { Library } from '../facilities/library';
import { upload } from '../facilities/data';
import { panel, action, input, chooseFile, closeCleanup } from './panels';

interface DictionaryEntry { word: string; phonetic?: string; meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[]; license?: { name: string; url: string }; sourceUrls?: string[] }
export async function dictionaryBook() {
  const p = panel('📖 Dictionary', true), word = input('Word to look up'), page = h('div.book-page'), count = h('span', {}, 'English dictionary'), credits = h('small');
  p.root.classList.add('reader');
  let controller: AbortController | null = null, pages: { title: string; text: string; example?: string }[] = [], index = 0, closed = false;
  const previous = action('← Previous page', () => { index--; render(); }), next = action('Next page →', () => { index++; render(); });
  const render = () => {
    index = Math.max(0, Math.min(pages.length - 1, index)); previous.disabled = index <= 0; next.disabled = index >= pages.length - 1;
    const entry = pages[index]; count.textContent = pages.length ? `Meaning ${index + 1} of ${pages.length}` : 'English dictionary';
    page.replaceChildren(entry ? h('div.book-text', {}, h('h2', {}, entry.title), h('p', {}, entry.text), entry.example ? h('p', {}, 'Example: ' + entry.example) : '') : h('p', {}, 'Type a word above to open its definitions. Click page edges or Previous/Next to turn through its meanings.'));
  };
  const search = async () => {
    const term = word.field.value.trim(); if (!term || term.length > 80) throw new Error('Enter a word under 80 characters.');
    controller?.abort(); controller = new AbortController(); page.textContent = 'Opening the dictionary…'; credits.textContent = '';
    try {
      const response = await fetch('/api/dictionary?word=' + encodeURIComponent(term), { signal: controller.signal });
      if (closed) return;
      if (response.status === 404) { pages = []; render(); page.textContent = 'No entry found. Check the spelling or try another word.'; return; }
      if (!response.ok) { const error = await response.json(); throw new Error(error.error ?? 'The dictionary is temporarily unavailable. Try again later.'); }
      const entries: DictionaryEntry[] = await response.json(); if (closed) return;
      pages = entries.flatMap(entry => entry.meanings.flatMap(meaning => meaning.definitions.map(def => ({ title: `${entry.word}${entry.phonetic ? ' · ' + entry.phonetic : ''} · ${meaning.partOfSpeech}`, text: def.definition, example: def.example }))));
      credits.textContent = [...new Set(entries.flatMap(entry => [entry.license ? `${entry.license.name} · ${entry.license.url}` : '', ...(entry.sourceUrls ?? [])]).filter(Boolean))].join(' · ');
      index = 0; render();
    } catch (error) { if (closed || (error as Error).name === 'AbortError') return; pages = []; render(); page.textContent = (error as Error).message || 'Unable to load this entry. An internet connection is needed for word lookup.'; }
  };
  const lookup = action('Open word', search); word.field.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); lookup.click(); } };
  page.onclick = e => { const box = page.getBoundingClientRect(); index += e.clientX < box.left + box.width / 2 ? -1 : 1; render(); };
  p.body.append(word.row, lookup, h('div.fac-toolbar', {}, previous, count, next), page, h('small', {}, 'Definitions provided by Free Dictionary API / Wiktionary. Online lookup stays inside the office.'), credits);
  render(); closeCleanup(p.modal, () => { closed = true; controller?.abort(); });
}

/** Named shelf buttons always open a reader or an in-app upload slot, never an external site. */
export async function writingBook(reader: Library, name: 'Dictionary' | 'The Artist’s Way') {
  await reader.data.load();
  const found = reader.data.value.find(b => {
    const book = b as typeof b & { station?: string; reference?: string };
    return book.station === 'writing' && (book.reference === name || (name === 'Dictionary' ? /dictionary/i : /artist.?s way/i).test(book.title));
  });
  if (found) { reader.selected = found; return reader.read(); }
  if (name === 'Dictionary') return dictionaryBook();
  const p = panel('📖 The Artist’s Way');
  p.body.append(h('p', {}, 'Add your own PDF, EPUB or text copy to this book slot. It will open here with page turning and a saved bookmark. The full book is not bundled.'), chooseFile('.pdf,.epub,.txt,.md', async file => {
    if (!/\.(pdf|epub|txt|md)$/i.test(file.name)) throw new Error('Choose PDF, EPUB, TXT or Markdown.');
    const asset = await upload(file), book = Object.assign({ id: crypto.randomUUID(), asset, title: name, page: 0 }, { station: 'writing', reference: name });
    reader.data.value.push(book); await reader.data.save(); reader.selected = book; p.modal.close(); await reader.read();
  }));
}
