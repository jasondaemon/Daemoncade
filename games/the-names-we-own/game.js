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
const placeNames = {tollhouse:"Tollhouse", riverbank:"Riverbank", crossing:"Bellwick bridge"};
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
  const stage = player.resolution || (player.spokeUp ? "debt" : "fog");
  if (bridge.dataset.stage === stage && bridge.dataset.location === room) return;
  const reveal = stage !== bridge.dataset.stage && (stage === "paid" || stage === "tolls");
  bridge.dataset.stage = stage;
  bridge.dataset.location = room;
  clearTimeout(pendingFrame);
  caption.textContent = placeNames[room] + " / " + captions[stage];
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

const commandButtons = document.querySelectorAll("#commands [data-command]");
const commandConditions = {
  cross: bridgeOpen,
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
}

settings.afterLoad = () => {
  closeEncounter();
  updateScene(false);
  updateCommands();
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
  }
  input.value = "";
  if (player.loc !== w.orra.loc) closeEncounter();
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
updateScene(false);
updateCommands();
