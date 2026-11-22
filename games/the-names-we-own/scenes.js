"use strict";

// Every mark is one text cell. Color is applied to runs of literal characters.
const terminalScenes = {
  tollhouse: [
    "    .   :    .     :      .      :    .    .",
    "   :       .         +         .        :  ",
    "      .           /#####\\          .       ",
    "    :     +     /#########\\      :         ",
    "              /#############\\              ",
    "       ^^^   /_______________\\   vvv      ",
    "     ^^^^^^   |  []  | |  [] |    vvvvv    ",
    "    ^^^^^^^^  |  **  | |  ** |  vvvvvvvv   ",
    "      ||      |______|_|_____|     ||      ",
    "  vv,,||,,,,,,==....===....==,,,,,||,,vv   ",
    " ,vvvv,,,vv,,,,,,,..==..,,,,,vv,,,,vvv,,,  ",
    "~ ~ = ~ ~ == ~ ~ = ~ ~ == ~ ~ = ~ ~ == ~ ~",
  ],
  riverbank: [
    "   :      .      :          .    :         ",
    "       .       .      :        .      .    ",
    "  ^^^  ^^^  .                     ^^^  ^^^ ",
    " ^^^^^^^^   vv    |       |   vv   ^^^^^^^^",
    "   |||     vvvvvvv|-------|vvvvvv     |||  ",
    " ,,|||,,vvvvvvv,,,|       |,,,vvvvv,,,|||,,",
    "~~ == ~~ == ~~~~~ |       | ~~~~ == ~~ = ~~",
    " =~ ~~~~~~ == ~~~#|#~~~~~#|#~~~ == ~~~~~ ~=",
    "~~~~ == ~~~ ^^ ___###____ ###~~ ~= ~~~~~~~~",
    "v~~~~ == ~~~ vv|__+__|__| ~~~~~ == ~~~~~ ~v",
    ",vvvv,~~~ ,vvvv|  |     | ~~~~ vvvv,,,vvvv,",
    ",,,,vvvvvvvv,,,|__|_____|vvvvvv,,vvvv,,,,,,",
  ],
  crossing: [
    "         .       :          .     :        ",
    "  ^^^         .                 .    ^^^^  ",
    " ^^^^^^    ____________________     ^^^^^^ ",
    "  |||      |     BELLWICK     |       |||  ",
    ",,|||,vv,,,|__________________|,,,vv,,|||,,",
    " vvvv,,,,,,, |              | ,,,,,,vvvvv ",
    "  ~~~~~~     |              |    ~~~~~~~   ",
    " ~~ ==== ~~~ |    .    .    | ~~ ==== ~~~~",
    "=====|=============================|=======",
    " ~~~ | ~~~~~~ == ~~~~~~ == ~~~~~~~ | ~~~~~",
    "~~~ #|# == ~~~~~~ == ~~~~~~ == ~~ #|# ~~~~",
    "~~~ ### ~~~~~~~~ == ~~~~~~~~ == ~ ### ~~~~",
  ],
};

const cellColors = {
  "~":"water", "=":"foam", ",":"reed", "v":"reed", "^":"leaf", "#":"stone",
  "/":"timber", "\\":"timber", "_":"timber", "|":"timber", "-":"timber",
  "[":"flame", "]":"flame", "*":"flame", "+":"flame", ".":"rain", ":":"rain",
};

function drawCells(target, rows) {
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
    for (const glyph of row) {
      const color = cellColors[glyph] || (/[A-Z]/.test(glyph) ? "flame" : "");
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
  const scene = [...terminalScenes[room]];
  if (room !== "riverbank") return scene;
  if (stage === "debt") scene[2] = "  ^^^  ^^^         B E . . W I . .   ^^^   ";
  if (stage === "paid" || stage === "tolls") {
    const name = [..."BELLWICK"].map((letter, index) => index < visible ? letter : ".").join(" ");
    scene[2] = "  ^^^  ^^^         " + name + "   ^^^   ";
    scene[4] = stage === "paid"
      ? "   |||     vvvvvvv|---------------|     |||"
      : "   |||     vvvvvvv|------X--------|     |||";
  }
  return scene;
}
