"use strict";

// Every mark is one text cell. Color is applied to runs of literal characters.
const sceneWidth = 76;
const sceneHeight = 22;

const sky = [
  "      .          @           .                      @           .",
  "  @         .                        .       .                         .",
  "                    .    @                           .        @",
  "        .                         .        @                     .",
  "   .         .            .                       .          .        @",
];

const hills = [
  "       /#\\        /#\\                                /#\\          /#\\",
  "  /#\\ /###\\  /#\\  /###\\                  /#\\       /###\\   /#\\  /###\\",
  "/###/#####\\/###/#####\\          /#\\     /###\\    /#####\\ /###/#####\\",
  "########################################################################",
];

const pine = ["    ^", "   ^^^", "  ^^^^^", " ^^^^^^^", "^^^^^^^^^", "   |||"];
const willow = [
  "      vvvvvvv", "   vvvvvvvvvvvvv", " vvvvvvvvvvvvvvvvv",
  "vvv vvvvvvvvvvv vvv", "vvv   vvv|vvv   vvv", "vv      |||      vv", "        |||",
];
const tollhouse = [
  "           ++", "           ||", "          /##\\", "        /######\\",
  "      /##########\\", "    /##############\\", "  /##################\\",
  " /____________________\\", "  |  [**]  | |  [**] |",
  "  |  [**]  | |  [**] |", "  |________|_|_______|",
];
const pier = ["  |      |", "  |------|", "  |      |", " #|#    #|#", " ###    ###"];

function landscape(room, stage, visible) {
  const cells = Array.from({length:sceneHeight}, () => Array(sceneWidth).fill(" "));
  function layer(x, y, rows) {
    rows.forEach((row, dy) => [...row].forEach((glyph, dx) => {
      if (glyph !== " " && x + dx < sceneWidth && y + dy < sceneHeight) {
        cells[y + dy][x + dx] = glyph;
      }
    }));
  }
  function ground(first, last, patterns) {
    for (let y = first; y <= last; y++) {
      layer(0, y, [patterns[y % patterns.length].repeat(8).slice(0, sceneWidth)]);
    }
  }

  layer(0, 0, sky);
  layer(1, 4, hills);
  ground(17, 21, ["~~ = ~~~  ", "~  ~~~ =  ", "~~~ == ~~ "]);
  if (room === "tollhouse") {
    ground(14, 17, [",, vv ,,,, ", "vv ,,,, vv "]);
    layer(2, 8, willow);
    layer(16, 9, pine);
    layer(26, 5, tollhouse);
    layer(51, 9, pine);
    layer(63, 8, willow);
    layer(31, 16, ["___--==--___", "__--==--____", "____--==--___"]);
  } else {
    ground(11, 21, ["~~~~~ = ~~~~   ", "~ = ~~  ~~~~~  ", "~~~ == ~~~~~   "]);
    layer(0, 7, willow);
    layer(13, 8, pine);
    layer(58, 8, pine);
    layer(62, 7, willow);
    layer(18, 12, pier);
    layer(51, 12, pier);
    const repaired = stage === "paid" || stage === "tolls";
    const name = repaired ? "BELLWICK" : stage === "debt" ? "BE..WI.." : "........";
    const sign = [...name].map((letter, index) => index < visible ? letter : ".").join(" ");
    layer(27, 8, ["___________________", "| " + sign + " |", "|_________________|"]);
    layer(14, 13, [repaired
      ? "______|-----------------------------------|______"
      : "______|--------                     ------|______"]);
    if (stage === "tolls") layer(35, 13, ["XXX"]);
    if (room === "crossing") layer(39, 12, ["@"]);
    layer(3, 18, [",,,,,vvv,,,,", ",vvv,,,,vvv,,,,"]);
    layer(58, 18, [",,,vvvv,,,,,,", ",vvvv,,,,vvv,,,,,"]);
  }
  return cells.map(row => row.join(""));
}

// Expand the layout into two rows of independently shaped cells. Sparse
// markers stay one cell wide, while surfaces gain seams and texture.
const detailCells = {
  " ": ["  ", "  "],
  "@": ["@ ", "  "],
  ".": [". ", "  "],
  ":": [". ", " ."],
  "#": ["##", "#:"],
  "^": [" ^", "^^"],
  "v": ["vv", " v"],
  ",": [", ", " ,"],
  "~": ["~ ", " ~"],
  "=": ["==", " ~"],
  "/": [" /", "/ "],
  "\\": ["\\ ", " \\"],
  "_": ["  ", "__"],
  "-": ["--", "  "],
  "|": ["| ", "| "],
  "[": ["[ ", "| "],
  "]": [" ]", " |"],
  "*": ["**", " *"],
  "+": ["++", "  "],
  "X": ["XX", "XX"],
};

function detailFrame(rows) {
  return rows.flatMap(row => {
    const upper = [];
    const lower = [];
    for (const glyph of row) {
      const [top, bottom] = detailCells[glyph] ?? [glyph + " ", "  "];
      upper.push(top);
      lower.push(bottom);
    }
    return [upper.join(""), lower.join("")];
  });
}

const cellColors = {
  "~":"water", "=":"foam", ",":"reed", "v":"reed", "^":"leaf", "#":"stone",
  "/":"timber", "\\":"timber", "_":"timber", "|":"timber", "-":"timber",
  "[":"flame", "]":"flame", "*":"flame", "+":"flame", ".":"rain", ":":"rain",
};

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
      if (glyph === "@" || glyph === "~" && (index * 7 + column) % 11 === 0) {
        flush();
        const cell = document.createElement("span");
        cell.className = glyph === "@" ? "flame" : "water";
        cell.dataset.ambient = glyph === "@" ? "star" : "water";
        cell.dataset.phase = (index * 3 + column * 5) % 9;
        cell.textContent = glyph === "@" ? "+" : "~";
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

function terminalFrame(room, stage, visible = 8) {
  return detailFrame(landscape(room, stage, visible));
}
