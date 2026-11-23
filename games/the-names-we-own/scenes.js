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
  const outdoor = ["crossing","washout","ridge","orchard"].includes(room);
  if (outdoor) {
    rectangle(0,0,sceneWidth,24,"sky",room.length);
    const stars = {
      crossing:[[10,3],[27,8],[51,2],[72,5],[102,4],[137,7]],
      washout:[[24,5],[80,3],[124,6]],
      ridge:[[10,4],[36,3],[58,8],[82,2],[112,5],[139,2]],
      orchard:[[37,3],[73,6],[111,4]],
    };
    for (const [x,y] of stars[room]) put(x,y,"@");
    if (room === "crossing") {
      face([[0,17],[19,5],[37,15],[65,9],[83,18],[108,7],[152,15],[152,44],[0,44]],"bank",1);
      face([[58,16],[94,16],[139,33],[152,35],[152,44],[78,44],[55,32]],"water",2);
      for (const [x,y,size] of [[5,14,15],[19,12,12],[133,12,14],[146,15,19]]) pine(x,y,size,x%11);
    } else if (room === "washout") {
      face([[0,9],[49,17],[100,14],[152,12],[152,44],[0,44]],"bank",4);
      face([[0,9],[14,4],[40,9],[59,18],[0,23]],"far",3);
      face([[97,19],[122,9],[152,14],[152,25]],"far",7);
    } else if (room === "ridge") {
      face([[0,23],[21,16],[48,19],[72,10],[96,19],[117,14],[152,18],[152,33],[0,33]],"far",8);
      face([[0,30],[44,20],[85,22],[152,25],[152,44],[0,44]],"bank",2);
    } else {
      face([[0,19],[66,13],[152,16],[152,44],[0,44]],"bank",6);
      face([[0,14],[30,6],[71,9],[74,14],[33,21],[0,23]],"far",3);
      face([[88,16],[135,7],[152,12],[152,21],[118,23]],"far",9);
    }
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
  } else if (room === "hall") {
    // A long aisle leads to a raised council desk, viewed head-on.
    rectangle(0,0,152,44,"shadow");
    face([[0,0],[42,9],[42,32],[0,44]],"stone",1);
    face([[152,0],[111,9],[111,32],[152,44]],"stone",6);
    rectangle(42,9,69,20,"wall",2);
    face([[57,25],[92,25],[127,44],[24,44]],"path",4);
    for (const [x,y,h] of [[20,6,29],[43,9,22],[102,9,22],[126,6,29]]) {
      rectangle(x,y,6,h,"stone",x);
      lamps(x+1,y+3,3,3);
    }
    face([[53,25],[97,25],[111,30],[43,30]],"planks",2);
    rectangle(43,30,68,5,"wall",6);
    lamps(87,20,3,4);
    if (stage !== "dim") label(70,28,stage === "read" ? "EXPIRED" : stage === "shared" ? "REPAIR" : "RETURN");
  } else if (room === "home") {
    // A low, diagonal view down a long supper table toward the kitchen.
    rectangle(0,0,152,44,"planks",6);
    face([[0,0],[39,7],[39,34],[0,44]],"shadow",8);
    face([[39,31],[152,24],[152,44],[0,44]],"deck",3);
    rectangle(111,5,23,20,"shadow",3);
    lamps(115,8,15,13);
    face([[14,35],[92,17],[120,22],[39,42]],"planks",2);
    face([[39,41],[120,21],[120,27],[39,44]],"wall",7);
    for (const [x,y] of [[42,33],[61,29],[79,24],[97,21]]) label(x,y,"[o]");
    rectangle(25,24,9,10,"shadow",2);
    label(27,25,"[]");
    if (stage === "complete") lamps(36,31,7,2);
  } else if (room === "vestry") {
    // Seen through the shed doorway, the note is close and there is open orchard behind it.
    rectangle(0,0,152,44,"shadow");
    face([[4,0],[52,10],[52,34],[4,44]],"planks",2);
    face([[151,0],[112,10],[112,34],[151,44]],"planks",5);
    rectangle(52,10,60,24,"canopy",1);
    face([[59,24],[91,21],[108,44],[25,44]],"path",2);
    face([[7,31],[50,24],[83,33],[35,42]],"planks",8);
    face([[24,32],[43,29],[57,32],[37,37]],"stone",2);
    label(33,33,"NOTE");
    put(41,31,"o");
    if (stage === "promise") label(34,36,"...");
  } else if (room === "records") {
    // A narrow stack aisle, with the open WINTERS drawer in the foreground.
    rectangle(0,0,152,44,"shadow");
    face([[0,3],[70,13],[70,31],[0,44]],"wall",5);
    face([[152,2],[91,12],[91,31],[152,44]],"wall",7);
    face([[70,31],[91,31],[122,44],[43,44]],"deck",4);
    for (const [y,height] of [[4,6],[13,6],[22,6],[31,6]]) {
      face([[0,y],[66,y+5],[66,y+height+3],[0,y+height]],"planks",y);
      label(8,y+2,"[||||] [|||] [|||||]");
    }
    lamps(81,12,5,6);
    face([[82,33],[129,26],[151,32],[103,41]],"planks",4);
    face([[91,33],[129,28],[143,32],[105,38]],"shadow",7);
    label(104,34,"WINTERS");
    if (stage === "copied") label(121,31,"[====]");
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
