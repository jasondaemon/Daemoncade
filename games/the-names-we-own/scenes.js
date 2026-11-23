"use strict";

// Projected faces are filled entirely with colored monospaced glyphs.
const sceneWidth = 152;
const sceneHeight = 44;
const cellColors = {
  "~":"water", "=":"foam", ".":"rain", ":":"rain", ",":"reed", "v":"reed",
  "^":"leaf", "n":"leaf", "f":"leaf-shadow", "#":"stone", "%":"stone-shadow",
  "+":"flame", "*":"flame", "o":"flame", "$":"flame",
  "/":"timber", "\\":"timber", "-":"timber", "|":"timber", "_":"timber",
  "h":"timber-shadow", "r":"roof", "x":"roof-light", "a":"path",
  "[":"stone", "]":"stone",
};

const materials = {
  sky: "                 .       :   ",
  far: ".,f.,f%%%:: ",
  stone: "%%##:%#%%#.",
  bank: "ffv,^n,,,%%",
  water: "~~= ~~: ~~~~",
  path: "..aa..a=,",
  deck: "-_-/--h-+",
  shadow: "hhh|hh%%h",
  roof: "rrrx////r",
  roofDark: "rrhhr///",
  planks: "|h|_h|h|+",
  wall: "h%h|h%%",
  light: "++*o+*",
  pine: "^n^ff^,",
  canopy: "fn^v^nvf,",
};

