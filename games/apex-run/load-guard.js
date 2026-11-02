function showLoadFailure(){
  const status=document.getElementById("loading-status"),retry=document.getElementById("retry-load");
  if(!status||!retry)return;
  status.textContent="Graphics could not start. Check WebGL support, then retry.";
  retry.hidden=false;
  retry.onclick=()=>location.reload();
}
addEventListener("error",showLoadFailure);
addEventListener("unhandledrejection",showLoadFailure);
