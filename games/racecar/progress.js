import { clamp } from "./rules.js?v=39";
import { selectedCar, availableCars, CARS } from './garage.js?v=39';
import { championshipEvent } from './championships.js?v=39';
export function restore(data = {}) {
  if (!data || typeof data !== "object") data = {};
  const cursors = {};
  for (const mode of ["highway", "race"])
    for (const difficulty of ["easy", "normal", "hard"]) {
      const k = mode + ":" + difficulty;
      cursors[k] = clamp(Math.floor(Number(data.cursors?.[k])) || 0, 0, 6);
    }
  const progress = {
    cursors,
    results:
      data.results && typeof data.results === "object" ? data.results : {},
    mode: data.mode === "race" ? "race" : "highway",
    difficulty: ["easy", "normal", "hard"].includes(data.difficulty)
      ? data.difficulty
      : "normal",
    sound: data.sound !== false,
    reduced: typeof data.reduced === "boolean" ? data.reduced : null,
    car: typeof data.car === 'string' ? data.car : 'metro',
    unlockedCars: Array.isArray(data.unlockedCars) ? data.unlockedCars.filter(id=>CARS.some(c=>c.id===id)) : [],
    championships: Object.fromEntries(['easy','normal','hard'].map(d=>[d,
      clamp(Math.floor(Number(data.championships?.[d] ?? cursors['race:'+d]))||0,0,18)])),
    championshipResults: data.championshipResults && typeof data.championshipResults==='object' ? data.championshipResults : {},
  };
  progress.unlockedCars=availableCars(progress).map(c=>c.id);
  progress.car = selectedCar(progress).id;
  return progress;
}
export function record(progress, run) {
  const previousCars=availableCars(progress).map(c=>c.id);
  const key = run.mode + ":" + run.difficulty,
    stageKey = key + ":" + run.stage,
    old = progress.results[stageKey] || {};
  const event=run.mode==='race' && Number.isInteger(run.eventIndex) ? championshipEvent(run.eventIndex) : null;
  const won = run.phase === "finished",
    qualified = won && (run.mode === "highway" || run.position <= (event?.place || 3));
  const stars = qualified
    ? run.mode === "race"
      ? 4 - run.position
      : 1 + Number(run.collisions === 0) + Number(run.nearMisses >= 3)
    : 0;
  progress.results[stageKey] = {
    score: Math.max(Number(old.score) || 0, Math.floor(run.score)),
    stars: Math.max(Number(old.stars) || 0, Math.min(3, stars)),
    time:
      won && run.player.finish !== null
        ? Math.min(Number(old.time) || Infinity, run.player.finish)
        : old.time,
  };
  if (qualified && progress.cursors[key] === run.stage)
    progress.cursors[key] = Math.min(6, run.stage + 1);
  if(event) {
    const resultKey=run.difficulty+':'+event.index;
    const oldEvent=progress.championshipResults[resultKey];
    progress.championshipResults[resultKey]={
      bestPlace:won ? Math.min(oldEvent?.bestPlace||4,run.position) : (oldEvent?.bestPlace||4),
      cleared:!!oldEvent?.cleared || qualified,
    };
    if(qualified && progress.championships[run.difficulty]===event.index)
      progress.championships[run.difficulty]=Math.min(18,event.index+1);
  }
  progress.unlockedCars=availableCars(progress).map(c=>c.id);
  return { qualified, stars: Math.min(3, stars), unlocked:progress.unlockedCars.filter(id=>!previousCars.includes(id)) };
}
