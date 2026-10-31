// Simulation and visible lamps share this clock; amber stops new entries.
export function signalState(time,axis='x'){
 const t=((time%16)+16)%16;
 if(axis==='x')return t<6?'green':t<7?'amber':'red';
 return t>=8&&t<14?'green':t>=14&&t<15?'amber':'red';
}
