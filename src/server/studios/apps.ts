import { existsSync,mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import { spawn,execFileSync } from 'node:child_process';
import path from 'node:path';
import { Facilities } from '../facilities.js';
const paths:Record<string,string[]>={
  fl:['C:\\Program Files\\Image-Line\\FL Studio 21\\FL64.exe'],
  blender:['C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe','C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe'],
  paint:[path.join(process.env.SystemRoot??'C:\\Windows','System32','mspaint.exe'),path.join(process.env.LOCALAPPDATA??'','Microsoft','WindowsApps','mspaint.exe')],
};
let packagedPaint:string|undefined;
let checkedPaint=false;
function storePaint(){if(checkedPaint)return packagedPaint;checkedPaint=true;if(process.platform!=='win32')return;
  try{const location=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Get-AppxPackage -Name Microsoft.Paint | Select-Object -ExpandProperty InstallLocation'],{encoding:'utf8',timeout:5000,windowsHide:true,stdio:['ignore','pipe','ignore']}).trim();const exe=path.join(location,'PaintApp','mspaint.exe');if(location&&existsSync(exe))packagedPaint=exe;}catch{}return packagedPaint;
}
export const executable=(app:string)=>paths[app]?.find(p=>existsSync(p))??(app==='paint'?storePaint():undefined);
export function connections(){return Object.fromEntries(Object.keys(paths).map(app=>[app,!!executable(app)]));}
export function launchApp(vault:Facilities,app:string,id?:string) {
  const exe=executable(app);if(!exe)throw new Error('This app is not installed at a supported location on the office computer.');
  const args:string[]=app==='blender'?['--disable-autoexec']:[];
  if(id){const file=vault.file(id);if(!file)throw new Error('File not found in your vault.');
    const allowed:Record<string,RegExp>={fl:/\.(flp|wav|mp3|mid)$/i,blender:/\.blend$/i,paint:/\.(png|jpe?g|webp)$/i};
    if(!allowed[app].test(file.asset.name))throw new Error('This file format cannot be opened by that studio button.');
    const dir=path.join(vault.dir,'handoff',id);mkdirSync(dir,{recursive:true});const dest=path.join(dir,file.asset.name);writeFileSync(dest,file.body);args.push(dest);
  }
  return new Promise<void>((resolve,reject)=>{const child=spawn(exe,args,{shell:false,detached:true,stdio:'ignore',windowsHide:false});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});
}
export function importHandoff(vault:Facilities,id:string) {
  const file=vault.file(id);if(!file)throw new Error('File not found.');
  if(!/\.(png|jpe?g|webp|blend|flp)$/i.test(file.asset.name))throw new Error('Unsupported handoff file.');
  const dest=path.join(vault.dir,'handoff',id,file.asset.name);if(!existsSync(dest))throw new Error('Open this file in its app first, save changes, then import it here.');
  return vault.upload(file.asset.name,readFileSync(dest));
}
