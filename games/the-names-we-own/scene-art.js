"use strict";

const scenePlate = document.querySelector("#scene-plate");
const sceneCharacters = document.querySelector("#scene-characters");
const sceneEffects = document.querySelector("#scene-effects");
let plateRoom;
let plateStage;
let plateLetters = 8;
let plateReady = false;
let artHidden = false;
let sceneAtlas;
const animatedRooms = new Set("tollhouse riverbank crossing washout ridge orchard hall home vestry records".split(" "));
const sceneAtlases = new Map();

function loadSceneAtlas(room) {
  if (!sceneAtlases.has(room)) {
    sceneAtlases.set(room, new Promise((resolve) => {
      const atlas = new Image();
      atlas.onload = () => resolve(atlas);
      atlas.onerror = () => resolve(null);
      atlas.src = "art/" + room + ".webp?v=16";
    }));
  }
  return sceneAtlases.get(room);
}

function paintSceneAtlas(tick) {
  if (!sceneAtlas) return;
  const ctx = sceneCharacters.getContext("2d");
  if (!ctx) return;
  const frameWidth = sceneAtlas.naturalWidth;
  const frameHeight = sceneAtlas.naturalHeight / 2;
  const width = sceneCharacters.width;
  const height = sceneCharacters.height;
  ctx.drawImage(sceneAtlas, 0, 0, frameWidth, frameHeight, 0, 0, width, height);
  const blend = [0, .22, .48, .7, .48, .22][tick % 6];
  if (blend) {
    ctx.globalAlpha = blend;
    ctx.drawImage(sceneAtlas, 0, frameHeight, frameWidth, frameHeight, 0, 0, width, height);
    ctx.globalAlpha = 1;
  }
}

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

function drawGlyphBackdrop(room) {
  const ctx = sceneCharacters.getContext("2d");
  const artwork = glyphAtlas.rooms[room];
  if (!ctx || !artwork) return false;
  ctx.clearRect(0,0,sceneCharacters.width,sceneCharacters.height);
  const height = sceneCharacters.height / artwork.rows.length;
  const width = sceneCharacters.width / (artwork.rows[0].length / 2);
  ctx.font = "bold " + height + "px monospace";
  ctx.textBaseline = "middle";
  for (const [y,row] of artwork.rows.entries()) {
    for (let pos=0; pos<row.length; pos+=2) {
      const glyph = glyphAtlas.glyphs[glyphAtlas.alphabet.indexOf(row[pos])];
      if (glyph === " ") continue;
      ctx.fillStyle = artwork.palette[glyphAtlas.alphabet.indexOf(row[pos+1])];
      ctx.fillText(glyph,(pos/2)*width,(y+.54)*height,width);
    }
  }
  return true;
}

function setSceneArt(room, stage, letters) {
  plateStage = stage;
  plateLetters = letters;
  if (room !== plateRoom) {
    plateRoom = room;
    sceneAtlas = null;
    if (animatedRooms.has(room)) {
      loadSceneAtlas(room).then((atlas) => {
        if (!atlas || plateRoom !== room) return;
        sceneAtlas = atlas;
        plateReady = true;
        syncArtVisibility();
        paintSceneEffects(ambientPhase);
      });
    }
    plateReady = drawGlyphBackdrop(room);
    syncArtVisibility();
  }
  if (!plateReady) drawCells(bridge, terminalFrame(room, stage, letters));
  paintSceneEffects(ambientPhase);
}

function paintSceneEffects(tick) {
  if (scenePlate.hidden || !plateRoom) return;
  if (!sceneMotionEnabled()) tick = 0;
  if (sceneAtlas) paintSceneAtlas(tick);
  const ctx = sceneEffects.getContext("2d");
  if (!ctx) return;
  const width = sceneEffects.width;
  const height = sceneEffects.height;
  ctx.clearRect(0,0,width,height);
  const effects = roomEffects[plateRoom];
  function stamp(glyph, x, y, color, size = 16, alpha = .75, outline = false) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = size + "px monospace";
    if (outline) {
      ctx.strokeStyle = "#0b1718";
      ctx.lineWidth = 4;
      ctx.strokeText(glyph,x * width,y * height);
    }
    ctx.fillText(glyph,x * width,y * height);
  }
  if (!sceneAtlas) {
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
  }

  if (sceneAtlas && plateRoom === "ridge" && plateStage === "signaled") {
    stamp(lamp[tick % lamp.length], .75, .46, "#ffd785", 19, .9);
  }
  const repaired = plateStage === "paid" || plateStage === "tolls";
  if (["tollhouse","riverbank","crossing"].includes(plateRoom) &&
      (repaired || plateStage === "debt")) {
    const word = repaired ? "BELLWICK".slice(0,plateLetters) : "BE··WI··";
    const signX = plateRoom === "tollhouse" ? .80 : .72;
    const signY = plateRoom === "tollhouse" ? .44 : .29;
    stamp(word,signX,signY,"#ffd386",18,1,true);
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
