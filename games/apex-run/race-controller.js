import {checkpointAdvance} from "./track-model.js?v=0.5.0-alpha17";

export class RaceController{
  constructor(){this.reset({ready:true})}
  reset({ready=false}={}){this.state=ready?"ready":"countdown";this.pausedFrom=null;this.time=0;this.countdown=3;this.checkpoint=0;this.tick=0;this.eligible=true;return this}
  start(){if(this.state!=="ready")return false;this.state="countdown";return true}
  advance(dt){
    if(this.state==="countdown"){this.countdown-=dt;if(this.countdown<=0){this.countdown=0;this.state="racing"}}
    if(this.state==="racing"){this.time+=dt;this.tick++}
  }
  observe(position){
    if(this.state!=="racing")return{finished:false,checkpointChanged:false};
    const next=checkpointAdvance(this.checkpoint,position),checkpointChanged=next!==this.checkpoint;this.checkpoint=next;
    if(this.checkpoint===6){this.state="finished";return{finished:true,checkpointChanged}}
    return{finished:false,checkpointChanged};
  }
  step(dt,position){this.advance(dt);return this.observe(position)}
  recover(penalty=1.5){if(this.state==="racing"){this.time+=penalty;this.eligible=false}}
  pause({invalidate=false}={}){if(!["countdown","racing"].includes(this.state))return false;this.pausedFrom=this.state;this.state="paused";if(invalidate)this.eligible=false;return true}
  resume(){if(this.state!=="paused")return false;this.state=this.pausedFrom||"countdown";this.pausedFrom=null;return true}
}
