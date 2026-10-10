import { spawn } from 'node:child_process';
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { executable } from './apps.js';
import { Facilities } from '../facilities.js';
import { recipe,scad } from '../../shared/studio-files.js';
// The AI supplies measurements only. This fixed script is the only Python we execute.
export const BLENDER_SCRIPT=String.raw`import bpy, json, sys, math, os
r=json.load(open(sys.argv[sys.argv.index('--')+1],encoding='utf-8'))
out=sys.argv[sys.argv.index('--')+2]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
w,h,d,wall=[r[k]/1000 for k in ['width','height','depth','wall']]
def cube(name,loc,scale):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object; o.name=name; o.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return o
if r['shape']=='assembly':
    solids=[];cuts=[]
    for p in r['parts']:
        loc=[n/1000 for n in p['position']];size=[n/1000 for n in p['size']]
        if p['kind']=='box': o=cube('Part',loc,size)
        elif p['kind']=='sphere':
            bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,radius=1,location=loc)
            o=bpy.context.object;o.dimensions=size
        else:
            bpy.ops.mesh.primitive_cone_add(vertices=64,radius1=1,radius2=0 if p['kind']=='cone' else 1,depth=1,location=loc)
            o=bpy.context.object;o.dimensions=size
        o.rotation_euler=[math.radians(n) for n in p['rotation']]
        bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        (cuts if p['cut'] else solids).append(o)
    for o in solids:
        bpy.context.view_layer.objects.active=o
        for cutter in cuts:
            mod=o.modifiers.new('Concept cut','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
            bpy.ops.object.modifier_apply(modifier=mod.name)
    for cutter in cuts: bpy.data.objects.remove(cutter,do_unlink=True)
elif r['shape']=='box':
    o=cube('Measured box',(0,0,h/2),(w,d,h))
    cutter=cube('Opening',(0,0,h/2+wall),(w-2*wall,d-2*wall,h))
else:
    bpy.ops.mesh.primitive_cone_add(vertices=96,radius1=w/2,radius2=(w if r['shape']=='ring' else d)/2,depth=h,location=(0,0,h/2))
    o=bpy.context.object
    bpy.ops.mesh.primitive_cone_add(vertices=96,radius1=w/2-wall,radius2=(w if r['shape']=='ring' else d)/2-wall,depth=h+2*wall,location=(0,0,h/2 if r['shape']=='ring' else h/2+2*wall))
    cutter=bpy.context.object
if r['shape']!='assembly':
    bpy.context.view_layer.objects.active=o
    mod=o.modifiers.new('Hollow opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    solids=[o]
material=bpy.data.materials.new('Chosen material');material.diffuse_color=tuple(int(r['color'][i:i+2],16)/255 for i in (1,3,5))+(1,)
for obj in solids: obj.data.materials.append(material)
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.length_unit='MILLIMETERS'
bpy.ops.object.select_all(action='DESELECT')
for obj in solids: obj.select_set(True)
bpy.context.view_layer.objects.active=solids[0]
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'prototype.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(out,'prototype.glb'),export_format='GLB',use_selection=True)
# STL uses millimetres for common slicers, while Blender/GLB keep metres.
for obj in solids:
    obj.location*=1000;obj.scale=(1000,1000,1000)
bpy.ops.wm.stl_export(filepath=os.path.join(out,'prototype.stl'),export_selected_objects=True)
`;
export async function buildPrototype(vault:Facilities,value:unknown) {
  const r=recipe(value),exe=executable('blender');if(!exe)throw new Error('Blender is not installed on the office computer.');
  const dir=path.join(vault.dir,'prototypes',randomUUID());mkdirSync(dir,{recursive:true});
  const script=path.join(dir,'build.py'),config=path.join(dir,'recipe.json');writeFileSync(script,BLENDER_SCRIPT);writeFileSync(config,JSON.stringify(r));
  await new Promise<void>((resolve,reject)=>{const child=spawn(exe,['--background','--factory-startup','--disable-autoexec','--python',script,'--',config,dir],{shell:false,windowsHide:true,stdio:['ignore','ignore','pipe']});let error='';child.stderr.on('data',b=>{error=(error+b.toString()).slice(-2000);});const timer=setTimeout(()=>{child.kill();reject(new Error('Blender took longer than two minutes. Try a simpler prototype.'));},120000);child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',code=>{clearTimeout(timer);code===0?resolve():reject(new Error('Blender could not create this prototype. '+error.slice(-500)));});});
  return {recipe:r,assets:[...['blend','glb','stl'].map(ext=>vault.upload('prototype.'+ext,readFileSync(path.join(dir,'prototype.'+ext)))),vault.upload('prototype.scad',Buffer.from(scad(r))),vault.upload('prototype-recipe.json',Buffer.from(JSON.stringify(r,null,2)))]};
}
