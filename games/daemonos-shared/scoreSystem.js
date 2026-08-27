export function getBoardIdForGame(gameId, mode="classic", difficulty="normal"){return`${gameId}:${mode}:${difficulty}`}
export async function submitFinalScore({board,score,runMs,meta}={}){const game=String(board||"game").split(":")[0];return window.GameScores?.record({game,mode:"solo",difficulty:String(board||"").split(":").slice(1).join("-")||"default",value:Number(score)||0,meta:{runMs, ...(meta||{})}})||{accepted:true}}
export async function fetchHighScores({board,limit=5}={}){const game=String(board||"game").split(":")[0];const entries=(window.GameScores?.game(game)?.recent||[]).filter(entry=>entry.metric==="score").sort((a,b)=>b.value-a.value).slice(0,Math.max(1,Number(limit)||5)).map((entry,index)=>({rank:index+1,name:"Player",score:entry.value}));return{entries}}
export function createScoreOverlay(){return{overlay:null,show(){},hide(){},refresh(){return Promise.resolve()}}}
export function getActivePlayerName(){return"Player"}
