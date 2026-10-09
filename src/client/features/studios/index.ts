import * as THREE from 'three';
import type { Ctx } from '../../core/context';
import { floorWorlds } from '../../core/floor-worlds';
import { hintTitle,key,onE } from '../../core/hint';
import { store } from '../../state';
import { h,toast,modalOpen } from '../../ui/dom';
import { panel,action } from './panels';
import { CREATIVE,CRAFT,CREATIVE_STATIONS,CRAFT_STATIONS } from '../../../shared/studio-plans';
import { StudioWorld } from './world';
import { MusicStudio } from './music';
import { ArtStudio } from './art';
import { WritingDesk } from './writing';
import { CraftStudio } from './craft';
import { StationLibrary } from './library';
import { StationVideo } from './video';
import { studioConnections } from './connections';
import './ui.css';
declare module '../../world/types' {
  interface InteractKinds {
    studios: true;
  }
}
export function installStudios(ctx:Ctx){
  let creative:StudioWorld|null=null,craft:StudioWorld|null=null;
  const creativeWorld=()=>creative??=new StudioWorld(),craftWorld=()=>craft??=new StudioWorld(true);
  floorWorlds.set(CREATIVE,()=>creativeWorld().world);floorWorlds.set(CRAFT,()=>craftWorld().world);
  const textures=new Map<string,THREE.Texture>();
  const texture=(station:string,t:THREE.Texture)=>{t.colorSpace=THREE.SRGBColorSpace;creativeWorld().texture(station,t);textures.get(station)?.dispose();textures.set(station,t);};
  const art=new ArtStudio(texture),music=new MusicStudio(),workshop=new CraftStudio(craftWorld),video=new StationVideo();
  const writing=new WritingDesk(text=>{const c=document.createElement('canvas');c.width=900;c.height=600;const g=c.getContext('2d')!;g.fillStyle='#e8d8b6';g.fillRect(0,0,900,600);g.fillStyle='#302920';g.font='25px monospace';text.split('\n').slice(0,18).forEach((s,i)=>g.fillText(s.slice(0,60),30,40+i*30));texture('writing',new THREE.CanvasTexture(c));});
  const creativeLibrary=new StationLibrary('creative-library',(s,a)=>video.play(creativeWorld(),s,a)),craftLibrary=new StationLibrary('craft-library',(s,a)=>video.play(craftWorld(),s,a));
  const open=(station:string)=>{const isCraft=store.floor===CRAFT,p=panel(isCraft?'🧵 Craft station · '+station:'🎨 Creative station · '+station),library=isCraft?craftLibrary:creativeLibrary;
    const run=(fn:()=>unknown)=>{p.modal.close();return fn();};
    if(isCraft)p.body.append(action('Design & build virtual prototype',()=>run(()=>workshop.open(station))),action('Project files & patterns',()=>run(()=>workshop.files.open(station,a=>workshop.display(station,a)))));
    else if(station==='music')p.body.append(action('Play piano · record · music workspaces',()=>run(()=>music.open())));
    else if(station==='writing')p.body.append(action('Traditional typewriter',()=>run(()=>writing.typewriter())),action('Digital journal & collages',()=>run(()=>writing.journal())));
    else p.body.append(action('Blackline drawing desk',()=>run(()=>art.desk())),action('Generate / augment image with AI',()=>run(()=>art.aiImage())),action('Sketchbooks & wall gallery',()=>run(()=>art.sketchbooks())),action('Mood boards · create & switch',()=>run(()=>art.moodboards())));
    p.body.append(action('Station library · books & MP4 lessons',()=>run(()=>library.open(station))));
  };
  ctx.interactions.define('studios',{reach:3.5,hint:it=>({k:it.label??'',parts:[hintTitle(it.label??'Studio station'),key('E','Create')]}),use:onE(it=>{const world=store.floor===CRAFT?craftWorld():creativeWorld();open(world.ids.get(it)??'sketch');})});
  const call=h('button.btn.studio-call',{type:'button',hidden:true},'🎨 Studio tools');call.onclick=()=>{const p=panel(store.floor===CRAFT?'🧵 Craft workshop':'🎼 Creative studio');for(const s of store.floor===CRAFT?CRAFT_STATIONS:CREATIVE_STATIONS)p.body.append(action(s.name,()=>{p.modal.close();open(s.id);}));p.body.append(action('Studio connections · apps & AI',()=>{p.modal.close();return studioConnections();}));};document.body.append(call);
  let loaded=false,craftLoaded=false;ctx.ticks.add('hud',()=>{call.hidden=![CREATIVE,CRAFT].includes(store.floor??'')||modalOpen();if(store.floor===CRAFT&&!craftLoaded){craftLoaded=true;void workshop.restore().catch(e=>toast((e as Error).message,'error'));}if(store.floor===CREATIVE&&!loaded){loaded=true;void Promise.all([art.drawing.load(),art.boards.load(),art.books.load(),writing.data.load()]).then(()=>{void art.showBoard();void art.showWall();}).catch(e=>toast((e as Error).message,'error'));}});
  ctx.activities.add({id:'studio-video',active:()=>video.active,stop:why=>{if(['trip','taken','map'].includes(why))video.stop();}});
}
