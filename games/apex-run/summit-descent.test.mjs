import assert from "node:assert/strict";

globalThis.location={search:"?track=summit-circuit"};
const model=await import("./track-model.js?summit-descent-v2");
const connector=model.ROAD_SAMPLES.filter(sample=>sample.stunt==="connector");
assert.ok(connector.length>1200,"Summit descent lost its smooth collision tessellation");

let length=0,absoluteTurn=0,previousSign=0;const turnSigns=[];
for(let index=1;index<connector.length;index++){
  const before=connector[index-1],sample=connector[index];
  length+=Math.hypot(sample.x-before.x,sample.y-before.y,sample.z-before.z);
  const turn=Math.atan2(Math.sin(sample.heading-before.heading),Math.cos(sample.heading-before.heading));
  absoluteTurn+=Math.abs(turn);
  const sign=Math.abs(turn)>.0002?Math.sign(turn):0;
  if(sign&&sign!==previousSign){turnSigns.push(sign);previousSign=sign}
}
assert.ok(length>500&&length<530,`Summit descent length is no longer a bounded final rhythm: ${length.toFixed(1)}m`);
assert.deepEqual(turnSigns,[-1,1,-1],"Summit descent lost its three readable alternating apexes");
assert.ok(absoluteTurn*180/Math.PI>240,"Summit descent became another passive connector");
assert.ok(Math.max(...connector.map(sample=>sample.width))===40&&Math.min(...connector.map(sample=>sample.width))<10,"loop exit and finish widths changed");
const finish=connector.at(-1);assert.ok(Math.hypot(finish.x-650,finish.y-3,finish.z+120)<1e-6,"Summit finish position moved");
assert.ok(Math.abs(finish.heading+1.95)<.02,"Summit finish camera tangent changed");

let progress=0;const cueKinds=[],directions=[];
for(const fraction of[.05,.2,.35,.5,.65,.8,.92]){
  const sample=connector[Math.floor((connector.length-1)*fraction)],target=model.routeTarget(6,sample,34,progress);progress=target.progress;
  const cue=model.routePreview(6,sample,progress,sample.heading);if(cue){cueKinds.push(cue.kind);if(cue.direction)directions.push(cue.direction)}
}
assert.ok(directions.includes("left")&&directions.includes("right"),"route HUD does not explain the alternating descent");
assert.equal(cueKinds.at(-1),"finish","finish cue was lost after the descent");
console.log("Summit v2 descent geometry and guidance passed",{samples:connector.length,length:+length.toFixed(1),absoluteTurn:+(absoluteTurn*180/Math.PI).toFixed(1),turnSigns});
