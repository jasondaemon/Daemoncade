import { CARS } from './garage.js?v=39';

export const CAREER_KEY = 'racecar_careers_v1'; // Never overwrite racecar_progress_v2.
export const CIRCUITS = [
  {id:'beach',name:'Sunshore',price:0,pace:0.68,prize:1400,tracks:['Boardwalk','Palm Loop','Marina Sprint','Sunshore GP']},
  {id:'desert',name:'Red Sands',price:9000,pace:0.79,prize:2300,tracks:['Dry Creek','Mesa Loop','Canyon Run','Red Sands GP']},
  {id:'coast',name:'Pacific Coast',price:22000,pace:0.91,prize:3600,tracks:['Headland','Lighthouse','Ocean Drive','Pacific GP']},
  {id:'mountain',name:'Alpine Pass',price:45000,pace:1.05,prize:5200,tracks:['Pine Valley','Switchback','Summit Run','Alpine GP']},
  {id:'city',name:'Midnight City',price:80000,pace:1.18,prize:7500,tracks:['Warehouse Mile','River Lights','Uptown','Midnight GP']},
];
export const PRICES={metro:0,touring:7500,roamer:9500,taxi:12000,sport:21000,interceptor:34000,apex:62000};
export const UNLOCKS={metro:0,touring:0,roamer:0,taxi:1,sport:1,interceptor:2,apex:3};
for(const car of CARS) if(car.source||car.procedural) {PRICES[car.id]=car.price;UNLOCKS[car.id]=car.tier;}
export const carPrice=(p,id)=>id==='ufo'&&p.ufoDiscount?1:PRICES[id];
export const carAvailable=(p,id)=>id==='ufo'&&p.ufoDiscount||p.admitted.includes(UNLOCKS[id]);
export const UPGRADES={
  engine:{name:'Engine',base:700,step:0.035,stat:'speed'},
  transmission:{name:'Transmission',base:500,step:0.08,stat:'accel'},
  tires:{name:'Tires',base:600,step:0.055,stat:'grip'},
  brakes:{name:'Brakes',base:350,step:0.07,stat:'brake'},
  nitrous:{name:'Nitrous',base:900,step:0.12,stat:'boost'},
};
const integer=(v,max=1e9)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
export function newCareer(difficulty) {
  return {difficulty,wallet:0,car:'metro',owned:['metro'],parts:{},paint:{},admitted:[0],circuit:0,
    podiums:[],series:{},races:0,earned:0,settled:[]};
}
export function restoreCareers(raw={}) {
  const data={active:['easy','normal','hard'].includes(raw?.active)?raw.active:'normal',profiles:{}};
  for(const difficulty of ['easy','normal','hard']) {
    const old=raw?.profiles?.[difficulty];
    if(!old || typeof old!=='object') continue;
    const p=newCareer(difficulty);
    if(old.ufoDiscount===true)p.ufoDiscount=true;
    p.wallet=integer(old.wallet);p.races=integer(old.races);p.earned=integer(old.earned);
    p.owned=[...new Set(['metro',...(Array.isArray(old.owned)?old.owned:[]).filter(id=>CARS.some(c=>c.id===id))])];
    p.car=p.owned.includes(old.car)?old.car:'metro';
    p.admitted=[0];
    const admitted=Array.isArray(old.admitted)?old.admitted:[];
    for(let i=1;i<CIRCUITS.length;i++) if(admitted.includes(i)&&p.admitted.includes(i-1))p.admitted.push(i);
    p.circuit=p.admitted.includes(old.circuit)?old.circuit:0;
    p.podiums=(Array.isArray(old.podiums)?old.podiums:[]).filter(i=>p.admitted.includes(i));
    p.settled=Array.isArray(old.settled)?old.settled.filter(id=>typeof id==='string').slice(-100):[];
    for(const id of p.owned) {
      p.parts[id]=Object.fromEntries(Object.keys(UPGRADES).map(k=>[k,integer(old.parts?.[id]?.[k],3)]));
      if(/^#[0-9a-f]{6}$/i.test(old.paint?.[id]))p.paint[id]=old.paint[id];
    }
    for(const i of p.admitted) {
      const s=old.series?.[i];
      if(s && Array.isArray(s.points)&&s.points.length===4)
        p.series[i]={round:integer(s.round,3),points:s.points.map(n=>integer(n,40))};
    }
    data.profiles[difficulty]=p;
  }
  return data;
}
export function profile(data) {return data.profiles[data.active]??=newCareer(data.active);}
export function series(p) {return p.series[p.circuit]??={round:0,points:[0,0,0,0]};}
export function upgradeCost(p,id,kind) {
  if(id==='ufo'&&['tires','nitrous'].includes(kind))return null;
  const level=p.parts[id]?.[kind]||0;
  return !Object.hasOwn(UPGRADES,kind)||level>=3?null:UPGRADES[kind].base*(level+1)**2;
}
export function buyCar(p,id) {
  if(!CARS.some(c=>c.id===id)||p.owned.includes(id)||!carAvailable(p,id)||p.wallet<carPrice(p,id))return false;
  p.wallet-=carPrice(p,id);p.owned.push(id);p.car=id;return true;
}
export function upgrade(p,id,kind) {
  const cost=upgradeCost(p,id,kind);
  if(!p.owned.includes(id)||cost===null||p.wallet<cost)return false;
  p.wallet-=cost;p.parts[id]??={};p.parts[id][kind]=(p.parts[id][kind]||0)+1;return true;
}
export function admit(p,index) {
  const c=CIRCUITS[index];
  if(!Number.isInteger(index)||!c||p.admitted.includes(index)||
    !Array.from({length:index},(_,i)=>i).every(i=>p.admitted.includes(i))||
    !p.podiums.includes(index-1)||p.wallet<c.price)return false;
  p.wallet-=c.price;p.admitted.push(index);p.circuit=index;return true;
}
export function tunedCar(p,id=p.car,previewPart=null) {
  const car={...(CARS.find(c=>c.id===id)||CARS[0])};
  const specs={metro:[.72,.18],touring:[.81,.21],roamer:[.76,.19],taxi:[.79,.20],sport:[1.02,.29],interceptor:[1.09,.31],apex:[1.25,.39]};
  [car.speed,car.accel]=specs[car.id]||[car.careerSpeed,car.careerAccel];
  for(const [k,u] of Object.entries(UPGRADES)){
    if(car.id==='ufo'&&['tires','nitrous'].includes(k))continue;
    car[u.stat]*=1+u.step*Math.min(3,(p.parts[id]?.[k]||0)+(previewPart===k?1:0));
  }
  car.paint=p.paint[id];car.boost=(car.unlimitedNitro||p.parts[id]?.nitrous||previewPart==='nitrous')?car.boost:0;
  return car;
}
// Opponents use real career vehicle performance, never the player's selected car.
export function configureCareerRivals(run,p) {
  const grids=[['metro','touring','roamer'],['touring','sport','taxi'],['sport','sport','interceptor'],['interceptor','apex','sport'],['apex','formula','future']];
  const level=[0,0,1,2,3][p.circuit];
  run.rivals.forEach((r,i)=>{
    r.carId=grids[p.circuit][i];r.name=['KAI','MARA','SOL'][i];
    r.performance=tunedCar({...p,parts:{[r.carId]:{engine:level,transmission:level,tires:level,brakes:level}}},r.carId);
    r.racePace=({easy:.9,normal:1,hard:1.07})[p.difficulty];
    r.cornerPace=[.74,.82,.91,.94,.97][p.circuit];
  });
}
// Same straight-line acceleration and speed cap as Run.update (without boost).
export function performanceCurve(car) {
  return Array.from({length:121},(_,i)=>({t:i/10,speed:Math.min(66*car.speed,24*car.accel*i/10)*3.6}));
}
export function carPotential(p,id) {
  // Preview profiles never share the saved upgrade map.
  const stock=tunedCar({...p,parts:{}},id);
  const full=tunedCar({...p,parts:{[id]:Object.fromEntries(Object.keys(UPGRADES).map(k=>[k,3]))}},id);
  return {stock,full};
}
export function settle(p,run) {
  if(!run.careerId||p.settled.includes(run.careerId))return null;
  p.settled.push(run.careerId);p.settled=p.settled.slice(-100);
  const finished=run.phase==='finished',c=CIRCUITS[p.circuit];
  const place=finished?Math.max(1,Math.min(4,run.position)):4;
  const placement=finished?Math.round([0,1200,850,600,250][place]*(1+p.circuit*0.65)):0;
  const clean=finished&&run.collisions===0?Math.round(placement*0.15):0;
  const pickups=integer(run.cashCollected,600);
  let championship=0,championshipPlace=null;
  if(finished) {
    const s=series(p),standing=run.standings();
    standing.forEach((actor,i)=>{const slot=actor===run.player?0:run.rivals.indexOf(actor)+1;if(slot>=0)s.points[slot]+=[10,6,4,2][i];});
    if(s.round===3) {
      championshipPlace=1+s.points.slice(1).filter(points=>points>s.points[0]).length;
      if(championshipPlace<=3) {
        if(!p.podiums.includes(p.circuit))p.podiums.push(p.circuit);
        championship=Math.round(c.prize*[1,.7,.5][championshipPlace-1]);
      }
      p.series[p.circuit]={round:0,points:[0,0,0,0]};
    } else s.round++;
  }
  const total=placement+clean+pickups+championship;
  p.wallet+=total;p.earned+=total;p.races++;
  return {placement,clean,pickups,championship,championshipPlace,total};
}
