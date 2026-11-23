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
  } else if (room === "ridge") {
    ground(12, 21, ["  ,   ##     ", "   #  ,  #   ", " ,   ##  ,   "]);
    layer(8, 9, hills);
    layer(33, 13, ["|#######|", "|_______|", " ### ###"]);
    layer(34, 12, [stage === "signaled" ? "**   **" : ".     ."]);
  } else if (room === "vestry" || room === "records") {
    layer(10, 7, ["/____________________________________________________\\",
      "|    []     |                               |    []   |",
      "|    **     |        ____________________   |    **   |",
      "|    ##     |       |____________________|  |    ##   |",
      "|___________|_______|_|________________|_|__|_________|"]);
    layer(32, 9, [room === "vestry" ? "[ NOTE ]" : "[ WINTERS ]"]);
    if (stage === "promise" || stage === "copied") layer(34, 10, ["+"]);
  } else if (room === "washout") {
    ground(14, 21, [",, vv ,,,, ", "vv ,,,, vv "]);
    layer(9, 8, ["  /##\\      /##\\                 /###\\       /##\\",
      " /_[]_\\    /_[]_\\               /_____\\     /_[]_\\",
      " | ++ |    | ++ |               |  +  |     | ++ |",
      "_|____|____|____|_______________|_____|_____|____|"]);
    layer(4, 10, pine);
    layer(63, 9, willow);
    layer(6, 15, stage === "oral"
      ? ["-----------------------------------------------------------", "==========================================================="]
      : ["-----------------------    ~~~ ~~~   ----------------------", "=======================   ~~~ ~~~~~  ======================"]);
    layer(28, 12, ["/##", "|#|", "|#|"]);
    if (stage === "marked") layer(31, 13, ["[====]"]);
  } else if (room === "orchard") {
    ground(16, 21, [",, vv ,,,, ", "vv ,,,, vv "]);
    for (const [x,y] of [[4,7],[26,8],[51,7]]) {
      layer(x,y,willow);
      layer(x+3,y+5,["|   |   |", stage === "sealed" ? "[]  []  []" : "[+] [+] [+]"]);
    }
    layer(33, 16, [".. ..", "... ...", ".... ....", "..... .....", "...... ......"]);
  } else if (room === "hall") {
    layer(10, 5, ["/____________________________________________________\\",
      "|     []    ||                            ||    []     |",
      "|     **    ||      __________________    ||    **     |",
      "|     ##    ||     /__________________\\   ||    ##     |",
      "|     ##    ||     |                  |   ||    ##     |",
      "|___________||_____|__________________|___||___________|"]);
    layer(33, 11, ["  +", " [*]", "  |"]);
    layer(23, 14, ["/____________________________\\", "|                            |", "|____________________________|"]);
    if (stage !== "dim") layer(34, 15, [stage === "read" ? "EXPIRED" : stage === "shared" ? "REPAIR" : "RETURN"]);
  } else if (room === "home") {
    ground(17, 21, [",, vv ,,,, ", "vv ,,,, vv "]);
    layer(13, 6, ["          /########################\\",
      "         /__________________________\\",
      "         |   [++]     ||     [++]   |",
      "         |____________||____________|",
      "  []       __________________________       []",
      "  ||      /__________________________\\      ||",
      "         /____________________________\\",
      "            ||                    ||"]);
    layer(51, 16, ["[]","||"]);
    if (stage === "complete") layer(48, 14, ["+ + +"]);
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
