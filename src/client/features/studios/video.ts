import * as THREE from 'three';
import { h,type Modal } from '../../ui/dom';
import { action,closeCleanup } from './panels';
import { assetUrl,type Asset } from '../facilities/data';
import type { StudioWorld } from './world';
export function readVideo(body:HTMLElement,modal:Modal,asset:Asset,screen?:(asset:Asset)=>void) {
  const video=h('video.studio-video',{src:assetUrl(asset),controls:true,preload:'metadata'});video.volume=.3;
  body.append(video,h('p',{},'Press play to watch. The volume starts at 30%.'));if(screen)body.append(action('Play on station screen · keep creating',()=>{screen(asset);modal.close();}));
  closeCleanup(modal,()=>{video.pause();video.removeAttribute('src');video.load();});
}
export class StationVideo {
  get active(){return !!this.video;}
  private video:HTMLVideoElement|null=null;private texture:THREE.VideoTexture|null=null;private bar:HTMLElement|null=null;
  play(world:StudioWorld,station:string,asset:Asset) {
    this.stop();const video=h('video',{src:assetUrl(asset),preload:'metadata',playsinline:true,loop:false});video.volume=.3;this.video=video;
    const texture=new THREE.VideoTexture(video);texture.colorSpace=THREE.SRGBColorSpace;this.texture=texture;world.texture(station,texture);
    const volume=h('input',{type:'range',min:0,max:100,value:30,'aria-label':'Lesson video volume'});volume.oninput=()=>video.volume=Number(volume.value)/100;
    this.bar=h('div.studio-video-tools',{},asset.name,action('Pause / play',()=>video.paused?video.play():video.pause()),volume,action('Stop video',()=>this.stop()));document.body.append(this.bar);void video.play().catch(()=>{});
  }
  stop(){this.video?.pause();this.video?.removeAttribute('src');this.video?.load();this.video=null;this.texture?.dispose();this.texture=null;this.bar?.remove();this.bar=null;}
}
