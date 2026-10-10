import { Facilities } from '../../facilities.js';
import { storageSnapshot } from '../../storage/stats.js';
import type { Route } from '../router.js';
import { send } from '../util.js';
export const storageRoute:Route={path:'/api/storage',method:'GET',auth:'session',async handle(ctx,{res,session}){
  try{const vault=new Facilities(ctx.cfg.dataDir,session.account?.id??'shared-office');return send(res,200,await storageSnapshot(vault.dir));}
  catch{return send(res,500,{error:'Storage information could not be read. Try Refresh.'});}
}};
