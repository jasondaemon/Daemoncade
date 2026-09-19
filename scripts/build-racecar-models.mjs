// Convert the bundled CC0 OBJ/MTL originals into compact, animation-ready meshes.
import fs from 'node:fs';
import path from 'node:path';
const dir = path.resolve('games/racecar/assets/quaternius-cars');
for (const name of ['NormalCar1','NormalCar2','SUV','SportsCar','SportsCar2','Taxi','Cop']) {
  const mats = {}; let mat;
  for (const line of fs.readFileSync(path.join(dir,name+'.mtl'),'utf8').split('\n')) {
    const [key,...args] = line.trim().split(/\s+/);
    if(key==='newmtl') { mat=args[0]; mats[mat]={}; }
    if(key==='Kd') mats[mat].color=args.map(Number);
  }
  const vertices=[null], normals=[null], groups=new Map(); let object='', material='';
  for(const line of fs.readFileSync(path.join(dir,name+'.obj'),'utf8').split('\n')) {
    const [key,...args]=line.trim().split(/\s+/);
    if(key==='o') object=args.join(' ');
    if(key==='usemtl') material=args[0];
    if(key==='v') vertices.push(args.map(Number));
    if(key==='vn') normals.push(args.map(Number));
    if(key!=='f') continue;
    const face=args.map(s=>s.split('/').map(Number));
    for(let i=1;i<face.length-1;i++) {
      const triangle=[face[0],face[i],face[i+1]];
      const wheel=/wheel/i.test(object);
      const side=triangle.reduce((sum,v)=>sum+vertices[v[0]][0],0)<0 ? 'left':'right';
      const part=wheel ? (/front/i.test(object)?'front-':'rear-')+side : 'body';
      const groupKey=part+':'+material;
      if(!groups.has(groupKey)) groups.set(groupKey,{part,material,positions:[],normals:[]});
      const group=groups.get(groupKey);
      for(const [v,,n] of triangle) {
        group.positions.push(...vertices[v]); group.normals.push(...normals[n]);
      }
    }
  }
  const all=vertices.slice(1), bounds=[0,1,2].map(i=>[Math.min(...all.map(v=>v[i])),Math.max(...all.map(v=>v[i]))]);
  const front=[...groups.values()].filter(g=>/headlight/i.test(g.material));
  const frontZ=front.flatMap(g=>g.positions.filter((_,i)=>i%3===2));
  const flip=frontZ.reduce((a,b)=>a+b,0)/frontZ.length>0 ? -1:1;
  const scale=4.3/(bounds[2][1]-bounds[2][0]);
  const center=[(bounds[0][0]+bounds[0][1])/2,bounds[1][0],(bounds[2][0]+bounds[2][1])/2];
  const parts=[...groups.values()].map(g=>{
    g.positions=g.positions.map((v,i)=>Number(((v-center[i%3])*scale*(i%3===1?1:flip)).toFixed(4)));
    g.normals=g.normals.map((v,i)=>Number((v*(i%3===1?1:flip)).toFixed(4)));
    return g;
  });
  fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify({materials:mats,parts}));
  console.log(name,parts.length,'parts',parts.reduce((n,p)=>n+p.positions.length/9,0),'triangles');
}
