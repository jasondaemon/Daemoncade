import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('independent boot guard recovers failed module imports and clears on success',()=>{
 for(const outcome of['error','timeout','load']){
  const handlers={},button={disabled:true},status={hidden:true},module={addEventListener:(name,fn)=>handlers[name]=fn};let timeout,cleared=false,reloaded=false;
  runInNewContext(readFileSync(new URL('./boot.js',import.meta.url),'utf8'),{document:{getElementById:id=>id==='game-module'?module:id==='title-play'?button:status},setTimeout:fn=>{timeout=fn;return 1;},clearTimeout:()=>cleared=true,location:{reload:()=>reloaded=true}});
  if(outcome==='timeout')timeout();else handlers[outcome]();
  if(outcome==='load'){assert.ok(cleared);assert.equal(button.disabled,true);}else{assert.equal(button.disabled,false);assert.match(status.textContent,/could not load/);button.onclick();assert.ok(reloaded);}
 }
});
