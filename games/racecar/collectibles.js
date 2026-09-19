// CC0 Kenney Car Kit. Novelty vehicles are deliberately side-grades.
export const COLLECTIBLES = [
  ['hatch','Pocket GT','hatchback-sports','Sport',11000,0,.86,.23,0x39df70],
  ['coupe','Grand Sport','sedan-sports','Sport',26000,1,1.06,.30,0xf85724],
  ['luxury','Monarch','suv-luxury','Touring',18000,1,.92,.22,0x994bff],
  ['formula','Formula','race','Race',110000,4,1.36,.43,0xff2b3b],
  ['future','Vector','race-future','Race',140000,4,1.39,.44,0x32dbff],
  ['parcel','Parcel Express','delivery','Collection',8000,0,.73,.16,0xffc331],
  ['flatbed','Hauler','delivery-flat','Collection',13000,1,.78,.17,0x3395ff],
  ['fire','Fire Engine','firetruck','Collection',16000,1,.79,.17,0xf02b25],
  ['refuse','Clean Sweep','garbage-truck','Collection',21000,2,.81,.16,0x66bf42],
  ['tractor','Harvest','tractor','Collection',12000,1,.70,.15,0x51b43b],
  ['loader','Earthmover','tractor-shovel','Collection',18000,2,.72,.14,0xf4bd26],
  ['truck','Big Rig','truck','Collection',24000,2,.84,.17,0x9b58ef],
  ['pickup','Workhorse','truck-flat','Collection',12000,1,.81,.18,0xff7940],
  ['van','Weekend Van','van','Collection',8500,0,.75,.17,0x45ccbe],
  ['medic','First Response','ambulance','Collection',17000,1,.82,.20,0xffdf74],
  ['kart','Pocket Monster','kart-oopi','Collection',28000,2,.86,.22,0xf571be],
].map(([id,name,model,klass,price,tier,speed,accel,color])=>({
  id,name,model,class:klass,source:'kenney-cars',price,tier,careerSpeed:speed,careerAccel:accel,color,
  speed,accel,grip:klass==='Race'?1.04:klass==='Collection'?.96:1.05,brake:1,boost:1,
  unlock:99,requirement:'Career purchase',
}));
