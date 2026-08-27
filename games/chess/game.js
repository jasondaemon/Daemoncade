import { Chess } from "./vendor/chess.js";

const $ = (id) => document.getElementById(id);
const glyph = { wp: "♟", wn: "♞", wb: "♝", wr: "♜", wq: "♛", wk: "♚", bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚" };
const pieceName = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
const value = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const key = "jasondaemon.chess.stats.v1";
let chess = new Chess(), selected = "", orientation = "w", thinking = false, last = null, pendingAnimation = null;

function stats() {
  try { return JSON.parse(localStorage.getItem(key)) || { wins: 0, losses: 0, draws: 0 }; }
  catch { return { wins: 0, losses: 0, draws: 0 }; }
}

function save(result) {
  const current = stats();
  current[result] = (current[result] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(current));
  GameScores.record({ game: "chess", mode: $("mode").value, difficulty: $("difficulty").value, value: current.wins, meta: { result } });
}

function squares() {
  const ranks = orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === "w" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];
  return ranks.flatMap((rank) => files.map((file) => file + rank));
}

function legal(from = selected) { return from ? chess.moves({ square: from, verbose: true }) : []; }
function status() {
  if (chess.isCheckmate()) return { done: true, label: "Checkmate", winner: chess.turn() === "w" ? "black" : "white" };
  if (chess.isDraw()) return { done: true, label: "Draw", winner: "draw" };
  return { done: false, label: chess.isCheck() ? "Check" : "In play" };
}
function recordResult(current) {
  if ($("mode").value === "cpu") save(current.winner === "white" ? "wins" : current.winner === "draw" ? "draws" : "losses");
  else save(current.winner === "draw" ? "draws" : "wins");
}

function move(from, to, promotion = "q") {
  if (thinking) return;
  const applied = chess.move({ from, to, promotion });
  if (!applied) return;
  last = { from: applied.from, to: applied.to };
  pendingAnimation = last;
  selected = "";
  const current = status();
  if (current.done) { recordResult(current); render(); }
  else if ($("mode").value === "cpu" && chess.turn() === "b") {
    thinking = true;
    render();
    setTimeout(cpuMove, 180);
  } else render();
}

function clickSquare(square) {
  if (thinking || status().done) return;
  const piece = chess.get(square);
  if ($("mode").value === "cpu" && chess.turn() !== "w") return;
  if (selected) {
    const target = legal().find((candidate) => candidate.to === square);
    if (target) {
      if (target.piece === "p" && (square.endsWith("8") || square.endsWith("1"))) return promote(target);
      return move(target.from, target.to, target.promotion || "q");
    }
    if (square === selected) { selected = ""; return render(); }
  }
  selected = piece?.color === chess.turn() ? square : "";
  render();
}

function promote(candidate) {
  const dialog = $("promotion");
  if (!dialog.showModal) return move(candidate.from, candidate.to, "q");
  const done = () => {
    dialog.removeEventListener("close", done);
    move(candidate.from, candidate.to, ["q", "r", "b", "n"].includes(dialog.returnValue) ? dialog.returnValue : "q");
  };
  dialog.addEventListener("close", done);
  dialog.showModal();
}

function evaluate(game, color) {
  if (game.isCheckmate()) return game.turn() === color ? -100000 : 100000;
  if (game.isDraw()) return 0;
  let total = 0;
  for (const row of game.board()) for (const piece of row) if (piece) total += (piece.color === color ? 1 : -1) * (value[piece.type] || 0);
  if (game.isCheck()) total += game.turn() === color ? -30 : 30;
  return total;
}

function search(game, depth, alpha, beta, color, budget) {
  if (depth <= 0 || game.isGameOver() || budget.n++ > budget.max) return evaluate(game, color);
  const maximize = game.turn() === color;
  let best = maximize ? -Infinity : Infinity;
  const moves = game.moves({ verbose: true }).sort((a, b) => (b.captured ? value[b.captured] : 0) - (a.captured ? value[a.captured] : 0));
  for (const candidate of moves) {
    const trial = new Chess(game.fen());
    trial.move({ from: candidate.from, to: candidate.to, promotion: candidate.promotion || "q" });
    const score = search(trial, depth - 1, alpha, beta, color, budget);
    if (maximize) { best = Math.max(best, score); alpha = Math.max(alpha, best); }
    else { best = Math.min(best, score); beta = Math.min(beta, best); }
    if (beta <= alpha || budget.n > budget.max) break;
  }
  return best;
}

