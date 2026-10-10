import { h } from '../../ui/dom';
import { action, input } from '../facilities/panels';
import type { BookSource, ReadingBook, ReadingNote, Citation } from '../../../shared/reading';
import { notebook, saveNotebook } from './store';
import { saveNoteDocument } from './documents';
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function notesSheet(source: BookSource, state: ReadingBook, changed: () => void, jump: (ref: Citation) => Promise<void>) {
  const sheet = h('aside.reading-notes', { 'aria-label': 'Reading notes sheet', hidden: true }), title = input('Reading note title', state.draft.title), subject = input('Note subject', state.draft.subject), tags = input('Extra note tags', state.draft.tags), text = input('Reading notes', state.draft.text, true), refs = h('div.reading-note-references'), date = h('small');
  const sync = () => { Object.assign(state.draft, { title: title.field.value.slice(0, 160), subject: subject.field.value.slice(0, 160), tags: tags.field.value.slice(0, 300), text: text.field.value.slice(0, 24000) }); changed(); };
  for (const field of [title.field, subject.field, tags.field, text.field]) field.oninput = sync;
  const render = () => {
    date.textContent = `Book: ${source.title} · Date: ${notebook.value.notes.find(n => n.id === state.draft.note)?.date ?? today()}`;
    refs.replaceChildren(...state.draft.citations.map(c => h('div.reading-reference', {}, action(`Page ${c.page + 1}${c.quote ? ' · “' + c.quote.slice(0, 70) + '”' : ''}`, () => jump(c)), action('Remove reference', () => { state.draft.citations = state.draft.citations.filter(r => r.id !== c.id); changed(); render(); }))));
  };
  const add = (ref: Omit<Citation, 'id'>) => {
    if (!state.draft.citations.some(c => c.page === ref.page && c.quote === ref.quote)) state.draft.citations.push({ ...ref, id: crypto.randomUUID() });
    changed(); render();
  };
  sheet.append(h('h3', {}, 'A sheet for your thoughts'), date, title.row, subject.row, tags.row, text.row, h('p.reading-help', {}, 'Use “Cite page / selection” to attach a page or passage. Book, subject and date tags are added automatically.'), h('h4', {}, 'References'), refs,
    action('Save note to documents', async () => {
      sync(); if (!state.draft.title.trim() || !state.draft.text.trim()) throw new Error('Give your note a title and write a note before saving.');
      let note = notebook.value.notes.find(n => n.id === state.draft.note);
      const fields = { source: { ...source, page: state.page }, title: state.draft.title.trim(), subject: state.draft.subject || 'General', text: state.draft.text, tags: state.draft.tags, updated: new Date().toISOString(), citations: state.draft.citations.map(c => ({ ...c })) };
      if (!note) { note = { ...fields, id: crypto.randomUUID(), date: today() }; notebook.value.notes.unshift(note); state.draft.note = note.id; }
      else Object.assign(note, fields);
      await saveNoteDocument(note); render();
    }, true), action('Start a new note', async () => {
      const saved=notebook.value.notes.find(n=>n.id===state.draft.note);
      if (text.field.value.trim() && (!saved || saved.text!==state.draft.text || saved.title!==state.draft.title.trim() || saved.tags!==state.draft.tags || saved.subject!==state.draft.subject || JSON.stringify(saved.citations)!==JSON.stringify(state.draft.citations))) throw new Error('Save this note to your documents before starting another.');
      state.draft = { title: source.title + ' · reading notes', subject: subject.field.value, text: '', tags: '', citations: [] };
      title.field.value = state.draft.title; tags.field.value = ''; text.field.value = ''; await saveNotebook(); render();
    })); render();
  return { el: sheet, add, refresh: render };
}
