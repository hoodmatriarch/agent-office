/** Only self-contained GLB files are allowed: models must not fetch other URLs or vault files. */
export function validateGLB(bytes:ArrayBuffer) {
  const v=new DataView(bytes);if(v.byteLength<20||v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==v.byteLength)throw new Error('Choose a valid self-contained GLB 2 model.');
  const length=v.getUint32(12,true);if(v.getUint32(16,true)!==0x4e4f534a||length>v.byteLength-20)throw new Error('The model header is invalid.');
  const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,length)));
  for(const item of [...(json.buffers??[]),...(json.images??[])])if(item.uri)throw new Error('Export a self-contained GLB with embedded geometry and textures. External resources are disabled.');
  if((json.accessors??[]).some((a:{count:number})=>!Number.isSafeInteger(a.count)||a.count<0||a.count>1500000))throw new Error('Choose a smaller prototype model.');
  if((json.accessors??[]).reduce((n:number,a:{count:number})=>n+a.count,0)>3000000||(json.nodes??[]).length>4096||(json.meshes??[]).length>1024)throw new Error('Choose a smaller prototype scene.');
  const extensions=Object.keys(json.extensions??{});if(extensions.some(e=>!['KHR_lights_punctual'].includes(e)))throw new Error('Export a standard GLB without custom scene extensions.');
  return json;
}
