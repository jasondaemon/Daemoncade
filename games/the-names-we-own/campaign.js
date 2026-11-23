"use strict";

// QuestJS persists these decisions on the player with the rest of the story state.
const campaignDefaults = {
  daylight: false, roadClue: false, roadWitness: false, roadDecision: "",
  orchardClue: false, orchardWitness: false, orchardDecision: "",
  charterClue: false, nerisWitness: false, hearingDecision: "", completed: false,
};
Object.assign(w.me, campaignDefaults, {
  afterLoad() {
    for (const [flag, value] of Object.entries(campaignDefaults)) this[flag] ??= value;
    w.brass_pass.loc = this.hearingDecision === "shared" ? false : this.name;
  },
});
w.tollhouse.east.isLocked = () => !bridgeOpen();
w.crossing.north = new Exit("washout");
w.crossing.desc = "The sign reads WELCOME TO BELLWICK. To the north, Fen waits beside a stone post. Neris gave her a bundle of letters with blank addresses. The tollhouse is west.";

createRoom("washout", {
  alias:"The Road Beneath the Road",
  desc() {
    const opening = player.roadDecision === "oral" ? "Fresh tracks from the medicine cart cut through the mud. Fen has penciled a road back onto her map." :
      "ABANDONED, says Fen's map. Someone has put a lamp in every window along the road. At the washout, the lamps stop.";
    return opening + " An old milepost leans into the mud. The orchard is east, Bellwick is south, and the signal ridge lies west.";
  },
  south:new Exit("crossing"),
  east:new Exit("orchard", {isLocked:() => !player.roadDecision}),
});
createItem("milepost", {
  loc:"washout", scenery:true, synonyms:["stone", "post"],
  examine() {
    player.roadClue = true;
    msg("A date faces the ditch. Fen kneels to read it. Each shallow nick marks a year a household here paid for repairs. The last nick was cut yesterday.");
  },
});
createItem("road_surveyor", NPC(), {
  alias:"Fen", synonyms:["dwarf", "surveyor"], loc:"washout", scenery:true,
  talkto() {
    player.roadWitness = true;
    if (player.roadDecision) {
      characterSpeaks("fen", player.roadDecision === "oral"
        ? "“The cart made it. Its driver says he'll tell the council exactly where the wheel sank.”"
        : "“I've kept the signed rubbing dry. Listen for the runner over the ridge.”");
      return world.SUCCESS;
    }
    const memory = player.resolution === "paid"
      ? "“Orra's bell is in my pack. I told him I'd carry it until I could give it a job.”"
      : "“Bellwick's running its own tolls this morning. Orra brought the new keeper tea before he handed over the keys.”";
    msg(memory);
    characterSpeaks("fen", "“There's a cart bringing fever medicine over the ridge. We can clear the washout before it turns back, or record the stones before the repair buries them. If we stay, I'll send a runner to guide the cart around.”");
    return world.SUCCESS;
  },
});

createRoom("orchard", {
  alias:"The Orchard of Witnesses",
  desc:"Almost every tree has a tag tied to a branch. Most flutter. A few have been tied close to the trunk so the writing faces the bark. Iven, an elf archivist, keeps a box under the shelter of her coat. The council hall is north, the shed east, and the old road west.",
  west:new Exit("washout"),
  north:new Exit("hall", {isLocked:() => !player.orchardDecision}),
});
createItem("tags", {
  loc:"orchard", scenery:true, synonyms:["tag", "names", "records"],
  examine() {
    player.orchardClue = true;
    msg("The open tags say whose names may be read aloud. The turned tags are promises to keep a name private. Either set can be counted. Only the people who signed an open tag agreed to be named at the hearing.");
  },
});
createItem("iven", NPC(), {
  alias:"Iven", synonyms:["elf", "archivist"], loc:"orchard", scenery:true,
  talkto() {
    player.orchardWitness = true;
    if (player.orchardDecision) {
      characterSpeaks("iven", player.orchardDecision === "public"
        ? "“The carter's waiting by the road. He only speaks for himself. That will be quite enough.”"
        : "“I've put the folded tally in a dry pocket. What people asked me to keep here stays here.”");
      return world.SUCCESS;
    }
    characterSpeaks("iven", "“A council clerk said these belonged in a proper archive,” Iven says. “That's why they're here.” She taps the box. “I can read the open names in public, or seal the originals and bring a count attested by two witnesses. I won't read anyone's name without permission.”");
    return world.SUCCESS;
  },
});

