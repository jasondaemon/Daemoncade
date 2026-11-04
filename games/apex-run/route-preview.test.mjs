import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const track=process.argv[2];
if(!track){
  for(const id of["alpine-sprint","summit-circuit","harbor-run","skyline-gauntlet"])
    execFileSync(process.execPath,[fileURLToPath(import.meta.url),id],{stdio:"inherit"});
  console.log("Apex Run four-track route previews passed");
}else{
  globalThis.location={search:`?track=${track}`};
  const model=await import(`./track-model.js?route-preview=${track}`);
  const stageForSample=sampleIndex=>model.CHECKPOINTS.findIndex((_,checkpoint)=>{const stage=model.routeStage(checkpoint);return sampleIndex>=stage[0].sampleIndex&&sampleIndex<=stage.at(-1).sampleIndex});
  const cues=[];
  for(let checkpoint=0;checkpoint<model.CHECKPOINTS.length;checkpoint++){
    const stage=model.routeStage(checkpoint);
    for(let index=0;index<stage.length;index+=Math.max(1,Math.floor(stage.length/18))){const point=stage[index],cue=model.routePreview(checkpoint,point,0);if(cue)cues.push({checkpoint,index:point.sampleIndex,cue})}
  }
  assert.ok(cues.some(({cue})=>cue.kind==="turn"),`${track} produced no actionable turn preview`);
  assert.ok(cues.every(({cue})=>cue.distance>=0&&cue.distance<=180),`${track} exposed a cue outside the restrained preview window`);
  assert.ok(cues.filter(({cue})=>cue.kind==="turn").every(({cue})=>["left","right"].includes(cue.direction)&&["bend","sharp","hairpin"].includes(cue.severity)),`${track} emitted an invalid turn description`);
  const straightHidden=model.ROUTE_STAGE_RANGES.some((_,checkpoint)=>model.routeStage(checkpoint).some(point=>model.routePreview(checkpoint,point,0)===null));
  assert.equal(straightHidden,true,`${track} never suppressed guidance on a clear section`);
  for(const gap of model.SURFACE_GAPS){const checkpoint=stageForSample(gap.start);assert.ok(checkpoint>=0,`${track} jump is outside every ordered stage`);const stage=model.routeStage(checkpoint),cue=stage.filter(point=>point.sampleIndex<gap.start).slice(-160).map(point=>model.routePreview(checkpoint,point,0)).find(item=>item?.kind==="jump"&&item.distance>=20);assert.equal(cue?.kind,"jump",`${track} did not preview ${gap.id} from its approach`);assert.ok(cue.distance>=20&&cue.distance<=150,`${track} jump preview distance is not useful`)}
  const loopStart=model.ROAD_SAMPLES.findIndex(sample=>sample.phase==="loop");if(loopStart>=0){const checkpoint=stageForSample(loopStart),stage=model.routeStage(checkpoint),before=stage.filter(point=>point.sampleIndex<loopStart).at(-100)||stage[0],cue=model.routePreview(checkpoint,before,0);assert.equal(cue?.kind,"loop",`${track} did not preview its loop`);assert.ok(cue.distance>=20&&cue.distance<=180,`${track} loop preview distance is not useful`);for(const point of stage.filter(point=>point.phase==="loop"))assert.notEqual(model.routePreview(checkpoint,point,0)?.kind,"turn",`${track} emitted a false corner inside its loop`)}
  for(let checkpoint=0;checkpoint<model.CHECKPOINTS.length;checkpoint++){
    const stage=model.routeStage(checkpoint);let progress=0;const directions=[];
    for(let index=1;index<stage.length-1;index++){const point=stage[index],before=stage[index-1],after=stage[index+1],heading=Math.atan2(after.z-before.z,after.x-before.x),target=model.routeTarget(checkpoint,point,0,progress);progress=target.progress;const aligned=model.routePreview(checkpoint,point,progress,heading),reversed=model.routePreview(checkpoint,point,progress,heading+Math.PI);if(aligned?.kind==="turn"){directions.push(aligned.direction);assert.notEqual(reversed?.kind,"turn",`${track} showed a directional corner while facing backward`) }else directions.push(null)}
    for(let index=2;index<directions.length;index++){const a=directions[index-2],b=directions[index-1],c=directions[index];assert.ok(!(a&&b&&c&&a===c&&a!==b),`${track} flickered ${a}/${b}/${c} across adjacent bend samples`)}
  }
  const finalCheckpoint=model.CHECKPOINTS.length-1,finalStage=model.routeStage(finalCheckpoint),finishCue=finalStage.slice(-200).map(point=>model.routePreview(finalCheckpoint,point,0)).find(cue=>cue?.kind==="finish");assert.equal(finishCue?.kind,"finish",`${track} did not identify the finish approach`);
  if(!model.SURFACE_GAPS.length&&loopStart<0)assert.equal(cues.some(({cue})=>cue.kind==="jump"||cue.kind==="loop"),false,`${track} invented a stunt hazard`);
  console.log(`Apex Run ${track} route preview passed`,{cues:cues.length,jumps:model.SURFACE_GAPS.length,loop:loopStart>=0});
}
