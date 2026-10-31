export const STEP = 1 / 60;

// Gameplay and the round timer advance together, independent of render rate.
export class RunClock {
  constructor(){ this.reset(); }
  reset(){ this.elapsed = 0; this.accumulator = 0; this.last = null; }
  rebase(){ this.last = null; this.accumulator = 0; }
  advance(now, step){
    if(this.last === null){ this.last = now; return true; }
    const delta = Math.max(0, (now - this.last) / 1000); this.last = now;
    // Long stalls require explicit resume, instead of burning time in the background.
    if(delta > .5){ this.rebase(); return false; }
    this.accumulator += delta;
    while(this.accumulator + 1e-9 >= STEP){
      this.accumulator -= STEP; this.elapsed += STEP;
      if(step(STEP, this.elapsed * 1000) === false){ this.accumulator = 0; break; }
    }
    return true;
  }
}

export class SceneAssets {
  constructor(){ this.entries = []; }
  register(image, scenes, url){
    this.entries.push({image, scenes: Array.isArray(scenes) ? scenes : [scenes], url});
  }
  releaseExcept(scene){
    for(const entry of this.entries) if(!entry.scenes.includes(scene)){
      entry.image.removeAttribute('src'); entry.ready = false;
    }
  }
  async load(scene, progress = () => {}){
    const entries = this.entries.filter(entry => entry.scenes.includes(scene)); let done = 0;
    const failures = [];
    await Promise.all(entries.map(async entry => {
      try {
        if(!entry.ready){
          // Image.decode rejects on a missing/corrupt resource; vector fallbacks remain usable.
          entry.image.src = entry.url;
          let timeout;
          try {
            await Promise.race([entry.image.decode(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Image timeout')),12000);})]);
            entry.ready = true;
          } finally { clearTimeout(timeout); }
        }
      } catch { entry.image.removeAttribute('src'); failures.push(entry.url); }
      progress(++done, entries.length);
    }));
    return failures;
  }
}

export function readJSON(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
export function writeStorage(key, value){
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
