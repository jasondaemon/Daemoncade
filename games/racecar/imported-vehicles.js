import * as THREE from '../vendor/three/three.module.min.js';
import { VehicleFactory } from './vehicle.js?v=39';
import { CARS } from './garage.js?v=39';
import { FINISHES, isPaintSlot } from './finishes.js?v=39';
import {buildHover} from './hover-models.js?v=39';

export class ImportedVehicles extends VehicleFactory {
  constructor() { super(); this.models=new Map(); }
  async load() {
    await Promise.all(CARS.map(async car=>{
      if(car.procedural)return;
      const response=await fetch(new URL(`./assets/${car.source||'quaternius-cars'}/${car.model}.json`,import.meta.url));
      if(!response.ok) throw new Error('Car model unavailable');
      const data=await response.json();
      const paint = new THREE.MeshPhysicalMaterial({
        color:FINISHES[car.id].color,metalness:0.25,roughness:0.27,
        clearcoat:1,clearcoatRoughness:0.16,
      });
      const accent = paint.clone(); accent.color.multiplyScalar(0.48);
      this.models.set(car.id,data.parts.map(part=>{
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.positions,3));
        geometry.setAttribute('normal',new THREE.Float32BufferAttribute(part.normals,3));
        geometry.computeBoundingBox();
        const color=new THREE.Color().setRGB(...data.materials[part.material].color,THREE.SRGBColorSpace);
        const material=isPaintSlot(part.material)
          ? (part.material==='DarkOrange'?accent:paint)
          : this.mat(color.getHex(),/window/i.test(part.material)?0.45:0.2,/window/i.test(part.material)?0.2:0.42);
        return {part:part.part,materialName:part.material,geometry,material};
      }));
    }));
  }
  create(color,type,paint) {
    if(CARS.find(c=>c.id===type)?.procedural){
      const root=super.create(color,'coupe'),v=root.userData.vehicle;
      v.body.traverse(o=>{if(o.userData.ownedGeometry)o.geometry.dispose();});v.body.clear();
      for(const w of v.wheels){w.pivot.traverse(o=>{if(o.userData.ownedGeometry)o.geometry.dispose();});root.remove(w.pivot);}v.wheels=[];
      buildHover(v,type,paint);return root;
    }
    const parts=this.models.get(type);
    const root=super.create(color,parts?'coupe':type);
    if(!parts) return root;
    const v=root.userData.vehicle;
    for(const group of [v.body,...v.wheels.map(w=>w.spin)]) {
      group.traverse(o=>{if(o.userData.ownedGeometry)o.geometry.dispose();});
      group.clear();
    }
    for(const w of v.wheels) root.remove(w.pivot);
    v.wheels=[];
    const wheelGroups=new Map();
    for(const part of parts) {
      const material=/taillight/i.test(part.materialName)?v.brakes:/headlight/i.test(part.materialName)?v.headlights:part.material;
      let finish=material;
      if(paint&&isPaintSlot(part.materialName)) {
        finish=material.clone();finish.color.set(paint);
        if(part.materialName==='DarkOrange')finish.color.multiplyScalar(0.48);
      }
      const mesh=new THREE.Mesh(part.geometry,finish);
      if(finish!==material)mesh.userData.customPaint=true;
      if(part.part==='body') v.body.add(mesh);
      else {
        if(!wheelGroups.has(part.part)) wheelGroups.set(part.part,new THREE.Group());
        wheelGroups.get(part.part).add(mesh);
      }
    }
    for(const [name,group] of wheelGroups) {
      const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3());
      const pivot=new THREE.Group(),spin=new THREE.Group();
      group.position.copy(center).multiplyScalar(-1);
      spin.add(group);pivot.add(spin);pivot.position.copy(center);root.add(pivot);
      v.wheels.push({pivot,spin,front:name.startsWith('front'),radius:(bounds.max.y-bounds.min.y)/2});
    }
    return root;
  }
  update(root,actor,point,run,reduced) {
    super.update(root,actor,point,run,reduced);
    const v=root.userData.vehicle;
    if(v.hover){v.body.position.y=.85+(reduced?0:Math.sin(run.time*2.4)*.06);v.body.rotation.z=reduced?0:-(actor.steering||0)*.15;v.exhaust.visible=false;v.hoverGlow.emissiveIntensity=run.boosting?3:1.4;}
    for(const wheel of root.userData.vehicle.wheels)
      if(wheel.radius) wheel.spin.rotation.x=-(actor.z/wheel.radius)%(Math.PI*2);
  }
  release(root) {
    root.userData.vehicle?.hoverMaterials?.forEach(m=>m.dispose());
    root.traverse(o=>{if(o.userData.customPaint)o.material.dispose();});
    super.release(root);
  }
}
