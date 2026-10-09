import { panel as basePanel } from '../facilities/panels';
export { action,input,chooseFile,closeCleanup } from '../facilities/panels';
export function panel(title:string,wide=false){const p=basePanel(title,wide);p.root.classList.add('studio-panel');return p;}
