import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MusicPlayer} from './music.js';
test('music is lazy, single-element and paused without losing position',async()=>{
 let created=0,hidden=false,plays=0;const media={paused:true,currentTime:12,play(){plays++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;}};
 const p=new MusicPlayer(()=>{created++;return media},()=>hidden);assert.equal(created,0);
 p.start(true);await Promise.resolve();assert.equal(created,1);assert.equal(media.currentTime,0);assert.equal(media.loop,true);assert.equal(media.preload,'none');
 assert.equal(media.volume,1);assert.match(media.src,/background-game-quiet\.mp3$/);media.currentTime=25;p.pause();assert.equal(media.paused,true);p.start();assert.equal(media.currentTime,25);assert.equal(created,1);
 p.pause();hidden=true;p.start();assert.equal(plays,2);assert.equal(p.wanted,false);
});
test('late playback cannot escape pause, hiding or rejected autoplay',async()=>{
 let finish,hidden=false;const media={paused:true,play(){this.paused=false;return new Promise(r=>finish=r)},pause(){this.paused=true;}};
 const p=new MusicPlayer(()=>media,()=>hidden);p.start();p.pause();media.paused=false;finish();await Promise.resolve();assert.equal(media.paused,true);
 p.start();hidden=true;media.onplaying();assert.equal(media.paused,true);finish();await Promise.resolve();
 hidden=false;media.play=()=>Promise.reject(new Error('denied'));p.start();await Promise.resolve();await Promise.resolve();p.pause();assert.equal(p.wanted,false);
});
