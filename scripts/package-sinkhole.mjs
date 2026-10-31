import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,relative,extname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {modelPaths,ASSET_LICENSES,MUSIC_TRACK} from '../games/sinkhole-city/metro/assets.js';

export const REPO=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const RELEASE_VERSION='1.0.0';
const ENTRY='games/sinkhole-city/metro/index.html';
const APP_ENTRY='games/sinkhole-city/app.html';
export function resolveDependency(owner,spec){
 const clean=spec.split(/[?#]/)[0];
 if(!clean.startsWith('.'))throw new Error(`Non-local dependency in ${owner}: ${spec}`);
 const path=resolve(REPO,dirname(owner),clean),rel=relative(REPO,path);
 if(rel==='..'||rel.startsWith('..'+sep)||rel.startsWith(sep))throw new Error(`Dependency escapes repository: ${spec}`);
 return rel;
}
export function dependencies(path,source){
 const refs=[];
 if(extname(path)==='.js'){
  // The local graph uses literal ES module imports/re-exports; ignore comments.
  const code=source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
  for(const m of code.matchAll(/(?:^|[;\n])\s*(?:import\s*(?:[^;'"`]*?\bfrom\s*)?|export\s*[^;'"`]*?\bfrom\s*)['"]([^'"]+)['"]/g))refs.push(m[1]);
  for(const m of code.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g))refs.push(m[1]);
 }else if(extname(path)==='.html'){
  for(const m of source.matchAll(/<(?:script|link|iframe)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g))refs.push(m[1].startsWith('.')?m[1]:'./'+m[1]);
 }else if(extname(path)==='.css'){
  for(const m of source.matchAll(/url\(\s*['"]?([^'"\s)]+)/g))if(!m[1].startsWith('data:'))refs.push(m[1].startsWith('.')?m[1]:'./'+m[1]);
 }
 return refs.map(spec=>resolveDependency(path,spec));
}
function glbDependencies(path,bytes){
 if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2)throw new Error(`Invalid GLB: ${path}`);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString().trim());
 return [...(json.buffers||[]),...(json.images||[])].filter(r=>r.uri&&!r.uri.startsWith('data:')).map(r=>{
  if(/^(?:[a-z]+:|\/)/i.test(r.uri))throw new Error(`Non-local GLB resource: ${path}: ${r.uri}`);
  return resolveDependency(path,r.uri.startsWith('.')?r.uri:'./'+r.uri);
 });
}
export async function packagePreview(out){
 const target=resolve(out);
 // Never overwrite any directory. In particular, never use the checkout as output.
 if(target===REPO||target.startsWith(REPO+sep))throw new Error('Output must be outside the repository');
 await mkdir(target,{recursive:false});
 const files=new Set([ENTRY,'LICENSE.md','NOTICE.txt','games/sinkhole-city/metro/RELEASE-CANDIDATE.md','games/sinkhole-city/metro/RELEASE-QUALIFICATION.txt','games/sinkhole-city/metro/ASSET-PROVENANCE.txt','games/sinkhole-city/metro/qualification52-pacing.json',APP_ENTRY,'games/sinkhole-city/app-expedition.html','games/sinkhole-city/expedition-manifest.json','games/sinkhole-city/app-icon.png',...ASSET_LICENSES.map(a=>a.license)]);
 files.add(resolveDependency(ENTRY,MUSIC_TRACK));
 for(const world of['metro','basecamp','deep','alien','orbit'])for(const path of Object.values(modelPaths(world)))files.add(resolveDependency(ENTRY,path));
 const queue=[...files];
 for(let i=0;i<queue.length;i++){
  const path=queue[i],bytes=await readFile(resolve(REPO,path));
  const deps=extname(path)==='.glb'?glbDependencies(path,bytes):dependencies(path,bytes.toString());
  for(const dep of deps)if(!files.has(dep)){files.add(dep);queue.push(dep);}
 }
 const manifest=[];
 for(const path of [...files].sort()){
  const source=resolve(REPO,path);let bytes=await readFile(source);
  // The standalone preview cannot link to the unshipped legacy beta.
  if(path===ENTRY)bytes=Buffer.from(bytes.toString().replace('<a href="../">Five-world beta</a>',''));
  const dest=resolve(target,path);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,bytes);
  const attribution=ASSET_LICENSES.find(a=>path.startsWith(a.root));
  const music=path===resolveDependency(ENTRY,MUSIC_TRACK);
  manifest.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),license:attribution?.spdx||'GPL-3.0-only',licenseFile:attribution?.license||'LICENSE.md',...(music?{rightsConfirmation:'owner-confirmed-2026-10-31',provenanceFile:'games/sinkhole-city/metro/ASSET-PROVENANCE.txt'}:{})});
 }
 const inventory={format:1,kind:'stable',version:RELEASE_VERSION,build:'qualification52',entry:ENTRY,installEntry:APP_ENTRY,files:manifest,totalBytes:manifest.reduce((n,f)=>n+f.bytes,0),thirdParty:ASSET_LICENSES,acceptance:{stable:true,approval:'Owner accepted v1 scope and authorized publication on 2026-10-31',music:'owner-confirmed-2026-10-31',verificationLimits:['Physical-device endurance and Android testing were not performed by the local agent','Automated diagnostic routes are not uncoached human playtests']}};
 await writeFile(resolve(target,'asset-manifest.json'),JSON.stringify(inventory,null,2)+'\n');
 await writeFile(resolve(target,'index.html'),`<!doctype html><meta charset="utf-8"><title>Sinkhole City · 1.0</title><meta http-equiv="refresh" content="0;url=${APP_ENTRY}"><a href="${APP_ENTRY}">Play Sinkhole City</a>`);
 return inventory;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length!==3)throw new Error('Usage: node scripts/package-sinkhole.mjs /absolute/new-output-directory');
 const inventory=await packagePreview(process.argv[2]);console.log(JSON.stringify({out:resolve(process.argv[2]),files:inventory.files.length,bytes:inventory.totalBytes,entry:inventory.entry},null,2));
}
