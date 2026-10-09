import type { PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { h,toast } from '../../ui/dom';
import { Collection,upload,assetUrl,type Asset } from '../facilities/data';
import { action,panel,input,chooseFile,closeCleanup } from '../facilities/panels';
import { textPages,epubText } from '../facilities/library';
import { readVideo } from '../studios/video';
interface Material {id:string;title:string;section:string;kind:string;asset:Asset;page:number;notes:Record<string,string>;highlights:{page:number;quote:string}[];}
export class StudyLibrary {
  readonly data=new Collection<Material[]>('study-library',[]);
  constructor(private sit:()=>void,private screen?:(asset:Asset)=>void){}
  async open(){
    await this.data.load();const p=panel('📚 Subject library',true),section=input('Subject / curriculum section','General'),kind=h('select',{'aria-label':'Material type'}),search=input('Search subject, title or type'),list=h('div.fac-grid');
    for(const name of ['Book / textbook','Article','Research paper','Reference / notes','Learning video'])kind.append(h('option',{},name));
    const render=()=>{list.replaceChildren();const q=search.field.value.toLowerCase(),materials=this.data.value.filter(m=>`${m.section} ${m.title} ${m.kind}`.toLowerCase().includes(q));
      for(const group of [...new Set(materials.map(m=>m.section))].sort()){
        list.append(h('h3',{},group));for(const material of materials.filter(m=>m.section===group))list.append(h('article.fac-card',{},h('h3',{},material.title),h('small',{},`${material.kind} · page ${material.page+1}`),action('Sit & read with notes',()=>{p.modal.close();this.sit();return this.read(material);}),h('a.btn',{href:assetUrl(material.asset,true),download:material.asset.name},'Download original')));
      }if(!materials.length)list.append(h('p',{},'Upload curriculum reading material to build your subject sections. This library is separate from the break-floor shelves.'));
    };search.field.oninput=render;
    p.body.append(h('p',{},'Organize books, articles, papers and MP4 learning videos by subject. Reading, highlighting and notes stay together in this library.'),search.row,list,h('h3',{},'Add reading material'),section.row,h('label',{},'Material type',kind),chooseFile('.pdf,.epub,.txt,.md,.mp4',async file=>{
      if(!/\.(pdf|epub|txt|md|mp4)$/i.test(file.name))throw new Error('Choose PDF, EPUB, text, Markdown or MP4.');
      const asset=await upload(file);this.data.value.push({id:crypto.randomUUID(),title:file.name.replace(/\.[^.]+$/,''),section:section.field.value.trim().slice(0,200)||'General',kind:kind.value,asset,page:0,notes:{},highlights:[]});await this.data.save();render();
    }));render();
  }
  async read(book:Material){
    const p=panel('📖 Study · '+book.title,true);p.root.classList.add('study-reader');
    if(book.asset.type==='video/mp4'){readVideo(p.body,p.modal,book.asset,this.screen);return;}
    const page=h('div.study-page'),text=h('div.book-text.study-transcript',{'aria-label':'Selectable reading text'}),notes=input('Notes for this page',book.notes[String(book.page)]??'',true),count=h('span',{},'Loading…'),quotes=h('div');
    let pdf:PDFDocumentProxy|null=null,pages:string[]=[],closed=false,busy=false;
    const save=async()=>{book.notes[String(book.page)]=notes.field.value.slice(0,16000);await this.data.save();};
    const total=()=>pdf?.numPages??pages.length;
    const previous=action('← Previous page',()=>turn(-1)),next=action('Next page →',()=>turn(1));
    const annotate=action('Highlight selected text',async()=>{
      const selection=window.getSelection(),quote=selection?.toString().trim();
      if(!quote||!selection?.anchorNode||!text.contains(selection.anchorNode)||!selection.focusNode||!text.contains(selection.focusNode))throw new Error('Select a passage in the reading text first.');
      if(quote.length>4000)throw new Error('Choose a passage shorter than 4,000 characters.');
      book.highlights.push({page:book.page,quote});await save();selection.removeAllRanges();renderHighlights();toast('Passage highlighted.');
    });
    function renderHighlights(){
      const passages=book.highlights.filter(q=>q.page===book.page);quotes.replaceChildren(...passages.map(q=>h('mark',{},q.quote)));
      const raw=text.textContent??'';text.replaceChildren();let cursor=0;
      const matches=passages.map(q=>({quote:q.quote,start:raw.indexOf(q.quote)})).filter(q=>q.start>=0).sort((a,b)=>a.start-b.start);
      for(const m of matches){if(m.start<cursor)continue;text.append(raw.slice(cursor,m.start),h('mark',{},m.quote));cursor=m.start+m.quote.length;}text.append(raw.slice(cursor));
    }
    async function render(){
      if(closed||!total())return;busy=true;previous.disabled=next.disabled=true;
      try{
        if(pdf){const documentPage=await pdf.getPage(book.page+1),viewport=documentPage.getViewport({scale:1.1}),canvas=h('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await documentPage.render({canvas,viewport}).promise;const content=await documentPage.getTextContent();if(closed)return;page.replaceChildren(canvas);text.textContent=content.items.map(item=>'str'in item?item.str:'').join(' ');}
        else{page.replaceChildren();text.textContent=pages[book.page];}
        count.textContent=`Page ${book.page+1} of ${total()}`;notes.field.value=book.notes[String(book.page)]??'';renderHighlights();
      }finally{busy=false;previous.disabled=book.page===0;next.disabled=book.page>=total()-1;}
    }
    async function turn(delta:number){if(busy)return;await save();book.page=Math.max(0,Math.min(total()-1,book.page+delta));await render();}
    const reading=h('div.study-reading',{},page,text),side=h('aside.study-notes',{},h('h3',{},'Notes & highlights'),notes.row,action('Save notes',async()=>{await save();toast('Notes saved.');}),annotate,h('p',{},'Select text in the passage to highlight it. PDFs show their original page plus selectable extracted text.'),quotes);
    p.body.append(h('div.fac-toolbar',{},previous,count,next),h('div.study-reading-layout',{},reading,side));
    notes.field.onchange=()=>void save().catch(e=>toast((e as Error).message,'error'));
    closeCleanup(p.modal,()=>{closed=true;void save().catch(e=>toast((e as Error).message,'error'));void pdf?.loadingTask.destroy();});
    try{const response=await fetch(assetUrl(book.asset));if(!response.ok)throw new Error('Reading material could not be loaded.');const bytes=new Uint8Array(await response.arrayBuffer());
      if(book.asset.type==='application/pdf'){const {getDocument,GlobalWorkerOptions}=await import('pdfjs-dist');GlobalWorkerOptions.workerSrc=workerUrl;pdf=await getDocument({data:bytes,useSystemFonts:true}).promise;}
      else pages=textPages(/\.epub$/i.test(book.asset.name)?epubText(bytes):new TextDecoder().decode(bytes));
      if(closed){void pdf?.loadingTask.destroy();return;}book.page=Math.max(0,Math.min(total()-1,book.page));await render();
    }catch(e){if(!closed)text.textContent=(e as Error).message;}
  }
}
