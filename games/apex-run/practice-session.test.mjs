import assert from "node:assert/strict";
import test from "node:test";
import {beginPractice,completePracticeSector,createPracticeSession,currentPracticeTime,endPractice,retryPracticeSector} from "./practice-session.js";

test("practice retries reset only the current session sector clock",()=>{
  const session=beginPractice(createPracticeSession(3),10);
  assert.equal(currentPracticeTime(session,12.5),2.5);
  assert.equal(retryPracticeSector(session,12.5),true);
  assert.equal(session.attempts,2);assert.equal(currentPracticeTime(session,14),1.5);
  const first=completePracticeSector(session,1,15);assert.equal(first.elapsed,2.5);assert.equal(first.improved,true);
  retryPracticeSector(session,16);const second=completePracticeSector(session,2,20);assert.equal(second.elapsed,4);assert.deepEqual(session.best,[2.5,4,null]);
});

test("practice records session bests without serializable competitive output",()=>{
  const session=beginPractice(createPracticeSession(2),0);
  completePracticeSector(session,1,5);session.sectorStartedAt=0;const improved=completePracticeSector(session,1,4);
  assert.equal(improved.best,4);assert.equal(improved.improved,true);assert.equal(session.storage,undefined);assert.equal(session.outcome,undefined);
  endPractice(session);assert.equal(retryPracticeSector(session,8),false);
});
