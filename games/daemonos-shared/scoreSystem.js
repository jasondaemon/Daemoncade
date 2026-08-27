export function getBoardIdForGame(gameId, mode="classic", difficulty="normal"){return`${gameId}:${mode}:${difficulty}`}
export async function submitFinalScore({board,score,runMs,meta}={}){const game=String(board||"game").split(":")[0];return window.GameScores?.record({game,mode:"solo",difficulty:String(board||"").split(":").slice(1).join("-")||"default",value:Number(score)||0,meta:{runMs, ...(meta||{})}})||{accepted:true}}
export function createScoreOverlay(){return{overlay:null,show(){},hide(){},refresh(){return Promise.resolve()}}}
export function getActivePlayerName(){return"Player"}
