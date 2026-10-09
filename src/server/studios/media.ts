import type { ServerResponse } from 'node:http';
import type { Asset } from '../facilities.js';
export function serveMedia(res:ServerResponse,asset:Asset,body:Buffer,range:string|undefined,download:boolean) {
  const inline=!download&&/^(image\/(?!svg)|video\/|audio\/|application\/pdf|text\/plain)/.test(asset.type);
  const headers:Record<string,string|number>={'content-type':asset.type,'accept-ranges':'bytes','cache-control':'private, no-cache','x-content-type-options':'nosniff','cross-origin-resource-policy':'same-origin','content-security-policy':"default-src 'none'; sandbox",'content-disposition':`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(asset.name)}`};
  if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);let start=0,end=body.length-1;
    if(match&&(match[1]||match[2])) {if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}else start=Math.max(0,body.length-Number(match[2]));}
    else start=body.length;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=body.length||end<start){res.writeHead(416,{...headers,'content-range':`bytes */${body.length}`});return res.end();}
    res.writeHead(206,{...headers,'content-length':end-start+1,'content-range':`bytes ${start}-${end}/${body.length}`});return res.end(body.subarray(start,end+1));
  }
  res.writeHead(200,{...headers,'content-length':body.length});return res.end(body);
}
