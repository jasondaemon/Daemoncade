import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.min.js';
import { addArchitecture } from './scenery.js';

test('detailed architecture stays instanced with bounded material batches', () => {
  const group = new THREE.Group(), geometry = new THREE.BoxGeometry(1,1,1);
  const materials = new Map();
  const material = color => {
    if (!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({color}));
    return materials.get(color);
  };
  const props = Array.from({length:30}, (_,i) => ({p:{x:i*20,y:20,heading:i*0.1},w:5,h:12,d:6}));
  addArchitecture(group,geometry,props,material,0xaaccff);
  assert(group.children.length <= 7);
  assert(group.children.every(o => o.isInstancedMesh));
  const matrix = new THREE.Matrix4();
  for (const mesh of group.children) {
    for (let i=0;i<mesh.count;i++) {
      mesh.getMatrixAt(i,matrix);
      assert(matrix.elements.every(Number.isFinite));
    }
    mesh.dispose();
  }
  geometry.dispose();
  for (const mat of materials.values()) mat.dispose();
});
