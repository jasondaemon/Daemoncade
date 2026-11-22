"use strict";

const encounter = document.querySelector("#encounter");
const portrait = document.querySelector("#encounter-portrait");
const encounterLine = document.querySelector("#encounter-line");
let portraitTimer;
let portraitPose;

const orraPortrait = [
  "       #######       ",
  "    ###^^^^^^^###    ",
  "   ##^^^^^^^^^^^##   ",
  "  ##^^^##^^^##^^^##  ",
  " [#^^^^++^^^++^^^^#] ",
  " [#^^^^^^###^^^^^^#] ",
  "  #^^^^^^^|^^^^^^^#  ",
  "   #^^^---------^#   ",
  "    ##^^^vvv^^^##    ",
  "   /--#########--\\   ",
  "  /_______________\\  ",
];

function drawOrra(frame = 0) {
  const rows = [...orraPortrait];
  if (portraitPose === "invitation") rows[4] = " [#^^++^^^^++^^^^^#] ";
  if (frame === 1) rows[7] = "   #^^^---___---^#   ";
  if (frame === 2) rows[7] = "   #^^^--[___]--^#   ";
  drawCells(portrait, rows);
}

function stopPortrait() {
  clearInterval(portraitTimer);
  if (!encounter.hidden) drawOrra();
}

function orraSpeaks(line, pose = "watching") {
  msg(line);
  encounterLine.textContent = line;
  encounter.hidden = false;
  portraitPose = pose;
  stopPortrait();
  if (!sceneMotionEnabled()) return;

  let frame = 0;
  portraitTimer = setInterval(() => {
    if (!sceneMotionEnabled() || ++frame >= 8) {
      stopPortrait();
      return;
    }
    drawOrra(frame % 3);
  }, 105);
}

function closeEncounter() {
  if (encounter.hidden) return false;
  encounter.hidden = true;
  stopPortrait();
  return true;
}
