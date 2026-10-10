import { OFFICE_PLAN, type MapPlan } from './maps/index.js';
export const CREATIVE = '@creative';
export const CRAFT = '@craft';
export const CREATIVE_STATIONS = [
  { id:'music', name:'Music studio · instruments & recording', x:-10,z:-8 },
  { id:'sketch', name:'Blackline sketch desk', x:8,z:-8 },
  { id:'sketchbooks', name:'Sketchbooks & wall gallery', x:14,z:-2 },
  { id:'moodboards', name:'Mood boards', x:8,z:3 },
  { id:'writing', name:'Typewriter & digital journal', x:-10,z:3 },
];
export const CRAFT_STATIONS = [
  { id:'textiles',name:'Textiles · sewing & patterns',x:-11,z:-8 },
  { id:'jewellery',name:'Jewellery · silversmithing',x:0,z:-8 },
  { id:'sculpture',name:'Sculpture · virtual prototypes',x:11,z:-8 },
  { id:'woodwork',name:'Woodworking · measured designs',x:-11,z:3 },
  { id:'leather',name:'Leatherwork · templates',x:11,z:3 },
];
function floor(id:string,name:string,icon:string,description:string) {
  const plan:MapPlan={...OFFICE_PLAN,id:id.slice(1),name,icon,description,style:'castle',bounds:{minX:-18,maxX:18,minZ:-14,maxZ:14},height:3.8,spawn:{x:0,y:0,z:12.6,rotY:Math.PI},desks:[],overflow:[],stations:[],meeting:[],byId:new Map(),seating:[],seatingById:new Map(),lineup:[],tables:[],agents:{outfit:'none',ageMinutes:0}};
  return {id,name,icon,description,plan};
}
export const CREATIVE_FLOOR=floor(CREATIVE,'Creative studio','🎼','Music, blackline sketches, mood boards and writing');
export const CRAFT_FLOOR=floor(CRAFT,'Craft workshop','🧵','Textiles, jewellery, sculpture, woodworking and leather');
