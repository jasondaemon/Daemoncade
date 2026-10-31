import {VEHICLES} from './world-dressing.js?v=camp-life32';
export const MUSIC_TRACK='../assets/sfx/background-game-quiet.mp3';

// Shared by the renderer and release packager so loaded models cannot silently
// disappear from the distribution inventory. Paths are relative to metro/.
export const WORLD_ASSETS={
 metro:{car:'../../racecar/assets/kenney-cars/hatchback-sports.glb',van:'../../racecar/assets/kenney-cars/delivery.glb',warehouse:'../../blitz/assets/models/industrial/building-f.glb',landmark:'../../blitz/assets/models/industrial/water-tower.glb',tree:'../../racecar/assets/kenney-nature/tree_oak.glb'},
 basecamp:{pine:'../../racecar/assets/kenney-nature/tree_pineTallA.glb',tent:'../../racecar/assets/kenney-nature/tent_smallOpen.glb'},deep:{},alien:{},orbit:{},ascension:{}
};
export function modelPaths(world,arena=false){
 const paths={...WORLD_ASSETS[world]};
 if(world==='metro'&&!arena)for(const [id,file]of Object.entries(VEHICLES))paths[`${id==='van'||id==='flatbed'?'van':'car'}:${id}`]=`../../racecar/assets/kenney-cars/${file}.glb`;
 return paths;
}
export const ASSET_LICENSES=[
 {root:'games/vendor/three/',license:'games/vendor/three/LICENSE.txt',name:'Three.js',spdx:'MIT'},
 {root:'games/racecar/assets/kenney-cars/',license:'games/racecar/assets/kenney-cars/License.txt',name:'Kenney Car Kit',spdx:'CC0-1.0'},
 {root:'games/racecar/assets/kenney-nature/',license:'games/racecar/assets/kenney-nature/License.txt',name:'Kenney Nature Kit',spdx:'CC0-1.0'},
 {root:'games/blitz/assets/models/industrial/',license:'games/blitz/assets/models/industrial/LICENSE.txt',name:'Kenney City Kit Industrial',spdx:'CC0-1.0'}
];
