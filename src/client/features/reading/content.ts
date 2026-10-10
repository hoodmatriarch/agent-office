import type { PDFDocumentProxy, RenderTask, TextLayer } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { assetUrl, type Asset } from '../facilities/data';
import { h } from '../../ui/dom';
import { textPages, epubText } from './text';
export interface BookContent { total: number; render(page: number, width: number): Promise<HTMLElement>; close(): void }
const pageCleanup=new WeakMap<HTMLElement,()=>void>();
export function releasePage(page:HTMLElement){pageCleanup.get(page)?.();pageCleanup.delete(page);}
export async function openContent(asset: Asset, signal: AbortSignal): Promise<BookContent> {
  const response = await fetch(assetUrl(asset), { signal }); if (!response.ok) throw new Error('The original book could not be loaded.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (asset.type !== 'application/pdf') {
    const pages = textPages(/\.epub$/i.test(asset.name) ? epubText(bytes) : new TextDecoder().decode(bytes));
    return { total: pages.length, async render(page, width) {
      const leaf = h('article.reading-page', { 'data-reading-page': page, 'aria-label': `Book page ${page + 1}`, style: `width:${width}px;min-height:${width * 1.3}px` });
      leaf.append(h('div.reading-text.reading-prose', {}, pages[page]), h('small.reading-page-number', {}, page + 1)); return leaf;
    }, close() {} };
  }
  const api = await import('pdfjs-dist'); api.GlobalWorkerOptions.workerSrc = workerUrl;
  const loading = api.getDocument({ data: bytes, useSystemFonts: true });
  const abort = () => { void loading.destroy(); }; signal.addEventListener('abort', abort, { once: true });
  let pdf: PDFDocumentProxy;
  try { pdf = await loading.promise; } catch (e) { signal.removeEventListener('abort', abort); throw e; }
  const tasks = new Set<RenderTask>(), layers = new Set<TextLayer>(); let closed = false;
  return { total: pdf.numPages, async render(page, width) {
    if (closed) throw new Error('The book is closed.');
    const sheet = await pdf.getPage(page + 1), base = sheet.getViewport({ scale: 1 });
    const viewport = sheet.getViewport({ scale: Math.min(width / base.width, 4000 / base.height) });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8000000 / (viewport.width * viewport.height)));
    const leaf = h('article.reading-page.reading-pdf', { 'data-reading-page': page, 'aria-label': `Book page ${page + 1}`, style: `width:${viewport.width}px;height:${viewport.height}px;--total-scale-factor:${viewport.scale}` });
    const canvas = h('canvas', { 'aria-label': `Original PDF page ${page + 1}` }); canvas.width = Math.ceil(viewport.width * pixelRatio); canvas.height = Math.ceil(viewport.height * pixelRatio);
    canvas.style.width = viewport.width + 'px'; canvas.style.height = viewport.height + 'px';
    const text = h('div.reading-text.reading-pdf-text', { 'aria-label': 'Selectable book text' }); leaf.append(canvas, text);
    const task = sheet.render({ canvas, viewport, transform: [pixelRatio, 0, 0, pixelRatio, 0, 0] }); tasks.add(task);
    try {
      await task.promise; if (closed) throw new Error('The book is closed.');
      const layer = new api.TextLayer({ textContentSource: await sheet.getTextContent(), container: text, viewport }); layers.add(layer); await layer.render();
      pageCleanup.set(leaf,()=>{layer.cancel();layers.delete(layer);});
      return leaf;
    } finally { tasks.delete(task); }
  }, close() {
    closed = true; signal.removeEventListener('abort', abort); tasks.forEach(t => t.cancel()); layers.forEach(l => l.cancel()); layers.clear(); void loading.destroy();
  } };
}
