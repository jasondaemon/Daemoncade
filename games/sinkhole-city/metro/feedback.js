// Fixed pool: collection streaks never grow the DOM or create particle canvases.
export class PickupFeedback{
 constructor(host){this.items=Array.from({length:8},()=>{const element=document.createElement('span');element.hidden=true;host.append(element);return {element,until:0};});}
 clear(){for(const item of this.items){item.until=0;item.element.hidden=true;}}
 add(object,points,time,low){
  if(low)return;
  const item=this.items.find(i=>i.until<=time)||this.items.reduce((a,b)=>a.until<b.until?a:b);
  item.x=object.body?.x??object.x;item.z=object.body?.z??object.z;item.until=time+.85;
  item.element.textContent=`+${points}`;
 }
 render(renderer,time,reduced){for(const item of this.items){
  if(item.until<=time){item.element.hidden=true;continue;}
  const p=renderer.screenPosition(item);item.element.hidden=!p.visible;
  item.element.style.left=p.x+'%';item.element.style.top=p.y+'%';
  item.element.style.transform=`translate(-50%,${reduced?-28:-28-(.85-item.until+time)*28}px)`;
  item.element.style.opacity=String(Math.min(1,(item.until-time)*3));
 }}
}
