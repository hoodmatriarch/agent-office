import { Facilities } from '../facilities.js';
import { recipe,DESIGN_INSTRUCTION } from '../../shared/studio-files.js';
import { credentials } from './settings.js';
export const aiStatus=(vault:Facilities,secret:string)=>{const c=credentials(vault,secret);return {openai:!!c.openai,claude:!!c.claude};};
export async function concept(vault:Facilities,secret:string,provider:string,prompt:string,imageId?:string) {
  if(!['openai','claude'].includes(provider))throw new Error('Choose ChatGPT or Claude.');
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>20000)throw new Error('Describe your design in up to 20,000 characters.');
  const c=credentials(vault,secret),key=provider==='openai'?c.openai:c.claude;if(!key)throw new Error('Open Studio connections to configure your API access. Browser subscriptions do not activate it.');
  const file=imageId?vault.file(imageId):null;if(imageId&&(!file||!/^image\/(png|jpeg|webp)$/.test(file.asset.type)||file.body.length>8*1024*1024))throw new Error('Choose a PNG, JPEG or WebP concept under 8 MB from your vault.');
  const instruction=DESIGN_INSTRUCTION;
  let url:string,headers:Record<string,string>,body:unknown;
  if(provider==='openai') {
    url='https://api.openai.com/v1/responses';headers={authorization:'Bearer '+key,'content-type':'application/json'};
    body={model:c.openaiModel,store:false,instructions:instruction,input:[{role:'user',content:[{type:'input_text',text:prompt},...(file?[{type:'input_image',image_url:`data:${file.asset.type};base64,${file.body.toString('base64')}`}]:[])]}],max_output_tokens:6000};
  }else{
    url='https://api.anthropic.com/v1/messages';headers={'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'};
    body={model:c.claudeModel,max_tokens:6000,system:instruction,messages:[{role:'user',content:[...(file?[{type:'image',source:{type:'base64',media_type:file.asset.type,data:file.body.toString('base64')}}]:[]),{type:'text',text:prompt}]}]};
  }
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(60000)}),result=await response.json() as any;
  if(!response.ok)throw new Error(`${provider==='openai'?'OpenAI':'Claude'} rejected this request (${response.status}). Check the server connection and billing.`);
  const text=provider==='openai'?result.output?.flatMap((o:any)=>o.content??[]).filter((c:any)=>c.type==='output_text').map((c:any)=>c.text).join(''):result.content?.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('');
  return recipe(JSON.parse(String(text).replace(/^\s*```(?:json)?\s*|\s*```\s*$/g,'')));
}
