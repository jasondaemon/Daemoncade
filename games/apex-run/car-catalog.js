export const DEFAULT_CAR_ID="formula-apex";
export const DEFAULT_COSMETIC_ID="apex-cyan";

const cars=[
  {
    id:DEFAULT_CAR_ID,
    name:"Apex Formula",
    category:"OPEN WHEEL",
    description:"The original Apex Run formula car. Every livery uses identical race physics.",
    asset:{status:"ready",url:"assets/low-poly-f1.glb",raceAdapter:"formula",license:"CC BY 4.0",credit:"salasilma13 · Low Poly F1"},
    preview:{kind:"gltf",camera:"formula"},
    cosmetics:[
      {id:DEFAULT_COSMETIC_ID,name:"Apex Cyan",description:"Factory cyan, white and charcoal.",unlock:null,palette:{primary:"#18c6d8",secondary:"#ffc83d",accent:"#eefafa"}},
      {id:"summit-gold",name:"Summit Gold",description:"Earned by finishing one clean run.",unlock:"first-clean-finish",palette:{primary:"#d9a629",secondary:"#10232c",accent:"#f7efd7"}},
      {id:"midnight-grid",name:"Midnight Grid",description:"Earned by completing clean runs on two tracks.",unlock:"two-track-finisher",palette:{primary:"#17212b",secondary:"#47d7e8",accent:"#dce8ef"}},
      {id:"apex-white",name:"Apex White",description:"Earned with an Apex medal.",unlock:"apex-medal",palette:{primary:"#edf4f3",secondary:"#19bfd0",accent:"#f0bd3d"}},
    ],
  },
  {
    id:"car-concept",
    name:"Apex GT Concept",
    category:"GT CONCEPT",
    description:"A logo-clean, race-optimized grand-touring concept with the same competitive physics as every Apex car.",
    asset:{status:"ready",url:"assets/car-concept-showroom.glb",raceUrl:"assets/car-concept-race.glb",raceAdapter:"authored-wheels",source:"https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept",license:"CC BY 4.0",credit:"Eric Chadwick / Darmstadt Graphics Group · exterior modified and optimized for Apex Run",metrics:{showroom:{bytes:8318184,triangles:143802,primitives:58},race:{bytes:5775428,triangles:73531,primitives:33}}},
    preview:{kind:"gltf",camera:"gt",variants:["Apex Cyan","Summit Gold","Midnight Grid"]},
    unlock:"three-clean-streak",
    cosmetics:[
      {id:"gt-cyan",name:"Apex Cyan",description:"A cyan-and-gold factory GT finish.",unlock:null,variant:"Apex Cyan",palette:{primary:"#0794ad",secondary:"#f5c41f",accent:"#effcfe"}},
      {id:"gt-summit",name:"Summit Gold",description:"Warm metallic gold over deep slate.",unlock:"apex-medal",variant:"Summit Gold",palette:{primary:"#b56b0e",secondary:"#0e1b21",accent:"#f4e8c7"}},
      {id:"gt-midnight",name:"Midnight Grid",description:"Near-black paint with electric cyan details.",unlock:"two-track-finisher",variant:"Midnight Grid",palette:{primary:"#05070c",secondary:"#10a3b8",accent:"#dcebf0"}},
    ],
  },
  {
    id:"generic-sport",
    name:"Apex Sport",
    category:"SPORT COUPE",
    description:"A lightweight, trademark-neutral sport coupe prepared from Comrade1280's generic vehicle pack. It uses the same competitive physics as every Apex car.",
    asset:{status:"ready",url:"assets/cars/generic-sport.glb",raceUrl:"assets/cars/generic-sport.glb",raceAdapter:"authored-wheels",source:"https://sketchfab.com/3d-models/generic-passenger-car-pack-20f9af9b8a404d5cb022ac6fe87f21f5",license:"CC BY 4.0",credit:"Comrade1280 · Generic passenger car pack · sport coupe extracted and prepared for Apex Run",metrics:{showroom:{bytes:1730476,triangles:6268,primitives:7},race:{bytes:1730476,triangles:6268,primitives:7}}},
    preview:{kind:"gltf",camera:"gt"},
    unlock:"two-track-finisher",
    cosmetics:[
      {id:"sport-cyan",name:"Apex Cyan",description:"Bright cyan over the coupe's clean bodywork.",unlock:null,palette:{primary:"#0794ad",secondary:"#f5c41f",accent:"#effcfe"}},
      {id:"sport-gold",name:"Summit Gold",description:"Warm gold for the lightweight coupe.",unlock:"first-clean-finish",palette:{primary:"#b56b0e",secondary:"#0e1b21",accent:"#f4e8c7"}},
      {id:"sport-midnight",name:"Midnight Grid",description:"Near-black paint for a restrained race finish.",unlock:"two-track-finisher",palette:{primary:"#05070c",secondary:"#10a3b8",accent:"#dcebf0"}},
    ],
  },
  {
    id:"cybertruck",
    name:"Cybertruck",
    category:"ELECTRIC TRUCK",
    description:"A lightweight angular electric truck with the same competitive physics as every Apex car.",
    asset:{status:"ready",url:"assets/tesla-cybertruck.glb",raceUrl:"assets/tesla-cybertruck.glb",raceAdapter:"authored-wheels",raceProfile:"cybertruck",source:"https://sketchfab.com/3d-models/tesla-cybertruck-f12e67159f75486bb21213e573520612",license:"CC BY 4.0",credit:"Lexyc16 · Tesla Cybertruck",metrics:{showroom:{bytes:407140,primitives:14},race:{bytes:407140,primitives:14}}},
    preview:{kind:"gltf",camera:"gt",variants:["Apex Steel","Summit Gold","Midnight Grid"]},
    unlock:"apex-medal",
    cosmetics:[
      {id:"cyber-steel",name:"Apex Steel",description:"Brushed silver with a restrained cyan accent.",unlock:null,palette:{primary:"#a9b8bd",secondary:"#18c6d8",accent:"#edfafa"}},
      {id:"cyber-gold",name:"Summit Gold",description:"Warm metallic gold over dark technical trim.",unlock:"first-clean-finish",palette:{primary:"#b58a3a",secondary:"#18272d",accent:"#f4e8c7"}},
      {id:"cyber-midnight",name:"Midnight Grid",description:"Near-black steel with electric cyan details.",unlock:"two-track-finisher",palette:{primary:"#10171b",secondary:"#10a3b8",accent:"#dcebf0"}},
    ],
  },
  {
    id:"generic-offroad",
    name:"Apex Trail",
    category:"OFF-ROAD",
    description:"A compact, trademark-neutral trail vehicle prepared from Comrade1280's generic vehicle pack. It uses the same competitive physics as every Apex car.",
    asset:{status:"ready",url:"assets/cars/generic-offroad.glb",raceUrl:"assets/cars/generic-offroad.glb",raceAdapter:"authored-wheels",raceProfile:"trail",source:"https://sketchfab.com/3d-models/generic-passenger-car-pack-20f9af9b8a404d5cb022ac6fe87f21f5",license:"CC BY 4.0",credit:"Comrade1280 · Generic passenger car pack · off-road vehicle extracted and prepared for Apex Run",metrics:{showroom:{bytes:1579832,triangles:6502,primitives:7},race:{bytes:1579832,triangles:6502,primitives:7}}},
    preview:{kind:"gltf",camera:"gt"},
    unlock:"first-clean-finish",
    cosmetics:[
      {id:"trail-cyan",name:"Apex Cyan",description:"Factory cyan for the trail bodywork.",unlock:null,palette:{primary:"#0794ad",secondary:"#f5c41f",accent:"#effcfe"}},
      {id:"trail-sand",name:"Summit Sand",description:"A warm ochre expedition finish.",unlock:"first-clean-finish",palette:{primary:"#a76519",secondary:"#172126",accent:"#f4e8c7"}},
      {id:"trail-midnight",name:"Midnight Grid",description:"Near-black paint with cool trim.",unlock:"two-track-finisher",palette:{primary:"#05070c",secondary:"#10a3b8",accent:"#dcebf0"}},
    ],
  },
  {
    id:"generic-minivan",
    name:"Apex Tourer",
    category:"MINIVAN",
    description:"A roomy, trademark-neutral minivan prepared from Comrade1280's generic vehicle pack. It uses the same competitive physics as every Apex car.",
    asset:{status:"ready",url:"assets/cars/generic-minivan.glb",raceUrl:"assets/cars/generic-minivan.glb",raceAdapter:"authored-wheels",raceProfile:"tourer",source:"https://sketchfab.com/3d-models/generic-passenger-car-pack-20f9af9b8a404d5cb022ac6fe87f21f5",license:"CC BY 4.0",credit:"Comrade1280 · Generic passenger car pack · minivan extracted and prepared for Apex Run",metrics:{showroom:{bytes:1618892,triangles:7450,primitives:7},race:{bytes:1618892,triangles:7450,primitives:7}}},
    preview:{kind:"gltf",camera:"gt"},
    unlock:"two-track-finisher",
    cosmetics:[
      {id:"tourer-cyan",name:"Apex Cyan",description:"Bright cyan for the practical racer.",unlock:null,palette:{primary:"#0794ad",secondary:"#f5c41f",accent:"#effcfe"}},
      {id:"tourer-coral",name:"Harbor Coral",description:"A warm coral touring finish.",unlock:"first-clean-finish",palette:{primary:"#b94e3f",secondary:"#172126",accent:"#f4e8c7"}},
      {id:"tourer-midnight",name:"Midnight Grid",description:"Near-black paint for the late shuttle.",unlock:"two-track-finisher",palette:{primary:"#05070c",secondary:"#10a3b8",accent:"#dcebf0"}},
    ],
  },
];

