import { CARS } from './garage.js?v=39';
import { FINISHES } from './finishes.js?v=39';
import { CIRCUITS, PRICES, UNLOCKS, UPGRADES, buyCar, upgrade, upgradeCost, admit, tunedCar, performanceCurve, carPotential, series, carPrice, carAvailable } from './career.js?v=39';
import { careerTrack } from './career-tracks.js?v=39';
const $=id=>document.getElementById(id);
const money=n=>'$'+n.toLocaleString();
let inspecting=null;
let carPage=0;
let generation=0;
const thumbnails=new Map();
let previews=[],lastPreview=0,previewAngle=0;
export function animateGarage(view,now,dt) {
  if(view.reduced||document.hidden)return;
  previewAngle=(previewAngle+dt*.22)%(Math.PI*2);
  if(now-lastPreview<1000/30)return;
  lastPreview=now;
  for(const p of previews)if(p.canvas.getClientRects().length)view.previewCar(p.canvas,p.id,p.paint,p.locked,previewAngle);
}
function button(text,action,disabled=false) {
  const b=document.createElement('button');b.type='button';b.textContent=text;b.disabled=disabled;b.onclick=action;return b;
}
function graph(p,id,part=null) {
  const canvas=$('performance-curve'),ctx=canvas.getContext('2d');
  const current=tunedCar(p,id),next=part?tunedCar(p,id,part):null;
  const maxSpeed=Math.max(250,Math.ceil(66*Math.max(current.speed,next?.speed||0)*3.6/50)*50);
  ctx.clearRect(0,0,480,250);ctx.font='12px sans-serif';ctx.fillStyle='#aec4d6';
  ctx.fillText('SPEED / TIME · full throttle, no nitrous',12,16);
  ctx.strokeStyle='#334858';ctx.beginPath();ctx.moveTo(36,30);ctx.lineTo(36,140);ctx.lineTo(465,140);ctx.stroke();
  ctx.fillText('0',18,143);ctx.fillText('12 seconds',390,160);ctx.fillText(maxSpeed+' km/h',38,32);
  for(const [car,color] of [[current,'#67deff'],[next,'#ffcf64']]) {
    if(!car)continue;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();
    performanceCurve(car).forEach(({t,speed},i)=>ctx[i?'lineTo':'moveTo'](36+t/12*425,140-speed/maxSpeed*105));ctx.stroke();
  }
  ctx.fillStyle='#aec4d6';ctx.fillText('ACCELERATION · m/s²',12,180);
  ctx.strokeStyle='#334858';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(36,190);ctx.lineTo(36,230);ctx.lineTo(465,230);ctx.stroke();
  ctx.fillText('0',18,232);ctx.fillText('12 seconds',390,246);
  for(const [car,color] of [[current,'#67deff'],[next,'#ffcf64']]) {
    if(!car)continue;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();
    performanceCurve(car).forEach(({t,speed},i)=>{const acceleration=speed<66*car.speed*3.6?24*car.accel:0;ctx[i?'lineTo':'moveTo'](36+t/12*425,230-acceleration/14*35);});ctx.stroke();
  }
  const zeroTo100=(100/3.6/(24*current.accel)).toFixed(2);
  $('curve-caption').textContent=`0–100 km/h: ${zeroTo100}s · Top speed: ${Math.round(66*current.speed*3.6)} km/h. Blue: installed${next?' · Gold: proposed upgrade':''}. Straight-line estimates; corners and traction affect race pace.`;
  if(part&&['tires','brakes','nitrous'].includes(part)) {
    const stat=UPGRADES[part].stat;
    $('curve-caption').textContent+=` ${UPGRADES[part].name}: ${part==='nitrous'?`${Math.round(18*next.boost*3.6)} km/h additional boost`:`${Math.round((next[stat]/current[stat]-1)*100)}% improvement`}. These do not change the unboosted straight-line curve.`;
  }
}
function purchaseGraph(p,id) {
  const {stock,full}=carPotential(p,id),current=tunedCar(p,p.car),canvas=$('purchase-curve'),ctx=canvas.getContext('2d');
  const seconds=Math.ceil(Math.max(...[stock,full,current].map(c=>66*c.speed/(24*c.accel))))+2;
  const max=Math.ceil(Math.max(full.speed,current.speed)*66*3.6/50)*50;
  ctx.clearRect(0,0,480,160);ctx.font='12px sans-serif';ctx.fillStyle='#c8dae4';
  ctx.fillText('SPEED · full throttle, no nitrous',12,17);
  ctx.strokeStyle='#304c60';ctx.lineWidth=1;ctx.setLineDash([]);
  for(let i=0;i<=2;i++){const y=127-i*44;ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(462,y);ctx.stroke();ctx.fillText(String(Math.round(i*max/2)),5,y+4);}
  ctx.fillText('km/h',4,30);ctx.fillText('0',40,145);ctx.fillText(seconds+' sec',418,145);
  for(const [car,color,dash] of [[stock,'#67deff',[]],[full,'#ffcf64',[7,5]],[current,'#ed9eff',[2,4]]]) {
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.setLineDash(dash);ctx.beginPath();
    for(let i=0;i<=200;i++){const t=i/200*seconds,v=Math.min(66*car.speed,24*car.accel*t)*3.6;ctx[i?'lineTo':'moveTo'](40+i/200*422,127-v/max*88);}ctx.stroke();
  }
  ctx.setLineDash([]);
  const spec=c=>`${Math.round(66*c.speed*3.6)} km/h · 0–100 ${(100/3.6/(24*c.accel)).toFixed(2)}s`;
  $('purchase-specs').replaceChildren();
  for(const [label,car] of [['Stock —',stock],['Max upgrades ╌',full],[`Current ··· ${current.name}:`,current]]) {const line=document.createElement('span');line.textContent=`${label} ${spec(car)}`;$('purchase-specs').append(line);}
  canvas.setAttribute('aria-label',`${stock.name}: stock, solid line: ${spec(stock)}. Fully upgraded, dashed line: ${spec(full)}. Current ${current.name}, dotted line: ${spec(current)}. Full throttle without nitrous.`);
}
export function renderCareerGarage(p,view,changed) {
  const token=++generation;
  previews=[];view?.clearPreviews();
  $('garage-current').textContent=CARS.find(c=>c.id===p.car).name;
  $('career-status').textContent=`${money(p.wallet)} · ${p.owned.length} / ${CARS.length} owned · ${p.races} races`;
  $('circuit-list').replaceChildren();
  const map=$('career-map'),ctx=map.getContext('2d');
  const sea=ctx.createLinearGradient(0,0,480,260);sea.addColorStop(0,'#14384b');sea.addColorStop(1,'#082030');ctx.fillStyle=sea;ctx.fillRect(0,0,480,260);
  ctx.fillStyle='#355447';ctx.beginPath();ctx.moveTo(0,65);ctx.bezierCurveTo(100,15,200,95,270,40);ctx.bezierCurveTo(370,0,450,25,480,50);ctx.lineTo(480,260);ctx.lineTo(0,260);ctx.fill();
  ctx.strokeStyle='#769981';ctx.lineWidth=2;ctx.stroke();
  const locations=[[55,190],[150,125],[245,180],[325,75],[425,110]];
  ctx.strokeStyle='#d4c399';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();locations.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.stroke();ctx.setLineDash([]);
  locations.forEach(([x,y],i)=>{ctx.fillStyle=p.admitted.includes(i)?'#ffd578':'#557082';ctx.beginPath();ctx.arc(x,y,p.circuit===i?15:10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#eef6fa';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(CIRCUITS[i].name,x,y+30);});ctx.textAlign='left';
  $('map-nodes').replaceChildren();
  CIRCUITS.forEach((c,i)=>{
    const owned=p.admitted.includes(i);
    const b=button('',()=>{p.circuit=i;changed();},!owned);
    b.dataset.circuit=i;
    b.setAttribute('aria-label',c.name+(owned?'':' · Locked'));
    b.setAttribute('aria-pressed',String(p.circuit===i));
    b.title=c.name+(owned?' · Select circuit':' · Locked');
    $('map-nodes').append(b);
  });
  const next=CIRCUITS.findIndex((_,i)=>!p.admitted.includes(i));
  if(next>=0) {
    const c=CIRCUITS[next],qualified=p.podiums.includes(next-1);
    const b=button(`ENTER ${c.name.toUpperCase()} · ${money(c.price)}`,()=>{if(admit(p,next))changed();},!qualified||p.wallet<c.price);
    b.id='buy-circuit';
    const detail=document.createElement('small');detail.textContent=!qualified?`Earn a championship podium in ${CIRCUITS[next-1].name} to qualify.`:p.wallet<c.price?`${money(c.price-p.wallet)} more needed · Permanent circuit access`:'Qualified · Permanent circuit access';
    $('circuit-list').append(b,detail);
  } else $('circuit-list').textContent='All circuits open · Select any circuit on the map.';
  $('track-list').replaceChildren();
  $('series-standings').textContent=series(p).points.map((points,i)=>`${['You','Kai','Mara','Sol'][i]} ${points}`).join(' · ');
  $('circuit-advice').textContent=`Recommended top speed: ${[170,200,240,280,320][p.circuit]}+ km/h · ${p.difficulty} career · Earn a championship podium to qualify for the next circuit.`;
  CIRCUITS[p.circuit].tracks.forEach((name,round)=>{
    const item=document.createElement('div'),canvas=document.createElement('canvas');canvas.width=110;canvas.height=75;
    const track=careerTrack(p.circuit,round);item.title=track.character;
    const g=canvas.getContext('2d'),points=track.circuit;
    const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x0=Math.min(...xs),y0=Math.min(...ys),scale=Math.min(90/(Math.max(...xs)-x0),55/(Math.max(...ys)-y0));
    const offsetX=(110-(Math.max(...xs)-x0)*scale)/2,offsetY=(75-(Math.max(...ys)-y0)*scale)/2;
    g.strokeStyle=round===series(p).round?'#ffdb78':'#88adb9';g.lineWidth=3;g.beginPath();points.forEach((p,i)=>g[i?'lineTo':'moveTo'](offsetX+(p.x-x0)*scale,offsetY+(p.y-y0)*scale));g.stroke();
    const label=document.createElement('small');label.textContent=`${round+1}. ${name}`;
    const character=document.createElement('small');character.className='track-character';character.textContent=track.character;
    item.classList.toggle('current',round===series(p).round);item.append(canvas,label,character);$('track-list').append(item);
  });
  $('car-list').replaceChildren();
  $('car-pages').replaceChildren();
  const pageCount=Math.ceil(CARS.length/4);
  const pageLabel=document.createElement('span');pageLabel.textContent=`${carPage+1} / ${pageCount}`;
  $('car-pages').append(button('←',()=>{carPage--;renderCareerGarage(p,view,changed);},carPage===0),pageLabel,button('→',()=>{carPage++;renderCareerGarage(p,view,changed);},carPage===pageCount-1));
  $('car-pages').firstChild.setAttribute('aria-label','Previous cars');$('car-pages').lastChild.setAttribute('aria-label','Next cars');
  for(const car of CARS.slice(carPage*4,carPage*4+4)) {
    const owned=p.owned.includes(car.id);
    const b=button(car.name+(owned?'':` · ${money(carPrice(p,car.id))}`),()=>{inspecting=car.id;show(car);});
    b.dataset.car=car.id;b.setAttribute('aria-pressed',String((inspecting||p.car)===car.id));
    const thumb=document.createElement('canvas');thumb.width=160;thumb.height=80;thumb.setAttribute('aria-hidden','true');b.prepend(thumb);$('car-list').append(b);
    const locked=!carAvailable(p,car.id),cacheKey=car.id+':'+(p.paint[car.id]||'')+':'+locked;
    previews.push({canvas:thumb,id:car.id,paint:p.paint[car.id],locked});
    const paintThumb=()=>{
      if(token!==generation||!view)return;
      if(thumbnails.has(cacheKey))thumb.getContext('2d').putImageData(thumbnails.get(cacheKey),0,0);
      else {view?.previewCar(thumb,car.id,p.paint[car.id],locked);if(thumbnails.size>=80)thumbnails.delete(thumbnails.keys().next().value);thumbnails.set(cacheKey,thumb.getContext('2d').getImageData(0,0,160,80));}
    };
    setTimeout(paintThumb,0);
  }
  function show(car) {
    purchaseGraph(p,car.id);
    const owned=p.owned.includes(car.id),available=carAvailable(p,car.id);
    $('car-stats').textContent=`${car.name} · ${car.class}${!available?' · Available in '+CIRCUITS[UNLOCKS[car.id]].name:''}`;
    if(car.id==='ufo')$('car-stats').textContent+=' · Perfect grip · Unlimited nitro · Unranked';
    view?.previewCar($('garage-preview'),car.id,p.paint[car.id],!available);
    previews=previews.filter(p=>p.canvas!==$('garage-preview'));
    previews.push({canvas:$('garage-preview'),id:car.id,paint:p.paint[car.id],locked:!available});
    $('garage-preview').setAttribute('aria-label',`${car.name}${available?'':' · Locked, grayscale preview'}`);
    $('car-list').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.car===car.id)));
    $('purchase-note').textContent=owned?(car.class==='Collection'?'Collector vehicle · A side-grade, not a competitive advantage.':'Owned · Paint is always free.'):
      !available?`Unlock ${CIRCUITS[UNLOCKS[car.id]].name} to purchase. Preview available now.`:
      p.wallet<carPrice(p,car.id)?`${money(carPrice(p,car.id)-p.wallet)} more needed. Race to earn cash.`:'Available to purchase.';
    $('car-actions').replaceChildren(button(owned?(p.car===car.id?'SELECTED':'SELECT CAR'):`BUY · ${money(carPrice(p,car.id))}`,()=>{
      if(owned)p.car=car.id;else if(!buyCar(p,car.id))return;changed();
    },owned?p.car===car.id:!available||p.wallet<carPrice(p,car.id)));
    const paint=$('car-paint');paint.replaceChildren();
    const factory='#'+FINISHES[car.id].color.toString(16).padStart(6,'0');
    for(const [name,color] of [['Factory',factory],['Red','#ff3048'],['Orange','#ff8b24'],['Yellow','#ffdc45'],['Green','#54d865'],['Blue','#168fff'],['Purple','#a45cff'],['White','#edf3f7'],['Black','#202832']]) {
      const swatch=button('',()=>{p.paint[car.id]=color;changed();},!owned);
      swatch.dataset.paint=name.toLowerCase();swatch.title=name;
      swatch.setAttribute('aria-label',name+' paint');swatch.setAttribute('aria-pressed',String((p.paint[car.id]||factory).toLowerCase()===color.toLowerCase()));
      const chip=document.createElement('canvas');chip.width=32;chip.height=32;chip.setAttribute('aria-hidden','true');const g=chip.getContext('2d');g.fillStyle=color;g.fillRect(0,0,32,32);swatch.append(chip);paint.append(swatch);
    }
    $('upgrade-list').replaceChildren();
    for(const [kind,u] of Object.entries(UPGRADES)) {
      const level=p.parts[car.id]?.[kind]||0,cost=upgradeCost(p,car.id,kind);
      const row=document.createElement('div');
      const builtIn=car.id==='ufo'&&['tires','nitrous'].includes(kind);
      const preview=button(builtIn?`${u.name} · BUILT IN`:`${u.name} · ${level}/3`,()=>graph(p,car.id,kind));
      const buy=button(cost===null?'MAX':money(cost),()=>{if(upgrade(p,car.id,kind))changed();},!owned||cost===null||p.wallet<cost);
      buy.setAttribute('aria-label',`Upgrade ${u.name}${cost===null?' maximum level':` for ${money(cost)}`}`);
      row.append(preview,buy);$('upgrade-list').append(row);
    }
    graph(p,car.id);
  }
  show(CARS.find(c=>c.id===inspecting)||CARS.find(c=>c.id===p.car));
}
