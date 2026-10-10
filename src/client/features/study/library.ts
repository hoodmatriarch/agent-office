import { h,toast } from '../../ui/dom';
import { Collection,upload,assetUrl,type Asset } from '../facilities/data';
import { action,panel,input,chooseFile,closeCleanup } from '../facilities/panels';
import { openFlipbook } from '../reading';
import { readVideo } from '../studios/video';
import { archiveStore,archiveUpload,stationCards,openResource } from '../resources';
interface Material {id:string;title:string;section:string;kind:string;asset:Asset;page:number;notes:Record<string,string>;highlights:{page:number;quote:string}[];}
export class StudyLibrary {
  readonly data=new Collection<Material[]>('study-library',[]);
  constructor(private sit:()=>void,private screen?:(asset:Asset)=>void){}
  async open(){
    await this.data.load();const p=panel('📚 Subject library',true),section=input('Subject / curriculum section','General'),kind=h('select',{'aria-label':'Material type'}),search=input('Search subject, title or type'),list=h('div.fac-grid');
    let archive=await archiveStore();
    for(const name of ['Book / textbook','Article','Research paper','Reference / notes','Learning video'])kind.append(h('option',{},name));
    const render=()=>{list.replaceChildren();const q=search.field.value.toLowerCase(),materials=this.data.value.filter(m=>`${m.section} ${m.title} ${m.kind}`.toLowerCase().includes(q));
      list.append(...stationCards(archive.value,'study-library',item=>{p.modal.close();this.sit();const legacy=this.data.value.find(m=>m.asset.id===item.asset?.id);return legacy?this.read(legacy):openResource(item,this.screen);},q));
      for(const group of [...new Set(materials.filter(m=>!archive.value.some(i=>i.asset?.id===m.asset.id)).map(m=>m.section))].sort()){
        list.append(h('h3',{},group));for(const material of materials.filter(m=>m.section===group))list.append(h('article.fac-card',{},h('h3',{},material.title),h('small',{},`${material.kind} · page ${material.page+1}`),action('Sit & read with notes',()=>{p.modal.close();this.sit();return this.read(material);}),h('a.btn',{href:assetUrl(material.asset,true),download:material.asset.name},'Download original')));
      }if(!list.children.length)list.append(h('p',{},'Upload curriculum material here, or assign archive files to Study hall to build your subject sections.'));
    };search.field.oninput=render;
    p.body.append(h('p',{},'Organize books, articles, papers and MP4 learning videos by subject. Reading, highlighting and notes stay together in this library.'),search.row,list,h('h3',{},'Add reading material'),section.row,h('label',{},'Material type',kind),chooseFile('.pdf,.epub,.txt,.md,.mp4',async file=>{
      if(!/\.(pdf|epub|txt|md|mp4)$/i.test(file.name))throw new Error('Choose PDF, EPUB, text, Markdown or MP4.');
      await archiveUpload(file,'study-library',section.field.value,kind.value);archive=await archiveStore();render();
    }));render();
  }
  async read(book:Material){
    if(book.asset.type==='video/mp4'){const p=panel('🎬 '+book.title,true);readVideo(p.body,p.modal,book.asset,this.screen);return;}
    await openFlipbook({id:book.id,title:book.title,asset:book.asset,bucket:'study-library',subject:book.section,page:book.page},{legacy:book,onPage:async page=>{book.page=page;await this.data.save();}});
  }
}
