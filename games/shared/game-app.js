/* Hosting controls only: the game inside the frame stays portable. */
(() => {
  'use strict';
  const frame=document.querySelector('#app-game'),guide=document.querySelector('#app-guide');
  const standalone=matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  const racecar=location.pathname.split('/').includes('racecar');
  const size=()=>document.documentElement.style.setProperty('--app-height',`${visualViewport?.height || innerHeight}px`);
  size();addEventListener('resize',size);visualViewport?.addEventListener('resize',size);
  document.querySelector('#app-help').onclick=()=>guide.showModal();
  document.querySelector('#guide-close').onclick=()=>{guide.close();frame.focus();};
  if(standalone) document.querySelector('#install-help').textContent='You’re playing from the Home Screen. Use Arcade to return to the game collection, or your phone’s app switcher to leave.';
  document.querySelector('#racecar-transfer').hidden=!racecar;
  document.querySelector('#other-transfer').hidden=racecar;
  if(new URLSearchParams(location.search).has('install')&&!standalone)guide.showModal();
  document.querySelector('#app-backup').onclick=()=>{
    const status=document.querySelector('#backup-status');
    try {
      const raw=localStorage.getItem('racecar_careers_v1');
      if(!raw)throw new Error('No saved careers in this browser yet. If you played in another browser, export from that browser first.');
      const data=JSON.parse(raw);
      if(!data?.profiles || typeof data.profiles!=='object' || Array.isArray(data.profiles))throw new Error('Could not read your careers. Use the game’s Export careers control instead.');
      const blob=new Blob([JSON.stringify({...data,format:'racecar-careers',version:1},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='racecar-careers.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
      status.textContent='Backup download requested. Keep the JSON file in Files, then restore it from the installed game’s start-screen Settings.';
    }catch(error){status.textContent=error.message;}
  };
  const fullscreen=document.querySelector('#app-fullscreen');
  fullscreen.hidden=!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const toggleFullscreen=async()=>{
    try{
      if(document.fullscreenElement || document.webkitFullscreenElement)await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else await (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
    }catch{/* Browser permission/support varies; do not claim fullscreen succeeded. */}
  };
  fullscreen.onclick=toggleFullscreen;
  const sync=()=>fullscreen.textContent=(document.fullscreenElement || document.webkitFullscreenElement)?'Exit fullscreen':'Fullscreen';
  document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
  addEventListener('message',event=>{
    if(event.origin===location.origin && event.source===frame.contentWindow && event.data?.type==='daemoncade:request-fullscreen')toggleFullscreen();
  });
})();
