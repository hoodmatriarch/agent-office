import { createReadStream } from 'node:fs';
import type { ServerResponse } from 'node:http';
import type { Asset } from '../facilities.js';
export function byteRange(range:string|undefined,size:number):{start:number;end:number}|null|false {
  if(!range)return null;
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);let start=0,end=size-1;
  if(!match||(!match[1]&&!match[2]))return false;
  if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}else{const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return false;start=Math.max(0,size-suffix);}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return false;
  return {start,end};
}
export function streamMedia(res:ServerResponse,asset:Asset,file:string,range:string|undefined,download:boolean){
  const inline=!download&&/^(image\/(?!svg)|video\/|audio\/|application\/pdf|text\/plain)/.test(asset.type);
  const headers:Record<string,string|number>={'content-type':asset.type,'accept-ranges':'bytes','cache-control':'private, no-cache','x-content-type-options':'nosniff','cross-origin-resource-policy':'same-origin','content-security-policy':"default-src 'none'; sandbox",'content-disposition':`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(asset.name)}`};
  const part=byteRange(range,asset.size);
  if(part===false){res.writeHead(416,{...headers,'content-range':`bytes */${asset.size}`});res.end();return;}
  const start=part?.start??0,end=part?.end??asset.size-1;
  const stream=createReadStream(file,{start,end,highWaterMark:64*1024});
  res.writeHead(part?206:200,{...headers,'content-length':end-start+1,...(part?{'content-range':`bytes ${start}-${end}/${asset.size}`}:{})});
  res.once('close',()=>stream.destroy());stream.once('error',()=>res.destroy());stream.pipe(res);
}
