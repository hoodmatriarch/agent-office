import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { STUDIO_BUCKETS,STUDIO_TYPES } from '../shared/studio-files.js';

export const BUCKETS = ['studio', 'library', 'organizer', 'records', 'locker', 'supplies', 'kitchen', 'vending', 'study', 'study-library', 'study-notices',...STUDIO_BUCKETS] as const;
export type Bucket = typeof BUCKETS[number];
export const MAX_ASSET = 80 * 1024 * 1024;
export interface Asset { id: string; name: string; type: string; size: number }
interface Saved { revision: number; value: unknown }
const TYPES: Record<string, string> = { pdf: 'application/pdf', epub: 'application/epub+zip', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', txt: 'text/plain', md: 'text/plain', csv: 'text/plain' };

/** Facilities data stays outside project checkouts. Each sign-in has its own library and records. */
export class Facilities {
  readonly dir: string;
  constructor(dataDir: string, owner: string) {
    this.dir = path.join(dataDir, 'facilities', createHash('sha256').update(owner).digest('hex').slice(0, 32));
    mkdirSync(this.dir, { recursive: true, mode: 0o700 });
  }
  get(bucket: Bucket): Saved {
    const file = path.join(this.dir, bucket + '.json');
    if (!existsSync(file)) return { revision: 0, value: null };
    return JSON.parse(readFileSync(file, 'utf8')) as Saved;
  }
  put(bucket: Bucket, revision: number, value: unknown): Saved | null {
    const current = this.get(bucket);
    if (current.revision !== revision) return null;
    const saved = { revision: revision + 1, value };
    this.atomic(bucket + '.json', JSON.stringify(saved));
    return saved;
  }
  upload(name: string, body: Buffer): Asset {
    if (!body.length || body.length > MAX_ASSET) throw new Error('Choose a non-empty file under 80 MB.');
    const safeName = path.basename(name.replace(/\\/g, '/')).replace(/[\x00-\x1f]/g, '').slice(0, 180) || 'file';
    const extension = safeName.split('.').pop()!.toLowerCase();
    const type = TYPES[extension] ?? STUDIO_TYPES[extension] ?? 'application/octet-stream';
    if (type === 'application/pdf' && body.subarray(0, 5).toString() !== '%PDF-') throw new Error('This file is not a PDF.');
    if (type === 'image/png' && body.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('This file is not a PNG.');
    const asset = { id: randomUUID(), name: safeName, type, size: body.length };
    writeFileSync(path.join(this.dir, asset.id + '.bin'), body, { mode: 0o600, flag: 'wx' });
    this.atomic(asset.id + '.json', JSON.stringify(asset));
    return asset;
  }
  file(id: string): { asset: Asset; body: Buffer } | null {
    if (!/^[0-9a-f-]{36}$/.test(id)) return null;
    const meta = path.join(this.dir, id + '.json');
    if (!existsSync(meta)) return null;
    return { asset: JSON.parse(readFileSync(meta, 'utf8')) as Asset, body: readFileSync(path.join(this.dir, id + '.bin')) };
  }
  private atomic(file: string, text: string) {
    const dest = path.join(this.dir, file), temp = dest + '.' + randomUUID() + '.tmp';
    writeFileSync(temp, text, { mode: 0o600 }); renameSync(temp, dest);
  }
}
