(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const key = "jasondaemon.connect-four.stats.v1";
  const cells = [];
  let board, turn, over, lastDrop;

  function stats() { try { return JSON.parse(localStorage.getItem(key)) || { wins: 0, losses: 0, draws: 0 }; } catch { return { wins: 0, losses: 0, draws: 0 }; } }
  function save(result) { const s = stats(); s[result] = (s[result] || 0) + 1; localStorage.setItem(key, JSON.stringify(s)); GameScores.record({ game: "connect-four", mode: $("mode").value, difficulty: $("difficulty").value, value: s.wins, meta: { result } }); }
  function win(b) { const dirs = [[0,1],[1,0],[1,1],[1,-1]]; for (let r=0;r<6;r++) for (let c=0;c<7;c++) if (b[r*7+c]) for (const [dr,dc] of dirs) { const line=[]; for (let n=0;n<4;n++) { const rr=r+dr*n, cc=c+dc*n; if (rr<0||rr>5||cc<0||cc>6||b[rr*7+cc]!==b[r*7+c]) break; line.push(rr*7+cc); } if (line.length===4) return { mark:b[r*7+c], line }; } return b.every(Boolean) ? { mark:"draw", line:[] } : null; }
  function available(b=board) { return [...Array(7).keys()].filter((c) => !b[c]); }
  function drop(column, mark, b=board) { for (let r=5;r>=0;r--) if (!b[r*7+column]) { b[r*7+column]=mark; return r*7+column; } return -1; }
  function evaluate(column, mark) { const b=[...board]; drop(column,mark,b); if (win(b)?.mark===mark) return 100; const other=mark==="red"?"yellow":"red"; const danger=available(b).some((x)=>{const z=[...b];drop(x,other,z);return win(z)?.mark===other;}); return (column===3?8:4-Math.abs(3-column))-danger*35+Math.random(); }
  function finish(result) { over=true; if (result.mark==="draw") { $("result").textContent="Draw"; save("draws"); } else { const human=result.mark==="red"; $("result").textContent=`${result.mark} wins`; save($("mode").value==="cpu"?(human?"wins":"losses"):"wins"); } $("message").textContent=result.mark==="draw"?"The board is full.":`${result.mark[0].toUpperCase()+result.mark.slice(1)} connected four.`; render(result.line); }
  function play(column) { if (over||!available().includes(column)) return; lastDrop=drop(column,turn); const result=win(board); if (result) return finish(result); turn=turn==="red"?"yellow":"red"; render(); if ($("mode").value==="cpu"&&turn==="yellow") { $("message").textContent="Computer is choosing…"; setTimeout(cpu,300); } else $("message").textContent=`${turn[0].toUpperCase()+turn.slice(1)} chooses a column.`; }
  function cpu() { const opts=available(), difficulty=$("difficulty").value; let column; if (difficulty==="easy") column=opts[Math.floor(Math.random()*opts.length)]; else { const winNow=opts.find((x)=>evaluate(x,"yellow")>=100); const block=opts.find((x)=>{const b=[...board];drop(x,"red",b);return win(b)?.mark==="red";}); column=winNow??block??(difficulty==="hard"?[...opts].sort((a,b)=>evaluate(b,"yellow")-evaluate(a,"yellow"))[0]:opts[Math.floor(Math.random()*opts.length)]); } play(column); }
  function render(winning=[]) { cells.forEach((cell,i)=>{ cell.className=board[i]||""; cell.disabled=over||!!board[i]; if (i===lastDrop) { cell.classList.add("drop"); cell.addEventListener("animationend",()=>cell.classList.remove("drop"),{once:true}); } if (winning.includes(i)) cell.classList.add("win"); }); lastDrop=-1; $("turn").textContent=over?"—":turn[0].toUpperCase()+turn.slice(1); const s=stats(); $("stats").innerHTML=`Local record<br><strong>${s.wins||0} wins · ${s.losses||0} losses · ${s.draws||0} draws</strong>`; }
  function reset() { board=Array(42).fill(""); turn="red"; over=false; lastDrop=-1; $("result").textContent="In play"; $("message").textContent="Red goes first. Choose a column."; $("difficulty").hidden=$("mode").value!=="cpu"; render(); }
  for (let i=0;i<42;i++) { const button=document.createElement("button"); button.type="button"; button.dataset.column=i%7; button.setAttribute("aria-label",`Column ${i%7+1}, row ${Math.floor(i/7)+1}`); button.onclick=()=>play(i%7); $("board").append(button); cells.push(button); }
  $("new").onclick=reset; $("mode").onchange=reset; reset();
})();
