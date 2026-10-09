import { h,toast } from '../../ui/dom';
import { Collection,upload,assetUrl,type Asset } from '../facilities/data';
import { panel,action,input,chooseFile,closeCleanup } from './panels';
import { download } from './files';
interface Entry {id:string;title:string;text:string;date:string;assets:Asset[];}
export class WritingDesk {
  readonly data=new Collection<{paper:string;title:string;entries:Entry[]}>('creative-writing',{paper:'',title:'Untitled',entries:[]});
  constructor(private display:(text:string)=>void){}
  async typewriter(){
    await this.data.load();const p=panel('⌨ Traditional typewriter',true),title=input('Story, poem or note title',this.data.value.title),paper=h('textarea.studio-paper',{rows:14,'aria-label':'Typewriter paper',spellcheck:true});paper.value=this.data.value.paper;
    let timer=0;const save=async()=>{this.data.value.paper=paper.value.slice(0,200000);this.data.value.title=title.field.value.slice(0,120);await this.data.save();this.display(paper.value);};
    const mark=()=>{clearTimeout(timer);timer=window.setTimeout(()=>void save().catch(e=>toast((e as Error).message,'error')),700);};paper.oninput=title.field.oninput=mark;
    p.body.append(h('p',{},'Type directly on the aged paper. Your writing stays here when you close it.'),title.row,paper,h('div.fac-toolbar',{},action('Save writing',async()=>{await save();toast('Writing saved.');}),action('Download text',async()=>{await save();download(this.data.value.title+'.txt',paper.value);}),action('Keep in journal',async()=>{await save();this.data.value.entries.unshift({id:crypto.randomUUID(),title:title.field.value,text:paper.value,date:new Date().toISOString(),assets:[]});await this.data.save();toast('A copy is now in your digital journal.');})));
    closeCleanup(p.modal,()=>{clearTimeout(timer);void save().catch(e=>toast((e as Error).message,'error'));});
  }
  async journal(){
    await this.data.load();const p=panel('📓 Digital journal · writing, images & collages',true),list=h('div.fac-grid');
    const render=()=>list.replaceChildren(...this.data.value.entries.map(e=>h('article.fac-card',{},h('strong',{},e.title),h('small',{},new Date(e.date).toLocaleDateString()),action('Open journal entry',()=>{p.modal.close();return this.entry(e);}))));
    p.body.append(action('New journal entry',async()=>{const e={id:crypto.randomUUID(),title:'New idea',text:'',date:new Date().toISOString(),assets:[]};this.data.value.entries.unshift(e);await this.data.save();p.modal.close();await this.entry(e);}),action('Download entire journal',()=>download('Journal.json',JSON.stringify(this.data.value.entries,null,2),'application/json')),list);render();
  }
  private async entry(e:Entry){
    const p=panel('📓 Journal entry',true),title=input('Entry title',e.title),text=input('Writing & notes',e.text,true),collage=h('div.studio-mood');
    const save=async()=>{e.title=title.field.value.slice(0,120);e.text=text.field.value.slice(0,200000);await this.data.save();};
    const render=()=>collage.replaceChildren(...e.assets.map(a=>h('figure',{},a.type.startsWith('image/')?h('img',{src:assetUrl(a),alt:a.name}):h('strong',{},a.name),h('figcaption',{},h('a',{href:assetUrl(a,true),download:a.name},a.name)))));
    p.body.append(title.row,text.row,action('Save entry',async()=>{await save();toast('Journal entry saved.');}),chooseFile('*',async file=>{e.assets.push(await upload(file));await save();render();}),collage);render();closeCleanup(p.modal,()=>void save().catch(e=>toast((e as Error).message,'error')));
  }
}
