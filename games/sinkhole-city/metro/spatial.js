// Broad phase only: the existing fit/support/descent solver remains authoritative.
// sync rebuilds external edits; update maintains the production moving/active set.
export class NearbyObjects{
 constructor(size=8){this.size=size;this.cells=new Map();this.entries=new Map();this.active=new Set();this.maxRadius=0;this.objects=null;this.count=0;this.version=0;}
 key(x,z){return `${Math.floor(x/this.size)}:${Math.floor(z/this.size)}`;}
 track(o){
  let entry=this.entries.get(o);if(!entry)return;
  if(o.phase==='consumed'){this.remove(o,entry);return;}
  const x=Math.floor((o.body?.x??o.x)/this.size),z=Math.floor((o.body?.z??o.z)/this.size);
  if(entry.x!==x||entry.z!==z){
   const old=this.cells.get(entry.key);old.delete(o);if(!old.size)this.cells.delete(entry.key);
   entry.x=x;entry.z=z;entry.key=`${x}:${z}`;let cell=this.cells.get(entry.key);if(!cell){cell=new Set();this.cells.set(entry.key,cell);}cell.add(o);
  }
  if(o.phase==='contact'||o.phase==='falling'||o.phase==='diving'||o.rockTarget||o.rockAngle||o.rockVelocity)this.active.add(o);else this.active.delete(o);
 }
 update(objects){
  if(this.objects!==objects||this.count!==objects.length){this.sync(objects);return;}
  for(const o of this.moving||[])this.track(o);
  for(const o of this.active)this.track(o);
 }
 remove(object,entry){const cell=this.cells.get(entry.key);cell?.delete(object);if(cell&&!cell.size)this.cells.delete(entry.key);this.entries.delete(object);this.active.delete(object);}
 sync(objects){
  if(this.objects!==objects||this.count!==objects.length){this.cells.clear();this.entries.clear();this.active.clear();this.objects=objects;this.count=objects.length;}
  this.maxRadius=0;this.version++;
  for(let i=0;i<objects.length;i++){
   const o=objects[i];
   let entry=this.entries.get(o);
   // Buried objects stay indexed so a reveal can collect them later in the same
   // authored-order tick, exactly as the original full scan did.
   if(o.phase==='consumed'){if(entry)this.remove(o,entry);continue;}
   this.maxRadius=Math.max(this.maxRadius,o.radius||0);
   const x=Math.floor((o.body?.x??o.x)/this.size),z=Math.floor((o.body?.z??o.z)/this.size);
   if(!entry||entry.x!==x||entry.z!==z){
    if(entry)this.remove(o,entry);const key=`${x}:${z}`;let cell=this.cells.get(key);if(!cell){cell=new Set();this.cells.set(key,cell);}cell.add(o);entry={key,x,z};this.entries.set(o,entry);
   }
   entry.seen=this.version;entry.order=i;
   // Accepted falls must finish even after the moving hole leaves their cell.
   // Rocking props also keep their recovery spring, including offscreen props.
   if(o.phase==='contact'||o.phase==='falling'||o.phase==='diving'||Math.abs(o.rockAngle||0)>0||Math.abs(o.rockVelocity||0)>0)this.active.add(o);else this.active.delete(o);
  }
  for(const [o,entry]of this.entries)if(entry.seen!==this.version)this.remove(o,entry);
  this.moving=objects.filter(o=>o.traffic||o.swim||o.orbital||o.walker);
 }
 query(player){
  const radius=player.radius+this.maxRadius*1.2,found=new Set(this.active),size=this.size;
  for(let x=Math.floor((player.x-radius)/size);x<=Math.floor((player.x+radius)/size);x++)for(let z=Math.floor((player.z-radius)/size);z<=Math.floor((player.z+radius)/size);z++)for(const o of this.cells.get(`${x}:${z}`)||[])found.add(o);
  // Preserve authored order, including simultaneous claims/reveals and scoring.
  return [...found].sort((a,b)=>this.entries.get(a).order-this.entries.get(b).order);
 }
}
