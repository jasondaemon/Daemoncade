"use strict";

// Side scenes reward exploration and are deliberately outside the route gates.
Object.assign(campaignDefaults, {ridgeSignal:false, keptPromise:false, clerkCopy:false});
for (const flag of ["ridgeSignal", "keptPromise", "clerkCopy"]) w.me[flag] = campaignDefaults[flag];

w.washout.west = new Exit("ridge");
w.orchard.east = new Exit("vestry");
w.hall.north = new Exit("records");

createRoom("ridge", {
  alias:"The Signal Ridge",
  desc:"The ridge path ends at a square stone basket above the road. Someone has left a matchbox inside an upturned kettle. Far down the track, the medicine cart's lamp blinks once. The washout is east.",
  east:new Exit("washout"),
});
createItem("signal_basket", {
  alias:"signal basket", synonyms:["basket","beacon","kettle"], loc:"ridge", scenery:true,
  examine:"The lid is scratched with two short lines. One light means a cart is expected. Two lights mean there is a safe route around the washout.",
});
storyCommand("RidgeSignal", /^(?:light (?:the )?(?:beacon|signal|basket)|signal the cart)$/, () => {
  if (player.loc !== "ridge") return failedmsg("The signal basket is west of the washout.");
  if (player.ridgeSignal) return failedmsg("Both lights are already burning.");
  player.ridgeSignal = true;
  msg("You light the two wicks. Far below, the cart lights its second lamp. Someone on the ridge has finally answered it.");
  return world.SUCCESS;
});

createRoom("vestry", {
  alias:"The Room of Unspoken Names",
  desc:"Inside the orchard shed, blank tags dry beside a cup of ink. A folded note is weighted with a small river stone. The orchard is west.",
  west:new Exit("orchard"),
});
createItem("quiet_note", {
  alias:"folded note", synonyms:["note","promise","tag"], loc:"vestry", scenery:true,
  examine() {
    player.keptPromise = true;
    msg("“You may tell them we carried stone every winter. Please leave my name here.” You leave the note under its stone. Now you know what to ask Iven to repeat, and what to carry no farther.");
  },
});

createRoom("records", {
  alias:"The Copy Room",
  desc:"The council's copy room is warm enough to dry the cuff of your coat. A drawer marked WINTERS has been left open. The hearing is south.",
  south:new Exit("hall"),
});
createItem("winter_drawer", {
  alias:"winter drawer", synonyms:["drawer","copy","memo"], loc:"records", scenery:true,
  examine() {
    player.clerkCopy = true;
    msg("Under a stack of blank forms lies the original copyist's note. “Council ordered the date moved. I made this copy in case someone asked.” There is room at the bottom to add a date and a name. You leave both spaces blank.");
  },
});
Object.assign(chapterTitles, {
  ridge:["2","The Road Beneath the Road"], vestry:["3","The Orchard of Witnesses"], records:["4","The Hall of Tallies"],
});
campaignChoices.push({id:"signal",room:"ridge",command:"light the beacon",label:"Light the signal",ready:() => !player.ridgeSignal});
