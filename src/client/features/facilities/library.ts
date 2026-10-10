import { h, toast } from '../../ui/dom';
import { Collection, assetUrl, upload, type Asset } from './data';
import { action, chooseFile, panel, closeCleanup } from './panels';
import type { Bucket } from './data';
import { readVideo } from '../studios/video';
import { openFlipbook } from '../reading';
import { archiveStore,archiveUpload,stationCards,openResource } from '../resources';
import type { ArchiveItem } from '../../../shared/resources';
interface Book { id: string; asset: Asset; title: string; page: number; subject?:string; archived?:boolean }

export { textPages, epubText } from '../reading/text';

export class Library {
  readonly data:Collection<Book[]>;
  constructor(bucket:Bucket='library',private title='📚 Reading library',private screen?:(asset:Asset)=>void){this.data=new Collection<Book[]>(bucket,[]);}
  selected: Book | null = null;
  async open(take: (book: Book) => void) {
    await this.data.load();
    let archive=await archiveStore();
    const { body, modal } = panel(this.title, true);
    const list = h('div.fac-grid');
    const render = () => { list.replaceChildren(...stationCards(archive.value,'break-library',(item:ArchiveItem)=>{const book:Book={id:item.id,title:item.title,asset:item.asset!,page:item.page??0,subject:item.section,archived:true};this.selected=book;modal.close();take(book);}));if(!list.children.length)list.append(h('p.fac-note',{},'Upload a book here or assign archive material to the Break-floor library.')); };
    const file = chooseFile('.pdf,.epub,.txt,.md,.mp4', async file => {
      if (!/\.(pdf|epub|txt|md|mp4)$/i.test(file.name)) throw new Error('Choose PDF, EPUB, TXT, Markdown or MP4.');
      await archiveUpload(file,'break-library');archive=await archiveStore();render();
    });
    body.append(h('p', {}, 'Upload your books. Pick one up, take a seat by the window, and click the page edges to turn pages. PDF preserves the original pages; EPUB and text are arranged into readable pages.'), file, list); render();
  }
  async read() {
    if (!this.selected) { toast('Pick a book from the library first.'); return; }
    const book=this.selected;
    if(!/\.(pdf|epub|txt|md|mp4)$/i.test(book.asset.name))return openResource({id:book.id,title:book.title,asset:book.asset,section:book.subject,folder:'',tags:'',note:''});
    if(book.asset.type==='video/mp4'){const p=panel('🎬 '+book.title,true);readVideo(p.body,p.modal,book.asset,this.screen);return;}
    await openFlipbook({id:book.id,title:book.title,asset:book.asset,bucket:book.archived?'organizer':this.data.bucket,subject:book.subject,page:book.page}, {onPage:async page=>{book.page=page;if(!book.archived)await this.data.save();}});
  }
}
