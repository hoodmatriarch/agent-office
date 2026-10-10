import type { ReadingAsset } from './reading.js';
export const STATIONS = {
  'break-library':'Break-floor library', 'study-library':'Study hall',
  music:'Music studio', writing:'Writing desk', sketch:'Sketch desk', sketchbooks:'Sketchbooks & gallery', moodboards:'Mood boards', textiles:'Textiles / sewing',
  jewellery:'Jewellery / silversmithing', sculpture:'Sculpture', woodwork:'Woodworking', leather:'Leather work',
} as const;
export interface ArchiveItem {
  id:string; title:string; folder:string; tags:string; note:string; asset?:ReadingAsset; url?:string;
  stations?:string[]; section?:string; legacyRefs?:string[]; page?:number;
}
export interface LegacyResource { id:string; title:string; asset:ReadingAsset; page?:number; station?:string; section?:string; }
export function assigned(items:ArchiveItem[],station:string,search='') {
  const q=search.toLowerCase();
  return items.filter(i=>i.asset && i.stations?.includes(station) && `${i.title} ${i.section??''} ${i.tags} ${i.note}`.toLowerCase().includes(q));
}
/** Import shelf metadata once. Remember its source so removing an assignment stays removed. */
export function importShelves(items:ArchiveItem[], shelves:{bucket:string;station?:string;books:LegacyResource[]}[],newId:()=>string) {
  let changed=false;
  for(const shelf of shelves) for(const book of shelf.books) {
    if(!book.asset?.id)continue;
    const ref=`${shelf.bucket}:${book.id}`,station=shelf.station??book.station;
    let item=items.find(i=>i.asset?.id===book.asset.id);
    if(item?.legacyRefs?.includes(ref))continue;
    if(!item){item={id:newId(),title:book.title,folder:'Library archives',tags:'',note:'',asset:book.asset,page:book.page,section:book.section||'General'};items.push(item);}
    item.legacyRefs=[...(item.legacyRefs??[]),ref];
    if(station && station in STATIONS)item.stations=[...new Set([...(item.stations??[]),station])];
    changed=true;
  }
  return changed;
}