createRoom("hall", {
  alias:"The Hall of Tallies",
  desc:"The council has laid the road charter on a table long enough to seat a family. Neris stands at the far end. Someone has set an oil lamp beside the charter. The orchard lies south, the copy room north, and the road home east.",
  south:new Exit("orchard"),
  east:new Exit("home", {isLocked:() => !player.hearingDecision}),
});
createItem("charter", {
  loc:"hall", scenery:true, synonyms:["ledger", "record", "clause"],
  examine() {
    player.charterClue = true;
    msg("You hold the lamp close. Under the renewal ink, the old date shows through: this clause expired at the end of the famine. Another hand has moved the date forward every year since.");
  },
});
createItem("neris", NPC(), {
  alias:"Neris", synonyms:["wizard"], loc:"hall", scenery:true,
  talkto() {
    player.nerisWitness = true;
    if (player.hearingDecision) {
      characterSpeaks("neris", "“Tomorrow I'll ask the villages if they still want me to finish the survey. They can say no this time.”");
      return world.SUCCESS;
    }
    characterSpeaks("neris", "“I wrote the clause to keep the roads open through one winter,” Neris says. “The first time they renewed it, I told myself I'd object at the next meeting.” She pushes the lamp closer to the page. “Put my name down. They can ask me in front of everyone.”");
    msg("A councilor eyes the brass pass on your coat. “We could restore your route tonight and leave the rest for committee.” With a pass you can make the ridge deliveries in a day. Without it, you pay each toll or take the footpath.");
    return world.SUCCESS;
  },
});
createItem("brass_pass", {
  alias:"brass pass", synonyms:["pass", "token"], loc:"me", scenery:true,
  examine() {
    msg(player.hearingDecision === "shared"
      ? "Your coat still has a pale square where the pass used to hang."
      : "A square of brass stamped with a wheel. It buys a courier free passage on every council road.");
  },
});

createRoom("home", {
  alias:"The Road Home",
  desc() {
    const routes = player.hearingDecision === "shared"
      ? "At the ridge, a new toll board charges every traveler the same. You stop to count out your first fare. The repair fund will pay the households that kept the road clear."
      : "At the first gate, the village has hung its own toll board. At the second, the council's seal is still in place. The first settlement has its road back. There is work left at the second.";
    return routes + " At Bellwick hall, someone props the kitchen door open with a shoe. Go inside when you're ready, or head west to the hall of tallies.";
  },
  west:new Exit("hall"),
});

const campaignChoices = [
  {id:"dawn", room:"tollhouse", command:"wait until dawn", label:"Wait until dawn", ready:() => player.resolution === "tolls" && !player.daylight},
  {id:"roadOpen", room:"washout", command:"open the road", label:"Open the road", ready:() => player.roadWitness && player.roadClue && !player.roadDecision},
  {id:"roadRecord", room:"washout", command:"record the mileposts", label:"Record the mileposts", ready:() => player.roadWitness && player.roadClue && !player.roadDecision},
  {id:"read", room:"orchard", command:"read public testimony", label:"Read public testimony", ready:() => player.orchardClue && player.orchardWitness && !player.orchardDecision},
  {id:"seal", room:"orchard", command:"seal testimony", label:"Seal testimony", ready:() => player.orchardClue && player.orchardWitness && !player.orchardDecision},
  {id:"shared", room:"hall", command:"offer my pass", label:"Offer my pass", ready:() => player.charterClue && player.nerisWitness && !player.hearingDecision},
  {id:"local", room:"hall", command:"request local settlements", label:"Request local settlements", ready:() => player.charterClue && player.nerisWitness && !player.hearingDecision},
  {id:"finish", room:"home", command:"deliver the letters", label:"Deliver the letters", ready:() => Boolean(player.hearingDecision) && !player.completed},
];

