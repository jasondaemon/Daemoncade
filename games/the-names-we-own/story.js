"use strict";

settings.title = "The Names We Own";
settings.version = "1.0.0-rc.1";
settings.panes = "none";
settings.cmdEcho = false;
settings.roomTemplate = ["#{cap:{hereName}}", "{hereDesc}", "{exitsHere:You can go {exits}.}"];
settings.intro = [
  "By the time you reach the tollhouse, the sign across the river says WELCOME TO. Beneath it is enough bare wood for a whole village.",
  "You're Bellwick's youngest courier. The farrier is waiting to hear whether his mare sold. You touch the brass pass on your coat. It promises you a crossing on any council road. The gate is shut anyway.",
];

createItem("me", PLAYER(), {
  loc: "tollhouse", examine: "You're Bellwick's youngest courier. You have a bag full of mail and two boots full of rain.",
  sawLedger: false, heardSurveyor: false, heardWitness: false, spokeUp: false,
  resolution: "",
});

const bridgeOpen = () => player.resolution === "paid" || player.daylight === true;
const hasEvidence = () => player.sawLedger && player.heardSurveyor && player.heardWitness;

createRoom("tollhouse", {
  alias: "The tollhouse",
  desc: "Rain rattles on the roof. A ledger lies open on the desk. Orra, the troll keeper, braces the door with one boot. Fen, a dwarf surveyor, counts notches on a tally stick. The bridge is east. The riverbank, where the elf witness is waiting, is south.",
  east: new Exit("crossing", {isLocked: () => !bridgeOpen()}),
  south: new Exit("riverbank"),
});

createRoom("riverbank", {
  alias: "The riverbank",
  desc: "You follow the wall around to the river. Leth, an elf with water dripping from her sleeves, is holding a cellar hatch shut against the wind. She heard what was said when the ledger was altered. The tollhouse is north.",
  north: new Exit("tollhouse"),
});

createRoom("crossing", {
  alias: "Bellwick bridge",
  desc: "Your boots ring on the new plank. Beyond the last post, the sign reads WELCOME TO BELLWICK. The letters look ordinary now. You had forgotten how good ordinary could feel. The tollhouse is west.",
  west: new Exit("tollhouse"),
});

createItem("ledger", {
  loc: "tollhouse", scenery: true,
  examine() {
    player.sawLedger = true;
    msg("REPLACEMENT PLANK: six coppers. CHARGED TO: Bellwick. Under the village name, Orra's mark is scratched out.");
    msg("A note in Neris's handwriting is tucked in the spine. A borrowed name comes home when the true debt is entered and a witness hears it. If it slips much farther, I'll have to follow it under the bridge.");
  },
});

createItem("orra", NPC(), {alias:"Orra", synonyms:["troll", "keeper", "troll keeper"], loc:"tollhouse", scenery:true,
  examine:"The troll holds the door against the storm. A brass ferry bell hangs at his belt.",
  talkto() {
    orraSpeaks(player.spokeUp ? "Orra keeps a finger on the ledger. “I'm listening.”" : "Orra keeps his eyes on the rain. “The plank broke. I kept the bridge open. Ask anyone who got home.”");
    return world.SUCCESS;
  },
});

createItem("fen", NPC(), {alias:"Fen", synonyms:["dwarf", "surveyor", "dwarf surveyor"], loc:"tollhouse", scenery:true,
  examine:"The dwarf has three pieces of notched wood laid out on the table.",
  talkto() {
    player.heardSurveyor = true;
    characterSpeaks("fen", "“Two cuts on each stick,” Fen says. “One fare out, one fare home. Six coppers in the box when I left. By morning there was a new plank and an empty box.” She weighs Orra's bell in her hand. “Good brass. Worth six, easily.”");
    return world.SUCCESS;
  },
});

