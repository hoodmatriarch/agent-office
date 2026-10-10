import type { Passage, PageRect } from '../../../shared/reading';
export function selectedPassage(root: HTMLElement): Passage | null {
  const selection = window.getSelection(); if (!selection?.rangeCount || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0), page = (range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer as Element : range.startContainer.parentElement)?.closest<HTMLElement>('[data-reading-page]');
  const text = page?.querySelector<HTMLElement>('.reading-text');
  if (!page || !text || !root.contains(page) || !text.contains(range.startContainer) || !text.contains(range.endContainer)) throw new Error('Select a passage on one book page at a time.');
  const quote = selection.toString().trim(); if (!quote) return null;
  if (quote.length > 4000) throw new Error('Select a passage shorter than 4,000 characters.');
  const prefix = document.createRange(); prefix.selectNodeContents(text); prefix.setEnd(range.startContainer, range.startOffset);
  return { id: crypto.randomUUID(), page: Number(page.dataset.readingPage), quote, start: prefix.toString().length, end: prefix.toString().length + range.toString().length, rects: rangeRects(range, page) };
}
function rangeRects(range: Range, page: HTMLElement): PageRect[] {
  const box = page.getBoundingClientRect();
  return Array.from(range.getClientRects()).filter(r => r.width > 0 && r.height > 0).slice(0, 100).map(r => ({ x: Math.max(0, (r.left - box.left) / box.width), y: Math.max(0, (r.top - box.top) / box.height), width: Math.min(1, r.width / box.width), height: Math.min(1, r.height / box.height) }));
}
export function passageRange(text: HTMLElement, passage: Pick<Passage, 'quote' | 'start' | 'end'>) {
  const raw = text.textContent ?? ''; let start = passage.start, end = passage.end;
  if (start === undefined || end === undefined || raw.slice(start, end).trim() !== passage.quote) {
    const offsets: number[] = []; let flat = '';
    for (let i = 0; i < raw.length; i++) if (!/\s/.test(raw[i])) { flat += raw[i]; offsets.push(i); }
    const query = passage.quote.replace(/\s/g, ''), at = flat.indexOf(query); if (at < 0 || !query) return null;
    start = offsets[at]; end = offsets[at + query.length - 1] + 1;
  }
  const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT), range = document.createRange(); let cursor = 0, began = false, node: Node | null;
  while ((node = walker.nextNode())) { const length = node.textContent?.length ?? 0;
    if (!began && start <= cursor + length) { range.setStart(node, Math.max(0, start - cursor)); began = true; }
    if (began && end <= cursor + length) { range.setEnd(node, Math.max(0, end - cursor)); return range; } cursor += length;
  } return null;
}
export function paintPassages(page: HTMLElement, passages: Passage[], focus?: string) {
  page.querySelector('.reading-highlights')?.remove();
  const layer = document.createElement('div'); layer.className = 'reading-highlights'; page.append(layer);
  const text = page.querySelector<HTMLElement>('.reading-text');
  for (const passage of passages.filter(p => p.page === Number(page.dataset.readingPage))) {
    const range = text ? passageRange(text, passage) : null;
    const rects = range ? rangeRects(range, page) : passage.rects ?? [];
    for (const r of rects) { const mark = document.createElement('span'); mark.className = 'reading-highlight' + (passage.id === focus ? ' citation-focus' : ''); mark.dataset.highlight = passage.id; mark.title = passage.quote; Object.assign(mark.style, { left: r.x * 100 + '%', top: r.y * 100 + '%', width: r.width * 100 + '%', height: r.height * 100 + '%' }); layer.append(mark); }
  }
  if (focus) page.querySelector<HTMLElement>(`[data-highlight="${CSS.escape(focus)}"]`)?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
}
