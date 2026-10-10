import { h } from '../../ui/dom';
import { Library } from '../facilities/library';
import { upload,assetUrl,type Asset,type Bucket } from '../facilities/data';
import { panel,action,chooseFile } from './panels';
import { writingBook } from './writing-references';
import { archiveStore,archiveUpload,stationCards,openResource } from '../resources';
export const REFERENCES:Record<string,{terms:string;links:[string,string][]}>={
 music:{terms:'Tempo = the speed of the beat. MIDI = editable musical notes; it does not contain sound. WAV = your actual recorded sound. A sample is a recording played at different pitches. Root note is the original pitch of that sample.',links:[['FL Studio manual','https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/'],['BandLab','https://www.bandlab.com/'],['SUNO','https://suno.com/']]},
 sketch:{terms:'Line weight is how thick a drawn line is. Negative space is the area around the subject. Save finished sketches to your sketchbooks before starting a new drawing.',links:[['ChatGPT image workspace','https://chatgpt.com/']]},
 writing:{terms:'Draft freely before editing. A journal can collect ideas, images and research; the typewriter exports plain text you can use anywhere. Dictionary and The Artist’s Way open as books inside the office.',links:[]},
 textiles:{terms:'A seam allowance is extra fabric around the stitching line. Grainline follows the fabric threads. Print patterns at 100% and check their dimensions with a ruler. This first pattern tool makes measured rectangular templates.',links:[['Sewing reference','https://www.seamwork.com/']]},
 jewellery:{terms:'Outside diameter is the full width of a ring. Inside diameter is outside diameter minus twice wall thickness. Metal prototypes need allowance for the manufacturing process; test fit with inexpensive material first.',links:[['Blender manual','https://docs.blender.org/manual/en/latest/']]},
 sculpture:{terms:'A mesh describes the surface of a shape. STL is commonly used by 3D-print slicers. GLB displays materials in 3D. A .blend project lets you edit the model. Parametric CAD sources keep dimensions editable.',links:[['Blender manual','https://docs.blender.org/manual/en/latest/']]},
 woodwork:{terms:'Width, depth and height define an object’s size. Wall thickness controls hollow boxes. Joinery is how separate wooden parts connect. The prototype is a design study; workshop drawings and material tolerances still need checking.',links:[['OpenSCAD reference','https://openscad.org/documentation.html']]},
 leather:{terms:'A template is the outline used to cut a piece. Seam allowance gives room for stitching. Leather thickness and bend allowance affect fit. Keep your reference images and pattern files with the project.',links:[['Blender manual','https://docs.blender.org/manual/en/latest/']]},
};
export class StationLibrary {
  readonly reader:Library;
  constructor(bucket:Bucket,private screen:(station:string,asset:Asset)=>void){this.reader=new Library(bucket);}
  async open(station:string) {
    await this.reader.data.load();const p=panel('📚 '+station+' · learning library',true),list=h('div.fac-grid'),ref=REFERENCES[station]??REFERENCES.sketch;
    let archive=await archiveStore();
    const books=()=>this.reader.data.value.filter(b=>(b as typeof b&{station?:string}).station===station);
    const render=()=>{list.replaceChildren(...stationCards(archive.value,station,item=>{p.modal.close();return openResource(item,a=>this.screen(station,a));}));if(!list.children.length)list.append(h('p',{},'No material assigned to this station. Add it here or choose this station in the central archive.'));};
    const references=h('div.fac-toolbar',{},...ref.links.map(([title,url])=>h('a.btn',{href:url,target:'_blank',rel:'noopener noreferrer'},title)));
    if(station==='writing')for(const name of ['Dictionary','The Artist’s Way'] as const)references.append(action(name,()=>{p.modal.close();return writingBook(this.reader,name);}));
    p.body.append(h('p',{},ref.terms),references,h('p',{},'Material assigned to this station, grouped by section. Upload here to add it to the central archive and this shelf. Assign more stations in the storeroom document archives.'),chooseFile('*',async file=>{await archiveUpload(file,station);archive=await archiveStore();render();}),list);render();
  }
  private async readVideo(asset:Asset,station:string){const p=panel('🎬 '+asset.name,true);const {readVideo}=await import('./video');readVideo(p.body,p.modal,asset,a=>this.screen(station,a));}
}