function terminalFrame(room, stage, visible = 8) {
  const cells = Array.from({length:sceneHeight}, () => Array(sceneWidth).fill(" "));
  function put(x,y,glyph) {
    if (x >= 0 && x < sceneWidth && y >= 0 && y < sceneHeight) cells[y][x] = glyph;
  }
  function label(x,y,text) {
    [...text].forEach((glyph,index) => put(x+index,y,glyph));
  }
  function face(points, material, seed = 0) {
    const glyphs = materials[material];
    const start = Math.max(0, Math.min(...points.map(([,y]) => y)));
    const end = Math.min(sceneHeight, Math.max(...points.map(([,y]) => y)));
    for (let y = start; y < end; y++) {
      const cuts = [];
      for (let index = 0; index < points.length; index++) {
        const [x1,y1] = points[index];
        const [x2,y2] = points[(index+1)%points.length];
        if ((y1 <= y + .5 && y2 > y + .5) || (y2 <= y + .5 && y1 > y + .5)) {
          cuts.push(x1+(y+.5-y1)*(x2-x1)/(y2-y1));
        }
      }
      cuts.sort((a,b) => a-b);
      for (let i = 0; i+1 < cuts.length; i += 2) {
        for (let x = Math.max(0,Math.ceil(cuts[i])); x < Math.min(sceneWidth,cuts[i+1]); x++) {
          put(x,y,glyphs[(x*17+y*11+Math.floor(x/5)*3+seed)%glyphs.length]);
        }
      }
    }
  }
  function rectangle(x,y,width,height,material,seed) {
    face([[x,y],[x+width,y],[x+width,y+height],[x,y+height]], material, seed);
  }
  function pine(x,y,size,seed) {
    rectangle(x-1,y+size-3,3,6,"planks",seed);
    for (let tier=3; tier>=0; tier--) {
      const top = y+Math.floor(tier*size/6);
      const half = Math.max(3,Math.round(size*.36+tier*1.7));
      face([[x,top],[x-half,top+Math.ceil(size/2)],[x+half,top+Math.ceil(size/2)]],"pine",seed+tier);
    }
  }
  function lamps(x,y,width,height) {
    rectangle(x,y,width,height,"light",2);
    put(x+Math.floor(width/2),y+Math.floor(height/2),"$");
  }
  function cottage(x,y,width) {
    const depth = Math.round(width*.38);
    const height = Math.max(4,Math.round(width*.29));
    const roof = Math.max(4,Math.round(width*.22));
    face([[x+width,y],[x+width+depth,y-3],[x+width+depth,y+height-3],[x+width,y+height]],"wall",1);
    rectangle(x,y,width,height,"planks",5);
    face([[x-3,y],[x+Math.round(width/2),y-roof],[x+width+2,y]],"roof",2);
    face([[x+Math.round(width/2),y-roof],[x+Math.round(width/2)+depth,y-roof-3],[x+width+depth+3,y-3],[x+width+2,y]],"roofDark",6);
    lamps(x+Math.round(width*.14),y+1,Math.max(3,Math.round(width*.15)),Math.max(2,height-4));
    lamps(x+Math.round(width*.68),y+1,Math.max(3,Math.round(width*.15)),Math.max(2,height-4));
    rectangle(x+Math.round(width*.42),y+3,Math.max(3,Math.round(width*.19)),height-3,"shadow");
  }
  function bridge(repaired) {
    face([[24,31],[100,19],[129,22],[54,37]],"shadow",2);
    if (repaired) {
      face([[13,30],[99,17],[127,20],[43,36]],"deck",4);
      face([[13,27],[99,14],[101,15],[13,29]],"planks",8);
      face([[43,32],[127,17],[127,19],[43,34]],"planks",5);
    } else {
      face([[13,30],[51,24],[77,27],[43,36]],"deck",4);
      face([[73,21],[99,17],[127,20],[101,25]],"deck",6);
    }
    for (const [x,y,h] of [[16,28,7],[34,25,6],[47,32,7],[67,28,6],[94,17,5],[119,18,6]]) {
      rectangle(x,y,2,h,"planks",2);
      put(x,y,"+");
    }
  }
  function grove() {
    for (const [x,y,size,seed] of [[17,12,18,3],[36,16,19,5],[63,12,19,2],[96,13,21,4],[129,11,22,1]]) {
      rectangle(x+12,y+6,4,16,"planks",seed);
      face([[x,y+4],[x+7,y],[x+size,y-2],[x+size+12,y+4],[x+size+5,y+10],[x+4,y+10]],"canopy",seed);
      for (let i=0;i<3;i++) {
        rectangle(x+7+i*6,y+8,1,3,"planks",i);
        label(x+6+i*6,y+11,stage === "sealed" ? "[]" : "[+]");
      }
    }
  }
  const inside = ["tollhouse","hall","home","vestry","records"].includes(room);
  if (!inside) {
    rectangle(0,0,152,18,"sky",7);
    for (const [x,y] of [[12,4],[28,6],[47,2],[76,7],[103,3],[124,5],[141,2]]) put(x,y,"@");
    face([[0,18],[16,7],[35,15],[55,5],[74,16],[101,8],[124,15],[145,7],[152,13],[152,24],[0,24]],"far",1);
    face([[0,23],[42,16],[96,16],[152,20],[152,44],[0,44]],"bank",4);
    face([[58,16],[94,16],[139,33],[152,35],[152,44],[78,44],[55,32]],"water",2);
    for (const [x,y,size] of [[5,14,15],[18,12,12],[34,13,10],[111,11,10],[133,12,14],[146,15,19]]) pine(x,y,size,x%11);
  }

  if (room === "tollhouse") {
    // The courier stands inside, facing Orra's desk and the far-bank window.
    rectangle(0,0,152,44,"shadow");
    face([[0,0],[61,7],[61,31],[0,44]],"planks",3);
    rectangle(61,7,77,24,"wall",2);
    face([[61,31],[138,31],[152,44],[0,44]],"deck",4);
    rectangle(85,8,41,17,"deck",3);
    rectangle(88,10,35,13,"sky",8);
    face([[88,18],[104,15],[123,18],[123,23],[88,23]],"water",2);
    put(115,13,"@");
    const restored = stage === "paid" || stage === "tolls";
    const name = restored ? "BELLWICK" : stage === "debt" ? "BE..WI.." : "........";
    rectangle(94,15,23,3,"shadow");
    label(97,16,[...name].map((letter,index) => index < visible ? letter : ".").join(" "));
    rectangle(12,9,23,24,"stone",3);
    face([[16,29],[16,20],[22,16],[30,20],[30,29]],"shadow");
    lamps(19,24,9,5);
    face([[25,30],[74,26],[108,32],[49,38]],"planks",4);
    face([[49,37],[108,31],[108,36],[49,43]],"wall",5);
    face([[54,31],[73,29],[88,32],[68,35]],"stone",1);
    label(63,32,"LEDGER");
    lamps(79,22,4,5);
  } else if (room === "riverbank") {
    // Below the deck, the stone pier and cellar hatch dominate the view.
    rectangle(0,0,152,44,"sky",7);
    face([[0,22],[152,15],[152,44],[0,44]],"water",2);
    face([[0,21],[33,25],[67,44],[0,44]],"bank",3);
    face([[105,13],[133,10],[139,35],[121,40]],"stone",4);
    face([[70,15],[152,0],[152,6],[76,25]],"shadow",5);
    face([[60,13],[152,0],[152,3],[70,17]],"planks",2);
    face([[4,29],[19,23],[37,33],[21,41]],"planks",1);
    face([[8,29],[19,26],[32,33],[22,37]],"shadow",5);
    label(18,32,"[o]");
    lamps(33,25,3,3);
    pine(3,9,11,4);
    const restored = stage === "paid" || stage === "tolls";
    const name = restored ? "BELLWICK" : stage === "debt" ? "BE..WI.." : "........";
    rectangle(112,7,23,3,"shadow");
    label(115,8,[...name].map((letter,index) => index < visible ? letter : ".").join(" "));
  } else if (room === "crossing") {
    bridge(stage === "paid" || stage === "tolls");
    const name = stage === "paid" || stage === "tolls" ? "BELLWICK" : stage === "debt" ? "BE..WI.." : "........";
    rectangle(85,10,26,6,"shadow");
    label(88,12,[...name].map((letter,index) => index < visible ? letter : ".").join(" "));
    rectangle(87,15,2,6,"planks");
    rectangle(107,15,2,5,"planks");
    if (stage === "tolls") label(56,27,"X X X");
    if (room === "crossing") label(42,28,"o");
  } else if (room === "washout" || room === "ridge" || room === "orchard") {
    if (room === "orchard") {
      face([[66,17],[75,17],[101,44],[42,44]],"path");
      grove();
    } else if (room === "ridge") {
      face([[0,32],[39,16],[110,20],[152,44],[0,44]],"stone",3);
      face([[46,31],[92,24],[121,44],[62,44]],"path",4);
      rectangle(73,19,16,8,"shadow",1);
      if (stage === "signaled") {
        lamps(73,18,5,3);
        lamps(85,18,5,3);
      } else label(74,20,".        .");
    } else {
      cottage(31,14,15);
      cottage(101,14,16);
      face([[23,24],[62,20],[143,35],[90,40]],"path",3);
      if (stage !== "oral") face([[71,22],[84,23],[104,36],[88,39]],"water",6);
      face([[37,29],[46,26],[49,34],[40,37]],"stone",4);
      if (stage === "marked") label(49,29,"[====]");
    }
  } else {
    rectangle(0,0,152,44,"shadow");
    face([[0,0],[42,9],[42,32],[0,44]],"stone",1);
    face([[152,0],[111,9],[111,32],[152,44]],"wall",5);
    face([[42,29],[111,29],[152,44],[0,44]],"deck",1);
    rectangle(42,9,69,20,"wall",2);
    lamps(49,12,9,7);
    lamps(95,12,9,7);
    const bench = [[37,26],[97,22],[119,27],[52,33]];
    face([[52,32],[119,26],[119,32],[52,39]],"wall",1);
    face(bench,"planks",2);
    if (room === "hall") {
      face([[61,26],[87,24],[102,27],[73,30]],"stone",3);
      lamps(88,20,3,4);
      if (stage !== "dim") label(73,26,stage === "read" ? "EXPIRED" : stage === "shared" ? "REPAIR" : "RETURN");
    } else if (room === "vestry" || room === "records") {
      if (room === "vestry") {
        face([[21,17],[40,15],[40,28],[21,31]],"canopy",3);
        label(68,27,"[ NOTE ]");
      } else {
        for (const y of [16,20,24]) {
          rectangle(114,y,22,2,"planks",y);
          label(118,y-1,"[|||] [||] [|]");
        }
        label(68,27,"[ WINTERS ]");
      }
      if (stage === "promise" || stage === "copied") label(62,28,"+");
    } else if (stage === "complete") {
      lamps(66,26,4,2);
      lamps(91,25,4,2);
      label(34,34,"[]");
    }
  }
  return cells.map(row => row.join(""));
}

