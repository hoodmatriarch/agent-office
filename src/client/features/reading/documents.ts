import { h, toast } from '../../ui/dom';
import { action, panel } from '../facilities/panels';
import { Collection, upload, type Asset } from '../facilities/data';
import { noteMarkdown, readingTags, type ReadingNote, type Citation } from '../../../shared/reading';
import { notebook, saveNotebook } from './store';
interface DocumentItem { id: string; title: string; folder: string; tags: string; note: string; asset?: Asset; url?: string; readingNote?: string }
type Reader = (note: ReadingNote, citation: Citation) => Promise<void>;
let readCitation: Reader;
export const readingDocumentTools = new Map<string, (item: DocumentItem) => HTMLElement[]>();
export function registerReadingDocuments(read: Reader) {
  readCitation = read;
  readingDocumentTools.set('reading-notes', item => item.readingNote ? [action('Open reading note & citations', () => openReadingNote(item.readingNote!))] : []);
}
export function documentReadingActions(item: DocumentItem, beforeOpen?:()=>void) {
  const buttons=[...readingDocumentTools.values()].flatMap(tool => tool(item));
  if(beforeOpen)for(const button of buttons){const click=button.onclick;button.onclick=e=>{beforeOpen();return click?.call(button,e);};}
  return buttons;
}
export async function saveNoteDocument(note: ReadingNote) {
  await saveNotebook();
  const documents = new Collection<DocumentItem[]>('organizer', []); await documents.load();
  const asset = await upload(new File([noteMarkdown(note, location.origin)], note.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 100) + '.md', { type: 'text/markdown' }));
  let item = documents.value.find(i => i.readingNote === note.id);
  if (!item) { item = { id: crypto.randomUUID(), title: note.title, folder: '', tags: '', note: '' }; documents.value.unshift(item); }
  Object.assign(item, { title: note.title, folder: 'Reading notes / ' + (note.subject || 'General'), tags: readingTags(note), note: note.text.slice(0, 4000), asset, readingNote: note.id });
  await documents.save(); note.document = item.id; await saveNotebook(); toast('Reading note saved to your documents with tags and citations.');
}
export async function openReadingNote(id: string, citationId?: string) {
  await notebook.load(); const note = notebook.value.notes.find(n => n.id === id); if (!note) throw new Error('This reading note could not be found in your signed-in cabinet.');
  const citation = note.citations.find(c => c.id === citationId);
  if (citation) return readCitation(note, citation);
  const p = panel('📝 ' + note.title, true); p.body.append(h('small', {}, readingTags(note)), h('div.reading-saved-note', {}, note.text), h('h3', {}, 'Book references'));
  for (const ref of note.citations) p.body.append(action(`${note.source.title} · page ${ref.page + 1}${ref.quote ? ' · “' + ref.quote.slice(0, 90) + '”' : ''}`, () => { p.modal.close(); return readCitation(note, ref); }));
  if (!note.citations.length) p.body.append(h('p', {}, 'This note has no book references yet.'));
}
