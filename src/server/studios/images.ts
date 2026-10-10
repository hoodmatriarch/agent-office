import { Facilities } from '../facilities.js';
import { credentials } from './settings.js';
export async function createImage(vault:Facilities,secret:string,prompt:string,imageId?:string){
  const key=credentials(vault,secret).openai;if(!key)throw new Error('Add OpenAI API access in Studio connections first.');
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>6000)throw new Error('Describe your image in up to 6,000 characters.');
  let body:BodyInit,headers:Record<string,string>={authorization:'Bearer '+key},endpoint='generations';
  if(imageId){const f=vault.file(imageId);if(!f||!/^image\/(png|jpeg|webp)$/.test(f.asset.type)||f.body.length>8*1024*1024)throw new Error('Choose a PNG, JPEG or WebP concept under 8 MB.');
    const form=new FormData();form.set('model','gpt-image-2.5-sunburst');form.set('prompt',prompt);form.set('size','1024x1024');form.set('quality','low');form.set('image',new Blob([new Uint8Array(f.body)],{type:f.asset.type}),f.asset.name);body=form;endpoint='edits';
  }else{headers['content-type']='application/json';body=JSON.stringify({model:'gpt-image-2.5-sunburst',prompt,size:'1024x1024',quality:'low',n:1});}
  const response=await fetch('https://api.openai.com/v1/images/'+endpoint,{method:'POST',headers,body,signal:AbortSignal.timeout(120000)});if(!response.ok)throw new Error(`OpenAI image request failed (${response.status}). Check API access and billing.`);
  const result=await response.json() as {data?:{b64_json?:string}[]},b64=result.data?.[0]?.b64_json;if(!b64)throw new Error('The image service did not return an image.');return vault.upload('AI-concept-'+Date.now()+'.png',Buffer.from(b64,'base64'));
}
