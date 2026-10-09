export const STUDIO_BUCKETS=['creative-art','creative-library','creative-music','creative-writing','creative-boards','creative-books','craft-library','craft-projects'] as const;
export const STUDIO_TYPES:Record<string,string>={mp4:'video/mp4',webm:'video/webm',wav:'audio/wav',mp3:'audio/mpeg',ogg:'audio/ogg',m4a:'audio/mp4',mid:'audio/midi',glb:'model/gltf-binary',stl:'model/stl',svg:'image/svg+xml',json:'application/json',scad:'text/plain',dxf:'application/dxf'};
export interface Part {kind:'box'|'cylinder'|'sphere'|'cone';size:[number,number,number];position:[number,number,number];rotation:[number,number,number];cut:boolean;}
export interface Recipe {shape:'box'|'ring'|'vase'|'assembly';width:number;height:number;depth:number;wall:number;color:string;parts?:Part[];}
export const DESIGN_INSTRUCTION='Create a measured 3D design from this prompt and optional concept image. Return ONLY JSON: {"shape":"box|ring|vase|assembly","width":100,"height":60,"depth":100,"wall":3,"color":"#a99b83","parts":[]}. Units are millimetres, positive dimensions 0.1–2000, wall less than half width and depth. Box means hollow box, ring means hollow cylinder (width outside diameter), vase means hollow tapered cylinder (width bottom diameter, depth top diameter). For furniture, sculpture, jewellery or multi-part objects choose assembly with 1–48 parts: {"kind":"box|cylinder|sphere|cone","size":[width,depth,height],"position":[x,y,z],"rotation":[degreesX,degreesY,degreesZ],"cut":false}. Parts are centred at position; z is up. Cylinders/cones stand on Z; size determines bounding dimensions. cut=true parts subtract material from every solid. Use precise useful proportions and multiple parts for a recognisable concept, with simple details. Positive parts are separate editable meshes. Include at least one solid. No executable code, paths or external resources. Do not claim detailed forms unsupported by these primitives.';
export function recipe(value:unknown):Recipe {
  const r=value as Recipe;
  if(!r||!['box','ring','vase','assembly'].includes(r.shape))throw new Error('Choose box, ring, vase or assembly.');
  for(const k of ['width','height','depth','wall'] as const)if(!Number.isFinite(r[k])||r[k]<.1||r[k]>2000)throw new Error(`${k} must be between 0.1 and 2000 mm.`);
  if(r.wall>=Math.min(r.width,r.depth)/2)throw new Error('Wall thickness must leave an opening.');
  if(['box','vase'].includes(r.shape)&&r.wall>=r.height)throw new Error('Wall thickness must be smaller than the height.');
  if(!/^#[0-9a-f]{6}$/i.test(r.color))throw new Error('Choose a valid material color.');
  let parts:Part[]|undefined;
  if(r.shape==='assembly'){
    if(!Array.isArray(r.parts)||!r.parts.length||r.parts.length>48)throw new Error('An assembly needs between 1 and 48 parts.');
    parts=r.parts.map(p=>{if(!p||!['box','cylinder','sphere','cone'].includes(p.kind)||typeof p.cut!=='boolean')throw new Error('Invalid assembly part.');
      for(const k of ['size','position','rotation']as const)if(!Array.isArray(p[k])||p[k].length!==3||p[k].some(n=>!Number.isFinite(n)||Math.abs(n)>4000)||(k==='size'&&p[k].some(n=>n<.1||n>2000)))throw new Error('Invalid part measurements.');
      return {kind:p.kind,size:[...p.size],position:[...p.position],rotation:[...p.rotation],cut:p.cut};
    });if(!parts.some(p=>!p.cut))throw new Error('Add at least one solid part.');
  }
  return {shape:r.shape,width:r.width,height:r.height,depth:r.depth,wall:r.wall,color:r.color,...(parts?{parts}:{})};
}
export function scad(r:Recipe) {
  if(r.shape==='assembly'){
    const part=(p:Part)=>`translate([${p.position}]) rotate([${p.rotation}]) `+(p.kind==='box'?`cube([${p.size}],center=true);`:p.kind==='sphere'?`scale([${p.size.map(n=>n/2)}]) sphere(r=1);`:`scale([${p.size[0]/2},${p.size[1]/2},1]) cylinder(h=${p.size[2]},r1=1,r2=${p.kind==='cone'?0:1},center=true);`);
    return '// Millimetres; editable constructive-solid CAD source.\n$fn=64;\ndifference(){union(){\n'+r.parts!.filter(p=>!p.cut).map(part).join('\n')+'\n}\n'+r.parts!.filter(p=>p.cut).map(part).join('\n')+'\n}\n';
  }
  return `// Dimensions in millimetres. Parametric source, editable in OpenSCAD.\n$fn=96;\nw=${r.width}; h=${r.height}; d=${r.depth}; wall=${r.wall};\n`+(r.shape==='box'?'difference(){cube([w,d,h],center=true);translate([0,0,wall])cube([w-2*wall,d-2*wall,h],center=true);}\n':r.shape==='ring'?'difference(){cylinder(h=h,d=w,center=true);cylinder(h=h+2,d=w-2*wall,center=true);}\n':'difference(){cylinder(h=h,d1=w,d2=d);translate([0,0,wall])cylinder(h=h,d1=w-2*wall,d2=d-2*wall);}\n');
}
export function svgPattern(width:number,height:number,seam:number) {
  if(![width,height,seam].every(v=>Number.isFinite(v)&&v>0&&v<=2000))throw new Error('Pattern measurements must be between 0 and 2000 mm.');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width+2*seam}mm" height="${height+2*seam}mm" viewBox="0 0 ${width+2*seam} ${height+2*seam}"><rect x="0.5" y="0.5" width="${width+2*seam-1}" height="${height+2*seam-1}" fill="none" stroke="black"/><rect x="${seam}" y="${seam}" width="${width}" height="${height}" fill="none" stroke="black" stroke-dasharray="3 2"/><text x="${seam+2}" y="${seam+8}" font-size="5">${width} × ${height} mm · seam ${seam} mm · print at 100%</text></svg>`;
}
