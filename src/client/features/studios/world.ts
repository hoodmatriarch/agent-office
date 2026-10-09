import * as THREE from 'three';
import { CREATIVE_STATIONS,CRAFT_STATIONS,CREATIVE_FLOOR,CRAFT_FLOOR } from '../../../shared/studio-plans';
import { mesh,roundedBox,toon,textSprite } from '../../world/toon';
import { sharedFloor } from '../../world/shared-floor';
import type { Collider,Interactable } from '../../world/types';
export class StudioWorld {
  readonly group=new THREE.Group();
  readonly ids=new Map<Interactable,string>();
  readonly colliders:Collider[]=[{minX:-18,maxX:18,minZ:-14,maxZ:14,bottom:-.3,top:0}];
  readonly stations:Interactable[]=[];
  readonly screens=new Map<string,THREE.Mesh>();
  readonly displays=new Map<string,THREE.Group>();
  readonly wallScreens=new Map<string,THREE.Mesh>();
  readonly world;
  constructor(readonly craft=false) {
    const floor=craft?CRAFT_FLOOR:CREATIVE_FLOOR;
    this.box(0,-.16,0,36,.3,28,craft?'#c6b6a0':'#dfd4bd');
    this.box(-18,1.9,0,.2,3.8,28,'#d5d9d0',true);this.box(0,1.9,-14,36,3.8,.2,'#d5d9d0',true);this.box(0,1.9,14,36,3.8,.2,'#d5d9d0',true);
    this.box(18,.4,0,.2,.8,28,'#abc4c6',true);
    for(const z of [-12,-6,0,6,12])this.box(18,2,z,.15,3.5,.15,'#72989c');
    this.box(0,3.95,0,36,.15,28,'#efebdf');
    for(const x of [-12,0,12])for(const z of [-8,3,10])this.box(x,3.8,z,2,.07,.7,'#fff8d8');
    this.label(floor.name.toUpperCase(),0,3,-13.7);
    for(const s of craft?CRAFT_STATIONS:CREATIVE_STATIONS) {
      const desk=this.box(s.x,.78,s.z,5,.15,1.8,craft?'#ad875e':'#bfa889',true);
      for(const dx of [-2,2])this.box(s.x+dx,.38,s.z,.15,.76,1.5,'#526976');
      const it:Interactable={kind:'studios',label:s.name,x:s.x,z:s.z+1.4,radius:2.5};this.ids.set(it,s.id);this.stations.push(it);desk.userData.interact=it;
      const control=this.box(s.x,1.15,s.z+1,.65,.4,.12,'#476c77');control.userData.interact=it;
      this.label('E · '+s.name,s.x,1.8,s.z+1).userData.interact=it;
      const screen=mesh(new THREE.PlaneGeometry(1.7,.95),new THREE.MeshBasicMaterial({color:'#31495c'}),s.x+1,1.5,s.z-.65);this.group.add(screen);screen.userData.interact=it;this.screens.set(s.id,screen);
      const display=new THREE.Group();display.name='studio-display-'+s.id;display.position.set(s.x, .9,s.z);this.group.add(display);this.displays.set(s.id,display);
      // Each medium has its own physical shelf, linked to its station library.
      this.box(s.x,1.5,s.z-2.5,5,3,.55,'#8b745a',true);
      for(let row=0;row<4;row++)for(let col=0;col<12;col++)this.box(s.x-2+col*.36,.4+row*.65,s.z-2.15,.23,.48,.3,['#718e97','#b08e77','#819479'][col%3]).userData.interact=it;
    }
    if(!craft) {
      // Acoustic studio enclosure with a wide door opening toward the central aisle.
      this.box(-10,.01,-8,14,.03,8,'#526b78');
      this.box(-3,1.4,-9,.15,2.8,7,'#70838a',true);
      this.box(-13.5,1.4,-3.8,7,2.8,.15,'#70838a',true);
      this.box(-4.5,1.4,-3.8,3,2.8,.15,'#70838a',true);
      for(let i=0;i<5;i++)this.box(-15+i*2.3,2.5,-13.6,1.8,1,.1,'#475963');
      this.label('RECORDING ROOM',-10,2.6,-3.7);
      const gallery=mesh(new THREE.PlaneGeometry(7,2),new THREE.MeshBasicMaterial({color:'#fff8e9'}),11,2.3,-13.7);this.group.add(gallery);this.wallScreens.set('sketchbooks',gallery);
      const mood=mesh(new THREE.PlaneGeometry(4,2.1),new THREE.MeshBasicMaterial({color:'#e8ddbf'}),8,2.2,.85);this.group.add(mood);this.wallScreens.set('moodboards',mood);
      // A playable piano with real black and white keys, microphone and speakers.
      this.box(-10,.98,-8,3,.12,.65,'#232938');
      for(let k=0;k<14;k++){this.box(-11.4+k*.21,1.07,-7.95,.2,.08,.58,'#fffdf5').userData.interact=this.stations[0];if(![2,6].includes(k%7))this.box(-11.3+k*.21,1.14,-8.1,.13,.09,.32,'#202329').userData.interact=this.stations[0];}
      this.box(-14,1,-8,.8,2,.8,'#293545',true);this.box(-6,1,-8,.8,2,.8,'#293545',true);
      this.box(-13,.9,-5,.05,1.8,.05,'#4e5964');this.box(-13,1.85,-5,.18,.25,.18,'#8f9aa3');
      this.box(-10,1,3,1.5,.25,.9,'#343e43');for(let i=0;i<10;i++)this.box(-10.6+i*.13,1.2,3.1,.09,.08,.1,'#ece1ce');
    } else {
      this.box(-11,1,-8,1.2,.65,.5,'#d6e1df');this.box(-10.5,1.12,-8,.15,.6,.15,'#74818a');
      this.box(-1,.97,-8,.9,.2,.7,'#4e5964');this.box(-11,1,3,1.5,.15,1,'#866544');
      this.box(0,.45,4,3,.9,3,'#77848e',true);this.label('PROTOTYPE GALLERY',0,2.6,4);
    }
    this.world=sharedFloor(floor.plan,this.group,this.colliders,this.stations,()=>{});
  }
  box(x:number,y:number,z:number,w:number,h:number,d:number,color:string,solid=false) {
    const obj=mesh(roundedBox(w,h,d,.025),toon(color),x,y,z);this.group.add(obj);
    if(solid)this.colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,bottom:y-h/2,top:y+h/2});return obj;
  }
  label(text:string,x:number,y:number,z:number) {
    const s=textSprite(text,{size:40,bg:'#faf6e9',color:'#365362'});s.position.set(x,y,z);s.scale.multiplyScalar(Math.min(5,s.scale.x)/s.scale.x);this.group.add(s);return s;
  }
  texture(station:string,texture:THREE.Texture) {
    for(const screen of [this.screens.get(station),this.wallScreens.get(station)]){if(!screen)continue;const old=screen.material as THREE.MeshBasicMaterial;screen.material=new THREE.MeshBasicMaterial({map:texture});old.dispose();}
  }
}
