function showLoadFailure(){
  const status=document.getElementById("loading-status"),retry=document.getElementById("retry-load"),low=document.getElementById("retry-low");
  if(!status||!retry||!low)return;
  status.textContent="Graphics could not start. Check WebGL support, then retry.";
  retry.hidden=false;
  retry.onclick=()=>location.reload();
  low.hidden=false;
  low.onclick=()=>{try{localStorage.setItem("apex-run:quality:v1","low")}catch{}location.reload()};
}
addEventListener("error",showLoadFailure,true);
addEventListener("unhandledrejection",showLoadFailure);
