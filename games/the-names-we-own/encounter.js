"use strict";

const encounter = document.querySelector("#encounter");
const portrait = document.querySelector("#encounter-portrait");
const encounterLine = document.querySelector("#encounter-line");
let portraitTimer;
let portraitPose;
let encounterRoom;
let currentSpeaker = "orra";

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

const speakers = {
  orra: {name:"Orra", role:"Troll keeper", palette:orraPalette},
  fen: {name:"Fen", role:"Dwarf surveyor", palette:{...orraPalette, s:"fen-skin", S:"fen-light", "#":"fen-shadow"}},
  leth: {name:"Leth", role:"Riverbank witness", palette:{...orraPalette, s:"leth-skin", S:"leth-light", "|":"leth-cloak"}},
  iven: {name:"Iven", role:"Elf archivist", palette:{...orraPalette, s:"iven-skin", S:"iven-light", "/":"iven-cloak"}},
  neris: {name:"Neris", role:"Wizard", palette:{...orraPalette, s:"neris-skin", S:"neris-light", "/":"neris-cloak"}},
};

const portraitFeatures = {
  fen: {
    0:"##########", 1:"#####//////#####", 2:"####////////////////####",
    3:"////###################////", 13:"####:::::ssssssss:::::####",
    15:"#####::::::::::::::::#####", 16:"####:::::#####:::::####", 17:"####::::::::::::####",
  },
  leth: {
    0:"//////", 1:"////ssssSSSsss////", 2:"///ssSSSSSSSSSss///",
    7:"t///ssSss##ssssssss##ssSss///t", 8:"tt///ssSss*oSssssSo*ssSss///tt",
    9:"t///ssSSSssSSSSSSssSSSss///t", 17:"////ssssss////",
  },
  iven: {
    0:"+", 1:"//////+//////", 2:"/////ssSSSSSSss/////",
    7:"t///ssSss##ssssssss##ssSss///t", 8:"tt///sss*oSSssssSSo*sss///tt", 19:"/////||||||++||||||/////",
  },
  neris: {
    0:"+", 1:"////", 2:"////////", 3:"//////////////",
    4:"////////////++////////////", 5:"///////////////////////////////////",
    6:"///ssSSss###ssssss###ssSSss///", 16:"////:::::SSSS:::::////", 17:"////::::::////",
  },
};

function drawPortrait(frame = 0) {
  const rows = [...orraPortrait];
  if (currentSpeaker === "orra" && portraitPose === "invitation") rows[8] = eyesLookingDown;
  rows[14] = mouths[frame];
  if (currentSpeaker !== "orra") {
    for (const [row, art] of Object.entries(portraitFeatures[currentSpeaker])) rows[row] = art;
    rows[13] = "###ssSSssssssssssssSSss###";
    rows[14] = ["###ssssss--------ssssss###", "###ssssss--mmmm--ssssss###", "###ssssss-mmmmmm-ssssss###"][frame];
    rows[15] = portraitFeatures[currentSpeaker][15] || "###ssssssssssssssssssss###";
  }
  const centered = rows.map(row => {
    const left = Math.floor((portraitWidth - row.length) / 2);
    return (" ".repeat(left) + row).padEnd(portraitWidth);
  });
  drawCells(portrait, centered, speakers[currentSpeaker].palette);
}

function stopPortrait() {
  clearInterval(portraitTimer);
  if (!encounter.hidden) drawPortrait();
}

function orraSpeaks(line, pose = "watching") {
  characterSpeaks("orra", line, pose);
}

function characterSpeaks(speaker, line, pose = "watching") {
  msg(line);
  currentSpeaker = speaker;
  encounterRoom = player.loc;
  document.querySelector("#speaker-name").textContent = speakers[speaker].name.toUpperCase();
  document.querySelector("#speaker-role").textContent = "// " + speakers[speaker].role.toUpperCase();
  encounter.querySelector(".encounter-topics").hidden = speaker !== "orra";
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
    drawPortrait(frame % 3);
  }, 105);
}

function closeEncounter() {
  if (encounter.hidden) return false;
  encounter.hidden = true;
  stopPortrait();
  return true;
}
