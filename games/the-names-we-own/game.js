"use strict";

const bridge = document.querySelector("#bridge");
const caption = document.querySelector("#bridge-status");
const output = document.querySelector("#output");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const glyphs = {
  fog: ["                            ", "         .  .   .           ", "____|---             ---|____", "    |                   |    ", "~  ~~~  ~~~   ~~~  ~~  ~~~  ~"],
  debt: ["        B E . . W I . .     ", "          .   .             ", "____|--------?       ---|____", "    |                   |    ", "~  ~~~  ~~~   ~~~  ~~  ~~~  ~"],
  paid: ["        B E L L W I C K     ", "      *               *     ", "____|===================|____", "    |                   |    ", "~  ~~~  ~~~   ~~~  ~~  ~~~  ~"],
  tolls: ["        B E L L W I C K     ", "      *    CLOSED     *     ", "____|===================|____", "    |                   |    ", "~  ~~~  ~~~   ~~~  ~~  ~~~  ~"],
};
const captions = {
  fog:"Fog hides the center of the bridge.",
  debt:"The missing name is taking shape. The gate is still shut.",
  paid:"Bellwick’s name is restored. The bridge is open.",
  tolls:"Bellwick’s name is restored. The gate is closed for inspection.",
};

let pendingFrame;

function updateScene(animate = true) {
  const stage = player.resolution || (player.spokeUp ? "debt" : "fog");
  if (bridge.dataset.stage === stage) return;
  bridge.dataset.stage = stage;
  clearTimeout(pendingFrame);
  const lines = glyphs[stage];
  caption.textContent = captions[stage];
  if (!animate || motion.matches || (stage !== "paid" && stage !== "tolls")) {
    bridge.textContent = lines.join("\n");
    return;
  }
  let visibleLetters = 0;
  function frame() {
    const banner = lines[0].replace(/\w/g, (glyph, offset) =>
      offset < 8 + visibleLetters * 2 ? glyph : " ");
    bridge.textContent = [banner, ...lines.slice(1)].join("\n");
    if (visibleLetters < 8 && !motion.matches) {
      visibleLetters++;
      pendingFrame = setTimeout(frame, 65);
    } else {
      bridge.textContent = lines.join("\n");
    }
  }
  frame();
}

settings.afterLoad = () => updateScene(false);
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
  updateScene();
  if (atEnd) output.scrollTop = output.scrollHeight;
}

// QuestJS also handles keys on document. Keep form controls and screen-reader
// navigation outside its global shortcuts, and submit only from our prompt.
document.addEventListener("keydown", event => {
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

for (const button of document.querySelectorAll("[data-command]")) {
  button.addEventListener("click", () => submit(button.dataset.command));
}
document.querySelector("#submit-command").addEventListener("click", () => submit(input.value));
updateScene(false);
