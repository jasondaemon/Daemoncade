#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [inputPath,outputPath]=process.argv.slice(2);
if(!inputPath||!outputPath)throw new Error("Usage: node prepare-car-concept.mjs SOURCE.glb OUTPUT.glb");

const DROP_NODE=/^(Interior|Engine$|License Plate$)|WindshieldWipers|HoodInterior|HoodUnder/;
const WHEELS=new Map([["WheelFrontL","front-left"],["WheelFrontR","front-right"],["WheelRearL","rear-left"],["WheelRearR","rear-right"]]);
const PAINTS={
  "Paint 1 Carmine":{name:"Paint 1 Apex Cyan",color:[.012,.58,.68,1]},
  "Paint 2 Carmine":{name:"Paint 2 Apex Cyan",color:[.96,.77,.12,1]},
  "Paint 1 Pearl":{name:"Paint 1 Summit Gold",color:[.71,.42,.055,1]},
  "Paint 2 Pearl":{name:"Paint 2 Summit Gold",color:[.055,.105,.13,1]},
  "Paint 1 Graphite":{name:"Paint 1 Midnight Grid",color:[.018,.028,.045,1]},
  "Paint 2 Graphite":{name:"Paint 2 Midnight Grid",color:[.05,.64,.72,1]},
};

function parseGlb(file){
  const bytes=fs.readFileSync(file);
  if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2)throw new Error("Expected a binary glTF 2.0 file");
  let offset=12,json,bin;
  while(offset<bytes.length){const length=bytes.readUInt32LE(offset),type=bytes.readUInt32LE(offset+4),data=bytes.subarray(offset+8,offset+8+length);if(type===0x4e4f534a)json=JSON.parse(data.toString("utf8").trim());if(type===0x004e4942)bin=data;offset+=8+length}
  if(!json||!bin)throw new Error("GLB must contain JSON and BIN chunks");
  return{json,bin};
}
function remapList(list,used){const indices=[...used].sort((a,b)=>a-b),map=new Map(indices.map((old,index)=>[old,index]));return{items:indices.map(index=>structuredClone(list[index])),map,indices}}
function textureIndices(value,found=new Set){if(!value||typeof value!=="object")return found;for(const[key,item]of Object.entries(value)){if(key.toLowerCase().includes("texture")&&item&&Number.isInteger(item.index))found.add(item.index);textureIndices(item,found)}return found}
function pad4(buffer,pad=0){const length=(buffer.length+3)&~3;if(length===buffer.length)return buffer;return Buffer.concat([buffer,Buffer.alloc(length-buffer.length,pad)])}
function encodeGlb(json,bin){const jsonChunk=pad4(Buffer.from(JSON.stringify(json)),0x20),binChunk=pad4(bin);const header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+jsonChunk.length+8+binChunk.length,8);jh.writeUInt32LE(jsonChunk.length,0);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(binChunk.length,0);bh.writeUInt32LE(0x004e4942,4);return Buffer.concat([header,jh,jsonChunk,bh,binChunk])}

const{json:source,bin}=parseGlb(inputPath);
const keepNode=new Set(source.nodes.map((node,index)=>DROP_NODE.test(node.name||"")?null:index).filter(Number.isInteger));
const nodes=remapList(source.nodes,keepNode);
nodes.items.forEach((node,index)=>{node.children=node.children?.filter(child=>keepNode.has(child)).map(child=>nodes.map.get(child));if(!node.children?.length)delete node.children;if(node.mesh!==undefined)node.mesh=node.mesh;const wheel=WHEELS.get(node.name);if(wheel)node.extras={...(node.extras||{}),apexWheel:wheel}});
const usedMeshes=new Set(nodes.items.flatMap(node=>node.mesh===undefined?[]:[node.mesh]));
const meshes=remapList(source.meshes,usedMeshes);nodes.items.forEach(node=>{if(node.mesh!==undefined)node.mesh=meshes.map.get(node.mesh)});

const usedAccessors=new Set(),usedMaterials=new Set();
for(const mesh of meshes.items)for(const primitive of mesh.primitives){if(primitive.indices!==undefined)usedAccessors.add(primitive.indices);Object.values(primitive.attributes||{}).forEach(index=>usedAccessors.add(index));for(const target of primitive.targets||[])Object.values(target).forEach(index=>usedAccessors.add(index));if(primitive.material!==undefined)usedMaterials.add(primitive.material);for(const mapping of primitive.extensions?.KHR_materials_variants?.mappings||[])usedMaterials.add(mapping.material)}
const accessors=remapList(source.accessors,usedAccessors),materials=remapList(source.materials,usedMaterials);
for(const mesh of meshes.items)for(const primitive of mesh.primitives){if(primitive.indices!==undefined)primitive.indices=accessors.map.get(primitive.indices);for(const key of Object.keys(primitive.attributes||{}))primitive.attributes[key]=accessors.map.get(primitive.attributes[key]);for(const target of primitive.targets||[])for(const key of Object.keys(target))target[key]=accessors.map.get(target[key]);if(primitive.material!==undefined)primitive.material=materials.map.get(primitive.material);for(const mapping of primitive.extensions?.KHR_materials_variants?.mappings||[])mapping.material=materials.map.get(mapping.material)}

