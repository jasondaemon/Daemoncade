export function createPracticeSession(sectorCount){
  return{active:false,sectorCount,sectorStartedAt:0,attempts:0,best:Array(sectorCount).fill(null),last:Array(sectorCount).fill(null)};
}

export function beginPractice(session,raceTime=0){
  session.active=true;session.sectorStartedAt=raceTime;session.attempts=1;session.best.fill(null);session.last.fill(null);return session;
}

export function retryPracticeSector(session,raceTime){
  if(!session.active)return false;session.sectorStartedAt=raceTime;session.attempts++;return true;
}

export function completePracticeSector(session,checkpoint,raceTime){
  if(!session.active||checkpoint<1||checkpoint>session.sectorCount)return null;
  const index=checkpoint-1,elapsed=Math.max(0,raceTime-session.sectorStartedAt),previous=session.best[index];
  session.last[index]=elapsed;session.best[index]=previous===null?elapsed:Math.min(previous,elapsed);session.sectorStartedAt=raceTime;session.attempts=1;
  return{index,elapsed,best:session.best[index],improved:previous===null||elapsed<previous};
}

export function endPractice(session){session.active=false;return session}

export function currentPracticeTime(session,raceTime){return session.active?Math.max(0,raceTime-session.sectorStartedAt):0}
