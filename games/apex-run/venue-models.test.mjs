import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import {VENUE_IDENTITY,addRadialServiceBays,addServiceCauseway} from "./venue-models.js";

const scene=new THREE.Scene();
const bays=addRadialServiceBays(THREE,scene,{x:0,z:0,y:2,radius:40,count:10});
const causeway=addServiceCauseway(THREE,scene,{x:0,y:0,z:0,length:34});
assert.equal(VENUE_IDENTITY.unit,"metre");
assert.equal(bays.count,10);
assert.equal(bays.frames.count,10);
assert.equal(scene.children.length,3);
assert.equal(causeway.children.length,3);
console.log("Apex reusable venue modules passed");
