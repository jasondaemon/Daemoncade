import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {addCockpitBackings,configureCarMaterial} from "./car-visual-adapter.js";

function material(name){return{name,isMeshPhysicalMaterial:true,color:{value:null,set(value){this.value=value}},transmission:1,opacity:.4,transparent:true,depthWrite:false,depthTest:false,roughness:0,metalness:.3,ior:1,thickness:0,clearcoat:0,clearcoatRoughness:0,needsUpdate:false}}

const glass=configureCarMaterial(material("Glass"));
assert.equal(glass.color.value,0x0b2028);
assert.equal(glass.transmission,.72,"optimized cockpit glass must retain controlled transmission");
assert.equal(glass.opacity,1);
assert.equal(glass.transparent,false,"glass uses physical transmission, not alpha sorting");
assert.equal(glass.depthWrite,true,"windshield must occlude road geometry behind the empty cabin");
assert.equal(glass.depthTest,true);
assert.equal(glass.roughness,.14);
assert.equal(glass.metalness,0);
assert.equal(glass.ior,1.45);
assert.equal(glass.thickness,.1);
assert.equal(glass.clearcoat,.42);
assert.equal(glass.clearcoatRoughness,.14);
assert.equal(glass.needsUpdate,true);
const standardGlass=new THREE.MeshStandardMaterial({name:"Glass_6",color:0xffffff});configureCarMaterial(standardGlass);assert.equal("transmission" in standardGlass,false,"standard glass must not enable unsupported physical-material shader features");assert.equal(standardGlass.color.getHex(),0x0b2028);

const paint=material("Paint 1 Apex Cyan"),before={...paint};
assert.equal(configureCarMaterial(paint),paint);
assert.equal(paint.transmission,before.transmission,"non-glass material was changed");
assert.equal(paint.transparent,before.transparent,"non-glass alpha policy was changed");

const root=new THREE.Group(),pane=new THREE.Mesh(new THREE.BoxGeometry(2,1,3),new THREE.MeshPhysicalMaterial({name:"Glass",transmission:1}));pane.name="Windshield";root.add(pane);
assert.equal(addCockpitBackings(THREE,root),1);
const backing=pane.getObjectByName("WindshieldBacking");
assert.ok(backing,"optimized glass did not receive a cabin backing");
assert.equal(backing.material.name,"Cockpit Interior");
assert.equal(backing.material.transparent,false);
assert.equal(backing.material.color.getHex(),0x061219);
assert.equal(backing.castShadow,false);
assert.equal(backing.receiveShadow,false);
pane.geometry.computeBoundingBox();backing.geometry.computeBoundingBox();
assert.ok(backing.geometry.boundingBox.getSize(new THREE.Vector3()).length()<pane.geometry.boundingBox.getSize(new THREE.Vector3()).length(),"backing is not inset from glass shell");
const tub=root.getObjectByName("CockpitTub");assert.ok(tub,"optimized exterior has no opaque cockpit tub");assert.equal(tub.geometry.type,"SphereGeometry","cockpit closure regressed to a visible rectangular plate");assert.ok(tub.scale.x<1&&tub.scale.y<.35&&tub.scale.z<1.7,"cockpit shell is not constrained beneath the glass");assert.equal(tub.castShadow,false);assert.equal(tub.material.map,null,"cockpit backing must not inherit the patterned mechanical texture");
const floor=root.getObjectByName("CockpitFloor");assert.ok(floor,"cowl opening has no opaque floor");assert.equal(floor.geometry.type,"CircleGeometry","cowl closure must not be rectangular");assert.equal(floor.material,tub.material);assert.equal(floor.material.map,null);
const authoredRoot=new THREE.Group(),mechanical=new THREE.MeshStandardMaterial({name:"Mechanical",color:0x111111}),authoredPane=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshPhysicalMaterial({name:"Glass"}));authoredRoot.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mechanical),authoredPane);addCockpitBackings(THREE,authoredRoot);assert.notEqual(authoredPane.children[0].material,mechanical,"cockpit must not inherit the patterned mechanical material");assert.equal(authoredPane.children[0].material.name,"Cockpit Interior");
console.log("Apex Run car glass material passed");
