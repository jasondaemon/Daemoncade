const STAGES = 3;

// The saved cursor is the next unfinished stage, never a board selection.
export function restoreCampaign(saved = {}) {
  let completed = 0;
  if (Number.isInteger(saved.completed) && saved.completed >= 0) {
    completed = Math.min(STAGES, saved.completed);
  } else {
    // Preserve earned progress from the former board picker, but not skipped boards.
    while (completed < STAGES && Number(saved.stars?.[completed]) > 0) completed++;
  }
  return { completed, started: completed > 0 || saved.started === true };
}

export function currentStage(campaign) {
  return Math.min(STAGES - 1, campaign.completed);
}

export function completeStage(campaign, stage) {
  if (stage === campaign.completed && stage < STAGES) campaign.completed++;
}
