"use strict";

const encounter = document.querySelector("#encounter");
const portrait = document.querySelector("#encounter-portrait");
const encounterLine = document.querySelector("#encounter-line");
let portraitTimer;
let portraitPose;

const portraitWidth = 42;
const orraPalette = {
  "#":"portrait-shadow", ":":"portrait-shadow",
  "s":"portrait-skin", "S":"portrait-light",
  "o":"portrait-eye", "*":"portrait-eye",
  "t":"portrait-tusk", "-":"portrait-mouth",
  "m":"portrait-mouth", ".":"portrait-mouth",
  "/":"portrait-cloak", "|":"portrait-cloak",
  "+":"portrait-clasp",
};

const orraPortrait = [
  "#######",
  "#####sssSSSsss#####",
  "####ssSSSSSSSSSssss####",
  "###ssSSSSSSSSSSSSSSsss###",
  "##ssSSSSssssssssSSSSsss##",
  "##ssSSss##########ssSSsss##",
  "###ssSss###ssssss###ssSss###",
  "ssss##ssSss##ssssssss##ssSss##ssss",
  "ss##sssSss*oSssssssSo*ssSsss##ss",
  "s###ssSSSSSssSSSSSSssSSSSSss###s",
  "##ssSSSSsssSSSSSSSSsssSSSSss##",
  "##ssSSsssSSSSSSSSSSsssSSss##",
  "###ssSSsssss####sssssSSss###",
  "###ssSStsssssssssssstSSss###",
  "###sssSts--------stSsss###",
  "###ssssstssssssstsssss###",
  "####ssssSSSSssss####",
  "#####ssssss#####",
  "////####::::::::####////",
  "////////####::::::::####////////",
  "//////|||||##::::::##|||||//////",
  "//////////||||||::++::||||||//////////",
];

const eyesLookingDown = "ss##sssSSSSssssssssssssSSSSsss##ss";
const mouths = [
  orraPortrait[14],
  "###sssSts--mmmm--stSsss###",
  "###sssSts-mmmmmm-stSsss###",
];

function drawOrra(frame = 0) {
  const rows = [...orraPortrait];
  if (portraitPose === "invitation") rows[8] = eyesLookingDown;
  rows[14] = mouths[frame];
  const centered = rows.map(row => {
    const left = Math.floor((portraitWidth - row.length) / 2);
    return (" ".repeat(left) + row).padEnd(portraitWidth);
  });
  drawCells(portrait, centered, orraPalette);
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
