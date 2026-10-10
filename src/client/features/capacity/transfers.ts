import type { Asset } from '../facilities/data';
import { MAX_UPLOAD_BYTES,uploadLimitLabel } from '../../../shared/capacity';
export interface Transfer {id:string;name:string;sent:number;total:number;finished:boolean;error?:string}
export const transferListeners=new Set<(transfer:Transfer)=>void>();
/** XMLHttpRequest streams a browser File and supplies progress without reading it into JS memory. */
export function sendUpload(file:File):Promise<Asset>{
  if(file.size>MAX_UPLOAD_BYTES)return Promise.reject(Error(`Choose a file up to ${uploadLimitLabel}.`));
  const transfer:Transfer={id:crypto.randomUUID(),name:file.name,sent:0,total:file.size,finished:false};
  const notify=()=>transferListeners.forEach(fn=>fn({...transfer}));
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();xhr.open('POST',`/api/facilities/upload?name=${encodeURIComponent(file.name)}`);xhr.responseType='json';xhr.timeout=10*60*1000;
    const fail=(message:string)=>{transfer.finished=true;transfer.error=message;notify();reject(Error(message));};
    xhr.upload.onprogress=e=>{transfer.sent=e.loaded;notify();};
    xhr.onload=()=>{if(xhr.status<200||xhr.status>=300||!xhr.response?.id)return fail(xhr.response?.error??'The upload could not be saved. Try again.');transfer.sent=file.size;transfer.finished=true;notify();resolve(xhr.response as Asset);};
    xhr.onerror=()=>fail('The upload connection was interrupted. Try again.');xhr.ontimeout=()=>fail('The upload timed out. Try again.');xhr.onabort=()=>fail('The upload was cancelled.');
    notify();xhr.send(file);
  });
}