createItem("leth", NPC(), {alias:"Leth", synonyms:["elf", "witness", "elf witness"], loc:"riverbank", scenery:true,
  examine:"Leth has hooked a foot through the iron ring on the rattling hatch.",
  talkto() {
    player.heardWitness = true;
    characterSpeaks("leth", "“Orra said ‘Put it on my name.’ I watched him mark the ledger. Then he saw what the plank had cost and scratched his mark out.” There is a knock from beneath the hatch. “That's Neris. She's keeping the name from washing downstream.”");
    return world.SUCCESS;
  },
});

createItem("invitation", TAKEABLE(), {
  loc:"me", synonyms:["letter", "mail"],
  examine:"An invitation for Orra, written before the storm. A child has drawn the village hall's long table and marked his place beside the kitchen door.",
});

function storyCommand(name, regex, script) {
  new Cmd(name, {regexes:[regex], score:20, objects:[], script});
}

function orraTopic(name, regex, reply, pose) {
  storyCommand(name, regex, () => {
    if (player.loc !== w.orra.loc) {
      return failedmsg(player.loc === "riverbank" ? "Orra is in the tollhouse to the north." : "Orra is in the tollhouse to the west.");
    }
    if (name === "OrraInvitation" && !w.invitation.isAtLoc(player.name)) return failedmsg("You aren't carrying the invitation.");
    orraSpeaks(reply(), pose);
    return world.SUCCESS;
  });
}

orraTopic("OrraPlank", /^ask orra about (?:the )?plank$/, () =>
  player.spokeUp ? "“I could have asked Bellwick for help,” Orra says. “I thought I could mend the whole thing before anyone noticed.”" :
    "“I heard it crack under a cart. A child was halfway across. I knew what a new plank would cost.”");
orraTopic("OrraBell", /^ask orra about (?:the )?bell$/, () =>
  player.resolution === "paid" ? "Orra reaches for the bell and finds an empty loop. “Still getting used to that.”" :
    "“It was my mother’s. One ring for the far bank, two for home. She could ring it once and have the whole bank listening.”");
orraTopic("OrraInvitation", /^(?:show (?:the )?invitation to orra|show orra (?:the )?invitation)$/, () =>
  "Orra turns away from the door and studies the little chair drawn next to the kitchen. “They put me by the stove. They remembered.”", "invitation");

storyCommand("LeaveEncounter", /^(?:leave conversation|end conversation|leave)$/, () => {
  if (!closeEncounter()) return failedmsg("You're not in a conversation. Try a direction to travel.");
  return world.SUCCESS_NO_TURNSCRIPTS;
});

storyCommand("StoryHelp", /^(?:help|commands)$/, () => {
  msg("Type LOOK, EXAMINE something, TALK TO someone, or a direction like SOUTH. HINT gives a nudge. In a conversation, ASK about a topic or type LEAVE. Progress saves automatically on this device. Use SAVE followed by a name for an extra slot, and LOAD followed by that name to restore it. RESTART asks before starting over.");
  return world.SUCCESS_NO_TURNSCRIPTS;
});

storyCommand("StoryHint", /^hint$/, () => {
  if (player.completed) msg("Your last delivery is made. You can revisit any place or save this ending.");
  else if (player.loc === "ridge") msg("EXAMINE BASKET, or go EAST to return to Fen.");
  else if (player.loc === "vestry") msg("EXAMINE NOTE, or go WEST to return to Iven.");
  else if (player.loc === "records") msg("EXAMINE DRAWER, or go SOUTH to return to the hearing.");
  else if (player.loc === "home") msg("Type DELIVER THE LETTERS when you're ready to go inside.");
  else if (player.loc === "hall") msg(player.hearingDecision ? "Go EAST for the road home." : "EXAMINE CHARTER and TALK TO NERIS; then decide between OFFER MY PASS and REQUEST LOCAL SETTLEMENTS.");
  else if (player.loc === "orchard") msg(player.orchardDecision ? "The hall is NORTH." : "EXAMINE TAGS and TALK TO IVEN. Then READ PUBLIC TESTIMONY or SEAL TESTIMONY.");
  else if (player.loc === "washout") msg(player.roadDecision ? "The orchard is EAST." : "EXAMINE MILEPOST and TALK TO FEN. Then OPEN THE ROAD or RECORD THE MILEPOSTS.");
  else if (player.loc === "crossing") msg("Fen is waiting to the NORTH.");
  else if (player.resolution) msg(bridgeOpen() ? "The bridge is east from the tollhouse. Fen is on its northern road." : "Bellwick has its name back. WAIT UNTIL DAWN at the tollhouse for Fen's inspection.");
  else if (!player.sawLedger) msg("Start at the tollhouse desk. EXAMINE LEDGER.");
  else if (!player.heardSurveyor) msg("The tally sticks might explain the missing money. TALK TO FEN at the tollhouse.");
  else if (!player.heardWitness) msg("SOUTH goes to the riverbank. TALK TO LETH about what she witnessed.");
  else if (!player.spokeUp) msg("Back at the tollhouse, you can type NAME ORRA if the evidence points to him.");
  else msg("Type SELL THE BELL to repay everyone tonight, or SIGN OVER THE TOLLS to let Bellwick run the crossing.");
  return world.SUCCESS_NO_TURNSCRIPTS;
});

