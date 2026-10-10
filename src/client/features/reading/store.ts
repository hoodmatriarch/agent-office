import { Collection } from '../facilities/data';
import type { BookSource, ReadingBook, ReadingData } from '../../../shared/reading';
export const notebook = new Collection<ReadingData>('reading', { books: {}, notes: [] });
export function bookState(source: BookSource, legacy?: { notes?: Record<string, string>; highlights?: { page: number; quote: string }[] }) {
  const existing = notebook.value.books[source.asset.id]; if (existing) return existing;
  const state: ReadingBook = { page: source.page ?? 0, marks: [], highlights: (legacy?.highlights ?? []).map(h => ({ ...h, id: crypto.randomUUID() })), draft: { title: source.title + ' · reading notes', subject: source.subject ?? 'General', text: Object.entries(legacy?.notes ?? {}).filter(([, text]) => text.trim()).map(([page, text]) => `Page ${Number(page) + 1}\n${text}`).join('\n\n'), tags: '', citations: [] } };
  notebook.value.books[source.asset.id] = state; return state;
}
export async function saveNotebook() {
  if (JSON.stringify(notebook.value).length > 1800000) throw new Error('Your reading notebook is full. Download or remove older reading notes before adding more.');
  await notebook.save();
}
