// Midnight Run: authored coordinates shared by rendering and collision geometry.
export const TABLE = {
  id: 'midnight-run', version: 1, title: 'MIDNIGHT RUN', width: 10, length: 20,
  rails: [
    [[-4.7, .5], [-4.7, 17.7], [-4.1, 19], [-2.6, 19.7], [1.9, 19.7], [3.7, 19], [4.7, 17.6], [4.7, .5]],
    [[3.65, .5], [3.65, 16.8]],
    [[3.65, .6], [4.7, .6]],
    // Separate outlanes from generous inlanes that feed the flipper heels.
    [[-4.7, 8], [-4.15, 6.5], [-4.15, .5]],
    [[-3.3, 6.5], [-3.3, 3.3], [-2.05, 2.6]],
    [[2.8, 3.2], [2.05, 2.6]],
    [[2.8, 3.2], [2.8, 6.5]],
  ],
  slings: [
    [[-2.3, 6.3], [-1.35, 4.35], [-2.3, 4.6]],
    [[1.85, 6.3], [1, 4.35], [1.85, 4.6]],
  ],
  bumpers: [{x:-1.4,z:14.9},{x:1,z:15.3},{x:-.2,z:12.7}],
  targets: [{x:-2.7,z:9.1},{x:-2.9,z:10.2},{x:-3.1,z:11.3}],
  // [x, surface height, z]. Width leaves room for a steel ball plus generous margins.
  ramp: [[2.15,.025,8],[2.15,.28,10],[2.15,.8,12],[2.15,1.5,14],[1.7,1.9,16],
    [.6,2,17],[-.8,2,17],[-2,1.8,16.1],[-2.5,1.5,14.7],[-2.8,1.15,12.9],[-3.25,.65,10.6],[-2.8,.04,7]],
  scoop: {x:-3.35,z:17.9},
  flippers: [{x:-1.7,z:2.9,side:1},{x:1.7,z:2.9,side:-1}],
};

export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

// Smooth authored control points before either collision or art consumes them.
const controls=TABLE.ramp;
TABLE.ramp=controls.flatMap((p,i)=>{
  if(i===controls.length-1)return [p];
  const a=controls[Math.max(0,i-1)],b=controls[i+1],c=controls[Math.min(controls.length-1,i+2)];
  return Array.from({length:4},(_,j)=>{const t=j/4;return p.map((v,k)=>.5*((2*v)+(-a[k]+b[k])*t+(2*a[k]-5*v+4*b[k]-c[k])*t*t+(-a[k]+3*v-3*b[k]+c[k])*t*t*t));});
});

export function segments(path) { return path.slice(1).map((p,i)=>[path[i],p]); }
