import {enterWorldMenu} from './sinkhole-menu-helpers.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import('/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{localStorage.setItem('sinkhole.metro.career.v1',JSON.stringify({version:1,records:{cleanup:{medal:3,time:40,score:100}}}));localStorage.setItem('sinkhole.metro.preferences.v1',JSON.stringify({world:'basecamp',sound:false}));});
 await page.route('**/metro/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('freshSeed()', '0')+'\nwindow.__qa={get run(){return run},get renderer(){return renderer},pause,chooseWorld};'});});
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/?revision=camp-life32');await page.waitForFunction(()=>document.querySelector('#start').textContent==='Start run'&&!document.querySelector('#start').disabled);await enterWorldMenu(page);
 await page.locator('#free').click();await page.evaluate(()=>{__qa.pause();document.querySelector('#panel').hidden=true;});
 const stats=await page.evaluate(()=>{
  const r=__qa.run,v=__qa.renderer;r.player.x=51;r.player.z=-51;
  const before=r.people.map(o=>[o.x,o.z,o.walker.gait]),active=r.people.filter(o=>o.phase==='idle'&&!o.body).length;for(let i=0;i<120;i++)r.step(1/60,{x:0,y:0});v.render(r,0);
  return {objects:r.total,people:r.people.length,active,moving:r.people.filter((o,i)=>Math.hypot(o.x-before[i][0],o.z-before[i][1])>.2).length,gaits:r.people.filter((o,i)=>o.walker.gait!==before[i][2]).length,models:[...v.sources.keys()],calls:v.renderer.info.render.calls,memory:{...v.renderer.info.memory},valid:r.objects.every(o=>o.shape&&Number.isFinite(o.shape.width+o.shape.height+o.shape.depth)),animated:v.batches.filter(b=>['person','deer','fox'].includes(b.type)).map(b=>({type:b.type,limbs:b.mesh.geometry.attributes.walkLimb.count,phase:b.mesh.geometry.attributes.walkPhase.count,depth:b.mesh.customDepthMaterial.customProgramCacheKey()}))};
 });console.log('LIVE SNAPSHOT',JSON.stringify(stats));assert.equal(stats.objects,241);assert.equal(stats.people,33);assert.ok(stats.moving>=25&&stats.gaits===stats.active&&stats.valid);assert.ok(stats.calls<80);
 for(const key of['rv:roof-jeep','rv:popup-pickup','rv:fj-suv','rv:explore-trailer','person@3','person@4','person@5','deer@0','fox@0'])assert.ok(stats.models.includes(key),key);
 assert.ok(stats.animated.every(b=>b.limbs>0&&b.phase>0&&b.depth==='city-person-gait-v1'));
 const finishes=await page.evaluate(()=>__qa.renderer.batches.filter(b=>b.objects[0].rig).map(b=>({key:b.objects[0].rig,program:b.mesh.material.customProgramCacheKey(),count:b.mesh.geometry.attributes.campRoughness.count,vertices:b.mesh.geometry.attributes.position.count,values:[...new Set(b.mesh.geometry.attributes.campRoughness.array)]})));
 assert.equal(finishes.length,4);assert.ok(finishes.every(f=>f.program==='camp-surface-finish-v1'&&f.count===f.vertices&&f.values.length>=3),'paint/glass/fabric or rubber use one baked geometry stream');
 const frozen=await page.evaluate(()=>JSON.stringify(__qa.run.people));await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>JSON.stringify(__qa.run.people)),frozen);
 for(const [name,x,z,radius]of[['pond',-36,8,2.4],['family',22,30,2.5],['rigs',34,7,2.6],['jeep',-7,24,2],['pickup',-16,-6,2.5],['wildlife',37,35,2.5]]){
  await page.evaluate(({x,z,radius})=>{const r=__qa.run,v=__qa.renderer;r.player.x=x;r.player.z=z;r.player.radius=radius;r.player.area=radius**2;v.snapCamera(r);v.render(r,0);},{x,z,radius});
  await page.screenshot({path:`/tmp/sinkhole-camp32-${name}.png`});
 }
 await page.evaluate(()=>{__qa.renderer.reduced=true;__qa.renderer.render(__qa.run,0);});assert.deepEqual(await page.evaluate(()=>({...__qa.renderer.renderer.info.memory})),stats.memory);
 await page.evaluate(()=>{document.querySelector('#panel').hidden=false;document.querySelector('#leave').click();});for(const w of['metro','basecamp','metro','basecamp'])await page.evaluate(w=>__qa.chooseWorld(w),w);
 assert.deepEqual(await page.evaluate(()=>({...__qa.renderer.renderer.info.memory})),stats.memory);assert.deepEqual(errors,[]);
 // Original authored sources, rendered large enough to inspect actual rig detail.
 await page.setViewportSize({width:1200,height:800});
 const models=await page.evaluate(async()=>{
  const T=await import('/games/vendor/three/three.module.min.js'),{campPrimitive}=await import('/games/sinkhole-city/metro/camp-art.js?v=references35');
  const v=__qa.renderer;v.observer.disconnect();v.run=null;const scene=new T.Scene();scene.background=new T.Color(0x233b40);scene.add(new T.HemisphereLight(0xe9f5ee,0x68776c,3));const light=new T.DirectionalLight(0xffead0,3);light.position.set(-5,12,8);scene.add(light);const results=[];
  for(const [i,rig]of['roof-jeep','popup-pickup','fj-suv','explore-trailer'].entries()){
   const root=campPrimitive(v,'rv:'+rig);root.position.set(i%2?4:-4,0,i<2?-4:4);root.rotation.y=-.35;scene.add(root);let triangles=0;root.traverse(m=>{if(m.isMesh)triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;});results.push({rig,triangles});
  }
  const camera=new T.PerspectiveCamera(43,1200/800,.1,100);camera.position.set(0,15,19);camera.lookAt(0,.8,0);v.renderer.setPixelRatio(1);v.renderer.setSize(1200,800);document.body.replaceChildren(v.renderer.domElement);v.renderer.render(scene,camera);
  for(const [i,text]of['JEEP · ROOFTOP TENT','PROJECT M–STYLE PICKUP','GRAY FJ–STYLE SUV','EXPLORE–STYLE · DUAL TIP-OUT'].entries()){
   const label=document.createElement('div');label.textContent=text;label.style.cssText=`position:fixed;left:${i%2?50:0}%;${i<2?'top:16%':'bottom:8%'};width:50%;text-align:center;color:#e4eee7;font:600 15px sans-serif;letter-spacing:1px`;document.body.append(label);
  }
  return results;
 });assert.ok(models.every(m=>m.triangles<14000&&m.triangles>800));await page.screenshot({path:'/tmp/sinkhole-camp32-models.png'});
 // Inspect the far side as well: front-only views hide the trailer's rear doors.
 await page.evaluate(async()=>{
  const T=await import('/games/vendor/three/three.module.min.js'),{campPrimitive}=await import('/games/sinkhole-city/metro/camp-art.js?v=references35'),v=__qa.renderer;
  const scene=new T.Scene();scene.background=new T.Color(0x233b40);scene.add(new T.HemisphereLight(0xe9f5ee,0x68776c,2.2));const light=new T.DirectionalLight(0xffead0,2);light.position.set(-5,12,-8);scene.add(light);
  for(const [i,rig]of['popup-pickup','explore-trailer'].entries()){const root=campPrimitive(v,'rv:'+rig);root.position.x=i?3.5:-3.5;root.rotation.y=.35;scene.add(root);}
  const camera=new T.PerspectiveCamera(38,1.5,.1,100);camera.position.set(9,7,-15);camera.lookAt(0,1.2,0);v.renderer.render(scene,camera);
  document.querySelectorAll('body>div').forEach(n=>n.remove());
 });await page.screenshot({path:'/tmp/sinkhole-references35-rear.png'});
 console.log('CAMP LIFE',JSON.stringify({stats,models}));console.log('PASS: four rigs, active families/hikers/anglers/wildlife, native gait/shadow attributes, pause/reduced motion, phone views and stable world-switch resources.');
}finally{await browser.close();}
