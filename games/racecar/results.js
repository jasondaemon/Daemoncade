export function resultPresentation(run,outcome) {
  if(run.phase==='lost') return {
    title:run.reason==='fuel'?'OUT OF FUEL':run.reason==='wrecked'?'WRECKED':'TIME UP',
    subtitle:'Try again, or choose another car in the garage.',primary:'RETRY',
  };
  const cupComplete=run.mode==='race' && outcome.qualified && Number.isInteger(run.eventIndex) && run.eventIndex%6===5;
  const required=run.championship?.place||3;
  return {
    title:cupComplete ? (run.eventIndex===17?'CAREER COMPLETE':'CHAMPIONSHIP COMPLETE') :
      run.mode==='highway'?'CHECKPOINT CLEARED':run.position===1?'VICTORY':outcome.qualified?'QUALIFIED':'EVENT COMPLETE',
    subtitle:outcome.qualified ? (cupComplete?'Championship secured. Your progress and rewards are saved.':'Progress saved. Visit the garage before your next event.') :
      `Finished ${run.position}${run.position===2?'nd':run.position===3?'rd':'th'}. ${required===1?'Win':`Finish in the top ${required}`} to advance.`,
    primary:outcome.qualified?'CONTINUE TO GARAGE':'RETRY',
  };
}
