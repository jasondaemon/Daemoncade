import * as THREE from "../vendor/three/three.module.min.js";

// Architectural detail is instanced by material, not one draw call per window.
export function addArchitecture(group, geometry, props, material, accent) {
  const batches = new Map();
  const add = (color, p, x, y, z, w, h, d) => {
    if (!batches.has(color)) batches.set(color, []);
    const c = Math.cos(p.heading), s = Math.sin(p.heading);
    batches.get(color).push({ x: p.x + x*c - z*s, y,
      z: p.y + x*s + z*c, rotation: -p.heading, w, h, d });
  };
  props.forEach(({p,w,h,d}, index) => {
    const wall = [0x304653, 0x3b485b, 0x253c48][index % 3];
    add(wall,p,0,h/2,0,w,h,d);
    add(0x172935,p,0,0.3,0,w+0.35,0.6,d+0.35);
    add(0x172935,p,0,h+0.15,0,w+0.25,0.3,d+0.25);
    add(wall,p,0,h+0.7,0,w*0.5,1.1,d*0.55);
    // Cornice and recessed lobby, with two-sided street-facing windows.
    add(accent,p,0,h-0.45,0,w+0.06,0.075,d+0.06);
    for (const side of [-1,1]) {
      add(0x172935,p,0,1.1,side*(d/2+0.025),w*0.48,1.8,0.07);
      for (let floor=2.7;floor<h-0.9;floor+=1.7)
        for (let x=-w/2+0.6;x<w/2-0.3;x+=0.85) {
          const lit = (Math.floor(floor*10+x*7)+index*3)%5 !== 0;
          add(lit ? (index%3===0 ? 0xffd69a : 0x92c9de) : 0x172935,
            p,x,floor,side*(d/2+0.035),0.38,0.65,0.06);
        }
      for (let floor=2.7;floor<h-0.9;floor+=1.7)
        for (let z=-d/2+0.6;z<d/2-0.3;z+=0.85) {
          const lit = (Math.floor(floor*10+z*7)+index*3)%5 !== 0;
          add(lit ? (index%3===0 ? 0xffd69a : 0x92c9de) : 0x172935,
            p,side*(w/2+0.035),floor,z,0.06,0.65,0.38);
        }
    }
  });
  for (const [color, parts] of batches) {
    const mat = material(color);
    if (color===0xffd69a || color===0x92c9de) {
      mat.emissive.setHex(color); mat.emissiveIntensity=0.55;
    }
    const mesh = new THREE.InstancedMesh(geometry,mat,parts.length);
    const dummy = new THREE.Object3D();
    parts.forEach((p,i)=>{
      dummy.position.set(p.x,p.y,p.z); dummy.rotation.y=p.rotation;
      dummy.scale.set(p.w,p.h,p.d); dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
    });
    group.add(mesh);
  }
}
