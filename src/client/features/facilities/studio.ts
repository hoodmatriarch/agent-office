import { h, toast } from '../../ui/dom';
import { Collection, upload, assetUrl, type Asset } from './data';
import { action, chooseFile, input, panel, closeCleanup } from './panels';
type Tool = 'brush' | 'eraser' | 'line' | 'rectangle' | 'ellipse' | 'text';
interface Stroke { tool: Tool; color: string; width: number; points: [number, number][]; text?: string }
interface Art { title: string; background: string; strokes: Stroke[]; gallery: Asset[] }

export class Studio {
  readonly canvas = document.createElement('canvas');
  readonly data = new Collection<Art>('studio', { title: 'My sketch desk', background: '#fffaf0', strokes: [], gallery: [] });
  private timer = 0;
  private saving = false;
  private dirty = false;
  private status: HTMLElement | null = null;
  private redo: Stroke[] = [];
  constructor(private readonly changed: () => void) { this.canvas.width = 1200; this.canvas.height = 750; }
  async load() { await this.data.load(); this.render(); }
  render(extra?: Stroke) {
    const g = this.canvas.getContext('2d')!;
    g.fillStyle = this.data.value.background; g.fillRect(0, 0, 1200, 750);
    for (const s of [...this.data.value.strokes, ...(extra ? [extra] : [])]) {
      const first = s.points[0], last = s.points[s.points.length - 1]; if (!first) continue;
      g.strokeStyle = s.tool === 'eraser' ? this.data.value.background : s.color; g.fillStyle = s.color; g.lineWidth = s.width; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      if (s.tool === 'text') { g.font = `${Math.max(18, s.width * 5)}px sans-serif`; g.fillText(s.text ?? '', first[0], first[1]); }
      else if (s.tool === 'rectangle') g.strokeRect(first[0], first[1], last[0] - first[0], last[1] - first[1]);
      else if (s.tool === 'ellipse') { g.ellipse((first[0] + last[0]) / 2, (first[1] + last[1]) / 2, Math.max(.1, Math.abs(last[0] - first[0]) / 2), Math.max(.1, Math.abs(last[1] - first[1]) / 2), 0, 0, Math.PI * 2); g.stroke(); }
      else { g.moveTo(first[0], first[1]); for (const p of s.points.slice(1)) g.lineTo(p[0], p[1]); if (s.points.length === 1) g.lineTo(first[0] + .1, first[1]); g.stroke(); }
    }
    this.changed();
  }
  private mark() { this.dirty = true; this.status!.textContent = 'Saving…'; clearTimeout(this.timer); this.timer = window.setTimeout(() => void this.save(), 700); }
  private async save() {
    if (this.saving || !this.dirty) return;
    this.saving = true; this.dirty = false; let failed = false;
    try { await this.data.save(); if (this.status) this.status.textContent = 'Saved locally · art stays on the desk'; }
    catch (error) { failed = true; this.dirty = true; if (this.status) this.status.textContent = 'Save failed · keep this window open and retry'; toast((error as Error).message, 'error'); }
    finally { this.saving = false; if (this.dirty && !failed) void this.save(); }
  }
  async open() {
    await this.load();
    const { body, modal } = panel('🎨 Drawing studio', true);
    const title = input('Artwork name', this.data.value.title);
    this.status = h('p.fac-note', {}, 'Saved locally · art stays on the desk');
    let tool: Tool = 'brush', stroke: Stroke | null = null;
    const color = h('input', { type: 'color', value: '#24483c', 'aria-label': 'Brush color' });
    const paper = h('input', { type: 'color', value: this.data.value.background, 'aria-label': 'Paper color' });
    const size = h('input', { type: 'range', min: 1, max: 30, value: 5, 'aria-label': 'Brush size' });
    const text = input('Text to place on drawing', 'My idea');
    const tools = h('div.fac-toolbar');
    for (const name of ['brush', 'eraser', 'line', 'rectangle', 'ellipse', 'text'] as Tool[]) {
      const b = action(name, () => { tool = name; for (const button of tools.querySelectorAll('button')) button.classList.toggle('on', button === b); }); if (name === 'brush') b.classList.add('on'); tools.append(b);
    }
    const point = (event: PointerEvent): [number, number] => { const box = this.canvas.getBoundingClientRect(); return [Math.round((event.clientX - box.left) / box.width * 1200), Math.round((event.clientY - box.top) / box.height * 750)]; };
    this.canvas.className = 'studio-canvas'; this.canvas.setAttribute('aria-label', 'Drawing canvas');
    this.canvas.onpointerdown = event => {
      if (event.button !== 0 || this.data.value.strokes.length >= 1500) return;
      this.canvas.setPointerCapture(event.pointerId); stroke = { tool, color: color.value, width: Number(size.value), points: [point(event)], text: text.field.value.slice(0, 300) }; this.render(stroke);
    };
    this.canvas.onpointermove = event => { if (!stroke) return; const p = point(event); if (['brush', 'eraser'].includes(stroke.tool)) { if (stroke.points.length < 2000) stroke.points.push(p); } else stroke.points[1] = p; this.render(stroke); };
    const end = () => { if (!stroke) return; this.data.value.strokes.push(stroke); stroke = null; this.redo = []; this.render(); this.mark(); };
    this.canvas.onpointerup = end; this.canvas.onpointercancel = end;
    title.field.oninput = () => { this.data.value.title = title.field.value.slice(0, 100); this.mark(); };
    paper.oninput = () => { this.data.value.background = paper.value; this.render(); this.mark(); };
    const png = () => new Promise<Blob>((resolve, reject) => this.canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not export drawing')), 'image/png'));
    const exportPng = async () => {
      const blob = await png(), url = URL.createObjectURL(blob); const a = h('a', { href: url, download: (this.data.value.title || 'Sketch') + '.png' }); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const shelf = h('div.fac-grid');
    const gallery = () => { shelf.replaceChildren(...this.data.value.gallery.map(asset => h('article.fac-card', {}, h('img', { src: assetUrl(asset), alt: asset.name }), h('p', {}, asset.name), h('a.btn', { href: assetUrl(asset, true), download: asset.name }, 'Download PNG')))); };
    body.append(h('p', {}, 'Draw here, close the window, and your art stays displayed on the drawing desk. Changes save automatically.'), title.row, tools, h('div.fac-toolbar', {}, h('label', {}, 'Ink ', color), h('label', {}, 'Size ', size), h('label', {}, 'Paper ', paper)), text.row, this.canvas,
      h('div.fac-toolbar', {}, action('Undo', () => { const last = this.data.value.strokes.pop(); if (last) this.redo.push(last); this.render(); this.mark(); }), action('Redo', () => { const last = this.redo.pop(); if (last) this.data.value.strokes.push(last); this.render(); this.mark(); }), action('Save now', () => this.save()), action('Download PNG', exportPng), action('Save PNG to art shelf', async () => { await this.save(); const blob = await png(); const file = await upload(new File([blob], (this.data.value.title || 'Sketch') + '.png', { type: 'image/png' })); this.data.value.gallery.unshift(file); await this.data.save(); gallery(); toast('Artwork saved to your shelf.'); }), action('New blank canvas', () => { if (!window.confirm('Clear this canvas? Download or save it to the shelf first if you want to keep it.')) return; this.data.value.strokes = []; this.redo = []; this.render(); this.mark(); })), this.status, h('h3', {}, 'Your saved artwork'), shelf);
    gallery();
    closeCleanup(modal, () => { end(); clearTimeout(this.timer); void this.save(); this.status = null; this.canvas.onpointerdown = this.canvas.onpointermove = this.canvas.onpointerup = this.canvas.onpointercancel = null; });
  }
}
