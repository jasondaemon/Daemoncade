import test from 'node:test';import assert from 'node:assert/strict';
import {newCareer,tunedCar,buyCar,carPrice,carAvailable,restoreCareers,upgradeCost} from './career.js';
import {ImportedVehicles} from './imported-vehicles.js';
import {Run} from './rules.js';import {SecretCode} from './secret-code.js';
import * as THREE from '../vendor/three/three.module.min.js';
test('vehicle cleanup tolerates shared scene objects without vehicle metadata',()=>{
 assert.doesNotThrow(()=>new ImportedVehicles().release(new THREE.Group()));
});
test('secret code requires exact ordered input and expires incomplete sequences',()=>{
 const code=new SecretCode(),keys=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
 const results=keys.map((k,i)=>code.feed(k,i*100));assert.deepEqual(results,[false,false,false,false,false,false,false,false,false,true]);
 code.feed('arrowup',0);code.feed('arrowup',100);assert.equal(code.feed('a',200),false);assert.equal(code.feed('a',6000),false);
});
test('discount persists only in selected career; purchases use real price and admission',()=>{
 const p=newCareer('normal');p.wallet=1;assert.equal(buyCar(p,'ufo'),false);p.ufoDiscount=true;
 const data=restoreCareers({active:'normal',profiles:{normal:p,easy:newCareer('easy')}});
 assert.equal(carPrice(data.profiles.normal,'ufo'),1);assert.equal(carPrice(data.profiles.easy,'ufo'),2500000);
 assert.equal(carAvailable(data.profiles.normal,'ufo'),true);assert.equal(buyCar(data.profiles.normal,'ufo'),true);assert.equal(data.profiles.normal.wallet,0);assert.equal(buyCar(data.profiles.normal,'ufo'),false);
 assert.equal(upgradeCost(p,'ufo','nitrous'),null);
});
test('saucer holds unlimited nitro and never enters skid/drift state',()=>{
 const p=newCareer('normal');p.car='ufo';const r=new Run({mode:'race'});r.car=tunedCar(p);r.phase='playing';r.rivals=[];r.boost=0;
 for(let i=0;i<600;i++){r.update(1/60,{throttle:true,boost:true,drift:true,steer:.2});assert.equal(r.player.slipping,false);assert.equal(r.player.drifting,false);assert.equal(r.boost,100);assert.equal(r.boosting,true);}
});
test('hover models have no wheels, float above shadow and retain height with reduced motion',()=>{
 const f=new ImportedVehicles();
 for(const id of ['manta','ufo']){
  const root=f.create(0,id),v=root.userData.vehicle;assert.equal(v.wheels.length,0);assert.ok(v.hover);
  f.update(root,{x:0,z:30,speed:40,steering:.5},{x:0,y:0,heading:0},{time:1,boosting:false},false);
  assert.ok(v.body.position.y>.7);assert.ok(v.body.rotation.z<0);
  f.update(root,{x:0,z:30,speed:40},{x:0,y:0,heading:0},{time:2,boosting:true},true);
  assert.equal(v.body.position.y,.85);assert.equal(v.body.rotation.z,0);assert.ok(v.hoverGlow.emissiveIntensity>2);f.release(root);
 }
});
