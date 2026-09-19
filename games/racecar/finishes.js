import { COLLECTIBLES } from './collectibles.js?v=39';
// Only named paint slots change; rubber, glass, chrome and lamps keep their roles.
export const FINISHES = {
  metro: {color:0x00bfff, name:'Electric blue'},
  touring: {color:0x8844ff, name:'Ultraviolet'},
  roamer: {color:0x8bdd19, name:'Acid green'},
  taxi: {color:0xffc400, name:'Signal gold'},
  sport: {color:0xff3c12, name:'Lava orange'},
  interceptor: {color:0xe8f4ff, name:'Ice pearl'},
  apex: {color:0xff1876, name:'Hot magenta'},
  manta: {color:0xef279f,name:'Nebula pink'},
  ufo: {color:0xa9cbd1,name:'Starlight silver'},
};
for(const car of COLLECTIBLES)FINISHES[car.id]={color:car.color,name:'Factory finish'};
export function isPaintSlot(name) {
  return /^(Blue|LightBlue|White|Orange|DarkOrange|Yellow)$/.test(name);
}
