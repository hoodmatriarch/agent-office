import { h,toast } from '../../ui/dom';
import { action,panel,input,chooseFile } from '../facilities/panels';
import { assetUrl,upload } from '../facilities/data';
import { STATIONS,type ArchiveItem } from '../../../shared/resources';
import { archiveStore } from './store';
import { openResource } from './view';
function stationChoices(selected:string[]=[]){
  const fields=Object.entries(STATIONS).map(([id,label])=>({id,field:h('input',{type:'checkbox',checked:selected.includes(id),'aria-label':label}),label}));
  return {el:h('fieldset.archive-stations',{},h('legend',{},'Available at these stations'),...fields.map(({field,label})=>h('label',{},field,' '+label))),value:()=>fields.filter(f=>f.field.checked).map(f=>f.id)};
}
export async function editAssignments(id:string){
  const data=await archiveStore(),item=data.value.find(i=>i.id===id);if(!item)throw new Error('File not found. Reopen the archive.');
  const p=panel('Organize · '+item.title,true),title=input('Archive title',item.title),section=input('Library section',item.section||'General'),tags=input('Archive tags',item.tags),stations=stationChoices(item.stations);
  p.body.append(title.row,section.row,tags.row,stations.el,h('p',{},'Choose several stations to share one original file. Unchecking a station keeps the original in this archive.'),action('Save library assignments',async()=>{
    Object.assign(item,{title:title.field.value.trim().slice(0,160)||item.title,section:section.field.value.trim().slice(0,160)||'General',tags:tags.field.value.slice(0,300),stations:stations.value()});
    await data.save();p.modal.close();toast('Library assignments saved. Reopen a shelf to see the change.');
  },true));
}
export async function openArchives(){
  let data=await archiveStore();const p=panel('🗃️ Station library archives',true),search=input('Search archive files, sections or tags'),filter=h('select',{'aria-label':'Filter archive station'}),list=h('div.fac-grid');
  filter.append(h('option',{value:''},'All station assignments'),h('option',{value:'unassigned'},'Unassigned files'),...Object.entries(STATIONS).map(([id,label])=>h('option',{value:id},label)));
  const render=()=>{
    const q=search.field.value.toLowerCase();list.replaceChildren();
    const files=data.value.filter(i=>i.asset&&`${i.title} ${i.section||''} ${i.tags} ${i.note}`.toLowerCase().includes(q)&&(!filter.value||(filter.value==='unassigned'?!i.stations?.length:i.stations?.includes(filter.value))));
    for(const section of [...new Set(files.map(i=>i.section||'General'))].sort()){
      list.append(h('h3',{},section));for(const item of files.filter(i=>(i.section||'General')===section))list.append(h('article.fac-card',{},h('strong',{},item.title),h('small',{},item.tags),h('p',{},item.stations?.map(s=>STATIONS[s as keyof typeof STATIONS]??s).join(' · ')||'Archive only · no station assignments'),action('Open material',()=>{p.modal.close();return openResource(item);}),action('Organize sections & stations',()=>{p.modal.close();return editAssignments(item.id);}),h('a.btn',{href:assetUrl(item.asset!,true),download:item.asset!.name},'Download original')));
    }if(!files.length)list.append(h('p',{},'No matching files. Upload below, or change your filter.'));
  };
  search.field.oninput=render;filter.onchange=render;
  const title=input('Upload title (optional)'),section=input('Library section','General'),tags=input('Upload tags'),stations=stationChoices();
  p.body.append(h('p',{},'Upload once, organize here, and choose every station where the material belongs. Existing shelf uploads are included. Files stay in your local office cabinet, separate from GitHub.'),search.row,filter,list,h('h3',{},'Upload to the central archive'),title.row,section.row,tags.row,stations.el,h('p',{},'PDF, EPUB, MP4, images, audio, patterns and other files · up to 80 MB each'),chooseFile('*',async file=>{
    data=await archiveStore();const asset=await upload(file),item:ArchiveItem={id:crypto.randomUUID(),title:title.field.value.trim().slice(0,160)||file.name,folder:'Library archives',section:section.field.value.trim().slice(0,160)||'General',tags:tags.field.value.slice(0,300),note:'',stations:stations.value(),asset,page:0};
    data.value.unshift(item);await data.save();render();toast('Original stored once; available at your selected stations.');
  }));render();
}