const campaignActions = {
  dawn() {
    player.daylight = true;
    msg("Fen tests the mended plank from both directions. Leth brings out the village's new toll book. The gate opens east. The first six coppers taken here are already marked for repayment.");
  },
  roadOpen() {
    player.roadDecision = "oral";
    msg("A wheel sinks to its hub. Three people run to help. When the cart reaches dry ground, the driver asks how to spell your name. “For when they say nobody came this way.” The orchard road is open to the east.");
  },
  roadRecord() {
    player.roadDecision = "marked";
    msg("Fen traces the older date through the paper with her thumb and signs the copy. Across the ridge, a runner's lamp blinks twice. The cart has seen it. The families tell you to take the orchard road east while they mend the washout.");
  },
  read() {
    player.orchardDecision = "public";
    msg("Iven reads only the names she has permission to speak. At the third, a carter in the doorway takes off his hat. He asks to come to the hearing. The hall is north.");
  },
  seal() {
    player.orchardDecision = "sealed";
    msg("You count each statement aloud. The clerk can dispute the number. He cannot ask Iven to give him the names. She seals the bundle and asks you to carry it north.");
  },
  shared() {
    player.hearingDecision = "shared";
    w.brass_pass.loc = false;
    presentCase();
    msg("You lay the pass beside Neris's lamp. The councilor reaches for it, stops, and asks who will pay for the repair. The households name a sum. One by one, the people who used the roads agree to share it. The clerk opens a new book and asks Iven how to spell the first name.");
  },
  local() {
    player.hearingDecision = "local";
    presentCase();
    msg("You ask the council to return the crossings to the people who keep them open. The clerk draws a line through the claim on Bellwick's gate. Two more villages follow. Others will need to present their own accounts. Neris folds up her copy of the old charter. “I'll go with them,” she says.");
  },
  finish() {
    player.completed = true;
    msg("You deliver the last letter. The farrier calls from the table that the mare sold after all. Outside, a new courier asks if there's room by the kitchen door.");
    msg("“Slide along a bit,” Orra says. “We'll make another.”");
    msg(player.hearingDecision === "shared" ? "THE END · THE SHARED ROAD" : "THE END · ONE CROSSING AT A TIME");
  },
};

function presentCase() {
  if (player.ridgeSignal) msg("The cart driver sets his two lamp wicks on the ledger. One councilor stops turning the page.");
  if (player.keptPromise) msg("Iven repeats the orchard keeper's account of the winters they carried stone. She stops exactly where you asked her to.");
  if (player.clerkCopy) msg("The clerk reads the note caught beneath his forms. “The date was shifted by order,” he says. “Please write that down.”");
  msg(player.roadDecision === "oral"
    ? "The cart driver traces the old road with one finger. “I drove it yesterday. I can take you there today.”"
    : "Fen turns her signed rubbing so the councilor can read the dates. “That's a repair for every year you called this road abandoned.”");
  msg(player.orchardDecision === "public"
    ? "Iven reads the names of those who asked to be heard. The carter stands when she reaches his village."
    : "Iven hands the clerk the sealed tally of testimony and the two witnesses sign it. Nobody has to give up a name to enter the claim.");
}

const chapterTitles = {
  tollhouse:["1", "Bellwick Crossing"], riverbank:["1", "Bellwick Crossing"], crossing:["1", "Bellwick Crossing"],
  washout:["2", "The Road Beneath the Road"], orchard:["3", "The Orchard of Witnesses"],
  hall:["4", "The Hall of Tallies"], home:["5", "The Road Home"],
};

storyCommand("CampaignJournal", /^(?:journal|objectives)$/, () => {
  const [number, title] = chapterTitles[player.loc];
  msg("Chapter " + number + " of 5 · " + title);
  if (player.resolution) msg(player.resolution === "paid" ? "Bellwick: Orra sold his bell to repay the fares." : "Bellwick: the village took over the crossing.");
  if (player.roadDecision) msg(player.roadDecision === "oral" ? "Old road: the medicine cart driver can testify." : "Old road: Fen preserved the signed milepost record.");
  if (player.orchardDecision) msg(player.orchardDecision === "public" ? "Orchard: Iven brought consented public testimony." : "Orchard: Iven sealed the testimony.");
  if (player.hearingDecision) msg(player.hearingDecision === "shared" ? "Hearing: you gave up your pass as part of a shared repair agreement." : "Hearing: individual settlements can reclaim their crossings.");
  if (player.completed) msg("The last letter is delivered.");
  else msg("Type HINT for your next lead.");
  return world.SUCCESS_NO_TURNSCRIPTS;
});

for (const choice of campaignChoices) {
  storyCommand("Campaign_" + choice.id, new RegExp("^" + choice.command + "$"), () => {
    if (player.loc !== choice.room || !choice.ready()) return failedmsg("That action isn't available here yet. Try HINT.");
    campaignActions[choice.id]();
    return world.SUCCESS;
  });
}
