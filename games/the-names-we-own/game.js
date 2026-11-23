"use strict";

const bridge = document.querySelector("#bridge");
const caption = document.querySelector("#bridge-status");
const output = document.querySelector("#output");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const captions = {
  fog:"Fog hides the center of the bridge.",
  debt:"The missing name is taking shape. The gate is still shut.",
  paid:"Bellwick’s name is restored. The bridge is open.",
  tolls:"Bellwick’s name is restored. The gate is closed for inspection.",
};
const placeNames = {tollhouse:"Tollhouse", riverbank:"Riverbank", crossing:"Bellwick bridge", ridge:"Signal ridge", vestry:"Orchard shed", records:"Copy room"};
let pendingFrame;
let ambientTimer;
let ambientPhase = 0;
let motionPaused = false;
const motionButton = document.querySelector("#scene-motion");
const twinkle = ["+", "+", "x", "*", "+", "+", ".", "+", "+"];
const ripple = ["~", "~", "-", "=", "~", ".", "~", "~", "-"];

function sceneMotionEnabled() {
  return !motionPaused && !motion.matches && !document.hidden;
}

function syncSceneMotion() {
  clearInterval(ambientTimer);
  motionButton.disabled = motion.matches;
  motionButton.textContent = motion.matches ? "Scene motion off" : motionPaused ? "Resume scene motion" : "Pause scene motion";
  motionButton.setAttribute("aria-pressed", String(motionPaused || motion.matches));
  if (!sceneMotionEnabled()) {
    stopPortrait();
    return;
  }
  ambientTimer = setInterval(() => {
    ambientPhase++;
    for (const cell of bridge.querySelectorAll("[data-ambient]")) {
      const frames = cell.dataset.ambient === "star" ? twinkle : ripple;
      cell.textContent = frames[(ambientPhase + Number(cell.dataset.phase)) % frames.length];
    }
  }, 360);
}

motionButton.addEventListener("click", () => {
  motionPaused = !motionPaused;
  syncSceneMotion();
});
motion.addEventListener("change", syncSceneMotion);
document.addEventListener("visibilitychange", syncSceneMotion);
syncSceneMotion();

function updateScene(animate = true) {
  const room = player.loc;
  const stage = {
    ridge: player.ridgeSignal ? "signaled" : "ridge",
    vestry: player.keptPromise ? "promise" : "vestry",
    records: player.clerkCopy ? "copied" : "records",
    washout: player.roadDecision || "washed",
    orchard: player.orchardDecision || "unheard",
    hall: player.hearingDecision || (player.charterClue ? "read" : "dim"),
    home: player.completed ? "complete" : "arrival",
  }[room] || (player.daylight ? "paid" : player.resolution) || (player.spokeUp ? "debt" : "fog");
  if (bridge.dataset.stage === stage && bridge.dataset.location === room) return;
  const reveal = stage !== bridge.dataset.stage && (stage === "paid" || stage === "tolls");
  bridge.dataset.stage = stage;
  bridge.dataset.location = room;
  clearTimeout(pendingFrame);
  const [chapter, title] = chapterTitles[room];
  document.querySelector("#chapter").textContent = "CHAPTER " + chapter + " / " + title.toUpperCase();
  const sceneStatus = {
    ridge:"The signal basket is dark.", signaled:"Two lights burn on the ridge.",
    vestry:"A river stone holds down a folded note.", promise:"The private note stays beneath its stone.",
    records:"The winter drawer is open.", copied:"The copyist’s note is ready to take to the hearing.",
    washed:"A washout cuts the village road.", oral:"The crossing is clear for the cart.", marked:"Fen has copied the milepost dates.",
    unheard:"Name tags move in the orchard.", public:"The volunteered names can be read in public.", sealed:"The testimony is sealed.",
    dim:"An oil lamp stands beside the road charter.", read:"The original expiry date is visible.", shared:"The hall records a shared repair agreement.", local:"The hall returns the crossings to local hands.",
    arrival:"Bellwick’s kitchen door stands open.", complete:"The last letter is delivered.",
  };
  caption.textContent = (placeNames[room] || title) + " / " + (room === "tollhouse" || room === "riverbank" || room === "crossing" ? captions[stage] : sceneStatus[stage]);
  const view = room === "tollhouse" && (stage === "paid" || stage === "tolls") ? "riverbank" : room;
  if (!animate || !sceneMotionEnabled() || !reveal) {
    drawCells(bridge, terminalFrame(view, stage));
    return;
  }
  let visible = 0;
  function frame() {
    const rows = terminalFrame(view, stage, sceneMotionEnabled() ? visible : 8);
    drawCells(bridge, rows);
    if (visible++ < 8 && sceneMotionEnabled()) pendingFrame = setTimeout(frame, 65);
  }
  frame();
}

