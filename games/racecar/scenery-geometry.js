import * as THREE from '../vendor/three/three.module.min.js';
// Authored silhouettes, normalized for instancing. Boats have a sharp bow,
// flared gunwales and a narrower keel rather than a scaled cylinder.
export function sceneryGeometry(shape) {
 if(shape==='jib'){const g=sceneryGeometry('sail');g.scale(-1,1,1);return g;}
 if(shape==='hull') {
  const outline=[[0,-.5],[.31,-.36],[.49,-.08],[.46,.35],[.32,.5],[-.32,.5],[-.46,.35],[-.49,-.08],[-.31,-.36]],v=[],idx=[];
  for(const [scale,y] of [[.52,-.5],[.86,-.15],[1,.5]])for(const [x,z] of outline)v.push(x*scale,y,z*(.85+.15*scale));
  const n=outline.length;
  for(let ring=0;ring<2;ring++)for(let i=0;i<n;i++){const a=ring*n+i,b=ring*n+(i+1)%n;idx.push(a,b,a+n,b,b+n,a+n);}
  for(let i=1;i<n-1;i++)idx.push(2*n,2*n+i+1,2*n+i);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 if(shape==='sail') {
  const v=[],idx=[],steps=8;
  for(let row=0;row<=steps;row++)for(let col=0;col<=steps;col++){
   const t=row/steps,u=col/steps;v.push(-.5+u*(1-t),t-.5,Math.sin(u*Math.PI)*Math.sin(t*Math.PI)*.18);
  }
  for(let y=0;y<steps;y++)for(let x=0;x<steps;x++){const a=y*(steps+1)+x;idx.push(a,a+1,a+steps+1,a+1,a+steps+2,a+steps+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 if(shape==='gable') {
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0,.5,0,0,0,1,0],3));g.computeVertexNormals();return g;
 }
 if(shape==='ring')return new THREE.TorusGeometry(.38,.12,5,12);
 if(shape==='box')return new THREE.BoxGeometry(1,1,1);
 if(shape==='cone')return new THREE.ConeGeometry(.5,1,7);
 if(shape==='cylinder')return new THREE.CylinderGeometry(.5,.5,1,10);
 return new THREE.IcosahedronGeometry(.5,1);
}
