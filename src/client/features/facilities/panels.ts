import { h, openModal, toast, type Modal } from '../../ui/dom';
export function panel(title: string, wide = false) {
  const body = h('div.body.fac-body');
  const root = h('section.modal.fac-panel', { role: 'dialog', 'aria-label': title }, h('header', {}, h('h2', {}, title)), body);
  if (wide) root.classList.add('wide');
  const modal = openModal(root, { doing: title });
  return { body, root, modal };
}
export function action(text: string, run: () => unknown | Promise<unknown>, primary = false) {
  const button = h('button.btn', { type: 'button' }, text);
  if (primary) button.classList.add('primary');
  button.onclick = async () => { button.disabled = true; try { await run(); } catch (error) { toast((error as Error).message, 'error'); } finally { button.disabled = false; } };
  return button;
}
export function input(label: string, value = '', multiline = false) {
  const field = multiline ? h('textarea', { rows: 5 }) : h('input', { type: 'text' });
  field.value = value; field.setAttribute('aria-label', label);
  return { field, row: h('label', {}, label, field) };
}
export function chooseFile(accept: string, use: (file: File) => Promise<void>) {
  const field = h('input', { type: 'file', accept, 'aria-label': 'Choose a file' });
  field.onchange = async () => { if (field.files?.[0]) { try { await use(field.files[0]); } catch (error) { toast((error as Error).message, 'error'); } finally { field.value = ''; } } };
  return field;
}
export function closeCleanup(modal: Modal, dispose: () => void) { const close = modal.close.bind(modal); modal.close = () => { dispose(); close(); }; }
