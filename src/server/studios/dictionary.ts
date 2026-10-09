/** Fixed-host, bounded dictionary requests keep book lookup inside the office. */
const cache = new Map<string, { at: number; entries: unknown[] }>();
export function dictionaryWord(value: string) {
  const word = value.trim().toLowerCase();
  if (!word || word.length > 80 || !/^[a-z]+(?:[ '-][a-z]+)*$/.test(word)) throw new Error('Enter an English word using letters, spaces, apostrophes or hyphens.');
  return word;
}
export async function dictionaryLookup(value: string): Promise<unknown[] | null> {
  const word = dictionaryWord(value), saved = cache.get(word);
  if (saved && Date.now() - saved.at < 60 * 60 * 1000) return saved.entries;
  const response = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word), { signal: AbortSignal.timeout(10000), redirect: 'error' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('The dictionary service is temporarily unavailable.');
  const reader = response.body?.getReader(); if (!reader) throw new Error('The dictionary returned no entry.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) { const { value: chunk, done } = await reader.read(); if (done) break; size += chunk.byteLength; if (size > 512 * 1024) throw new Error('The dictionary entry is too large.'); chunks.push(chunk); }
  } finally { await reader.cancel(); }
  const entries: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!Array.isArray(entries) || !entries.length || !entries.every(e => typeof e.word === 'string' && Array.isArray(e.meanings) && e.meanings.every((m: { definitions?: unknown[] }) => Array.isArray(m.definitions)))) throw new Error('The dictionary returned an unreadable entry.');
  if (cache.size >= 128) cache.delete(cache.keys().next().value!);
  cache.set(word, { at: Date.now(), entries }); return entries;
}
