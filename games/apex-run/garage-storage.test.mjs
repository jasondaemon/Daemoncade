import assert from "node:assert/strict";
import {createGarageStorage} from "./garage-storage.js";
class Storage{constructor(){this.data=new Map()}getItem(key){return this.data.get(key)??null}setItem(key,value){this.data.set(key,String(value))}removeItem(key){this.data.delete(key)}}
const raw=new Storage(),normal=createGarageStorage({storage:raw,search:""});assert.equal(normal,raw);normal.setItem("apex-run:garage:v1","production");
const qa=createGarageStorage({storage:raw,search:"?testStorage=garage-boot-1"});qa.setItem("apex-run:garage:v1","qa");assert.equal(qa.getItem("apex-run:garage:v1"),"qa");assert.equal(raw.getItem("apex-run:garage:v1"),"production");assert.equal(raw.getItem("apex-run:garage-qa:garage-boot-1:apex-run:garage:v1"),"qa");qa.removeItem("apex-run:garage:v1");assert.equal(raw.getItem("apex-run:garage:v1"),"production");assert.throws(()=>createGarageStorage({storage:raw,search:"?testStorage=../bad"}),/Invalid/);
console.log("Apex Run isolated garage storage passed");
