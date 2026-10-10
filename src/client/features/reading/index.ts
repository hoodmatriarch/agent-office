import type { Ctx } from '../../core/context';
import { h, toast, setDoing, modalOpen } from '../../ui/dom';
import { action, panel, closeCleanup } from '../facilities/panels';
import { spreadPages, turnPage, type BookSource, type Citation, type Passage } from '../../../shared/reading';
import { notebook, bookState, saveNotebook } from './store';
import { openContent, releasePage, type BookContent } from './content';
import { selectedPassage, paintPassages } from './selection';
import { turnAnimation, PaperSound } from './turn';
import { notesSheet } from './notes';
import { registerReadingDocuments, openReadingNote } from './documents';
import './ui.css';
interface Options { page?: number; citation?: Citation; onPage?: (page: number) => Promise<void>; legacy?: { notes?: Record<string, string>; highlights?: { page: number; quote: string }[] } }
export async function openFlipbook(source: BookSource, options: Options = {}) {
  await notebook.load();
  const state = bookState(source, options.legacy), p = panel('📖 ' + source.title, true);
  p.root.classList.add('reading-reader'); p.modal.reading = true; setDoing(p.modal, '📖 Reading ' + source.title);
  const controller = new AbortController(), sound = new PaperSound();
  const layout = h('div.reading-layout'), stage = h('div.reading-stage'), spread = h('div.reading-spread'), count = h('span.reading-count', { 'aria-live': 'polite' }, 'Opening your book…'), status = h('p.reading-help'); stage.append(spread);
  let content: BookContent | null = null, busy = false, closed = false, single = matchMedia('(max-width: 850px)').matches, zoom = 1, focus = options.citation?.highlight, timer = 0;
  if (options.page !== undefined) state.page = options.page;
  const changed = () => { clearTimeout(timer); timer = window.setTimeout(() => void saveNotebook().catch(e => toast((e as Error).message, 'error')), 600); };
  const jump = async (ref: Citation) => { if (!content || busy) return; state.page = Math.max(0, Math.min(content.total - 1, ref.page)); focus = ref.highlight;
    if (ref.quote && !state.highlights.some(h => h.id === ref.highlight)) { const h: Passage = { id: crypto.randomUUID(), page: ref.page, quote: ref.quote }; state.highlights.push(h); focus = h.id; }
    await render(); await save();
  };
  const notes = notesSheet(source, state, changed, jump);
  const toggleNotes = action('Notes sheet', async () => { notes.el.hidden = !notes.el.hidden; layout.classList.toggle('has-notes', !notes.el.hidden); if (!notes.el.hidden && !state.draft.citations.length) notes.add({ page: state.page }); if (content) await render(); });
  const previous = action('← Previous pages', () => turn(-1)), next = action('Next pages →', () => turn(1)), mode = action(single ? 'Two facing pages' : 'Single page', async () => { single = !single; mode.textContent = single ? 'Two facing pages' : 'Single page'; await render(); });
  const pageNumber = h('input', { type: 'number', min: 1, value: state.page + 1, 'aria-label': 'Go to book page' });
  const volume = h('input', { type: 'checkbox', 'aria-label': 'Page-turn sounds' }); volume.onchange = () => { sound.enabled = volume.checked; };
  const zoomControl = h('select', { 'aria-label': 'Book zoom' }); for (const n of [75, 100, 125, 150, 200]) zoomControl.append(h('option', { value: n, ...(n === 100 ? { selected: true } : {}) }, n + '%')); zoomControl.onchange = () => { zoom = Number(zoomControl.value) / 100; void render().catch(e => toast((e as Error).message, 'error')); };
  const preserve = (button: HTMLButtonElement) => { button.onmousedown = e => e.preventDefault(); return button; };
  const capture = () => selectedPassage(spread);
  const cite = preserve(action('Cite page / selection', async () => { const passage = capture();
    if (passage) { state.page = passage.page; const existing = state.highlights.find(h => h.page === passage.page && h.start === passage.start && h.quote === passage.quote); if (!existing && state.highlights.length>=400)throw new Error('Remove an older highlight before adding more to this book.');if (!existing) state.highlights.push(passage); notes.add({ page: passage.page, quote: passage.quote, highlight: existing?.id ?? passage.id }); repaint(); }
    else notes.add({ page: state.page });
    notes.el.hidden = false; layout.classList.add('has-notes'); await render(); await save();
  }));
  const highlight = preserve(action('Highlight selected passage', async () => { const passage = capture(); if (!passage) throw new Error('Select text on the book page first. Scanned image pages need OCR for text selection; you can still mark or cite the whole page.');
    if (state.highlights.length >= 400) throw new Error('Remove an older highlight before adding more to this book.');
    const existing = state.highlights.find(h => h.page === passage.page && h.start === passage.start && h.quote === passage.quote); if (!existing) state.highlights.push(passage);
    state.page = passage.page; notes.add({ page: passage.page, quote: passage.quote, highlight: existing?.id ?? passage.id }); window.getSelection()?.removeAllRanges(); repaint(); await save(); toast('Passage highlighted and linked to your reading note.');
  }));
  const mark = action('Mark page', async () => { if (state.marks.includes(state.page)) state.marks = state.marks.filter(n => n !== state.page); else state.marks.push(state.page); refreshControls(); await save(); });
  const references = action('Marked pages & highlights', () => {
    const list = panel('🔖 Marked pages & highlighted passages');
    let continuing=false;closeCleanup(list.modal,()=>{if(!continuing)p.modal.close();});
    for (const page of state.marks) list.body.append(action(`Marked page ${page + 1}`, () => { continuing=true;list.modal.close(); return jump({ id: '', page }); }));
    for (const passage of state.highlights) list.body.append(h('div.reading-reference', {}, action(`Page ${passage.page + 1} · “${passage.quote.slice(0, 100)}”`, () => { continuing=true;list.modal.close(); return jump({ id: '', page: passage.page, quote: passage.quote, highlight: passage.id }); }), action('Remove highlight', async () => { state.highlights = state.highlights.filter(h => h.id !== passage.id); await save(); continuing=true;list.modal.close(); repaint(); })));
    if (!state.marks.length && !state.highlights.length) list.body.append(h('p', {}, 'Mark a page or select a passage and highlight it to keep it here.'));
  });
  const savedNotes = action('Saved reading notes', () => { const list = panel('📝 Saved reading notes');closeCleanup(list.modal,()=>p.modal.close());for (const note of notebook.value.notes.filter(n => n.source.asset.id === source.asset.id)) list.body.append(action(note.title + ' · ' + note.date, () => { list.modal.close(); return openReadingNote(note.id); })); if (!list.body.children.length) list.body.append(h('p', {}, 'Save a note to your documents to keep it here.')); });
  layout.append(stage, notes.el); p.body.append(h('div.reading-controls', {}, previous, count, next, mode, zoomControl, pageNumber, action('Go to page', async () => { if (content) await jump({ id: '', page: Number(pageNumber.value) - 1 }); }), h('label', {}, volume, ' Page sounds')), h('div.reading-tools', {}, toggleNotes, mark, references, highlight, cite, savedNotes), status, layout);
  function repaint() { spread.querySelectorAll<HTMLElement>('[data-reading-page]').forEach(page => paintPassages(page, state.highlights, focus)); }
  function refreshControls() {
    if (!content) return; const pages = spreadPages(state.page, content.total, single);
    count.textContent = pages.length > 1 ? `Pages ${pages[0] + 1}–${pages[1] + 1} of ${content.total}` : `Page ${state.page + 1} of ${content.total}`;
    pageNumber.value = String(state.page + 1); pageNumber.max = String(content.total); previous.disabled = busy || pages[0] === 0; next.disabled = busy || pages.at(-1) === content.total - 1;
    mark.textContent = state.marks.includes(state.page) ? `Unmark page ${state.page + 1}` : `Mark page ${state.page + 1}`;
  }
  async function save() { clearTimeout(timer); await saveNotebook(); await options.onPage?.(state.page); }
  async function render() {
    if (!content || closed || busy) return; busy = true; refreshControls();
    try {
      state.page = Math.max(0, Math.min(content.total - 1, Math.trunc(state.page) || 0));
      const pages = spreadPages(state.page, content.total, single), room = stage.clientWidth || Math.min(1050, window.innerWidth - 100), width = Math.max(230, Math.min(single ? 690 : 520, (room - 32) / (single ? 1 : 2))) * zoom;
      const leaves = await Promise.all(pages.map(page => content!.render(page, width))); if (closed) {leaves.forEach(releasePage);return;}
      spread.querySelectorAll<HTMLElement>('.reading-page').forEach(releasePage);
      spread.replaceChildren(...leaves); spread.classList.toggle('reading-cover', state.page === 0); spread.classList.toggle('reading-single', single || pages.length === 1);
      leaves.forEach(leaf => { leaf.onpointerdown = () => { state.page = Number(leaf.dataset.readingPage); refreshControls(); }; });
      if (state.page === 0 && content.total > 1) { const open = action('Open book', () => turn(1)); open.classList.add('reading-open-book'); leaves[0].append(open); }
      const back = action('Turn previous page corner', () => turn(-1)), forward = action('Turn next page corner', () => turn(1)); back.classList.add('reading-corner', 'reading-corner-back'); forward.classList.add('reading-corner', 'reading-corner-next'); back.disabled = pages[0] === 0; forward.disabled = pages.at(-1) === content.total - 1; leaves[0].append(back); leaves.at(-1)!.append(forward);
      repaint(); status.textContent = 'Click a lower corner to turn the page. Select text to highlight or cite it. Your place and draft notes save as you read.';
    } finally { busy = false; refreshControls(); }
  }
  async function turn(direction: number) {
    if (!content || closed || busy) return; const nextPage = turnPage(state.page, content.total, direction, single); if (nextPage === state.page) return;
    turnAnimation(stage, spread.querySelector<HTMLElement>(direction > 0 ? '.reading-page:last-child' : '.reading-page:first-child'), direction > 0); void sound.play().catch(() => {}); state.page = nextPage; focus = undefined; await render(); await save();
  }
  p.root.addEventListener('keydown', e => { if ((e.target as HTMLElement).matches('input,textarea,select')) return; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); void turn(e.key === 'ArrowRight' ? 1 : -1).catch(err => toast((err as Error).message, 'error')); } });
  closeCleanup(p.modal, () => { closed = true; controller.abort(); content?.close(); sound.close(); clearTimeout(timer); void save().catch(e => toast((e as Error).message, 'error')); });
  try { content = await openContent(source.asset, controller.signal); if (closed) { content.close(); return; } if (options.citation) await jump(options.citation); else await render(); }
  catch (e) { if (!closed) { status.textContent = 'Could not open this book: ' + (e as Error).message; count.textContent = 'Book unavailable'; } }
}
registerReadingDocuments((note, citation) => openFlipbook(note.source, { page: citation.page, citation }));
export function installReading(ctx: Ctx) {
  const query = new URLSearchParams(location.search), id = query.get('reading-note'); if (!id) return;
  const off = ctx.ticks.add('hud', () => { if (!ctx.net.up || !ctx.player.enabled || modalOpen()) return; off(); void openReadingNote(id, query.get('citation') ?? undefined).catch(e => toast((e as Error).message, 'error')); });
}
