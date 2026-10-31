import {MUSIC_TRACK} from './assets.js?v=music41';

// Stream the existing beta track. One media element, no decoded full-song
// AudioBuffer, no menu prefetch and no queued retries after losing focus.
export class MusicPlayer{
 constructor(create=()=>new Audio(),hidden=()=>globalThis.document?.hidden){this.create=create;this.hidden=hidden;this.media=null;this.wanted=false;}
 start(reset=false){
  if(this.hidden())return;
  this.wanted=true;
  try{
   // Attenuation is baked into the game-only track (-20 dB), so browsers that
   // ignore media-element volume still receive the same quieter source.
   if(!this.media){const m=this.media=this.create();m.preload='none';m.loop=true;m.volume=1;m.src=MUSIC_TRACK;m.onplaying=()=>{if(!this.wanted||this.hidden())m.pause();};}
   if(reset)this.media.currentTime=0;
   const m=this.media;const pending=m.play();
   pending?.then(()=>{if(!this.wanted||this.hidden())m.pause();}).catch(()=>{});
  }catch{/* Optional music failures must never block play. */}
 }
 pause(){this.wanted=false;try{this.media?.pause();}catch{}}
}
