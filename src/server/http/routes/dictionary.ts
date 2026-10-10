import type { Route } from '../router.js';
import { send } from '../util.js';
import { dictionaryWord, dictionaryLookup } from '../../studios/dictionary.js';
let active = 0;
export const dictionaryRoute: Route = { prefix: '/api/dictionary', auth: 'session', async handle(_ctx, { req, res, path }) {
  if (path !== '/api/dictionary') return send(res, 404, { error: 'Not found' });
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  let word: string;
  try { word = dictionaryWord(new URL(req.url!, 'http://office.local').searchParams.get('word') ?? ''); }
  catch (e) { return send(res, 400, { error: (e as Error).message }); }
  if (active >= 8) return send(res, 429, { error: 'The dictionary is busy. Try again in a moment.' });
  active++;
  try { const entries = await dictionaryLookup(word); return entries ? send(res, 200, entries) : send(res, 404, { error: 'No dictionary entry found.' }); }
  catch { return send(res, 503, { error: 'Unable to reach the dictionary. Check the office computer’s internet connection and try again.' }); }
  finally { active--; }
} };
