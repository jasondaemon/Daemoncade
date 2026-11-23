"use strict";

Object.assign(campaignDefaults, {roadPresented:false, witnessesPresented:false, trustBroken:false});
for (const flag of ["roadPresented", "witnessesPresented", "trustBroken"]) w.me[flag] = false;
let crossingWarned = false;
let disclosureWarned = false;
let runFailed = false;

const hearingOpen = () => player.charterClue && player.nerisWitness && !player.hearingDecision;
const hearingReady = () => hearingOpen() && player.roadPresented && player.witnessesPresented;
const independentSupport = () => player.ridgeSignal && player.clerkCopy;
const sharedAvailable = () => hearingReady() && (!player.trustBroken || independentSupport());

for (const choice of campaignChoices) {
  if (choice.id === "shared") choice.ready = sharedAvailable;
  if (choice.id === "local") choice.ready = hearingReady;
}

function addAction(id, room, command, label, ready, action) {
  campaignChoices.push({id, room, command, label, ready});
  storyCommand(id, new RegExp("^" + command + "$"), () => {
    if (player.loc !== room || !ready()) return failedmsg("You can’t do that yet. Try HINT for a lead.");
    return action();
  });
}

function makeRoadCase(kind) {
  if (player.roadDecision !== kind) return failedmsg("You didn’t bring that evidence. Who or what did you bring from the old road?");
  player.roadPresented = true;
  msg(kind === "oral"
    ? "The driver points to where his wheel sank. “We drove that road yesterday.” The councilor crosses out ABANDONED. “Very well. Who else was paying for it?”"
    : "Fen unfolds her signed rubbing. The newest nick is a day old. The councilor sets aside the map. “That establishes the work. Who can speak for the people who did it?”");
  return world.SUCCESS;
}

function makeWitnessCase(kind) {
  if (player.orchardDecision !== kind) return failedmsg("That isn’t how Iven agreed to present the testimony.");
  player.witnessesPresented = true;
  disclosureWarned = false;
  msg(kind === "public"
    ? "Iven reads only the names she has permission to speak. The carter stands. “You can put mine beside the winter repairs.”"
    : "Iven submits the count and both witnesses attest to it. The councilor accepts the tally without opening the bundle.");
  return world.SUCCESS;
}

const roadQuestion = () => hearingOpen() && !player.roadPresented;
const witnessQuestion = () => hearingOpen() && player.roadPresented && !player.witnessesPresented && !player.trustBroken;
addAction("PresentDriver", "hall", "call the cart driver", "Call the cart driver", roadQuestion, () => makeRoadCase("oral"));
addAction("PresentRubbing", "hall", "present the milepost record", "Present milepost record", roadQuestion, () => makeRoadCase("marked"));
addAction("PresentNames", "hall", "offer public testimony", "Offer public testimony", witnessQuestion, () => makeWitnessCase("public"));
addAction("PresentTally", "hall", "offer the sealed tally", "Offer sealed tally", witnessQuestion, () => makeWitnessCase("sealed"));

const canBetray = () => hearingOpen() && player.roadPresented && player.orchardDecision === "sealed" && !player.witnessesPresented && !player.trustBroken;
addAction("ProposeDisclosure", "hall", "disclose private names", "Propose naming private witnesses", () => canBetray() && !disclosureWarned, () => {
  disclosureWarned = true;
  parser.abort();
  msg("Iven holds the seal down. “They trusted me to carry it. If you break that promise, I will withdraw my testimony.” You can keep the seal intact or insist on disclosure.");
  return world.SUCCESS_NO_TURNSCRIPTS;
});
addAction("BreakSeal", "hall", "insist on disclosure", "Break the seal anyway", () => canBetray() && disclosureWarned, () => {
  player.trustBroken = true;
  player.witnessesPresented = true;
  disclosureWarned = false;
  msg("Iven lifts the bundle away before the clerk can copy it. “The count is mine to withdraw.” She leaves the chamber.");
  msg(independentSupport() ? "The ridge signal and the copyist’s note can still support a shared agreement." :
    "You can still pursue local settlements. To make a wider case without Iven, find both the ridge signal and the copyist’s note.");
  return world.SUCCESS;
});

