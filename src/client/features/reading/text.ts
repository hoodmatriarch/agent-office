import { unzipSync, strFromU8 } from 'fflate';
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

