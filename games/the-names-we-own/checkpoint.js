"use strict";

// Separate from QuestJS's named slots: SAVE, LOAD and DIR keep their semantics.
const checkpointKey = "daemoncade:the-names-we-own:checkpoint:v1";
const checkpointStatus = document.querySelector("#checkpoint-status");
let freshCheckpoint;
let lastCheckpoint;

function storeCheckpoint() {
  const body = saveLoad.getSaveBody();
  if (body === lastCheckpoint) return;
  try {
    localStorage.setItem(checkpointKey, body);
    lastCheckpoint = body;
    checkpointStatus.textContent = "Progress saved on this device";
  } catch {
    checkpointStatus.textContent = "Auto-save unavailable on this device";
  }
}

function restoreCheckpoint() {
  freshCheckpoint = saveLoad.getSaveBody();
  lastCheckpoint = freshCheckpoint;
  let saved;
  try {
    saved = localStorage.getItem(checkpointKey);
  } catch {
    checkpointStatus.textContent = "Auto-save unavailable on this device";
    return;
  }
  if (saved === null) return;

  try {
    const records = saved.split("!");
    const objects = records.slice(3).map(record => record.split("="));
    if (saved.length > 500000 || objects.length === 0 ||
        !objects.some(([name]) => name === "me") ||
        new Set(objects.map(([name]) => name)).size !== objects.length ||
        objects.some(([name, type, data]) => !Object.hasOwn(w, name) || type !== "Object" || data === undefined)) {
      throw new Error("Invalid automatic checkpoint");
    }
    saveLoad.loadTheWorld(saved);
    if (!Object.hasOwn(chapterTitles, player.loc)) throw new Error("Invalid checkpoint location");
    world.gameState.length = 0;
    world.saveGameState();
    lastCheckpoint = saveLoad.getSaveBody();
    clearScreen();
    metamsg("Resumed from your automatic checkpoint.");
    currentLocation.description();
    checkpointStatus.textContent = "Progress restored from this device";
  } catch {
    saveLoad.loadTheWorld(freshCheckpoint);
    checkpointStatus.textContent = "Couldn’t restore progress. Starting at Bellwick.";
  }
}

storyCommand("RestartCheckpoint", /^(?:restart|new game)$/, () => {
  askText("Start a new game? Your automatic checkpoint will reset. Named saves will stay. Type YES to confirm.", answer => {
    if (!/^(?:y|yes)$/i.test(answer.trim())) {
      metamsg("Your current game continues.");
      return;
    }
    saveLoad.loadTheWorld(freshCheckpoint);
    world.gameState.length = 0;
    world.saveGameState();
    closeEncounter();
    clearScreen();
    world.begin();
    // The next snapshot must replace the previous run, even at the same location.
    lastCheckpoint = undefined;
    storeCheckpoint();
  });
  return world.SUCCESS_NO_TURNSCRIPTS;
});