export const CAR_CATALOG=Object.freeze(cars.map(car=>Object.freeze({...car,asset:Object.freeze({...car.asset}),preview:Object.freeze({...car.preview}),cosmetics:Object.freeze(car.cosmetics.map(cosmetic=>Object.freeze({...cosmetic,palette:Object.freeze({...cosmetic.palette})})))})));

export const ACHIEVEMENTS=Object.freeze([
  Object.freeze({id:"first-clean-finish",name:"First Flag",description:"Finish one PB-eligible run without recovery.",target:1}),
  Object.freeze({id:"two-track-finisher",name:"Road Scholar",description:"Finish clean runs on two different tracks.",target:2}),
  Object.freeze({id:"three-clean-streak",name:"Clean Machine",description:"Finish three PB-eligible runs in a row without recovery.",target:3}),
  Object.freeze({id:"apex-medal",name:"At the Apex",description:"Earn an Apex medal on any track.",target:1}),
]);

export function carById(id){return CAR_CATALOG.find(car=>car.id===id)||null}
export function cosmeticById(car,id){return car?.cosmetics.find(cosmetic=>cosmetic.id===id)||null}
export function achievementById(id){return ACHIEVEMENTS.find(achievement=>achievement.id===id)||null}
export function carAssetReady(car){return car?.asset?.status==="ready"&&typeof car.asset.url==="string"&&car.asset.url.length>0}
export function raceAssetFor(car){
  if(!carAssetReady(car))return null;
  if(car.asset.raceAdapter==="formula")return{adapter:"formula",url:car.asset.raceUrl||car.asset.url};
  if(car.asset.raceAdapter==="authored-wheels"&&typeof car.asset.raceUrl==="string"&&car.asset.raceUrl.length>0){const result={adapter:"authored-wheels",url:car.asset.raceUrl};if(car.asset.raceProfile)result.profile=car.asset.raceProfile;return result}
  return null;
}
export function achievementUnlocked(state,id){return id==null||Boolean(state?.achievements?.[id]?.unlockedAt)}
export function carUnlocked(state,car,access={}){return carAssetReady(car)&&(access.development===true||achievementUnlocked(state,car.unlock))}
export function cosmeticUnlocked(state,cosmetic,access={}){return Boolean(cosmetic)&&(access.development===true||achievementUnlocked(state,cosmetic.unlock))}
export function resolveSelection(state,access={}){
  const fallbackCar=carById(DEFAULT_CAR_ID),requestedCar=carById(state?.selection?.carId),car=carUnlocked(state,requestedCar,access)?requestedCar:fallbackCar;
  const requestedCosmetic=cosmeticById(car,state?.selection?.cosmeticId),cosmetic=cosmeticUnlocked(state,requestedCosmetic,access)?requestedCosmetic:cosmeticById(car,DEFAULT_COSMETIC_ID)||car.cosmetics.find(item=>cosmeticUnlocked(state,item,access));
  return{car,cosmetic};
}
