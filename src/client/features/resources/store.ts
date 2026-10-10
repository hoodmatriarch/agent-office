import { Collection, upload, type Bucket } from '../facilities/data';
import { importShelves,type ArchiveItem,type LegacyResource } from '../../../shared/resources';
export async function archiveStore() {
  const data=new Collection<ArchiveItem[]>('organizer',[]);await data.load();
  const specs:[Bucket,string?][]=[['library','break-library'],['study-library','study-library'],['creative-library'],['craft-library']];
  const shelves=await Promise.all(specs.map(async([bucket,station])=>{const old=new Collection<LegacyResource[]>(bucket,[]);await old.load();return {bucket,station,books:old.value};}));
  if(importShelves(data.value,shelves,()=>crypto.randomUUID()))await data.save();
  return data;
}
export async function archiveUpload(file:File,station:string,section='General',tags='') {
  const data=await archiveStore(),asset=await upload(file);
  const item:ArchiveItem={id:crypto.randomUUID(),title:file.name.replace(/\.[^.]+$/,''),folder:'Library archives',tags:tags.slice(0,300),note:'',asset,stations:[station],section:section.trim().slice(0,160)||'General',page:0};
  data.value.unshift(item);await data.save();return item;
}