function drawCells(target, rows, palette = cellColors) {
  const fragment = document.createDocumentFragment();
  for (const [index, row] of rows.entries()) {
    let previous;
    let run = "";
    function flush() {
      if (!run) return;
      if (previous) {
        const cells = document.createElement("span");
        cells.className = previous;
        cells.textContent = run;
        fragment.append(cells);
      } else {
        fragment.append(run);
      }
      run = "";
    }
    for (const [column, glyph] of [...row].entries()) {
      if (glyph === "@" || glyph === "$" || glyph === "~" && (index * 7 + column) % 13 === 0) {
        flush();
        const cell = document.createElement("span");
        cell.className = glyph === "~" ? "water" : "flame";
        cell.dataset.ambient = glyph === "@" ? "star" : glyph === "$" ? "lamp" : "water";
        cell.dataset.phase = (index * 3 + column * 5) % 9;
        cell.textContent = glyph === "~" ? "~" : "+";
        fragment.append(cell);
        continue;
      }
      const color = palette[glyph] || (/[A-Z]/.test(glyph) ? "flame" : "");
      if (color !== previous) flush();
      previous = color;
      run += glyph;
    }
    flush();
    if (index < rows.length - 1) fragment.append("\n");
  }
  target.replaceChildren(fragment);
}
