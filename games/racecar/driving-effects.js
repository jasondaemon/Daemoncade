import * as THREE from '../vendor/three/three.module.min.js';
export class DrivingEffects {
 constructor(group) {
  this.dust=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:0xc6ae8b,transparent:true,opacity:.18,depthWrite:false}),40);
  this.skids=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,.012,1),new THREE.MeshBasicMaterial({color:0x101218,transparent:true,opacity:.28,depthWrite:false}),80);
  for(const m of [this.dust,this.skids]){m.userData.owned=true;m.frustumCulled=false;m.count=0;group.add(m);}
  this.puffs=[];this.marks=[];this.last=0;this.pose=new THREE.Object3D();
 }
 update(run,point,reduced,active) {
  const now=run.time,p=run.player,angle=point.heading+(p.headingError||0);
  if(reduced||run.car?.hover){this.dust.count=this.skids.count=0;return;}
  if(active&&now-this.last>.055&&p.speed>8) {
   this.last=now;
   const x=point.x-Math.cos(angle)*1.7,z=point.y-Math.sin(angle)*1.7;
   if(Math.abs(p.x)>.92){this.puffs.push({x,z,t:now});if(this.puffs.length>40)this.puffs.shift();}
   if(p.slipping&&Math.abs(p.steering)>.25)for(const side of [-1,1]){this.marks.push({x:x-Math.sin(angle)*side*.75,z:z+Math.cos(angle)*side*.75,t:now,angle});if(this.marks.length>80)this.marks.shift();}
  }
  this.puffs=this.puffs.filter(p=>now-p.t<1.2);this.dust.count=this.puffs.length;
  this.puffs.forEach((p,i)=>{const age=now-p.t;this.pose.position.set(p.x,age*.6+.2,p.z);this.pose.rotation.set(0,p.t,0);this.pose.scale.setScalar((.25+age*.75)*(1-age/1.2));this.pose.updateMatrix();this.dust.setMatrixAt(i,this.pose.matrix);});
  this.marks=this.marks.filter(p=>now-p.t<12);this.skids.count=this.marks.length;
  this.marks.forEach((p,i)=>{this.pose.position.set(p.x,.055,p.z);this.pose.rotation.set(0,Math.PI/2-p.angle,0);this.pose.scale.set(1,1,2.4);this.pose.updateMatrix();this.skids.setMatrixAt(i,this.pose.matrix);});
  this.dust.instanceMatrix.needsUpdate=this.skids.instanceMatrix.needsUpdate=true;
 }
}
