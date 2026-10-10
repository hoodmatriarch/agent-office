import type { Ctx } from '../../core/context';
import { h,toast } from '../../ui/dom';
import { action,panel } from '../facilities/panels';
import { request,assetUrl } from '../facilities/data';
import { archiveTools } from '../resources/tools';
import { formatBytes,type StorageSnapshot } from '../../../shared/capacity';
import './ui.css';
import { transferListeners } from './transfers';
export function installCapacity(ctx:Ctx){
  const transfers=h('div.capacity-transfers',{'aria-live':'polite'}),jobs=new Map<string,HTMLElement>();document.body.append(transfers);
  transferListeners.add(t=>{let row=jobs.get(t.id);if(!row){row=h('div.capacity-transfer');jobs.set(t.id,row);transfers.append(row);}const percent=t.total?Math.min(100,Math.round(t.sent*100/t.total)):0;row.textContent=`${t.name} · ${t.error??(t.finished?'Original saved':percent===100?'Finishing upload…':`Uploading ${percent}% · ${formatBytes(t.sent)} / ${formatBytes(t.total)}`)}`;if(t.finished)window.setTimeout(()=>{jobs.get(t.id)?.remove();jobs.delete(t.id);},t.error?10000:4000);});
  let frames=0,last=performance.now(),fps:number|null=null;
  ctx.ticks.add('hud',()=>{const now=performance.now();if(document.hidden){frames=0;last=now;return;}frames++;if(now-last>=2000){fps=frames*1000/(now-last);frames=0;last=now;}});
  async function open(){
    const p=panel('📊 Storage & performance',true),summary=h('div.capacity-summary'),types=h('div'),largest=h('div'),runtime=h('div'),status=h('p',{'aria-live':'polite'},'Checking your local cabinet…');
    const row=(label:string,value:string)=>h('div.capacity-card',{},h('small',{},label),h('strong',{},value));
    const refresh=async()=>{try{const s=await request('/api/storage') as StorageSnapshot;
      summary.replaceChildren(row('Original files',`${s.files} · ${formatBytes(s.originalsBytes)}`),row('Cabinet including notes & working files',formatBytes(s.cabinetBytes)),row('Laptop disk free',s.disk?`${formatBytes(s.disk.free)} of ${formatBytes(s.disk.total)}`:'Unavailable'),row('Maximum size per uploaded file',formatBytes(s.limits.file)));
      types.replaceChildren(h('h3',{},'What is stored'),...s.types.map(t=>row(t.type,`${t.files} files · ${formatBytes(t.bytes)}`)));
      largest.replaceChildren(h('h3',{},'Largest originals'),...s.largest.map(a=>h('div.capacity-file',{},h('span',{},a.name),h('strong',{},formatBytes(a.size)),h('a.btn',{href:assetUrl(a,true),download:a.name},'Download'))));
      const browser=(performance as Performance&{memory?:{usedJSHeapSize:number}}).memory;
      runtime.replaceChildren(h('h3',{},'Running the world'),row('Office server memory right now',formatBytes(s.memory.server)),row('Laptop RAM available right now',`${formatBytes(s.memory.machineFree)} of ${formatBytes(s.memory.machineTotal)}`),row('Current view frame rate',fps===null?'Measuring…':`${Math.round(fps)} frames / second`),row('3D resources currently allocated',`${ctx.renderer.info.memory.geometries} geometries · ${ctx.renderer.info.memory.textures} textures`),...(browser?[row('Browser JavaScript memory',formatBytes(browser.usedJSHeapSize))]:[]));
      status.textContent=`Updated ${new Date(s.time).toLocaleTimeString()}. This is a snapshot; Refresh after an upload or while exploring a floor.`;
      if(s.disk&&s.disk.free<10*1024**3)status.textContent+=' Disk space is getting low. Move or back up large files before adding more.';
    }catch(error){status.textContent=(error as Error).message;toast(status.textContent,'error');}};
    p.body.append(status,action('Refresh storage & performance',refresh),summary,types,largest,runtime,h('h3',{},'A world that can grow'),h('p',{},'Stored books and videos take disk space. The room, characters, textures, videos and tools you have open take memory and rendering time. There is no fixed maximum number of floors.'),h('ol',{},h('li',{},'Keep one original in the archive and assign it to several stations.'),h('li',{},'Create one useful room at a time. Check its frame rate during normal use before adding more detail.'),h('li',{},'Open one large book or video at a time. Close unused tabs, heavy tools and models.'),h('li',{},'Keep large source projects on disk; use smaller previews and models on display.'),h('li',{},'Download important originals and back up the whole office data folder regularly. GitHub does not back up this cabinet.')),h('p',{},'Uploads stream to disk, with at most two running together and a 2 GB disk reserve. PDF reading requests chunks as needed; PDFs may still need significant browser memory. These protections reduce load but do not guarantee that every file or scene will run smoothly.'),h('p',{},'Browser JavaScript memory excludes much of video, PDF and graphics memory. Frame rate in a background tab or headless test is not a reliable measure of your laptop’s graphics performance.'));
    await refresh();
  }
  archiveTools.set('capacity',close=>action('Storage & performance',()=>{close();return open();}));
}
