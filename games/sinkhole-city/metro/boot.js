// This small classic script remains independent of the game's module graph.
// A failed import must not strand an installed app on a disabled Loading button.
(() => {
 const module=document.getElementById('game-module'),button=document.getElementById('title-play'),status=document.getElementById('title-loading');
 const retry=()=>{status.hidden=false;status.textContent='The game could not load. Check your connection and retry.';button.textContent='Retry loading';button.disabled=false;button.onclick=()=>location.reload();};
 const timer=setTimeout(retry,15000);
 module.addEventListener('load',()=>clearTimeout(timer),{once:true});
 module.addEventListener('error',()=>{clearTimeout(timer);retry();},{once:true});
})();
