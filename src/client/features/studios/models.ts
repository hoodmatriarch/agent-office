import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { validateGLB } from '../../../shared/studio-model';
import { assetUrl,type Asset } from '../facilities/data';
import { h } from '../../ui/dom';
import { panel,closeCleanup } from './panels';
export function disposeModel(group:THREE.Object3D){group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const value of Object.values(m))if(value instanceof THREE.Texture)value.dispose();m.dispose();}}});}
export async function loadModel(asset:Asset) {
  const response=await fetch(assetUrl(asset));if(!response.ok)throw new Error('Model could not be loaded.');const bytes=await response.arrayBuffer();if(bytes.byteLength>40*1024*1024)throw new Error('Display a prototype under 40 MB.');
  let model:THREE.Object3D;
  if(/\.glb$/i.test(asset.name)){validateGLB(bytes);const gltf=await new GLTFLoader().parseAsync(bytes,'');model=gltf.scene;}
  else if(/\.stl$/i.test(asset.name)){const geometry=new STLLoader().parse(bytes);if(geometry.attributes.position.count>1500000){geometry.dispose();throw new Error('Choose a smaller STL model.');}model=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#83a7ac',roughness:.5}));model.rotation.x=-Math.PI/2;}
  else throw new Error('Choose GLB or STL to display.');
  const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=2/Math.max(size.x,size.y,size.z,.0001);
  const root=new THREE.Group();model.position.sub(center);root.add(model);root.scale.setScalar(scale);return root;
}
export async function preview(asset:Asset){
  const model=await loadModel(asset),p=panel('🧊 Prototype preview · '+asset.name,true),canvas=h('canvas.studio-model'),renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setSize(850,350,false);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const scene=new THREE.Scene();scene.background=new THREE.Color('#dbe2e3');scene.add(model,new THREE.HemisphereLight(0xffffff,0x627077,2));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(3,5,4);scene.add(sun);const camera=new THREE.PerspectiveCamera(40,850/350,.01,100);camera.position.set(3,2,4);camera.lookAt(0,0,0);
  let dragging=false,frame=0;canvas.onpointerdown=e=>{dragging=true;canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(dragging){model.rotation.y+=e.movementX*.015;model.rotation.x+=e.movementY*.01;}};canvas.onpointerup=canvas.onpointercancel=()=>dragging=false;
  const draw=()=>{renderer.render(scene,camera);frame=requestAnimationFrame(draw);};draw();p.body.append(h('p',{},'Drag to rotate. The display is scaled to fit; the exported files retain their measurements.'),canvas);closeCleanup(p.modal,()=>{cancelAnimationFrame(frame);disposeModel(model);renderer.dispose();});
}
