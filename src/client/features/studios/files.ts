import { h } from '../../ui/dom';
import { panel,action,chooseFile } from './panels';
import { Collection,upload,assetUrl,request,type Asset } from '../facilities/data';
export function download(name:string,body:BlobPart,type='text/plain') {
  const url=URL.createObjectURL(new Blob([body],{type}));h('a',{href:url,download:name}).click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const post=(url:string,body:unknown)=>request(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
export const launch=(app:string,asset?:Asset)=>post('/api/studios/launch',{app,asset:asset?.id});
export const webLink=(label:string,url:string)=>h('a.btn',{href:url,target:'_blank',rel:'noopener noreferrer'},label);
export class ProjectFiles {
  readonly data=new Collection<{station:string;asset:Asset;display?:boolean}[]>('craft-projects',[]);
  async open(station:string,onDisplay:(asset:Asset)=>Promise<void>) {
    await this.data.load();const p=panel('📁 '+station+' · files & patterns',true),list=h('div.fac-grid');
    const render=()=>list.replaceChildren(...this.data.value.filter(f=>f.station===station).map(f=>h('article.fac-card',{},h('strong',{},f.asset.name),h('a.btn',{href:assetUrl(f.asset,true),download:f.asset.name},'Download'),/\.(glb|stl)$/i.test(f.asset.name)?action('Display prototype',()=>onDisplay(f.asset)):null,/\.blend$/i.test(f.asset.name)?action('Open in Blender',()=>launch('blender',f.asset)):null,/\.(png|jpg|jpeg)$/i.test(f.asset.name)?h('img',{src:assetUrl(f.asset),alt:f.asset.name}):null)));
    p.body.append(h('p',{},'Keep concept sketches, Blender projects, patterns, CAD sources and finished models here. Files stay in your personal office vault, outside GitHub.'),chooseFile('.pdf,.png,.jpg,.jpeg,.webp,.blend,.glb,.stl,.scad,.step,.stp,.dxf,.svg,.zip',async file=>{const asset=await upload(file);this.data.value.push({station,asset});await this.data.save();render();}),list);render();
  }
}
