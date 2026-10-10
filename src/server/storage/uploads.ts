import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { open,rename,writeFile,unlink,statfs } from 'node:fs/promises';
import { Readable,Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { MAX_UPLOAD_BYTES,DISK_RESERVE_BYTES,MAX_CONCURRENT_UPLOADS,uploadLimitLabel } from '../../shared/capacity.js';
import { STUDIO_TYPES } from '../../shared/studio-files.js';
import type { Asset } from '../facilities.js';
const TYPES:Record<string,string>={pdf:'application/pdf',epub:'application/epub+zip',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',txt:'text/plain',md:'text/plain',csv:'text/plain'};
export class UploadError extends Error {constructor(message:string,readonly status:number){super(message);}}
let active=0,reserved=0;
export function describeAsset(name:string,size:number,id=randomUUID()):Asset {
  const safe=path.basename(name.replace(/\\/g,'/')).replace(/[\x00-\x1f]/g,'').slice(0,180)||'file';
  return {id,name:safe,size,type:TYPES[safe.split('.').pop()!.toLowerCase()]??STUDIO_TYPES[safe.split('.').pop()!.toLowerCase()]??'application/octet-stream'};
}
export function validateAsset(asset:Asset,prefix:Buffer){
  if(asset.type==='application/pdf'&&prefix.subarray(0,5).toString()!=='%PDF-')throw new UploadError('This file is not a PDF.',400);
  if(asset.type==='image/png'&&prefix.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new UploadError('This file is not a PNG.',400);
}
/** Stream into a private staging file. Only publish metadata once validation succeeds. */
export async function uploadStream(dir:string,name:string,source:Readable,declared?:number):Promise<Asset>{
  if(declared!==undefined&&(!Number.isSafeInteger(declared)||declared<0||declared>MAX_UPLOAD_BYTES))throw new UploadError(`Files may be up to ${uploadLimitLabel}.`,413);
  if(active>=MAX_CONCURRENT_UPLOADS)throw new UploadError('Two uploads are running. Wait for one to finish, then try again.',429);
  const claim=declared??MAX_UPLOAD_BYTES;active++;reserved+=claim;
  const asset=describeAsset(name,0),base=path.join(dir,asset.id),staged=base+'.upload',metadata=base+'.json.upload';
  let published=false;
  try{
    const disk=await statfs(dir),free=disk.bavail*disk.bsize;
    if(free-reserved<DISK_RESERVE_BYTES)throw new UploadError('There is not enough free disk space. Keep at least 2 GB free, then try again.',507);
    let bytes=0;
    const meter=new Transform({transform(chunk:Buffer,_encoding,done){bytes+=chunk.length;
      if(bytes>MAX_UPLOAD_BYTES||(declared!==undefined&&bytes>declared))return done(new UploadError(`Files may be up to ${uploadLimitLabel}; upload size was exceeded.`,413));
      done(null,chunk);
    }});
    await pipeline(source,meter,createWriteStream(staged,{flags:'wx',mode:0o600,highWaterMark:64*1024}));
    if(!bytes)throw new UploadError('Choose a non-empty file.',400);
    if(declared!==undefined&&bytes!==declared)throw new UploadError('The upload was incomplete. Try again.',400);
    asset.size=bytes;const file=await open(staged,'r');const prefix=Buffer.alloc(8);try{await file.read(prefix,0,8,0);}finally{await file.close();}validateAsset(asset,prefix);
    await writeFile(metadata,JSON.stringify(asset),{flag:'wx',mode:0o600});await rename(staged,base+'.bin');published=true;await rename(metadata,base+'.json');return asset;
  }catch(error){await Promise.all([unlink(staged).catch(()=>{}),unlink(metadata).catch(()=>{}),...(published?[unlink(base+'.bin').catch(()=>{})]:[])]);throw error;}
  finally{active--;reserved-=claim;}
}
