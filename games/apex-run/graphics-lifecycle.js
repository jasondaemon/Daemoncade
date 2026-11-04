export function installGraphicsLifecycle({window,renderer}){
  if(!window?.addEventListener||!renderer)throw new TypeError("window and renderer are required");
  let disposed=false;
  const release=event=>{
    if(event?.persisted||disposed)return false;
    disposed=true;
    renderer.setAnimationLoop?.(null);
    renderer.renderLists?.dispose?.();
    renderer.dispose?.();
    renderer.forceContextLoss?.();
    return true;
  };
  window.addEventListener("pagehide",release);
  return {release,get disposed(){return disposed}};
}
