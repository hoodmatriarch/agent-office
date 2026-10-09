import { BUCKETS, Facilities, MAX_ASSET, type Bucket } from '../../facilities.js';
import { readBytes, readBody, sameOrigin, send } from '../util.js';
import type { Route } from '../router.js';
import { serveMedia } from '../../studios/media.js';

export const facilitiesRoute: Route = {
  prefix: '/api/facilities/', auth: 'session',
  async handle(ctx, { req, res, url, path, session }) {
    const vault = new Facilities(ctx.cfg.dataDir, session.account?.id ?? 'shared-office');
    if (req.method === 'POST' && !sameOrigin(req, ctx.cfg)) return send(res, 403, { error: 'Forbidden' });
    try {
      if (path === '/api/facilities/state') {
        const bucket = url.searchParams.get('bucket') as Bucket;
        if (!BUCKETS.includes(bucket)) return send(res, 400, { error: 'Unknown collection' });
        if (req.method === 'GET') return send(res, 200, vault.get(bucket));
        if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
        const body = JSON.parse(await readBody(req, 2 * 1024 * 1024));
        if (!Number.isSafeInteger(body.revision) || body.revision < 0 || !Object.hasOwn(body, 'value')) return send(res, 400, { error: 'Invalid save' });
        const saved = vault.put(bucket, body.revision, body.value);
        return saved ? send(res, 200, saved) : send(res, 409, { error: 'Another window saved changes. Reload this collection before saving again.' });
      }
      if (path === '/api/facilities/upload' && req.method === 'POST') {
        if (Number(req.headers['content-length']) > MAX_ASSET) return send(res, 413, { error: 'Files may be up to 80 MB.' });
        const body = await readBytes(req, MAX_ASSET);
        return send(res, 200, vault.upload(url.searchParams.get('name') ?? '', body));
      }
      if (path === '/api/facilities/file' && req.method === 'GET') {
        const file = vault.file(url.searchParams.get('id') ?? '');
        if (!file) return send(res, 404, { error: 'File not found' });
        const { asset, body } = file;
        return serveMedia(res,asset,body,req.headers.range,url.searchParams.get('download')==='1');
      }
      return send(res, 404, { error: 'Not found' });
    } catch (error) {
      const message = (error as Error).message;
      return send(res, message === 'too large' ? 413 : 400, { error: message === 'too large' ? 'Files may be up to 80 MB.' : message });
    }
  },
};
