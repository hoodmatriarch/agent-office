import { h } from '../../ui/dom';
import { assetUrl,type Asset } from '../facilities/data';
import { action,panel } from '../facilities/panels';
import { openFlipbook } from '../reading';
import { readVideo } from '../studios/video';
import { closeCleanup } from '../facilities/panels';
import { assigned,type ArchiveItem } from '../../../shared/resources';
export async function openResource(item:ArchiveItem,screen?:(asset:Asset)=>void) {
  const asset=item.asset;if(!asset)return;
  if(/\.(pdf|epub|txt|md)$/i.test(asset.name))return openFlipbook({id:item.id,title:item.title,asset,bucket:'organizer',subject:item.section,page:item.page});
  const p=panel(item.title,true);
  if(asset.type==='video/mp4'||/\.mp4$/i.test(asset.name))readVideo(p.body,p.modal,asset,screen);
  else if(asset.type.startsWith('image/'))p.body.append(h('img',{src:assetUrl(asset),alt:item.title,style:'max-width:100%;max-height:70vh;object-fit:contain'}));
  else if(asset.type.startsWith('audio/')){const audio=h('audio',{src:assetUrl(asset),controls:true});p.body.append(audio);closeCleanup(p.modal,()=>{audio.pause();audio.removeAttribute('src');audio.load();});}
  else p.body.append(h('p',{},'This file is stored here. Download it to open it in its editing app.'));
  p.body.append(h('a.btn',{href:assetUrl(asset,true),download:asset.name},'Download original'));
}
export function stationCards(items:ArchiveItem[],station:string,open:(item:ArchiveItem)=>unknown,search='') {
  const materials=assigned(items,station,search),out:HTMLElement[]=[];
  for(const section of [...new Set(materials.map(i=>i.section||'General'))].sort()){
    out.push(h('h3',{},section));
    for(const item of materials.filter(i=>(i.section||'General')===section))out.push(h('article.fac-card',{},h('strong',{},item.title),h('small',{},item.tags),action('Open material',()=>open(item)),h('a.btn',{href:assetUrl(item.asset!,true),download:item.asset!.name},'Download original')));
  }
  return out;
}
