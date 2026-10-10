import type { READING_BUCKETS } from '../../../shared/reading';
import { MAX_UPLOAD_BYTES,uploadLimitLabel } from '../../../shared/capacity';
import { sendUpload } from '../capacity/transfers';
import type { STUDIO_BUCKETS } from '../../../shared/studio-files';
export type Bucket = 'studio' | 'library' | 'organizer' | 'records' | 'locker' | 'supplies' | 'kitchen' | 'vending' | 'study' | 'study-library' | 'study-notices' | typeof STUDIO_BUCKETS[number] | typeof READING_BUCKETS[number];
export interface Asset { id: string; name: string; type: string; size: number }
export class Collection<T> {
  revision = 0;
  private saving: Promise<void> = Promise.resolve();
  constructor(readonly bucket: Bucket, public value: T) {}
  async load() {
    await this.saving.catch(() => {});
    const saved = await request(`/api/facilities/state?bucket=${this.bucket}`);
    this.revision = saved.revision; if (saved.value !== null) this.value = saved.value as T;
    return this.value;
  }
  save() {
    const next = this.saving.catch(() => {}).then(async () => {
      const saved = await request(`/api/facilities/state?bucket=${this.bucket}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ revision: this.revision, value: this.value }) });
      this.revision = saved.revision;
    });
    this.saving = next;
    return next;
  }
}
export async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? 'The office could not save this.');
  return body;
}
export const assetUrl = (asset: Asset, download = false) => `/api/facilities/file?id=${encodeURIComponent(asset.id)}${download ? '&download=1' : ''}`;
export const upload = async (file: File): Promise<Asset> => {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`Choose a file up to ${uploadLimitLabel}.`);
  return sendUpload(file);
};
