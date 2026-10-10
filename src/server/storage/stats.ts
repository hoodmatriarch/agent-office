import { readdir,stat,readFile,statfs } from 'node:fs/promises';
import { freemem,totalmem } from 'node:os';
import path from 'node:path';
import { DISK_RESERVE_BYTES,MAX_UPLOAD_BYTES,MAX_CONCURRENT_UPLOADS,type StorageSnapshot } from '../../shared/capacity.js';
import type { Asset } from '../facilities.js';
/** Metadata inspection only: never load original media to measure the cabinet. */
export async function storageSnapshot(dir:string):Promise<StorageSnapshot>{
  let cabinetBytes=0;const assets:Asset[]=[];
  async function walk(folder:string){
    for(const entry of await readdir(folder,{withFileTypes:true})){
      const file=path.join(folder,entry.name);
      if(entry.isDirectory())await walk(file);
      else if(entry.isFile()){
        const info=await stat(file).catch(error=>{if(error.code==='ENOENT')return null;throw error;});if(!info)continue;cabinetBytes+=info.size;
        if(folder===dir&&/^[0-9a-f-]{36}\.json$/.test(entry.name)&&info.size<4096){
          try{const asset=JSON.parse(await readFile(file,'utf8')) as Asset;
            if(typeof asset.name==='string'&&typeof asset.type==='string'&&asset.id+'.json'===entry.name){const original=await stat(path.join(dir,asset.id+'.bin'));assets.push({...asset,size:original.size});}
          }catch{/* A simultaneous upload or stale metadata is not an inventory item. */}
        }
      }
    }
  }await walk(dir);
  const types=new Map<string,{type:string;files:number;bytes:number}>();
  for(const asset of assets){const type=asset.type==='application/pdf'?'PDF books':asset.type.startsWith('video/')?'Video':asset.type.startsWith('audio/')?'Audio':asset.type.startsWith('image/')?'Images':'Other files';const row=types.get(type)??{type,files:0,bytes:0};row.files++;row.bytes+=asset.size;types.set(type,row);}
  let disk:StorageSnapshot['disk']=null;try{const d=await statfs(dir);disk={total:d.blocks*d.bsize,free:d.bavail*d.bsize,reserve:DISK_RESERVE_BYTES};}catch{/* Some network filesystems do not report disk capacity. */}
  const memory=process.memoryUsage();return {files:assets.length,originalsBytes:assets.reduce((n,a)=>n+a.size,0),cabinetBytes,types:[...types.values()].sort((a,b)=>b.bytes-a.bytes),largest:assets.sort((a,b)=>b.size-a.size).slice(0,12),disk,memory:{server:memory.rss,heap:memory.heapUsed,machineTotal:totalmem(),machineFree:freemem()},limits:{file:MAX_UPLOAD_BYTES,concurrentUploads:MAX_CONCURRENT_UPLOADS},time:new Date().toISOString()};
}
