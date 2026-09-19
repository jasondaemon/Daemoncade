export const CHAMPIONSHIPS = [
  {name:'Street Cup',place:3,pace:1},
  {name:'Club Championship',place:2,pace:1.04},
  {name:'Night Masters',place:1,pace:1.08},
];
export function championshipEvent(cursor) {
  const index=Math.max(0,Math.min(17,Math.floor(Number(cursor)||0)));
  return {index,stage:index%6,cup:Math.floor(index/6),...CHAMPIONSHIPS[Math.floor(index/6)]};
}
export function raceCursor(progress,difficulty) {
  return progress.championships?.[difficulty] ?? progress.cursors['race:'+difficulty] ?? 0;
}
export function configureEvent(run,event) {
  run.eventIndex=event.index;
  run.championship=event;
  run.rules={...run.rules,pace:run.rules.pace*event.pace};
}
