export const MAX_UPLOAD_BYTES=512*1024*1024;
export const DISK_RESERVE_BYTES=2*1024*1024*1024;
export const MAX_CONCURRENT_UPLOADS=2;
export const uploadLimitLabel='512 MB';
export function formatBytes(bytes:number){
  const units=['B','KB','MB','GB','TB'];let n=Math.max(0,bytes),i=0;
  while(n>=1024&&i<units.length-1){n/=1024;i++;}
  return `${n.toFixed(i===0?0:n>=100?0:1)} ${units[i]}`;
}
export interface StorageSnapshot {
  files:number; originalsBytes:number; cabinetBytes:number; types:{type:string;files:number;bytes:number}[];
  largest:{id:string;name:string;type:string;size:number}[];
  disk:{total:number;free:number;reserve:number}|null;
  memory:{server:number;heap:number;machineTotal:number;machineFree:number};
  limits:{file:number;concurrentUploads:number}; time:string;
}
