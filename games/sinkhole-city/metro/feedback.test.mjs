import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PickupFeedback} from './feedback.js';

test('pickup feedback stays pooled, respects reduced/low effects, expires and clears',()=>{
 const previous=globalThis.document,children=[];
 globalThis.document={createElement:()=>({hidden:false,style:{}})};
 try{
  const feedback=new PickupFeedback({append:e=>children.push(e)}),renderer={screenPosition:()=>({x:40,y:50,visible:true})};
  for(let i=0;i<100;i++)feedback.add({x:i,z:2},i,1,false);
  assert.equal(children.length,8);feedback.render(renderer,1.2,true);
  assert.ok(children.every(e=>!e.hidden&&e.style.transform==='translate(-50%,-28px)'));
  feedback.render(renderer,1.4,true);assert.ok(children.every(e=>e.style.transform==='translate(-50%,-28px)'));
  feedback.render(renderer,2,false);assert.ok(children.every(e=>e.hidden));
  feedback.add({x:1,z:2},50,3,true);feedback.render(renderer,3,false);assert.ok(children.every(e=>e.hidden));
  feedback.add({x:1,z:2},50,3,false);feedback.render(renderer,3,false);assert.ok(children.some(e=>!e.hidden));
  feedback.clear();assert.ok(children.every(e=>e.hidden));
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
