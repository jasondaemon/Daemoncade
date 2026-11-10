// Data and deterministic rules are independent from the browser and renderer.
export const W=16,H=10, VERSION=1;
export const lands=['Mossward','Amber Fen','Glass Highlands'];
export const entrances=[6,8,14];
export const camps=[0,2,4,6,8,14];
export const names=Array.from({length:27},(_,id)=>id<15?`${lands[Math.min(2,Math.floor((id%5)/2))]} · ${['Verge','Crossing','Grove'][Math.floor(id/5)]} ${id%5+1}`:`${['Rootvault','Drowned Archive','Prism Crypt'][Math.floor((id-15)/4)]} · ${['Threshold','Lantern Trial','Warden Hall','Heart Chamber'][(id-15)%4]}`);
export function fresh(){return {version:VERSION,room:0,x:3.5,y:5.5,facing:[1,0],hp:8,maxHp:8,light:false,status:'playing',inv:0,cooldown:0,swing:0,potions:2,coins:0,sword:1,relics:[],keys:[],switches:[],opened:[],visited:[0],message:'Mira: The three wardens swallowed our dawn. Take my lantern. Restore their hearts, then return to the northern beacon.',enemies:Array.from({length:27},(_,r)=>camps.includes(r)?[]:r>=15?(r-15)%4===3?[{x:11.5,y:5.5,hp:8,boss:true}]:[{x:10.5,y:4.5,hp:3},{x:12.5,y:6.5,hp:3}]:[{x:11.5,y:4.5,hp:2},{x:12.5,y:7.5,hp:2}])};}
export function dungeon(r){return r>=15?Math.floor((r-15)/4):-1;}
export function tile(r,x,y){
 if(x<0||x>=W||y<0||y>=H)return '#';
 if(r<15){if(y===0)return r>=5&&x===8?'.':'#';if(y===9)return r<10&&x===8?'.':'#';if(x===0)return r%5>0&&y===5?'.':'#';if(x===15)return r%5<4&&y===5?'.':'#';}
 else {if(y===0||y===9)return '#';if(x===0)return y===5?'.':'#';if(x===15)return (r-15)%4<3&&y===5?'D':'#';if((r-15)%4===1&&x===8)return y===5?'~':'#';}
 if((x===6||x===10)&&(y===3||y===7))return '#';
 return '.';
}
function gateOpen(s){const d=dungeon(s.room),part=(s.room-15)%4;return part===0||part===1&&s.switches.includes(d)||part===2&&s.keys.includes(d);}
export function solid(s,x,y){const t=tile(s.room,Math.floor(x),Math.floor(y));return t==='#'||t==='~'&&!s.light||t==='D'&&!gateOpen(s);}
export function canStand(s,x,y){return [-.23,.23].every(a=>[-.23,.23].every(b=>!solid(s,x+a,y+b)));}
function move(s,a,dx,dy){if(canStand(s,a.x+dx,a.y))a.x+=dx;if(canStand(s,a.x,a.y+dy))a.y+=dy;}
export function toggle(s){if(s.status==='playing')s.light=!s.light;}
export function pause(s){if(s.status==='playing')s.status='paused';else if(s.status==='paused')s.status='playing';}
export function attack(s){if(s.status!=='playing'||s.cooldown>0)return;s.cooldown=.3;s.swing=.17;for(const e of s.enemies[s.room]){const dx=e.x-s.x,dy=e.y-s.y;if(e.hp>0&&Math.hypot(dx,dy)<1.8&&dx*s.facing[0]+dy*s.facing[1]>-.15){e.hp=Math.max(0,e.hp-s.sword);if(!e.hp)s.coins+=e.boss?12:3;}}}
export function potion(s){if(s.status!=='playing'||!s.potions||s.hp===s.maxHp)return false;s.potions--;s.hp=Math.min(s.maxHp,s.hp+5);s.message='Sunleaf tonic restores five hearts.';return true;}
function changeRoom(s,r,x,y){s.room=r;s.x=x;s.y=y;s.inv=1;s.message=names[r];if(!s.visited.includes(r))s.visited.push(r);}
export function interact(s){
 if(s.status!=='playing')return false;
 if(camps.includes(s.room)&&Math.hypot(s.x-3.5,s.y-5.5)<1.6){s.hp=s.maxHp;if(s.coins>=6&&s.potions<9){s.coins-=6;s.potions++;}s.message='Waystone: health restored. Checkpoint saved. Six coins buys one tonic when available.';return 'save';}
 const d=entrances.indexOf(s.room);if(d>=0&&Math.hypot(s.x-12.5,s.y-2.5)<1.6){changeRoom(s,15+d*4,1.5,5.5);s.message=['Rootvault: carry light across the broken roots.','Drowned Archive: awaken the sun plate, then defeat its sentries.','Prism Crypt: the last warden guards the stolen dawn.'][d];return true;}
 if(s.room===4&&Math.hypot(s.x-12.5,s.y-5.5)<1.6){if(s.relics.length===3&&s.light){s.status='won';s.message='Mira watches the dawn climb over Lantern Vale. The wardens sleep; the roads are yours again.';}else s.message='The beacon needs all three heart relics and a raised lantern.';return true;}
 s.message='Seek a glowing waystone, dungeon stair, sun plate or treasure chest.';return false;
}
export function step(s,input,dt){
 if(s.status!=='playing'||!Number.isFinite(dt))return;dt=Math.max(0,Math.min(dt,.04));
 for(const k of ['inv','cooldown','swing'])s[k]=Math.max(0,s[k]-dt);
 let dx=Number.isFinite(input.x)?input.x:0,dy=Number.isFinite(input.y)?input.y:0;const n=Math.hypot(dx,dy);if(n){dx/=n;dy/=n;s.facing=[dx,dy];move(s,s,dx*3.5*dt,dy*3.5*dt);}
 const r=s.room,d=dungeon(r),part=(r-15)%4;
 if(r<15){let dest=r,px=s.x,py=s.y;if(s.x>15.5){dest=r+1;px=.55;}else if(s.x<.5){dest=r-1;px=15.45;}else if(s.y<.5){dest=r-5;py=8.45;}else if(s.y>9.5){dest=r+5;py=.55;}
 // South doorway crosses at 9.5; tile map includes the outer half-tile apron.
 if(dest!==r){const column=dest%5,need=column>=4?2:column>=2?1:0;if(s.relics.length<need){s.x=Math.max(.55,Math.min(15.45,s.x));s.y=Math.max(.55,Math.min(9.45,s.y));s.message=`The dusk veil needs ${need} restored heart relic${need===1?'':'s'}.`;}else changeRoom(s,dest,px,py);}}
 else if(s.x<.5){if(part===0)changeRoom(s,entrances[d],12.5,3.5);else changeRoom(s,r-1,14.5,5.5);}else if(s.x>15.5&&part<3)changeRoom(s,r+1,.55,5.5);
 if(s.room!==r)return;
 if(d>=0&&part===1&&s.light&&Math.hypot(s.x-12.5,s.y-5.5)<.8&&!s.switches.includes(d)){s.switches.push(d);s.message='The sun plate opens the sealed hall.';}
 for(const e of s.enemies[r]){if(e.hp<=0)continue;const ex=s.x-e.x,ey=s.y-e.y,dist=Math.hypot(ex,ey);const awake=!e.boss||s.light;if(awake&&dist<(s.light?9:2.4)&&dist>.05)move(s,e,ex/dist*dt*(e.boss?.9:1.1),ey/dist*dt*(e.boss?.9:1.1));if(dist<(e.boss?.85:.65)&&s.inv===0){s.hp-=e.boss?2:1;s.hp=Math.max(0,s.hp);s.inv=1.1;if(!s.hp)s.status='dead';}}
 if(d>=0&&part===2&&s.enemies[r].every(e=>e.hp===0)&&!s.keys.includes(d)){s.keys.push(d);s.message='The sentries drop a warden key. The eastern gate opens.';}
 if(d>=0&&part===3&&s.enemies[r].every(e=>e.hp===0)&&!s.relics.includes(d)&&Math.hypot(s.x-12.5,s.y-5.5)<1.2){s.relics.push(d);s.sword=Math.min(3,1+s.relics.length);s.maxHp=8+s.relics.length*2;s.hp=s.maxHp;s.potions=Math.min(9,s.potions+1);s.message='Heart restored. Your blade grows brighter. Return west to the waystone to save.';}
 if(r<15&&!camps.includes(r)&&!s.opened.includes(r)&&s.light&&Math.hypot(s.x-4.5,s.y-2.5)<.8){s.opened.push(r);s.coins+=5;s.potions=Math.min(9,s.potions+1);s.message='Lantern reveals a cache: five coins and a sunleaf tonic.';}
}
export function objective(s){if(s.status==='won')return 'Dawn restored · explore or start a new journey.';if(s.status==='dead')return 'Your lantern dims. Continue from your last waystone or start anew.';if(s.relics.length===3)return 'Return to the northeast beacon. Raise the lantern and interact.';return `Restore ${['Rootvault (west grove)','Drowned Archive (central grove)','Prism Crypt (southeast)'][s.relics.length]} · ${s.relics.length}/3 hearts. E interacts; waystones heal and save.`;}
// Accept only canonical, bounded records; never merge arbitrary stored properties.
export function encode(s){return JSON.stringify({version:VERSION,room:s.room,hp:s.hp,maxHp:s.maxHp,potions:s.potions,coins:s.coins,sword:s.sword,relics:s.relics,keys:s.keys,switches:s.switches,opened:s.opened,visited:s.visited,enemies:s.enemies});}
export function decode(raw){try{if(typeof raw!=='string'||raw.length>20000)return null;const v=JSON.parse(raw),s=fresh();const int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;const list=(v,a,b)=>Array.isArray(v)&&v.length<=b-a+1&&v.every(x=>int(x,a,b))&&new Set(v).size===v.length;if(v.version!==VERSION||!camps.includes(v.room)||!int(v.maxHp,8,14)||!int(v.hp,1,v.maxHp)||!int(v.potions,0,9)||!int(v.coins,0,9999)||!int(v.sword,1,3))return null;for(const k of ['relics','keys','switches'])if(!list(v[k],0,2))return null;for(const k of ['opened','visited'])if(!list(v[k],0,26))return null;if(!Array.isArray(v.enemies)||v.enemies.length!==27)return null;for(let r=0;r<27;r++){if(!Array.isArray(v.enemies[r])||v.enemies[r].length!==s.enemies[r].length)return null;for(let i=0;i<s.enemies[r].length;i++){const e=v.enemies[r][i],base=s.enemies[r][i];if(!e||!int(e.hp,0,base.hp))return null;base.hp=e.hp;}}for(const k of ['room','hp','maxHp','potions','coins','sword','relics','keys','switches','opened','visited'])s[k]=v[k];s.x=3.5;s.y=5.5;s.message='The waystone remembers. Your journey continues.';return s;}catch{return null;}}
