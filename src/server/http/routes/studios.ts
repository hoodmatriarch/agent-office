import type { Route } from '../router.js';
import { send,readBody,sameOrigin } from '../util.js';
import { Facilities } from '../../facilities.js';
import { connections,launchApp,importHandoff } from '../../studios/apps.js';
import { buildPrototype } from '../../studios/blender.js';
import { aiStatus,concept } from '../../studios/ai.js';
import { saveSettings } from '../../studios/settings.js';
import { createImage } from '../../studios/images.js';
const running=new Set<string>();
export const studiosRoute:Route={prefix:'/api/studios/',auth:'session',async handle(ctx,{req,res,path,session}) {
  const owner=session.account?.id??'shared-office',vault=new Facilities(ctx.cfg.dataDir,owner);
  if(req.method==='GET'&&path==='/api/studios/connections')return send(res,200,{apps:connections(),ai:aiStatus(vault,ctx.cfg.secret)});
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!sameOrigin(req,ctx.cfg))return send(res,403,{error:'Forbidden'});
  const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'');
  if(!local||session.account&&session.account.role!=='admin')return send(res,403,{error:'Studio app controls are available to the owner on this computer.'});
  if(running.has(owner))return send(res,409,{error:'Your studio is already completing a request. Wait for it to finish.'});
  try {
    const body=JSON.parse(await readBody(req,32*1024));running.add(owner);
    if(path==='/api/studios/launch'){await launchApp(vault,String(body.app),body.asset);return send(res,200,{ok:true});}
    if(path==='/api/studios/import')return send(res,200,importHandoff(vault,String(body.asset)));
    if(path==='/api/studios/prototype')return send(res,200,await buildPrototype(vault,body.recipe));
    if(path==='/api/studios/settings'){saveSettings(vault,ctx.cfg.secret,body);return send(res,200,{ok:true,ai:aiStatus(vault,ctx.cfg.secret)});}
    if(path==='/api/studios/image')return send(res,200,await createImage(vault,ctx.cfg.secret,body.prompt,body.image));
    if(path==='/api/studios/concept')return send(res,200,{recipe:await concept(vault,ctx.cfg.secret,body.provider,body.prompt,body.image)});
    return send(res,404,{error:'Not found'});
  }catch(e){return send(res,400,{error:(e as Error).message});}finally{running.delete(owner);}
}};
