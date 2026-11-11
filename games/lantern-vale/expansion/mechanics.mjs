// Regional circuits run through the same public movement, lantern and interaction
// controls as combat. Partial work is checkpointed; reset always clears it safely.
export const mechanics=['roots','current','reflection','furnace','wind','frost','clock','echo','weave'];
export const instructions={
 roots:'At each root, raise light until grown, then lower it to bank the warmth. Bank all roots, then lower light at the source.',
 current:'Lower light at the source to still the current. Then raise light at each silver page. Lower light at the source to finish.',
 reflection:'Raise light at each facet, facing east for odd facets and west for even facets. Lower light at the source to reveal the constellation.',
 furnace:'Cool each shutter with lowered light. Raise light at the source to fire the bellows; raising light beside a shutter reheats it.',
 wind:'Raise light at the source to shelter a flame. Carry it with light lowered to each vane before the shelter fades (20 seconds). Return to renew shelter as needed. Raise light at the source to finish.',
 frost:'Raise light at the first mirror to thaw it; keep light lowered at all remaining mirrors to freeze them. Lower light at the source to finish. Light melts frozen mirrors again.',
 clock:'With light lowered, set the numbered escapements in order using E. A wrong order resets the sequence. Pause in shade at the source, then raise light there to wind the spring.',
 echo:'Raise light at the source to call a voice. Carry it in darkness to a listener. Repeat for every listener; light at a listener scares its voice away. Lower light at the source to finish.',
 weave:'Visit the colors in numbered order, alternating raised and lowered light, starting raised. The wrong light unweaves that color. Raise light at the source to join the dawn.'
};
const near=(s,p)=>Math.hypot(s.x-p[0],s.y-p[1])<.8;
export function regionalState(v,p){v.marks??=p.controls.map(()=>0);v.dwell??=p.controls.map(()=>0);v.reserve??=0;v.rest??=0;return v;}
export function regionalInteract(s,p,v,i){
 if(p.mechanic!=='clock')return;
 regionalState(v,p);
 const next=v.marks.findIndex(n=>n<1);
 if(s.light||i!==next){v.marks.fill(0);v.rest=0;s.message='The escapements slip. Lower light and start again at 1.';}
 else {v.marks[i]=1;s.message=`Escapement ${i+1} catches. Return to shade at the source after the last.`;}
}
export function regionalStep(s,p,v,dt){
 if(!p.mechanic)return true;
 regionalState(v,p);
 const source=near(s,p.source),m=p.mechanic,all=()=>v.marks.every(n=>n===1);
 if(m==='current'&&source&&!s.light)v.reserve=1;
 if(m==='wind')v.reserve=source&&s.light?20:Math.max(0,v.reserve-dt);
 if(m==='echo'&&source&&s.light)v.reserve=1;
 for(const [i,c] of p.controls.entries()){
  if(!near(s,c.at)) {v.dwell[i]=0;continue;}
  let active=false;
  if(m==='roots'){
   if(s.light&&v.marks[i]!==1)v.dwell[i]=Math.min(.6,v.dwell[i]+dt);
   if(!s.light&&v.dwell[i]>=.6)v.marks[i]=1;
   continue;
  }
  if(m==='current')active=v.reserve===1&&s.light;
  if(m==='reflection')active=s.light&&s.facing[0]*(i%2?-1:1)>.9;
  if(m==='furnace'){active=!s.light;if(s.light)v.marks[i]=0;}
  if(m==='wind')active=!s.light&&v.reserve>0;
  if(m==='frost'){active=i===0?s.light:!s.light;if(i>0&&s.light)v.marks[i]=0;}
  if(m==='echo'){active=!s.light&&v.reserve===1;if(s.light)v.marks[i]=0;}
  if(m==='weave'){
   const next=v.marks.findIndex(n=>n<1);
   active=i===next&&s.light===(i%2===0);
   if(i===next&&s.light!==(i%2===0)){v.dwell[i]=Math.min(.6,v.dwell[i]+dt);if(v.dwell[i]>=.6){v.marks.fill(0);v.dwell.fill(0);}continue;}
  }
  if(m==='clock')continue;
  v.dwell[i]=active?Math.min(.6,v.dwell[i]+dt):0;
  if(v.dwell[i]>=.6){v.marks[i]=1;if(m==='echo')v.reserve=0;}
 }
 if(m==='clock')v.rest=all()&&source&&!s.light?Math.min(.6,v.rest+dt):v.rest;
 return all()&&(m!=='clock'||v.rest>=.6);
}

export function controlLabel(p,v,i){
 const ready=v?.marks?.[i]===1;
 const action={roots:'Grow ↑ then bank ↓',current:'Still source, then ↑',reflection:i%2?'↑ Face west':'↑ Face east',furnace:'Cool ↓',wind:'Shelter, then carry ↓',frost:i===0?'Thaw ↑':'Freeze ↓',clock:'↓ E in order',echo:'Call, then carry ↓',weave:i%2?'Weave ↓':'Weave ↑'}[p.mechanic];
 const progress=v?.dwell?.[i]>0?` ${Math.round(v.dwell[i]/.6*100)}%`:'';
 return `${i+1} · ${ready?'Ready':action+progress}`;
}
