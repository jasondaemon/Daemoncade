function showLoadFailure(){
  const loading=document.getElementById("loading"),status=document.getElementById("loading-status"),retry=document.getElementById("retry-load"),low=document.getElementById("retry-low");
  if(!loading||!status||!retry||!low)return;
  loading.setAttribute("role","alertdialog");loading.setAttribute("aria-modal","true");loading.setAttribute("aria-labelledby","loading-status");
  for(const sibling of loading.parentElement.children)if(sibling!==loading)sibling.inert=true;
  status.textContent="Graphics could not start. Check WebGL support, then retry.";
  retry.hidden=false;
  retry.onclick=()=>location.reload();
  low.hidden=false;
  low.onclick=()=>{try{localStorage.setItem("apex-run:quality:v1","low")}catch{}location.reload()};
  retry.focus();
}
addEventListener("error",showLoadFailure,true);
addEventListener("unhandledrejection",showLoadFailure);
