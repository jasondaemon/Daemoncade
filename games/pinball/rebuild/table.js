// Midnight Run: authored coordinates shared by rendering and collision geometry.
export const TABLE = {
  id: 'midnight-run', version: 1, title: 'MIDNIGHT RUN', width: 10, length: 20,
  rails: [
    [[-4.7, .5], [-4.7, 17.7], [-4.1, 19], [-2.6, 19.7], [1.9, 19.7], [3.7, 19], [4.7, 17.6], [4.7, .5]],
    [[3.65, .5], [3.65, 16.8]],
    [[3.65, .6], [4.7, .6]],
    [[3.65,16.8],[2.7,15],[2.1,14.8]],
    // Separate outlanes from generous inlanes that feed the flipper heels.
    [[-3.65, 6.5], [-3.65, 3.9], [-2.6, 3.15]],
    [[2.9, 6.5], [2.9, 3.9], [2.6, 3.15]],
  ],
  slings: [
    [[-2.65, 7.2], [-1.75, 5.5], [-2.65, 5.7]],
    [[2.05, 7.2], [1.45, 5.5], [2.05, 5.7]],
  ],
  bumpers: [{x:-.95,z:16.6},{x:.75,z:16.6},{x:-.95,z:18.25},{x:.75,z:18.25}],
  targets: [{x:-.65,z:11.8},{x:0,z:11.8},{x:.65,z:11.8}],
  // [x, surface height, z]. Width leaves room for a steel ball plus generous margins.
  ramp: [[1.8,.025,9.5],[2,.25,11],[2.25,.65,12.8],[2.65,1,14.2],[3.15,1.15,14],
    [3.25,1.1,12.8],[3.15,.85,11],[2.65,.4,9],[2.5,.025,7]],
  scoop: {x:0,z:13.6},
  modeScoop:{x:-3.9,z:9.4},spinner:{x:2.7,z:17.1},
  rollovers:[{x:-1.5,z:19.1},{x:-.15,z:19.1},{x:1.2,z:19.1}],
  flippers: [{x:-2.6,z:2.9,side:1},{x:2.6,z:2.9,side:-1}],
};

export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

// Smooth authored control points before either collision or art consumes them.
const smooth=controls=>controls.flatMap((p,i)=>{
  if(i===controls.length-1)return [p];
  const a=controls[Math.max(0,i-1)],b=controls[i+1],c=controls[Math.min(controls.length-1,i+2)];
  return Array.from({length:4},(_,j)=>{const t=j/4;return p.map((v,k)=>.5*((2*v)+(-a[k]+b[k])*t+(2*a[k]-5*v+4*b[k]-c[k])*t*t+(-a[k]+3*v-3*b[k]+c[k])*t*t*t));});
});
TABLE.ramps=[smooth(TABLE.ramp),smooth(TABLE.ramp.map(([x,y,z],i)=>[i===TABLE.ramp.length-1?-3.15:-x-.15,y,z+1]))];
TABLE.ramp=TABLE.ramps[0];

export function segments(path) { return path.slice(1).map((p,i)=>[path[i],p]); }
