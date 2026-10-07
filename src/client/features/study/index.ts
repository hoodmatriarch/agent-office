import type { Ctx } from '../../core/context';
import { floorWorlds,floorTravel } from '../../core/floor-worlds';
import { hintTitle,key,onE } from '../../core/hint';
import { STUDY,STUDY_PLAN } from '../../../shared/study-plan';
import { seatPlace } from '../../../shared/layout';
import { store } from '../../state';
import { h,toast,modalOpen } from '../../ui/dom';
import { action,panel } from '../facilities/panels';
import { StudyWorld } from './world';
import { StudyData } from './data';
import { Teacher } from './teacher';
import { StudyLibrary } from './library';
import { lockerTools } from '../../core/locker-tools';
import './ui.css';
declare module '../../world/types' {
  interface InteractKinds {
    study: true;
  }
}
export function installStudy(ctx:Ctx){
  let building:StudyWorld|null=null;
  const world=()=>building??=new StudyWorld();floorWorlds.set(STUDY,()=>world().world);
  const data=new StudyData();
  const sit=(library=false,seatId?:string)=>{
    if(store.floor!==STUDY)return;
    if(ctx.player.seat){if(!library||ctx.player.seat.seatId.startsWith('study-library'))return;ctx.player.stand();ctx.me.sit(null);ctx.net.send({t:'sit'});}
    const taken=new Set([...store.peers.values()].filter(p=>p.id!==store.you&&p.floor===STUDY).map(p=>p.seat));
    const seats=STUDY_PLAN.seating.filter(s=>seatId?s.id===seatId:library?s.id.startsWith('study-library'):s.id.startsWith('study-desk'));
    const places=seats.flatMap(s=>s.places.map((_,i)=>seatPlace(s,i))).filter(s=>!taken.has(s.key)).sort((a,b)=>Math.hypot(a.x-ctx.player.pos.x,a.z-ctx.player.pos.z)-Math.hypot(b.x-ctx.player.pos.x,b.z-ctx.player.pos.z));
    if(!places[0])return toast('These seats are occupied. Try another desk.');
    ctx.player.sit(places[0]);ctx.me.sit(places[0].hips);ctx.net.send({t:'sit',seat:places[0].key});
  };
  const teacher=new Teacher(data,world,()=>{sit();return ctx.player.pos;}),library=new StudyLibrary(()=>sit(true));
  lockerTools.set('📚 Homework stored in this locker',()=>teacher.backpack('locker'));
  const use=async(it:import('../../world/types').Interactable)=>{
    const id=world().ids.get(it);
    if(id==='library')return library.open();if(id==='backpack')return teacher.backpack();
    if(id==='desk'){sit(false,it.seatId);const p=panel('📖 Study desk');p.body.append(action('My classwork & homework',()=>teacher.backpack()),action('Read subject material',()=>library.open()),action('Raise hand · ask for help',()=>{p.modal.close();return teacher.help();}),action('View class lecture / test',()=>teacher.lecture()));return;}
    return id==='board'?teacher.lecture():teacher.open();
  };
  ctx.interactions.define('study',{reach:3.5,hint:it=>({k:it.label??'',parts:[hintTitle(it.label??'Study hall'),key('E','Use')]}),use:onE(it=>{void use(it).catch(e=>toast((e as Error).message,'error'));})});
  const call=h('button.btn.study-call',{type:'button',hidden:true},'🎓 Class & study tools');call.onclick=()=>{const p=panel('🎓 Classroom & study hall');p.body.append(action('Teacher & class lectures',()=>{p.modal.close();return teacher.open();}),action('Raise hand · ask for help',()=>{p.modal.close();return teacher.help();}),action('Subject library · read & take notes',()=>{p.modal.close();return library.open();}),action('Backpack & homework',()=>{p.modal.close();return teacher.backpack();}),action('Elevator · change floor',()=>{p.modal.close();floorTravel.elevator?.();}));};document.body.append(call);
  ctx.ticks.add('hud',()=>{call.hidden=store.floor!==STUDY||modalOpen();});
}