const canRiskCrossing = () => !bridgeOpen();
addAction("RiskCrossing", "tollhouse", "climb the gate", "Climb the barred gate", () => canRiskCrossing() && !crossingWarned, () => {
  crossingWarned = true;
  parser.abort();
  msg("You put one boot on the rail. A plank bends and cracks below you. Orra grabs your sleeve. “It won't hold.” Step back or force the crossing.");
  return world.SUCCESS_NO_TURNSCRIPTS;
});
addAction("StepBack", "tollhouse", "step back", "Step back", () => canRiskCrossing() && crossingWarned, () => {
  crossingWarned = false;
  msg("You step back onto stone. The plank is still moving when you take your hand off the rail.");
  return world.SUCCESS_NO_TURNSCRIPTS;
});
addAction("ForceCrossing", "tollhouse", "force the crossing", "Force the crossing", () => canRiskCrossing() && crossingWarned, () => {
  runFailed = true;
  parser.abort();
  crossingWarned = false;
  closeEncounter();
  msg("The plank gives way. You hear Orra shout once before the river takes the sound.");
  msg("GAME OVER · Retry from the tollhouse. Your investigation is intact.");
  return world.SUCCESS_NO_TURNSCRIPTS;
});

storyCommand("CaseNotebook", /^(?:review evidence|inspect evidence|review clues)$/, () => {
  msg("Which account doesn’t fit? Compare what the money paid for with the name written in the ledger.");
  if (player.sawLedger) msg("Ledger: six coppers paid for a plank. Orra’s mark is scratched out under Bellwick.");
  if (player.heardSurveyor) msg("Fen: three return fares were prepaid. By morning the box was empty.");
  if (player.heardWitness) msg("Leth: she saw Orra write his own mark and scratch it out.");
  if (hasEvidence() && !player.spokeUp) msg("You can question the keeper’s account or challenge Fen’s tally.");
  return world.SUCCESS_NO_TURNSCRIPTS;
});
storyCommand("ChallengeFen", /^(?:accuse fen|challenge (?:fen|the tally))$/, () => {
  if (player.loc !== "tollhouse") return failedmsg("Fen is at the tollhouse.");
  return failedmsg("Fen lays the sticks beside the ledger. “I counted what they paid. Who changed the name on the bill?”");
});

function recapLead() {
  if (player.completed) return "Your last letter was delivered. You can revisit the valley or start a new game.";
  if (player.hearingDecision) return "The hearing is settled. Follow the road home and deliver the last letters.";
  if (player.loc === "hall" || player.loc === "records") {
    if (!hearingOpen()) return "The council is waiting. Examine the charter and speak to Neris.";
    if (!player.roadPresented) return "The council is waiting for your evidence about the old road.";
    if (!player.witnessesPresented) return "The council has heard the road claim. Present Iven’s testimony as agreed.";
    if (player.trustBroken && !independentSupport()) return "Iven withdrew. You can pursue local settlements, or seek the ridge signal and copyist’s note.";
    return "The council has heard your case. Decide what kind of repair to ask for.";
  }
  if (player.orchardDecision) return "Iven’s testimony is ready. Bring it to the hearing.";
  if (player.loc === "orchard" || player.loc === "vestry") return "Find out what the orchard witnesses gave Iven permission to share.";
  if (player.roadDecision) return "You have evidence from the old road. Find Iven at the orchard.";
  if (player.loc === "washout" || player.loc === "ridge") {
    if (!player.roadClue || !player.roadWitness) return "The road is washed out. Compare the milepost with what Fen knows about the medicine cart.";
    return "You know what the washout threatens. Decide whether to clear the road now or preserve the milepost record.";
  }
  if (player.resolution) return bridgeOpen() ? "Bellwick’s name is back. Take Neris’s letters north with Fen." : "Bellwick’s name is back. Wait at the tollhouse for the dawn inspection.";
  if (player.spokeUp) return "Orra admitted what he did. Decide how Bellwick should be repaid.";
  if (hasEvidence()) return "You have three Bellwick clues. Compare the ledger, tally sticks and Leth’s account.";
  if (player.heardWitness) return "Leth saw the ledger changed. Compare her account with the tollhouse records.";
  if (player.sawLedger || player.heardSurveyor) return "You have part of the tollhouse account. A witness waits at the riverbank.";
  return "Find out why Bellwick vanished from the sign and the crossing is barred.";
}
