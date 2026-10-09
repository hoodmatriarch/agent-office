import { createCipheriv,createDecipheriv,createHash,randomBytes } from 'node:crypto';
import { existsSync,readFileSync,writeFileSync,renameSync } from 'node:fs';
import path from 'node:path';
import type { Facilities } from '../facilities.js';
interface Settings {openai?:string;claude?:string;openaiModel?:string;claudeModel?:string;}
export function studioSettings(vault:Facilities,secret:string):Settings {
  const file=path.join(vault.dir,'connections.enc');if(!existsSync(file))return {};
  const bytes=readFileSync(file);const decipher=createDecipheriv('aes-256-gcm',createHash('sha256').update(secret+':studio-connections').digest(),bytes.subarray(0,12));decipher.setAuthTag(bytes.subarray(12,28));
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString('utf8'));
}
export function saveSettings(vault:Facilities,secret:string,value:unknown) {
  const body=value as Settings,current=studioSettings(vault,secret);
  for(const key of ['openai','claude','openaiModel','claudeModel'] as const){if(body[key]===undefined)continue;if(typeof body[key]!=='string'||body[key]!.length>400||/[\x00-\x1f\x7f]/.test(body[key]!))throw new Error('Invalid connection setting.');current[key]=body[key]!.trim();}
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',createHash('sha256').update(secret+':studio-connections').digest(),iv),encrypted=Buffer.concat([cipher.update(JSON.stringify(current),'utf8'),cipher.final()]);
  const file=path.join(vault.dir,'connections.enc'),temp=file+'.tmp';writeFileSync(temp,Buffer.concat([iv,cipher.getAuthTag(),encrypted]),{mode:0o600});renameSync(temp,file);
}
export function credentials(vault:Facilities,secret:string){const s=studioSettings(vault,secret);return {openai:s.openai||process.env.OPENAI_API_KEY,claude:s.claude||process.env.ANTHROPIC_API_KEY,openaiModel:s.openaiModel||process.env.OFFICE_OPENAI_MODEL||'gpt-4.1',claudeModel:s.claudeModel||process.env.OFFICE_CLAUDE_MODEL||'claude-sonnet-4-5'};}
