export const READING_BUCKETS = ['reading'] as const;
export interface ReadingAsset { id: string; name: string; type: string; size: number }
export interface BookSource { id: string; title: string; asset: ReadingAsset; bucket: string; subject?: string; page?: number }
export interface PageRect { x: number; y: number; width: number; height: number }
export interface Passage { id: string; page: number; quote: string; start?: number; end?: number; rects?: PageRect[] }
export interface Citation { id: string; page: number; quote?: string; highlight?: string }
export interface ReadingNote { id: string; source: BookSource; title: string; subject: string; text: string; tags: string; date: string; updated: string; citations: Citation[]; document?: string }
export interface ReadingBook { page: number; marks: number[]; highlights: Passage[]; draft: { title: string; subject: string; text: string; tags: string; citations: Citation[]; note?: string } }
export interface ReadingData { books: Record<string, ReadingBook>; notes: ReadingNote[] }
/** Page zero is the cover; facing spreads begin with pages one and two. */
export function spreadPages(page: number, total: number, single = false): number[] {
  page = Math.max(0, Math.min(Math.max(0, total - 1), Math.trunc(page) || 0));
  if (single || page === 0) return [page];
  const left = 1 + Math.floor((page - 1) / 2) * 2;
  return left + 1 < total ? [left, left + 1] : [left];
}
export function turnPage(page: number, total: number, direction: number, single = false) {
  const pages = spreadPages(page, total, single);
  return Math.max(0, Math.min(total - 1, direction > 0 ? pages.at(-1)! + 1 : pages[0] - 1));
}
export function readingTags(note: Pick<ReadingNote, 'source' | 'subject' | 'date' | 'tags'>) {
  return [`book:${note.source.title}`, `subject:${note.subject || 'General'}`, `date:${note.date}`, 'reading-notes', note.tags].filter(Boolean).join(', ');
}
export function noteMarkdown(note: ReadingNote, origin: string) {
  const citations = note.citations.map((c, i) => `${i + 1}. [${note.source.title}, PDF/file page ${c.page + 1}](${origin}/?reading-note=${encodeURIComponent(note.id)}&citation=${encodeURIComponent(c.id)})${c.quote ? '\n\n   > ' + c.quote.replace(/\n/g, '\n   > ') : ''}`).join('\n\n');
  return `# ${note.title}\n\nBook: ${note.source.title}\nSubject: ${note.subject}\nDate: ${note.date}\nTags: ${readingTags(note)}\n\n${note.text}\n\n## References\n\n${citations || 'No references added.'}\n`;
}