storyCommand("Accountability", /^(?:name orra|confront orra|tell orra the truth|accuse (?:orra|the keeper))$/, () => {
  if (player.loc !== "tollhouse") return failedmsg("Orra is in the tollhouse, north of here.");
  if (player.spokeUp) return failedmsg("Orra has already admitted what happened.");
  if (!hasEvidence()) return failedmsg("You have a suspicion. Put the ledger, the tally sticks and the witness's account together before you ask him to answer for it.");
  player.spokeUp = true;
  msg("You lay the tally sticks beside the ledger. “These were their fares home. You took them and wrote Bellwick's name in the debt column.”");
  msg("Orra grips the bell. “I meant to put them back before fair day.”");
  if (w.invitation.isAtLoc(player.name)) {
    msg("You set his invitation on the desk. He studies the little chair drawn beside the kitchen door. “They still expect me?”");
  } else {
    msg("You tell him about the invitation and the chair they drew for him beside the kitchen door. “They still expect me?”");
  }
  msg("“They sent it yesterday. What happens today is up to you.”");
  msg("Leth comes in as you explain the two ways to make it right. SELL THE BELL and repay everyone now, or SIGN OVER THE TOLLS and let Bellwick collect what it's owed.");
  return world.SUCCESS;
});

function settle(resolution) {
  if (player.loc !== "tollhouse") return failedmsg("The ledger and Orra are in the tollhouse.");
  if (!player.spokeUp) return failedmsg("Before anyone can repay the debt, establish who owes it.");
  if (player.resolution) return failedmsg("The new promise has already been witnessed.");
  player.resolution = resolution;
  if (resolution === "paid") {
    msg("Orra unties the brass bell. Fen puts six coppers down in its place. Orra sets the widow's two pennies apart in an envelope. “Hers first,” he says.");
    msg("Leth reads the corrected entry aloud. BELLWICK comes back a letter at a time. The bridge is open to the east. There is no bell to announce it.");
  } else {
    msg("Orra signs the tollhouse and its ledger over to Bellwick. Leth witnesses the new agreement. Future crossings will pay the villagers back. Fen bars the gate until she can inspect the plank in daylight.");
    msg("You move the damp mail closer to the stove. Through the rain, you can see BELLWICK on the far-bank sign.");
  }
  msg("The cellar hatch lifts. Neris climbs out, soaked to the elbows. “Good,” she says. “I was running out of riverbank.”");
  msg("She takes a bundle of letters out of her coat. Each has a blank where a town should be. She gives them to Fen. “Take the courier north when the crossing is open. This happened upriver last week.”");
  return world.SUCCESS;
}

storyCommand("SellBell", /^(?:sell (?:the )?bell|repay (?:the )?fares)$/, () => settle("paid"));
storyCommand("SignTolls", /^(?:sign over (?:the )?tolls|give bellwick (?:the )?tolls)$/, () => settle("tolls"));