const commandBar = document.querySelector("#commands");
const campaignButtons = new Map();
for (const choice of campaignChoices) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.command = choice.command;
  button.textContent = choice.label;
  button.hidden = true;
  campaignButtons.set(choice, button);
  commandBar.append(button);
}
const commandButtons = commandBar.querySelectorAll("[data-command]");
const commandConditions = {
  cross: bridgeOpen,
  road: () => Boolean(player.roadDecision),
  orchard: () => Boolean(player.orchardDecision),
  hearing: () => Boolean(player.hearingDecision),
  confront: () => hasEvidence() && !player.spokeUp,
  settle: () => player.spokeUp && !player.resolution,
};

function updateCommands() {
  document.querySelector("#encounter-invitation").disabled = !w.invitation.isAtLoc(player.name);
  for (const button of commandButtons) {
    const {room, reveal, requires} = button.dataset;
    button.hidden = Boolean((room && room !== player.loc) || (reveal && !commandConditions[reveal]()));
    button.disabled = Boolean(io.disableLevel || (requires && !commandConditions[requires]()));
  }
  for (const [choice, button] of campaignButtons) {
    button.hidden = player.loc !== choice.room || !choice.ready();
  }
}

settings.afterLoad = () => {
  closeEncounter();
  updateScene(false);
  updateCommands();
  storeCheckpoint();
};
settings.playMode = "poc";
world.init();
let input;

io.msgInputText = function(command) {
  const line = document.createElement("p");
  line.className = "input-text";
  line.textContent = "> " + command;
  output.append(line);
};

function submit(raw) {
  const command = raw.trim();
  if (!command || io.disableLevel > 1 && !parser.override) return;
  const atEnd = output.scrollHeight - output.scrollTop - output.clientHeight < 24;
  if (/[<>&]/.test(command)) {
    metamsg("Please enter a plain-text command.");
  } else {
    if (io.savedCommands.at(-1) !== command) io.savedCommands.push(command);
    io.savedCommandsPos = io.savedCommands.length;
    runCmd(command);
    storeCheckpoint();
  }
  input.value = "";
  if (player.loc !== encounterRoom) closeEncounter();
  updateScene();
  updateCommands();
  if (atEnd) output.scrollTop = output.scrollHeight;
}

// QuestJS also handles keys on document. Keep form controls and screen-reader
// navigation outside its global shortcuts, and submit only from our prompt.
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !event.isComposing && closeEncounter()) {
    event.preventDefault();
    event.stopImmediatePropagation();
    input.focus();
    return;
  }
  if (event.target !== input) {
    event.stopImmediatePropagation();
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!event.isComposing) submit(input.value);
  }
});

io.init();
input = document.querySelector("#textbox");
input.setAttribute("aria-label", "Type a command");
input.placeholder = "Type a command";
input.maxLength = 120;

const enter = document.createElement("button");
enter.type = "button";
enter.textContent = "ENTER";
enter.addEventListener("click", () => submit(input.value));
document.querySelector("#input").append(enter);
for (const button of commandButtons) {
  button.addEventListener("click", event => {
    submit(button.dataset.command);
    if (event.detail === 0 && (button.hidden || button.disabled)) input.focus();
  });
}
for (const button of encounter.querySelectorAll("[data-topic]")) {
  button.addEventListener("click", () => submit(button.dataset.topic));
}
document.querySelector("#encounter-close").addEventListener("click", () => {
  submit("leave conversation");
  input.focus();
});
restoreCheckpoint();
updateScene(false);
updateCommands();