for(const material of materials.items){const paint=PAINTS[material.name];if(paint){material.name=paint.name;material.pbrMetallicRoughness={...(material.pbrMetallicRoughness||{}),baseColorFactor:paint.color}}}
const usedTextures=new Set();materials.items.forEach(material=>textureIndices(material,usedTextures));
const textures=remapList(source.textures||[],usedTextures),usedImages=new Set(),usedSamplers=new Set();
function remapTextureRefs(value){if(!value||typeof value!=="object")return;for(const[key,item]of Object.entries(value)){if(key.toLowerCase().includes("texture")&&item&&Number.isInteger(item.index))item.index=textures.map.get(item.index);remapTextureRefs(item)}}
materials.items.forEach(remapTextureRefs);
for(const texture of textures.items){if(texture.source!==undefined){usedImages.add(texture.source)}if(texture.sampler!==undefined)usedSamplers.add(texture.sampler);for(const extension of Object.values(texture.extensions||{}))if(extension.source!==undefined)usedImages.add(extension.source)}
const images=remapList(source.images||[],usedImages),samplers=remapList(source.samplers||[],usedSamplers);
for(const texture of textures.items){if(texture.source!==undefined)texture.source=images.map.get(texture.source);if(texture.sampler!==undefined)texture.sampler=samplers.map.get(texture.sampler);for(const extension of Object.values(texture.extensions||{}))if(extension.source!==undefined)extension.source=images.map.get(extension.source)}

const usedViews=new Set();
for(const accessor of accessors.items){if(accessor.bufferView!==undefined)usedViews.add(accessor.bufferView);if(accessor.sparse){usedViews.add(accessor.sparse.indices.bufferView);usedViews.add(accessor.sparse.values.bufferView)}}
images.items.forEach(image=>{if(image.bufferView!==undefined)usedViews.add(image.bufferView)});
const views=remapList(source.bufferViews,usedViews),chunks=[];let byteOffset=0;
views.items.forEach((view,index)=>{const old=source.bufferViews[views.indices[index]],slice=bin.subarray(old.byteOffset||0,(old.byteOffset||0)+old.byteLength),aligned=pad4(slice);view.buffer=0;view.byteOffset=byteOffset;chunks.push(aligned);byteOffset+=aligned.length});
for(const accessor of accessors.items){if(accessor.bufferView!==undefined)accessor.bufferView=views.map.get(accessor.bufferView);if(accessor.sparse){accessor.sparse.indices.bufferView=views.map.get(accessor.sparse.indices.bufferView);accessor.sparse.values.bufferView=views.map.get(accessor.sparse.values.bufferView)}}
images.items.forEach(image=>{if(image.bufferView!==undefined)image.bufferView=views.map.get(image.bufferView)});

const output={asset:{...source.asset,generator:"Apex Run CarConcept exterior preparation 1.0",copyright:"CarConcept © Eric Chadwick / Darmstadt Graphics Group, CC BY 4.0; modified by Apex Run"},scene:0,scenes:[{name:"Apex CarConcept Race Exterior",nodes:source.scenes[source.scene||0].nodes.filter(node=>keepNode.has(node)).map(node=>nodes.map.get(node))}],nodes:nodes.items,meshes:meshes.items,accessors:accessors.items,bufferViews:views.items,buffers:[{byteLength:byteOffset}],materials:materials.items,textures:textures.items,images:images.items,samplers:samplers.items,extensionsUsed:source.extensionsUsed,extensionsRequired:source.extensionsRequired,extensions:{...source.extensions,KHR_materials_variants:{variants:[{name:"Apex Cyan"},{name:"Summit Gold"},{name:"Midnight Grid"}]}}};
for(const key of["textures","images","samplers","extensionsRequired"])if(!output[key]?.length)delete output[key];
const outputBin=Buffer.concat(chunks),encoded=encodeGlb(output,outputBin);fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,encoded);
let triangles=0,primitives=0;for(const mesh of output.meshes)for(const primitive of mesh.primitives){primitives++;const accessor=output.accessors[primitive.indices??primitive.attributes.POSITION];triangles+=Math.floor(accessor.count/3)}
console.log(JSON.stringify({output:outputPath,bytes:encoded.length,triangles,primitives,nodes:output.nodes.length,materials:output.materials.length,textures:output.textures?.length||0,images:output.images?.length||0,wheels:output.nodes.filter(node=>node.extras?.apexWheel).map(node=>node.extras.apexWheel)},null,2));