function chooseCpu() {
  const moves = chess.moves({ verbose: true }), difficulty = $("difficulty").value;
  if (difficulty === "easy" && Math.random() < .7) return moves[Math.floor(Math.random() * moves.length)];
  const depth = difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1;
  const budget = { n: 0, max: difficulty === "hard" ? 12000 : 2500 };
  let best = -Infinity, pool = [];
  for (const candidate of moves) {
    const trial = new Chess(chess.fen());
    trial.move({ from: candidate.from, to: candidate.to, promotion: candidate.promotion || "q" });
    const score = search(trial, depth - 1, -Infinity, Infinity, "b", budget) + (Math.random() - .5) * (difficulty === "hard" ? 2 : 22);
    if (score > best + 2) { best = score; pool = [candidate]; }
    else if (Math.abs(score - best) <= 2) pool.push(candidate);
  }
  return pool[Math.floor(Math.random() * pool.length)] || moves[0];
}

function cpuMove() {
  const candidate = chooseCpu();
  thinking = false;
  if (candidate) move(candidate.from, candidate.to, candidate.promotion || "q");
}

function animateMove(animation) {
  if (!animation || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const from = $("board").querySelector(`[data-square="${animation.from}"]`);
  const to = $("board").querySelector(`[data-square="${animation.to}"]`);
  const piece = to?.querySelector(".piece");
  if (!from || !to || !piece) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  piece.animate([
    { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(.94)`, zIndex: 5 },
    { transform: "translate(0, 0) scale(1.06)", offset: .78, zIndex: 5 },
    { transform: "translate(0, 0) scale(1)", zIndex: 5 },
  ], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
}

function render() {
  const moves = legal(), current = status(), kingCheck = chess.isCheck() ? findKing(chess.turn()) : "", animation = pendingAnimation;
  pendingAnimation = null;
  const nodes = squares().map((square, index) => {
    const button = document.createElement("button"), piece = chess.get(square);
    button.type = "button";
    button.dataset.square = square;
    button.dataset.label = square[0] === "a" || square[1] === "1" ? square : "";
    button.className = `square ${(Math.floor(index / 8) + index % 8) % 2 ? "dark" : ""}`;
    button.ariaLabel = `${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${pieceName[piece.type]}` : " empty"}`;
    if (piece) {
      const token = document.createElement("span");
      token.className = `piece ${piece.color === "w" ? "white" : "black"}`;
      token.textContent = glyph[piece.color + piece.type];
      token.ariaHidden = "true";
      button.append(token);
    }
    if (square === selected) button.classList.add("selected");
    const target = moves.find((candidate) => candidate.to === square);
    if (target) button.classList.add(target.captured ? "capture" : "target");
    if (last && (square === last.from || square === last.to)) button.classList.add("last");
    if (square === kingCheck) button.classList.add("check");
    button.onclick = () => clickSquare(square);
    return button;
  });
  $("board").replaceChildren(...nodes);
  animateMove(animation);
  $("turn").textContent = current.done ? "—" : thinking ? "Black thinking" : chess.turn() === "w" ? "White" : "Black";
  $("result").textContent = current.label;
  $("message").textContent = current.done ? (current.winner === "draw" ? "The game ends in a draw." : `${current.winner} wins by checkmate.`) : thinking ? "Computer is thinking…" : chess.isCheck() ? "The king is in check." : `${chess.turn() === "w" ? "White" : "Black"} to move.`;
  $("history").replaceChildren(...chess.history().map((notation, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${notation}`;
    return item;
  }));
  const currentStats = stats();
  $("stats").innerHTML = `Local record<br><strong>${currentStats.wins || 0} wins · ${currentStats.losses || 0} losses · ${currentStats.draws || 0} draws</strong>`;
}

function findKing(color) {
  for (const row of chess.board()) for (const piece of row) if (piece?.type === "k" && piece.color === color) return piece.square;
  return "";
}

function reset() {
  chess = new Chess(); selected = ""; last = null; pendingAnimation = null; thinking = false;
  $("difficulty").hidden = $("mode").value !== "cpu";
  render();
}

$("new").onclick = reset;
$("mode").onchange = reset;
$("flip").onclick = () => { orientation = orientation === "w" ? "b" : "w"; render(); };
$("undo").onclick = () => {
  if (thinking) return;
  if ($("mode").value === "cpu") { chess.undo(); chess.undo(); } else chess.undo();
  last = null; pendingAnimation = null; selected = ""; render();
};
$("copy").onclick = async () => {
  try { await navigator.clipboard.writeText(chess.pgn()); $("message").textContent = "PGN copied."; }
  catch { $("message").textContent = "Copy was blocked by the browser."; }
};
reset();
