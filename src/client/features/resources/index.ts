import type { Ctx } from '../../core/context';
import { action } from '../facilities/panels';
import { readingDocumentTools } from '../reading/documents';
import { editAssignments } from './archive';
import './ui.css';
export { openArchives } from './archive';
export { archiveStore,archiveUpload } from './store';
export { openResource,stationCards } from './view';
export function installResources(_ctx:Ctx){
  readingDocumentTools.set('station-archives',item=>item.asset?[action('Assign to station libraries',()=>editAssignments(item.id))]:[]);
}
