import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreCampaign, currentStage, completeStage } from './campaign.js';

test('new campaigns start at the first stage regardless of old selection', () => {
  assert.equal(currentStage(restoreCampaign({ selected: 2, unlocked: 2 })), 0);
});
test('migration preserves only consecutive completed stages', () => {
  assert.equal(restoreCampaign({ stars: { 0: 2, 2: 3 } }).completed, 1);
});
test('progress advances once, in order, and survives reload', () => {
  const campaign = restoreCampaign();
  completeStage(campaign, 1);
  assert.equal(campaign.completed, 0);
  completeStage(campaign, 0);
  completeStage(campaign, 0);
  assert.equal(currentStage(restoreCampaign(campaign)), 1);
  completeStage(campaign, 1);
  completeStage(campaign, 2);
  assert.equal(restoreCampaign(campaign).completed, 3);
  assert.equal(currentStage(campaign), 2);
});
test('an explicit new campaign does not restore historical stars', () => {
  assert.equal(restoreCampaign({ completed: 0, stars: { 0: 3, 1: 3, 2: 3 } }).completed, 0);
});
