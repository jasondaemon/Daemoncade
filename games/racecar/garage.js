import { COLLECTIBLES } from './collectibles.js?v=39';
export const CARS = [
  {id:'metro',name:'Metro',model:'NormalCar1',class:'Street',unlock:0,requirement:'Starter car',speed:1,accel:1,grip:1.08,brake:1.05,boost:1},
  {id:'touring',name:'Touring',model:'NormalCar2',class:'Street',unlock:1,requirement:'Clear 1 route',speed:1.03,accel:0.98,grip:1.02,brake:1.08,boost:1},
  {id:'roamer',name:'Roamer',model:'SUV',class:'Utility',unlock:2,requirement:'Clear 2 routes',speed:0.97,accel:0.94,grip:1.16,brake:1.12,boost:0.95},
  {id:'taxi',name:'Night Cab',model:'Taxi',class:'Special',stars:9,requirement:'Earn 9 career stars',speed:1.02,accel:1.12,grip:1.06,brake:1,boost:0.96},
  {id:'sport',name:'Sprint',model:'SportsCar',class:'Sport',unlock:3,requirement:'Clear 3 routes',speed:1.08,accel:1.12,grip:0.95,brake:1.05,boost:1.05},
  {id:'interceptor',name:'Interceptor',model:'Cop',class:'Special',stars:18,requirement:'Earn 18 career stars',speed:1.07,accel:1.08,grip:0.98,brake:1.1,boost:1.12},
  {id:'apex',name:'Apex',model:'SportsCar2',class:'Sport',unlock:6,requirement:'Complete all 6 routes in either mode',speed:1.12,accel:1.08,grip:0.91,brake:1,boost:1.15},
...COLLECTIBLES,
{id:'manta',name:'Manta',model:'Manta',procedural:true,hover:true,class:'Hover racer',unlock:99,price:240000,tier:4,careerSpeed:1.55,careerAccel:.52,speed:1.55,accel:.52,grip:1.35,brake:1.3,boost:1.25,color:0xef279f},
{id:'ufo',name:'Visitor',model:'Visitor',procedural:true,hover:true,perfectGrip:true,unlimitedNitro:true,class:'Extraterrestrial',unlock:99,price:2500000,tier:4,careerSpeed:1.95,careerAccel:.85,speed:1.95,accel:.85,grip:3,brake:1.8,boost:1.6,color:0xa9cbd1}];
export function career(progress) {
  // Take the best result per mode/route: changing difficulty cannot farm stars.
  const best = new Map();
  for (const [key,result] of Object.entries(progress.results||{})) {
    const [mode,,stage]=key.split(':');
    if (!['highway','race'].includes(mode) || !/^[0-5]$/.test(stage)) continue;
    const id=mode+':'+stage;
    best.set(id,Math.max(best.get(id)||0,Math.min(3,Math.max(0,Number(result.stars)||0))));
  }
  const routes=Math.max(0,...Object.values(progress.cursors||{}).map(n=>Number(n)||0),
    ...[...best.entries()].filter(([,stars])=>stars>0).map(([key])=>Number(key.split(':')[1])+1));
  return {routes,stars:[...best.values()].reduce((a,b)=>a+b,0)};
}
export function availableCars(progress) {
  const earned=career(progress);
  return CARS.filter(c=>progress.unlockedCars?.includes(c.id) || (c.stars!==undefined ? earned.stars>=c.stars : earned.routes>=c.unlock));
}
export function selectedCar(progress) {
  return availableCars(progress).find(c=>c.id===progress.car)||CARS[0];
}
