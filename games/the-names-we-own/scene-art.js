"use strict";

const scenePlate = document.querySelector("#scene-plate");
const sceneImage = document.querySelector("#scene-image");
const sceneEffects = document.querySelector("#scene-effects");
let plateRoom;
let plateStage;
let plateLetters = 8;
let plateReady = false;
let artHidden = false;

const roomEffects = {
  tollhouse: {stars:[[.83,.25]], water:[.75,.49,.19,.09], lamps:[[.15,.54],[.67,.60]]},
  riverbank: {stars:[[.71,.16],[.89,.23]], water:[.53,.79,.42,.18], lamps:[[.11,.52]]},
  crossing: {stars:[[.16,.16],[.84,.16]], water:[.01,.66,.15,.22], lamps:[[.47,.39],[.69,.42]]},
  washout: {water:[.49,.69,.24,.27], lamps:[[.76,.49]]},
  ridge: {stars:[[.17,.14],[.42,.17],[.65,.13],[.79,.2]], lamps:[]},
  orchard: {stars:[[.58,.14],[.65,.26]], lamps:[[.34,.67],[.75,.63]]},
  hall: {lamps:[[.63,.46]]},
  home: {lamps:[[.13,.57],[.76,.42]]},
  vestry: {lamps:[]},
  records: {lamps:[[.65,.23]]},
};

function syncArtVisibility() {
  scenePlate.hidden = artHidden || !plateReady;
  bridge.hidden = artHidden || plateReady;
}

sceneImage.addEventListener("load", () => {
  plateReady = true;
  syncArtVisibility();
  paintSceneEffects(ambientPhase);
});

sceneImage.addEventListener("error", () => {
  plateReady = false;
  syncArtVisibility();
  if (plateRoom) drawCells(bridge, terminalFrame(plateRoom, plateStage, plateLetters));
});

function setSceneArt(room, stage, letters) {
  plateStage = stage;
  plateLetters = letters;
  if (room !== plateRoom) {
    plateRoom = room;
    plateReady = false;
    sceneImage.src = "art/" + room + ".webp?v=1";
    syncArtVisibility();
  }
  if (!plateReady) drawCells(bridge, terminalFrame(room, stage, letters));
  paintSceneEffects(ambientPhase);
}

function paintSceneEffects(tick) {
  if (scenePlate.hidden || !plateRoom) return;
  const ctx = sceneEffects.getContext("2d");
  if (!ctx) return;
  const width = sceneEffects.width;
  const height = sceneEffects.height;
  ctx.clearRect(0,0,width,height);
  const effects = roomEffects[plateRoom];
  function stamp(glyph, x, y, color, size = 16, alpha = .75) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = size + "px monospace";
    ctx.fillText(glyph,x * width,y * height);
  }
  for (const [i,[x,y]] of (effects.stars || []).entries()) {
    stamp(twinkle[(tick + i * 2) % twinkle.length],x,y,"#b7e5ff",12,.52);
  }
  if (effects.water) {
    const [left,top,wide,deep] = effects.water;
    for (let i=0; i<12; i++) {
      const x = left + ((i * 19 + tick) % 23) / 23 * wide;
      const y = top + ((i * 7) % 11) / 11 * deep;
      stamp(ripple[(tick+i) % ripple.length],x,y,"#90d4ff",10+(i%3)*3,.38);
    }
  }
  const lights = plateRoom === "ridge" && plateStage === "signaled"
    ? [[.39,.44],[.47,.44]] : effects.lamps;
  for (const [i,[x,y]] of lights.entries()) {
    stamp(lamp[(tick+i*3) % lamp.length],x,y,"#ffd785",16,.7);
  }

  const repaired = plateStage === "paid" || plateStage === "tolls";
  if (["tollhouse","riverbank","crossing"].includes(plateRoom) &&
      (repaired || plateStage === "debt")) {
    const word = repaired ? "BELLWICK".slice(0,plateLetters) : "BE··WI··";
    const signX = plateRoom === "tollhouse" ? .80 : .72;
    const signY = plateRoom === "tollhouse" ? .44 : .29;
    ctx.globalAlpha = .72;
    ctx.fillStyle = "#0b1718";
    ctx.fillRect(signX*width-9,signY*height-22,110,29);
    stamp(word,signX,signY,"#ffd386",18,1);
  }
  if (plateRoom === "washout" && plateStage === "oral") {
    for (let i=0; i<13; i++) stamp("=", .41+i*.016, .72-i*.004, "#ffc987",14,.6);
  }
  if (plateRoom === "hall" && plateStage !== "dim") {
    const label = {read:"EXPIRED",shared:"REPAIR",local:"RETURN"}[plateStage];
    if (label) stamp(label,.47,.52,"#ffdc91",15,.9);
  }
  if (plateRoom === "home" && plateStage === "complete") stamp("*",.51,.69,"#ffe2a4",18,.82);
  if (plateRoom === "orchard" && ["public","sealed"].includes(plateStage)) {
    stamp(plateStage === "sealed" ? "[]" : "[+]",.48,.61,"#ffe2a4",16,.82);
  }
  if (plateRoom === "vestry" && plateStage === "promise") stamp("·",.49,.68,"#ffdc91",22,.9);
  if (plateRoom === "records" && plateStage === "copied") stamp("[=]",.63,.71,"#ffdc91",14,.9);
  ctx.globalAlpha = 1;
}
