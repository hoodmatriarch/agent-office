import * as THREE from 'three';
import { STUDY_PLAN, STUDY_DESKS, STUDY_READING_DESKS } from '../../../shared/study-plan';
import { mesh, roundedBox, toon, textSprite } from '../../world/toon';
import { Person } from '../../world/character';
import { sharedFloor } from '../../world/shared-floor';
import type { StudyNotice } from './notices';
import type { Collider, Interactable } from '../../world/types';
export type StudyStation = 'teacher' | 'board' | 'desk' | 'library' | 'backpack' | 'reading' | 'notices';
export class StudyWorld {
  readonly group = new THREE.Group();
  readonly teacher = new Person('Professor Ellis · teacher', '#56778d', {skin:2,hair:3,style:1});
  readonly colliders: Collider[] = [{minX:-18,maxX:18,minZ:-14,maxZ:14,bottom:-.3,top:0}];
  readonly stations: Interactable[] = [];
  readonly ids = new Map<Interactable,StudyStation>();
  readonly boardCanvas = document.createElement('canvas');
  readonly boardTexture = new THREE.CanvasTexture(this.boardCanvas);
  readonly world;
  readonly screens = new Map<string, THREE.Mesh>();
  readonly noticesCanvas = document.createElement('canvas');
  readonly noticesTexture = new THREE.CanvasTexture(this.noticesCanvas);
  private path: [number,number][] = [];
  private home: [number,number] = [-7.5,-9.9];
  private helping = false;
  constructor() {
    this.box(0,-.16,0,36,.3,28,'#d8c6a7');
    this.box(-18,1.9,0,.2,3.8,28,'#dedfd3',true); this.box(0,1.9,-14,36,3.8,.2,'#dedfd3',true); this.box(0,1.9,14,36,3.8,.2,'#dedfd3',true);
    this.box(0,3.95,0,36,.18,28,'#f2efe5');
    this.box(18,.4,0,.2,.8,28,'#dedfd3',true);
    for (const z of [-12,-6,0,6,12]) { this.box(18,2,z,.15,3.5,.12,'#628b91'); this.box(18,3.6,z,.15,.15,6,'#628b91'); }
    for (const x of [-12,-4,4,12]) for (const z of [-9,-1,7]) this.box(x,3.8,z,2,.06,.65,'#fffaf0');
    this.box(4.1,1.6,-3.9,.15,3.2,14.2,'#d9dfcf',true); // quiet library partition, open at both ends
    this.box(11,.015,-4.2,13.8,.02,19.6,'#cbdad4');
    this.boardCanvas.width=1400; this.boardCanvas.height=700; this.boardTexture.colorSpace=THREE.SRGBColorSpace;
    const board=mesh(new THREE.PlaneGeometry(11,3),new THREE.MeshBasicMaterial({map:this.boardTexture}),-7.5,2,-13.7); this.group.add(board); this.station('board','📝 Classroom whiteboard',-7.5,-12,board);
    this.writeBoard('Welcome to the study hall','Your curriculum and lessons will be added here.\nChoose a study desk, bring a book, or raise your hand.');
    const desk=this.box(-7.5,.8,-10.8,4,.15,1.5,'#997651',true); this.box(-7.5,.4,-10.8,.4,.8,.5,'#567078'); this.station('teacher','🎓 Professor Ellis · teacher',-7.5,-8.3,desk);
    this.box(-7.5,.44,-9.9,.85,.12,.75,'#56778d');this.box(-7.5,.85,-10.25,.85,.7,.12,'#56778d');
    this.teacher.root.position.set(...[this.home[0],0,this.home[1]] as [number,number,number]); this.teacher.sit(.44); this.group.add(this.teacher.root); this.teacher.root.userData.interact=this.stations.at(-1);
    for (const d of STUDY_DESKS) {
      const table=this.box(d.x,.8,d.z,2.4,.12,1.2,'#bf9c72',true); this.box(d.x,.4,d.z,.25,.8,.4,'#557078');
      this.box(d.x,.44,d.z+.9,.8,.12,.7,'#75969b'); this.box(d.x,.85,d.z+1.25,.8,.7,.1,'#75969b');
      const it=this.station('desk','📖 Sit & study',d.x,d.z+.9,table); it.seatId=d.id;
      this.box(d.x+.6,.92,d.z,.5,.08,.4,'#dfd8bd');
    }
    const sections=['Books & textbooks','Articles & research','Reference & notes'];
    sections.forEach((name,i)=>{
      const x=7+i*4; const shelf=this.box(x,1.35,-12.5,3.5,2.7,.5,'#947957',true);
      for(let row=0;row<4;row++) for(let col=0;col<9;col++) this.box(x-1.4+col*.34,.4+row*.6,-12.1,.22,.45,.4,['#7c9c8a','#ae826e','#7e92ae'][col%3]);
      this.label(name,x,3,-12); this.station('library',`📚 ${name}`,x,-10.8,shelf);
    });
    for (const d of STUDY_READING_DESKS) {
      const table=this.box(d.x,.8,d.z,3,.12,1.4,'#bf9c72',true);
      this.box(d.x,.44,d.z+1.1,.9,.12,.8,'#75969b'); this.box(d.x,.85,d.z+1.5,.9,.7,.1,'#75969b');
      const it=this.station('reading','💻 Reading desk · books & MP4 lessons',d.x,d.z+1.1,table); it.seatId=d.id;
      this.box(d.x,.9,d.z-.1,1.1,.06,.65,'#334953').userData.interact=it;
      const screen=mesh(new THREE.PlaneGeometry(1.15,.65),new THREE.MeshBasicMaterial({color:'#243d49'}),d.x,1.28,d.z-.28);
      screen.name=d.id+'-screen'; screen.userData.interact=it; this.group.add(screen); this.screens.set(d.id,screen);
    }
    this.noticesCanvas.width=1800; this.noticesCanvas.height=650; this.noticesTexture.colorSpace=THREE.SRGBColorSpace;
    const notices=mesh(new THREE.PlaneGeometry(12.5,2.5),new THREE.MeshBasicMaterial({map:this.noticesTexture}),11.25,2,13.65); notices.rotation.y=Math.PI; this.group.add(notices);
    this.station('notices','📌 Notes, schedules & awards',11.25,11.8,notices); this.writeNotices([]);
    const bag=this.box(-9.4, .65, 10.2, .75,1.1,.45,'#547a8a'); this.station('backpack','🎒 Backpack & homework',-9.4,10.2,bag);
    this.label('CLASSROOM',-7.5,3,7); this.label('SUBJECT LIBRARY · QUIET STUDY',11,3,4.8);
    this.world=sharedFloor(STUDY_PLAN,this.group,this.colliders,this.stations,(t,dt)=>this.update(t,dt));
  }
  box(x:number,y:number,z:number,w:number,h:number,d:number,color:string,solid=false) {
    const obj=mesh(roundedBox(w,h,d,.03),toon(color),x,y,z); this.group.add(obj);
    if(solid)this.colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,bottom:y-h/2,top:y+h/2}); return obj;
  }
  label(text:string,x:number,y:number,z:number) {const obj=textSprite(text,{size:40,bg:'#fffbed',color:'#35515f'});obj.position.set(x,y,z);obj.scale.multiplyScalar(Math.min(5,obj.scale.x)/obj.scale.x);this.group.add(obj);return obj;}
  station(id:StudyStation,name:string,x:number,z:number,obj:THREE.Object3D) {
    const it:Interactable={kind:'study',label:name,x,z,radius:2};obj.userData.interact=it;this.ids.set(it,id);this.stations.push(it);
    const control=this.box(x,1.15,z-.35,.65,.4,.12,'#547a8a');control.userData.interact=it; const sign=this.label('E · '+name,x,1.6,z-.35);sign.scale.multiplyScalar(.5);sign.userData.interact=it;return it;
  }
  writeBoard(title:string,text:string) {
    const c=this.boardCanvas.getContext('2d')!;c.fillStyle='#fcfcf0';c.fillRect(0,0,1400,700);c.fillStyle='#294f5c';c.font='bold 54px sans-serif';c.fillText(title.slice(0,44),70,90);c.font='32px sans-serif';
    const words=text.split(/\s+/);let line='',y=165;
    for(const word of words){if(c.measureText(line+word).width>1250){c.fillText(line,70,y);y+=46;line='';if(y>640)break;}line+=word+' ';}if(y<=640)c.fillText(line,70,y);this.boardTexture.needsUpdate=true;
  }
  texture(id:string,texture:THREE.Texture) {
    const screen=this.screens.get(id); if(!screen)return;
    (screen.material as THREE.Material).dispose(); screen.material=new THREE.MeshBasicMaterial({map:texture});
  }
  resetScreens() { for(const screen of this.screens.values()){(screen.material as THREE.Material).dispose();screen.material=new THREE.MeshBasicMaterial({color:'#243d49'});} }
  writeNotices(items:StudyNotice[]) {
    const c=this.noticesCanvas.getContext('2d')!;c.fillStyle='#b38e62';c.fillRect(0,0,1800,650);
    c.fillStyle='#fff5dc';c.font='bold 42px sans-serif';c.fillText('NOTES · CLASS SCHEDULES · AWARDS',50,65);
    items.slice(-12).forEach((n,i)=>{const x=50+(i%6)*285,y=100+Math.floor(i/6)*260;
      c.fillStyle=n.kind==='Award'?'#f3d48a':n.kind==='Class schedule'?'#c5dfdf':'#fff1a8';c.fillRect(x,y,260,230);
      c.fillStyle='#35464b';c.font='bold 23px sans-serif';c.fillText(n.kind,x+14,y+35,232);c.font='22px sans-serif';c.fillText(n.title,x+14,y+72,232);
      const words=n.text.split(/\s+/);let line='',row=110;
      for(const word of words){if(c.measureText(line+word).width>230){c.fillText(line,x+14,y+row);row+=30;line='';if(row>210)break;}line+=word+' ';}if(row<=210)c.fillText(line,x+14,y+row);
    });
    if(!items.length){c.fillStyle='#fff5dc';c.font='32px sans-serif';c.fillText('Press E to pin your first study reminder.',80,210);}this.noticesTexture.needsUpdate=true;
  }
  helpAt(x:number,z:number) {this.helping=true;this.teacher.sit(null);this.path=this.world.nav.route([this.teacher.root.position.x,this.teacher.root.position.z],[x+1.1,z+1.8]).slice(1);}
  returnToDesk() {this.helping=false;this.path=this.world.nav.route([this.teacher.root.position.x,this.teacher.root.position.z],this.home).slice(1);}
  private update(t:number,dt:number) {
    const p=this.teacher.root.position,at=this.path[0];
    if(at){const dx=at[0]-p.x,dz=at[1]-p.z,d=Math.hypot(dx,dz);if(d<.12)this.path.shift();else{const step=Math.min(d,dt*2.4);p.x+=dx/d*step;p.z+=dz/d*step;this.teacher.root.rotation.y=Math.atan2(dx,dz);}}
    else if(!this.helping)this.teacher.sit(.44);
    this.teacher.update(dt,t,!!at,false);
  }
}
