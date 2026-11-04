export function naturalLightingProfile(trackId="summit-circuit"){
  if(trackId==="alpine-sprint")return Object.freeze({exposure:.88,hemisphere:1.05,sun:2.35,rim:.18});
  return Object.freeze({exposure:.96,hemisphere:1.45,sun:3,rim:.8});
}

export function renderTrackBox(trackId,box){
  // Alpine's authored terrain is the only visible ground skin. The broad
  // grass box remains the authoritative physical recovery surface, but
  // rendering its top 2 cm below the terrain produced distant z-fighting.
  return !(trackId==="alpine-sprint"&&box.surface==="grass");
}
