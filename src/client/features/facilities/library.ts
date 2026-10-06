import type { PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { unzipSync, strFromU8 } from 'fflate';
import { h, toast } from '../../ui/dom';
import { Collection, assetUrl, upload, type Asset } from './data';
import { action, chooseFile, panel, closeCleanup } from './panels';
interface Book { id: string; asset: Asset; title: string; page: number }

export function textPages(text: string) {
  const clean = text.replace(/\r/g, '').trim();
  const pages: string[] = [];
  for (let rest = clean; rest.length;) { let end = Math.min(1900, rest.length); if (end < rest.length) { const space = rest.lastIndexOf(' ', end); if (space > 1300) end = space; } pages.push(rest.slice(0, end)); rest = rest.slice(end).trimStart(); }
  return pages.length ? pages : ['This book has no readable text.'];
}
export function epubText(bytes: Uint8Array): string {
  let total = 0;
  const archive = unzipSync(bytes, { filter: entry => { total += entry.originalSize; if (total > 30 * 1024 * 1024) throw new Error('This EPUB expands beyond 30 MB. Please use a PDF copy.'); return /\.(xml|opf|xhtml|html|htm)$/i.test(entry.name); } });
  const parse = (text: string, mime: DOMParserSupportedType = 'application/xml') => new DOMParser().parseFromString(text, mime);
  const container = archive['META-INF/container.xml']; if (!container) throw new Error('This file is not a readable EPUB.');
  const opf = parse(strFromU8(container)).getElementsByTagNameNS('*', 'rootfile')[0]?.getAttribute('full-path');
  if (!opf || !archive[opf]) throw new Error('The EPUB is missing its book contents.');
  const doc = parse(strFromU8(archive[opf]));
  const manifest = new Map(Array.from(doc.getElementsByTagNameNS('*', 'item')).map(item => [item.getAttribute('id'), item.getAttribute('href')]));
  const base = opf.includes('/') ? opf.slice(0, opf.lastIndexOf('/') + 1) : '';
  return Array.from(doc.getElementsByTagNameNS('*', 'itemref')).map(ref => {
    const href = manifest.get(ref.getAttribute('idref')); if (!href) return '';
    const parts = (base + decodeURIComponent(href.split('#')[0])).split('/'), clean: string[] = [];
    for (const part of parts) { if (part === '..') clean.pop(); else if (part && part !== '.') clean.push(part); }
    const body = archive[clean.join('/')]; if (!body) return '';
    const html = parse(strFromU8(body), 'text/html'); html.querySelectorAll('script,style').forEach(node => node.remove());
    html.querySelectorAll('p,h1,h2,h3,li,br').forEach(node => node.append('\n\n'));
    return html.body.textContent ?? '';
  }).join('\n\n');
}

export class Library {
  readonly data = new Collection<Book[]>('library', []);
  selected: Book | null = null;
  async open(take: (book: Book) => void) {
    await this.data.load();
    const { body, modal } = panel('📚 Reading library', true);
    const list = h('div.fac-grid');
    const render = () => { list.replaceChildren(...this.data.value.map(book => h('article.fac-card', {}, h('div.book-cover', {}, '📖', h('strong', {}, book.title)), h('p', {}, `Bookmark: page ${book.page + 1}`), action('Take book to couch', () => { this.selected = book; modal.close(); take(book); }), h('a.btn', { href: assetUrl(book.asset, true), download: book.asset.name }, 'Download original')))); if (!this.data.value.length) list.append(h('p.fac-note', {}, 'Your shelves are ready. Upload a PDF, EPUB, TXT, or Markdown book.')); };
    const file = chooseFile('.pdf,.epub,.txt,.md', async file => {
      if (!/\.(pdf|epub|txt|md)$/i.test(file.name)) throw new Error('Choose PDF, EPUB, TXT, or Markdown.');
      const asset = await upload(file); this.data.value.push({ id: crypto.randomUUID(), asset, title: file.name.replace(/\.[^.]+$/, ''), page: 0 }); await this.data.save(); render();
    });
    body.append(h('p', {}, 'Upload your books. Pick one up, take a seat by the window, and click the page edges to turn pages. PDF preserves the original pages; EPUB and text are arranged into readable pages.'), file, list); render();
  }
  async read() {
    if (!this.selected) { toast('Pick a book from the library first.'); return; }
    const book = this.selected, { body, root, modal } = panel(`📖 ${book.title}`, true);
    root.classList.add('reader');
    const page = h('div.book-page', { 'aria-label': 'Book page' }), count = h('span', {}, 'Loading your book…');
    const previous = action('← Previous page', () => turn(-1)), next = action('Next page →', () => turn(1));
    const go = h('input', { type: 'number', min: 1, value: book.page + 1, 'aria-label': 'Go to page' });
    body.append(h('p.fac-note', {}, 'You are seated in the window lounge. Your bookmark saves when you close the book.'), h('div.fac-toolbar', {}, previous, count, next, go, action('Go', () => { book.page = Number(go.value) - 1; return render(); })), page);
    let pdf: PDFDocumentProxy | null = null, pages: string[] = [], busy = false, closed = false;
    const total = () => pdf?.numPages ?? pages.length;
    async function render() {
      if (busy || closed || !total()) return;
      busy = true; book.page = Math.max(0, Math.min(total() - 1, Number.isFinite(book.page) ? book.page : 0));
      count.textContent = `Page ${book.page + 1} of ${total()}`; go.value = String(book.page + 1); previous.disabled = book.page === 0; next.disabled = book.page >= total() - 1;
      try {
        if (pdf) {
          const documentPage = await pdf.getPage(book.page + 1), viewport = documentPage.getViewport({ scale: 1.35 });
          const canvas = h('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
          await documentPage.render({ canvas, viewport }).promise;
          if (!closed) page.replaceChildren(canvas);
        } else page.replaceChildren(h('div.book-text', {}, pages[book.page]));
      } catch (error) { if (!closed) page.textContent = (error as Error).message; }
      finally { busy = false; }
    }
    async function turn(delta: number) { if (busy || closed) return; book.page += delta; await render(); }
    page.onclick = event => { const rect = page.getBoundingClientRect(); void turn(event.clientX < rect.left + rect.width / 2 ? -1 : 1); };
    const keyboard = (event: KeyboardEvent) => { if (document.activeElement === go) return; if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); void turn(event.key === 'ArrowLeft' ? -1 : 1); } };
    root.addEventListener('keydown', keyboard);
    closeCleanup(modal, () => { closed = true; if (pdf) void pdf.loadingTask.destroy(); void this.data.save().catch(error => toast((error as Error).message, 'error')); });
    try {
      const response = await fetch(assetUrl(book.asset)); if (!response.ok) throw new Error('The book could not be loaded.'); const bytes = new Uint8Array(await response.arrayBuffer());
      if (book.asset.type === 'application/pdf') { const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist'); GlobalWorkerOptions.workerSrc = workerUrl; pdf = await getDocument({ data: bytes, useSystemFonts: true }).promise; }
      else pages = textPages(/\.epub$/i.test(book.asset.name) ? epubText(bytes) : new TextDecoder().decode(bytes));
      if (closed) { if (pdf) await pdf.loadingTask.destroy(); return; }
      await render();
    } catch (error) { if (!closed) page.textContent = `Could not open this book: ${(error as Error).message}. You can still download the original from the shelf.`; }
  }
}
