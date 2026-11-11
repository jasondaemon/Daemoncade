// Known-solution policy used by movement-based integration tests. All regional
// progress is earned through step, light and interaction; never assign puzzle state.
export function prepareRegional(s,p,{rules,walk,wait}){
 const light=value=>{if(s.light!==value)rules.toggle(s);};
 for(const [i,c] of p.controls.entries()){
  if(['current','wind','echo'].includes(p.mechanic)){
   walk(s,p.source);light(p.mechanic!=='current');wait(s,.08);
  }
  // Carry the flame under shelter, or a voice in shade, rather than exposing it.
  if(['wind','echo','clock'].includes(p.mechanic))light(false);
  if(p.mechanic==='frost'&&i>0)light(false);
  walk(s,c.at);
  if(p.mechanic==='clock'){light(false);rules.interact(s);continue;}
  light(!['wind','echo','furnace'].includes(p.mechanic)&&(p.mechanic!=='frost'||i===0)&&(p.mechanic!=='weave'||i%2===0));
  if(p.mechanic==='reflection')rules.step(s,{x:i%2?-1:1},0);
  wait(s,.68);
  if(p.mechanic==='roots'){light(false);wait(s,.08);}
 }
 walk(s,p.source);
 if(p.mechanic==='clock'){light(false);wait(s,.68);}
}
